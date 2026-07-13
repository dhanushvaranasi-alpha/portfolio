"use client";

import { useEffect, useRef, useState } from "react";
import { chatbotEnabled } from "@/lib/config";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What is your GenAI experience?",
  "Tell me about Supply Chain Tracer",
  "Why forward deployed engineering?",
  "Are you open to relocation?",
];

const HISTORY_CAP = 12;

function replaceLastAssistant(
  messages: ChatMessage[],
  content: string,
): ChatMessage[] {
  const next = [...messages];
  for (let i = next.length - 1; i >= 0; i--) {
    if (next[i].role === "assistant") {
      next[i] = { role: "assistant", content };
      break;
    }
  }
  return next;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view while streaming.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!chatbotEnabled) return null;

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setDraft("");
    const history = [...messages, { role: "user" as const, content }].slice(
      -HISTORY_CAP,
    );
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        let message = "Something went wrong. Try again in a moment.";
        try {
          const parsed = (await res.json()) as { error?: string };
          if (parsed.error) message = parsed.error;
        } catch {
          // Keep the default message.
        }
        setMessages((current) => replaceLastAssistant(current, message));
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const snapshot = reply;
        setMessages((current) => replaceLastAssistant(current, snapshot));
      }
      if (!reply) {
        setMessages((current) =>
          replaceLastAssistant(
            current,
            "I did not get a reply. Try again in a moment.",
          ),
        );
      }
    } catch {
      setMessages((current) =>
        replaceLastAssistant(
          current,
          "Connection hiccup. Try again in a moment.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close chat" : "Chat with Dhanush's AI"}
        onClick={() => setOpen((v) => !v)}
        className="glass hover:text-accent fixed right-5 bottom-5 z-40 flex h-13 w-13 items-center justify-center rounded-full transition-colors"
      >
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-9 8.36 8.5 8.5 0 0 1-3.4-.86L3 21l1.9-4.6a8.38 8.38 0 0 1-1.4-4.9 8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 9 8.5z" />
        </svg>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Chat with Dhanush's AI"
          className="glass fixed right-5 bottom-21 z-40 flex h-[min(520px,70dvh)] w-95 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl"
        >
          <header className="border-edge flex items-baseline justify-between gap-3 border-b px-5 py-4">
            <div>
              <p className="font-heading font-medium">Chat with Dhanush</p>
              <p className="text-muted mt-0.5 text-xs">
                An AI version of me. It can make mistakes; email me for anything
                important.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted hover:text-accent text-sm transition-colors"
            >
              Close
            </button>
          </header>

          <div
            ref={scrollRef}
            data-lenis-prevent
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4"
          >
            {messages.length === 0 ? (
              <div className="space-y-2">
                <p className="text-muted text-sm">
                  Ask me anything about my work. For example:
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="border-edge text-muted hover:text-accent block w-full rounded-2xl border px-4 py-2 text-left text-sm transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "bg-accent/15 ml-8 rounded-2xl rounded-br-md px-4 py-2.5 text-sm"
                      : "border-edge text-muted mr-8 rounded-2xl rounded-bl-md border px-4 py-2.5 text-sm"
                  }
                >
                  {m.content ||
                    (busy && i === messages.length - 1 ? "..." : "")}
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="border-edge flex gap-2 border-t px-4 py-3"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about my experience..."
              maxLength={1000}
              autoFocus
              className="text-ink placeholder:text-muted/60 min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <button
              type="submit"
              disabled={busy || draft.trim().length === 0}
              className="text-accent disabled:text-muted/50 text-sm font-medium transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
