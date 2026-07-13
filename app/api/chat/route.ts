import {
  buildSystemPrompt,
  contactEmail,
  DECLINE_MARKER,
} from "@/lib/chatbot-prompt";

const ZAI_URL = "https://api.z.ai/api/paas/v4/chat/completions";
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 1000;
const MAX_TOKENS = 400;
const UPSTREAM_TIMEOUT_MS = 30_000;

// Best-effort per-instance rate limiting. Serverless instances do not share
// this map; the real protections are the request caps, short max_tokens,
// the NEXT_PUBLIC_CHATBOT kill switch, and provider spend limits.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; windowStart: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  // Opportunistic pruning keeps the map bounded on warm instances.
  if (hits.size > 500) {
    for (const [key, value] of hits) {
      if (now - value.windowStart > RATE_WINDOW_MS) hits.delete(key);
    }
  }
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function parseMessages(body: unknown): ChatMessage[] | null {
  if (typeof body !== "object" || body === null) return null;
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (messages.length > MAX_MESSAGES) return null;
  const out: ChatMessage[] = [];
  for (const m of messages) {
    if (typeof m !== "object" || m === null) return null;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.length === 0) return null;
    if (content.length > MAX_MESSAGE_CHARS) return null;
    out.push({ role, content });
  }
  if (out[out.length - 1].role !== "user") return null;
  return out;
}

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: `Chat is not configured yet. Email ${contactEmail} instead.` },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (rateLimited(ip)) {
    return Response.json(
      { error: "Too many messages at once. Give it a minute and try again." },
      { status: 429 },
    );
  }

  let messages: ChatMessage[] | null = null;
  try {
    messages = parseMessages(await request.json());
  } catch {
    messages = null;
  }
  if (!messages) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const question = messages[messages.length - 1].content;
  console.log(JSON.stringify({ tag: "chatbot-question", question }));

  const upstream = await fetch(ZAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "en-US,en",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      // glm-4.7-flash is on Z.ai's free tier; override via ZAI_MODEL after
      // adding credit if a bigger model is wanted. Thinking is disabled so
      // hybrid reasoning models answer directly instead of spending the
      // token budget on reasoning.
      model: process.env.ZAI_MODEL ?? "glm-4.7-flash",
      messages: [{ role: "system", content: buildSystemPrompt() }, ...messages],
      temperature: 0.3,
      max_tokens: MAX_TOKENS,
      stream: true,
      thinking: { type: "disabled" },
    }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  }).catch(() => null);

  if (!upstream || !upstream.ok || !upstream.body) {
    console.log(
      JSON.stringify({
        tag: "chatbot-upstream-error",
        status: upstream?.status ?? "fetch-failed",
      }),
    );
    return Response.json(
      {
        error: `I could not reach my brain just now. Email ${contactEmail} instead.`,
      },
      { status: 502 },
    );
  }

  // Parse the upstream SSE stream and forward plain text chunks. Buffer the
  // full reply so declines (which start with the fixed DECLINE_MARKER phrase
  // per the system prompt) can be logged for FAQ growth.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let sseBuffer = "";
  let fullReply = "";

  function handleLine(
    line: string,
    controller: TransformStreamDefaultController<Uint8Array>,
  ) {
    const data = line.trim();
    if (!data.startsWith("data:")) return;
    const payload = data.slice(5).trim();
    if (payload === "[DONE]") return;
    try {
      const parsed = JSON.parse(payload) as {
        choices?: { delta?: { content?: string } }[];
      };
      const text = parsed.choices?.[0]?.delta?.content;
      if (text) {
        fullReply += text;
        controller.enqueue(encoder.encode(text));
      }
    } catch {
      // Ignore malformed SSE lines; the stream continues.
    }
  }

  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        sseBuffer += decoder.decode(chunk, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";
        for (const line of lines) handleLine(line, controller);
      },
      flush(controller) {
        // Process any final line the upstream sent without a trailing newline.
        if (sseBuffer) handleLine(sseBuffer, controller);
        if (fullReply.includes(DECLINE_MARKER)) {
          console.log(JSON.stringify({ tag: "chatbot-unanswered", question }));
        }
      },
    }),
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
