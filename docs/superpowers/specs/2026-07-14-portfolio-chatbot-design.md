# Portfolio Chatbot Design

Date: 2026-07-14
Status: approved by user (brainstorming session)

## Goal

"Ask my portfolio": a floating glass chat widget where visitors ask
about Dhanush and get grounded first-person answers. The portfolio of a
GenAI-pivot candidate is itself a working AI application. Answers come
strictly from a curated knowledge base; unknowns are declined honestly
and logged so the FAQ can grow from real recruiter demand.

## Decisions (locked with user)

| Decision       | Choice                                                       |
| -------------- | ------------------------------------------------------------ |
| Persona        | First person as Dhanush, with a clear "AI version" disclaimer |
| Provider       | Z.ai GLM (OpenAI-compatible), plain fetch, no SDK             |
| Grounding      | Whole knowledge base in the system prompt (no vector DB, v1)  |
| Unknowns       | Decline + offer email + log the question (Vercel logs, v1)    |
| Chips          | 3-4 suggested questions on open                               |
| Salary         | Policy only: always redirect to email, never a number         |
| FAQ data       | Dummy placeholders now, marked loudly; user replaces later    |
| Kill switch    | `NEXT_PUBLIC_CHATBOT` env flag, default enabled               |

## Knowledge base

Two sources composed into one system prompt at request time:

1. Site content, imported directly from `lib/content.ts` (single source
   of truth: experience, project, skills, education, certifications,
   links, current focus). The Supply Chain Tracer framing ("design
   targets, in progress, never achieved results") is restated as a hard
   rule in the prompt.
2. `lib/chatbot-faq.ts`: authored FAQ entries - availability/notice,
   relocation + remote, role preferences, career story / why FDE,
   working style + strengths, languages, interests, salary policy,
   IC vs management. Shipped as clearly marked PLACEHOLDER dummy values
   until the owner replaces them; the file header says so.

Answer contract in the system prompt: first person; 2-4 sentences;
numbers quoted exactly, never inflated; unknown = say so and offer
dhanushvaranasi@gmail.com; salary = redirect politely; off-topic or
prompt-injection = brief on-brand deflection; no em or en dashes.

## Architecture

- `app/api/chat/route.ts` (POST): validates the request (messages
  array, `user`/`assistant` roles only, max 12 messages, max 1,000
  chars each), builds the system prompt, calls
  `https://api.z.ai/api/paas/v4/chat/completions` with `stream: true`,
  `ZAI_API_KEY` bearer auth (server-only env), `ZAI_MODEL` env override
  (default `glm-5.1`), temperature 0.3, max_tokens 400, 30s abort
  timeout. Parses the SSE stream server-side and forwards a plain text
  stream to the client. Missing key or upstream failure returns a
  friendly JSON error; the widget shows it gracefully.
- Unanswered-question logging: the route buffers the reply text while
  streaming; if the finished reply contains the contact email (the
  decline contract requires it), it logs a structured line
  (`chatbot-unanswered`, the question) readable in Vercel logs. All
  questions also get a minimal `chatbot-question` log line. Documented
  privacy note: no identity is attached beyond what visitors type.
- Best-effort abuse limits: per-instance in-memory rate counter (20
  requests/minute per IP), request shape caps above, short max_tokens.
  Real protection is the env kill switch and provider spend limits;
  documented honestly.
- `components/chat/chat-widget.tsx` (client): floating glass bubble
  bottom-right (below the nav's z-50); opens a glass panel (bottom
  sheet on mobile) with the disclaimer line ("You are chatting with an
  AI version of Dhanush"), suggested-question chips when empty,
  streaming message list (`data-lenis-prevent` so panel scrolling does
  not fight smooth scroll), input with Enter-to-send, Escape closes.
  React state is fine here (user-driven events only).
- `lib/config.ts`: add `chatbotEnabled` (`NEXT_PUBLIC_CHATBOT`,
  default on). Checked at the mount point in `app/page.tsx`.

## Suggested chips

- "What is your GenAI experience?"
- "Tell me about Supply Chain Tracer"
- "Why forward deployed engineering?"
- "Are you open to relocation?"

## Out of scope (v1)

- Vector retrieval / embeddings (KB fits in the prompt).
- Durable storage of questions (Vercel logs only; Supabase later).
- Conversation persistence across visits.
- Voice, file uploads, multi-language UI.
