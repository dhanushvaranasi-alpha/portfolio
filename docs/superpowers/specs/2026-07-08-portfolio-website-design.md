# Portfolio Website Design — Dhanush Varanasi

Date: 2026-07-08
Status: Approved

## Goal

A single-page personal portfolio site presenting Dhanush Varanasi (Senior Backend Engineer pivoting to Forward Deployed Engineer / GenAI roles) to recruiters and hiring managers. Glassy Apple-style dark theme, showy but premium scroll choreography, and an architecture ready to host a chatbot later. The content source of truth is the "Portfolio Website Brief" provided by the user; all copy, facts, and figures come from it verbatim.

## Decisions (locked with user)

| Decision | Choice |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| Hosting | Vercel |
| Package manager | Bun |
| Styling | Tailwind CSS v4 + small custom CSS layer for glass/aurora |
| Color mode | Dark only |
| Motion level | Showy (Apple-style scroll storytelling, not confetti) |
| Animation stack | GSAP + ScrollTrigger, Lenis smooth scroll |
| Background | Aurora: slow-drifting blurred deep-blue/indigo gradient blobs |
| Typography | Space Grotesk (headings), Inter (body), JetBrains Mono (technical labels) |
| Future requirement | Chatbot: `app/api/chat` route + floating chat widget, added later |

## Architecture

- Static single page. No server code in v1. The App Router layout leaves a clean slot for the future chat API route and widget without touching existing components.
- Section components, each isolated and independently understandable:
  - `AuroraBackground` — fixed, behind everything; three blurred gradient blobs animated with CSS transforms; paused under `prefers-reduced-motion`.
  - `GlassNav` — floating glass pill nav; appears after the hero, condenses on scroll, active-section highlight, Lenis-driven anchor scrolling.
  - `Hero` — name (large, Space Grotesk), primary title line, hero one-liner, contact links as glass pills.
  - `About` — professional summary, lightly first-person.
  - `FeaturedProject` — Supply Chain Tracer, the centerpiece (pinned scroll scene).
  - `Experience` — vertical timeline, newest first, six entries.
  - `Skills` — grouped category cards.
  - `EducationCerts` — education and certifications.
  - `Footer` — contact and links, plus the short "current focus" note.
- All copy lives in `content.ts`, taken verbatim from the brief. Wording edits never touch components. The no-dash rule (no em or en dashes anywhere in site copy) is enforced in this file.

## Visual system

- Base: near-black navy (around `#050810`) with the aurora behind all content.
- Glass material used with restraint: nav, featured project panel, skill cards, and experience cards get `backdrop-filter: blur`, a 1px light-edge border, and a faint inner highlight. Body sections sit directly on the background so glass reads as elevation, not wallpaper.
- One accent color (electric blue): links, active nav state, hover glows, Tracer metric highlights. Nothing else gets color.
- Type scale: large headings, generous whitespace. JetBrains Mono for section numbers (formatted like `01 / ABOUT`, never with dashes), dates, and the Tracer design targets.

## Scroll choreography

- Hero: staggered rise-in on load; scales down slightly and fades on scroll-away while the aurora parallaxes slower than content.
- Featured project: pinned scene. The Tracer panel pins while the story scrubs through: what it is, then the design targets appearing one by one as mono-font stat cards (85% F1 target vs 65% baseline, ~60% to ~90% sanctions coverage target, >=0.85 grounding, <=0.10 hallucination), each framed explicitly as a target, then the honest-limitations blurb.
- Experience: glowing timeline line draws downward on scroll; glass entries slide in. The Army entry gets identical treatment to other roles (no military imagery).
- Skills / Education: staggered fade-rise only. The choreography decrescendos after the Tracer scene; the site has one climax.
- Micro-interactions (desktop only): magnetic hover on contact pills, subtle tilt-on-hover on glass cards, soft accent glow following the cursor over the Tracer panel. Mobile gets tap states and lighter reveals.
- `prefers-reduced-motion`: all scroll effects and the aurora drift disabled; content renders static and fully readable.

## Content mapping (order)

1. Hero: name, primary title ("Forward Deployed Engineer | Senior Backend Engineer | GenAI & Cloud | Ex-Army"), hero one-liner, contact links (email, LinkedIn, GitHub, phone, location).
2. About: professional summary from brief.
3. Featured project: Supply Chain Tracer, framed everywhere as in-progress design targets, never as achieved results.
4. Experience: EY Associate Project Manager, EY Senior Technical Lead / Technical Lead, EY Senior Software Engineer, Aurigo, Indian Army, Fintellix. Bullets verbatim.
5. Skills: seven labeled categories from the brief.
6. Education and certifications.
7. Footer: contact links plus the short "current focus" note tying the FDE pivot, the applied-AI project, and the regulated-domain thread.

Tone rules from the brief apply everywhere: no em or en dashes, no AI-sounding vocabulary (leverage, delve, seamless, robust, etc.), no job-seeking language, all numbers exactly as written.

## Performance and accessibility

- Static output; fonts subset and loaded with `font-display: swap`; GSAP + Lenis are the only meaningful JS (~60 KB gzipped combined); no images required in v1.
- Semantic landmarks and heading order, keyboard-navigable nav, visible focus states.
- WCAG AA contrast for all text over glass; glass panels carry a solid-enough tint to guarantee it.

## Verification workflow

Per the user's global rules: no dev server or build runs during development. Lint (ESLint) and formatting (Prettier) are the check gates. Bun for all package operations.

## Out of scope (v1)

- The chatbot itself (architecture slot only).
- Light mode.
- Blog or additional pages.
- Any dependency on live GitHub repo content.
