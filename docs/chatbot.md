# Portfolio Chatbot

"Ask my portfolio": a floating glass chat widget answering questions
about Dhanush in the first person, grounded strictly in a curated
knowledge base. Unknown questions are declined honestly with the
contact email and logged for FAQ growth.

## Configuration

- `ZAI_API_KEY` (required, server-only): Z.ai API key. Set in
  `.env.local` and Vercel env settings; never exposed to the browser.
  Without it the route returns a friendly 503 and the widget shows it.
- `ZAI_MODEL` (optional, server-only): defaults to `glm-4.7-flash`,
  which is on Z.ai's free tier. Paid models like `glm-5.1` return
  "insufficient balance" (code 1113) until the account has credit.
  Thinking is disabled in the request so hybrid reasoning models answer
  directly.
- `NEXT_PUBLIC_CHATBOT` (default enabled): set `false` to remove the
  widget entirely.

## IMPORTANT: placeholder data

`lib/chatbot-faq.ts` ships with dummy answers marked `[PLACEHOLDER]`
(availability, relocation, languages, interests, and more). These are
NOT facts about Dhanush and must be replaced before real recruiters
use the bot. The marker prefix is stripped from the prompt, so the bot
will state them as real facts; replace them first.

## How it works

- `lib/chatbot-prompt.ts` composes the system prompt at request time
  from `lib/content.ts` (single source of truth for experience,
  project, skills, education, contact) plus `lib/chatbot-faq.ts`.
  The prompt instructs (soft rules, not guarantees): first person, 2-4
  sentences, exact numbers, Supply Chain Tracer framed as design
  targets, salary redirected to email, unknowns declined with a fixed
  phrase ("I do not have that information") plus the email, injection
  attempts deflected.
- `app/api/chat/route.ts` (POST): validates shape (max 12 messages,
  1,000 chars each, last must be user), best-effort per-instance rate
  limit (20/min/IP), calls Z.ai chat completions
  (`https://api.z.ai/api/paas/v4/chat/completions`, OpenAI-compatible,
  `stream: true`, temperature 0.3, max_tokens 400, 30s timeout),
  parses the SSE stream server-side, and forwards plain text chunks.
- Logging (Vercel dashboard): `chatbot-question` for every question;
  `chatbot-unanswered` when the finished reply contains the fixed
  decline phrase the prompt mandates (so salary and contact answers,
  which also mention the email, do not false-positive). Heuristic, not
  a guarantee: a model that rewords its decline slips past. No visitor
  identity is recorded beyond what they type. Upgrade path: a Supabase
  table.
- `components/chat/chat-widget.tsx`: glass bubble bottom-right, panel
  with the AI disclaimer, four suggestion chips, streaming message
  list (`data-lenis-prevent` so panel scroll does not fight Lenis),
  Enter to send, Escape to close. Client state is user-event driven.

## Abuse posture (documented honestly)

Request caps + short max_tokens bound the per-request cost; the
in-memory rate limit only holds per warm instance. Real levers are the
`NEXT_PUBLIC_CHATBOT` kill switch and Z.ai spend limits. Revisit with
durable rate limiting if traffic warrants.

## Files

- `app/api/chat/route.ts` - validation, Z.ai call, SSE parsing, logs
- `lib/chatbot-prompt.ts` - system prompt builder
- `lib/chatbot-faq.ts` - authored FAQ (PLACEHOLDER until replaced)
- `components/chat/chat-widget.tsx` - UI
- `lib/config.ts` - `chatbotEnabled` flag
