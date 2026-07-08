# Portfolio Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-page glassy dark portfolio site for Dhanush Varanasi per the approved spec at `docs/superpowers/specs/2026-07-08-portfolio-website-design.md`.

**Architecture:** Next.js App Router with every section a focused component under `components/`, all copy centralized in `lib/content.ts`, a small motion-primitive layer (Lenis smooth scroll + GSAP ScrollTrigger) shared by sections, and glass/aurora visuals defined once in `app/globals.css` as Tailwind v4 theme tokens and utilities.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS v4, GSAP + ScrollTrigger + @gsap/react, Lenis (`lenis/react`), Bun, ESLint + Prettier.

## Global Constraints

- Package manager is Bun only: `bun add`, `bun create`, `bunx`. Never npm/pnpm/yarn.
- NEVER run `bun run dev` or `bun run build`. Verification per task is: `bun run format` then `bun run lint` then `bun run typecheck`. All three must exit clean.
- No em dashes or en dashes anywhere in site copy (hyphens inside compound words are fine). Section labels use `/`, e.g. `01 / ABOUT`.
- All facts, figures, and wording in `lib/content.ts` come verbatim from the spec/brief. Never inflate, round, or invent metrics. Supply Chain Tracer is always framed as design targets in progress, never as achieved results.
- Banned copy vocabulary: leverage, delve, seamless, robust, honed, spearhead, tapestry, "not just X but Y" constructions.
- Dark mode only. Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (technical labels).
- All motion must be disabled under `prefers-reduced-motion: reduce` (GSAP work goes through `gsap.matchMedia()` with `(prefers-reduced-motion: no-preference)`; CSS animations get a reduce-media override).
- Commit messages: short, conventional-commit prefixed, no AI/assistant/vendor mentions, no co-author trailers.
- External links (`https://...`) get `target="_blank" rel="noreferrer"`. `mailto:`/`tel:` links get neither.

## File Structure

```
app/
  layout.tsx          fonts, metadata, SmoothScrolling wrapper
  page.tsx            composes all sections
  globals.css         theme tokens, glass utility, aurora, focus styles
lib/
  content.ts          ALL site copy, typed
components/
  smooth-scrolling.tsx  Lenis + GSAP ScrollTrigger wiring (client)
  reveal.tsx            scroll-reveal wrapper (client)
  magnetic.tsx          magnetic-hover wrapper (client)
  tilt-card.tsx         subtle hover tilt wrapper (client)
  section-heading.tsx   mono index label + h2 (server)
  aurora-background.tsx fixed background blobs (server)
  glass-nav.tsx         floating pill nav w/ scrollspy (client)
  hero.tsx              hero w/ intro + scroll-away scrub (client)
  about.tsx             summary section (server)
  featured-project.tsx  Tracer pinned scene (client)
  experience.tsx        timeline w/ line draw (client)
  skills.tsx            grouped category cards (server)
  education-certs.tsx   education + certifications (server)
  footer.tsx            current-focus note + contact links (server)
```

---

### Task 1: Scaffold project and tooling

**Files:**
- Create: entire Next.js scaffold in repo root (create-next-app)
- Create: `.prettierrc`, `.prettierignore`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: nothing
- Produces: working lint/format/typecheck commands (`bun run lint`, `bun run format`, `bun run typecheck`) used by every later task; import alias `@/*`; dependencies `gsap`, `@gsap/react`, `lenis` available to all later tasks.

- [ ] **Step 1: Scaffold Next.js in the repo root**

The existing `docs/` directory is on create-next-app's allowlist and will not conflict.

```bash
cd /Users/dhanushvaranasi/Projects/portfolio/portfolio
bun create next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-bun --yes
```

Expected: scaffold completes, `package.json`, `app/`, `eslint.config.mjs`, `tsconfig.json` exist. Tailwind v4 is included by default.

- [ ] **Step 2: Add runtime and dev dependencies**

```bash
bun add gsap @gsap/react lenis
bun add -d prettier prettier-plugin-tailwindcss
```

Expected: all four packages appear in `package.json` (`prettier` entries under `devDependencies`).

- [ ] **Step 3: Add Prettier config and ignore file**

Create `.prettierrc`:

```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

Create `.prettierignore`:

```
.next
out
node_modules
next-env.d.ts
bun.lock
```

- [ ] **Step 4: Add scripts to package.json**

In `package.json`, ensure the `scripts` block contains (keep any existing `dev`/`build`/`start` entries untouched):

```json
"lint": "eslint .",
"format": "prettier --write .",
"format:check": "prettier --check .",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 5: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: prettier rewrites scaffold files, eslint exits 0, tsc exits 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold next.js app with tailwind, gsap, lenis, prettier"
```

---

### Task 2: Theme foundation (globals.css, fonts, layout, aurora)

**Files:**
- Modify: `app/globals.css` (full replacement)
- Modify: `app/layout.tsx` (full replacement)
- Create: `components/aurora-background.tsx`
- Modify: `app/page.tsx` (placeholder replacement)

**Interfaces:**
- Consumes: scaffold from Task 1.
- Produces: Tailwind utilities `bg-base`, `text-ink`, `text-muted`, `text-accent`, `bg-accent/15`, `border-edge`, `font-heading`, `font-body`, `font-mono`; CSS classes `glass`, `glow-panel`, `aurora`; component `AuroraBackground` (no props). Font CSS variables `--font-space-grotesk`, `--font-inter`, `--font-jetbrains-mono`. Note: `layout.tsx` renders children unwrapped in this task; Task 4 adds the `SmoothScrolling` wrapper.

- [ ] **Step 1: Replace `app/globals.css`**

```css
@import "tailwindcss";

@theme inline {
  --font-heading: var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif;
  --font-body: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, monospace;
}

@theme {
  --color-base: #050810;
  --color-ink: #e8ecf4;
  --color-muted: #9aa7bd;
  --color-accent: #5aa2ff;
  --color-edge: rgba(255, 255, 255, 0.08);
}

@utility glass {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%),
    rgba(11, 17, 32, 0.55);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 32px rgba(2, 6, 16, 0.45);
}

::selection {
  background: rgba(90, 162, 255, 0.3);
}

:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

/* Aurora background */
.aurora {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
}

.aurora__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(110px);
  will-change: transform;
}

.aurora__blob--1 {
  width: 55vw;
  height: 55vw;
  top: -15%;
  left: -10%;
  background: radial-gradient(circle, rgba(37, 78, 173, 0.5), transparent 65%);
  animation: aurora-drift-1 26s ease-in-out infinite alternate;
}

.aurora__blob--2 {
  width: 45vw;
  height: 45vw;
  top: 30%;
  right: -15%;
  background: radial-gradient(circle, rgba(76, 46, 173, 0.35), transparent 65%);
  animation: aurora-drift-2 32s ease-in-out infinite alternate;
}

.aurora__blob--3 {
  width: 40vw;
  height: 40vw;
  bottom: -20%;
  left: 25%;
  background: radial-gradient(circle, rgba(30, 108, 190, 0.3), transparent 65%);
  animation: aurora-drift-3 38s ease-in-out infinite alternate;
}

@keyframes aurora-drift-1 {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(12vw, 10vh) scale(1.15);
  }
}

@keyframes aurora-drift-2 {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(-10vw, -12vh) scale(1.1);
  }
}

@keyframes aurora-drift-3 {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(8vw, -8vh) scale(1.2);
  }
}

/* Cursor glow on the featured project panel */
.glow-panel {
  position: relative;
}

.glow-panel::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(
    600px circle at var(--glow-x, 50%) var(--glow-y, 50%),
    rgba(90, 162, 255, 0.1),
    transparent 60%
  );
  opacity: 0;
  transition: opacity 0.4s;
}

.glow-panel:hover::after {
  opacity: 1;
}

@media (pointer: coarse) {
  .glow-panel::after {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .aurora__blob {
    animation: none;
  }
  .glow-panel::after {
    display: none;
  }
}
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dhanush Varanasi | Forward Deployed Engineer",
  description:
    "Senior backend engineer who takes production-grade, cloud-native systems from prototype to production for enterprise clients in regulated domains, now building applied AI and moving toward forward deployed engineering.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-base font-body text-ink antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Create `components/aurora-background.tsx`**

```tsx
export default function AuroraBackground() {
  return (
    <div className="aurora" aria-hidden="true">
      <div className="aurora__blob aurora__blob--1" />
      <div className="aurora__blob aurora__blob--2" />
      <div className="aurora__blob aurora__blob--3" />
    </div>
  );
}
```

- [ ] **Step 4: Replace `app/page.tsx` with a minimal placeholder**

```tsx
import AuroraBackground from "@/components/aurora-background";

export default function Home() {
  return (
    <>
      <AuroraBackground />
      <main className="flex min-h-svh items-center justify-center">
        <h1 className="font-heading text-5xl">Dhanush Varanasi</h1>
      </main>
    </>
  );
}
```

- [ ] **Step 5: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: dark glass theme tokens, fonts, aurora background"
```

---

### Task 3: Content module

**Files:**
- Create: `lib/content.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (exact export names consumed by every section task):
  - `site: { name: string; location: string; title: string; heroLine: string; links: SiteLink[] }` where `SiteLink = { label: string; href: string; external: boolean }`
  - `navItems: { id: string; label: string }[]`
  - `about: string`
  - `project: { title: string; subtitle: string; tech: string[]; what: string; stats: ProjectStat[]; designPoints: string[]; why: string }` where `ProjectStat = { value: string; label: string; detail: string }`
  - `experience: { company: string; title: string; dates: string; location: string; bullets: string[] }[]`
  - `skills: { category: string; items: string[] }[]`
  - `education: { degree: string; school: string; year: string }[]`
  - `certifications: string[]`
  - `currentFocus: string`

- [ ] **Step 1: Create `lib/content.ts`** (all copy verbatim from the brief; no em/en dashes anywhere)

```ts
export type SiteLink = {
  label: string;
  href: string;
  external: boolean;
};

export type ProjectStat = {
  value: string;
  label: string;
  detail: string;
};

export const site = {
  name: "Dhanush Varanasi",
  location: "Bengaluru, Karnataka, India",
  title:
    "Forward Deployed Engineer | Senior Backend Engineer | GenAI & Cloud | Ex-Army",
  heroLine:
    "Senior backend engineer who takes production-grade, cloud-native systems from prototype to production for enterprise clients in regulated domains, now building applied AI and moving toward forward deployed engineering.",
  links: [
    { label: "Email", href: "mailto:dhanushvaranasi@gmail.com", external: false },
    {
      label: "LinkedIn",
      href: "https://linkedin.com/in/dhanushvaranasi",
      external: true,
    },
    {
      label: "GitHub",
      href: "https://github.com/dhanushvaranasi-alpha",
      external: true,
    },
    { label: "+91 8762689484", href: "tel:+918762689484", external: false },
  ] satisfies SiteLink[],
};

export const navItems = [
  { id: "about", label: "About" },
  { id: "project", label: "Project" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
];

export const about =
  "Senior Backend Engineer with 7+ years taking production-grade, cloud-native systems from prototype to production for enterprise clients in regulated domains including banking, public sector, and defense. Now focused on Forward Deployed Engineering: embedding with customers to translate ambiguous business problems into deployed AI solutions. Combines deep hands-on delivery in C#/.NET Core, Python, distributed microservices, and REST APIs across AWS and Azure with applied GenAI (RAG, agentic systems, and LLM evaluation), currently deepened through a self-directed defense-domain AI build and backed by an IIIT-Bangalore PG in ML & AI. Track record of owning end-to-end delivery under ambiguity, onboarding 12+ enterprise accounts, and mentoring engineering teams. Ex-Officer Cadet, Indian Army (OTA Chennai), bringing command-grade ownership, decisive judgment under pressure, and zero-defect execution discipline to high-stakes production environments.";

export const project = {
  title: "Supply Chain Tracer",
  subtitle:
    "AI-powered defense supply-chain risk intelligence (personal project, in active development)",
  tech: [
    "Python",
    "RAG",
    "ChromaDB",
    "Agentic AI",
    "NetworkX",
    "Pydantic",
    "LLM Evaluation",
  ],
  what: "An LLM-powered system designed to ingest public regulatory filings, trace corporate ownership through sanctions lists, and flag supply-chain threats 2 to 4 quarters ahead of regulatory thresholds.",
  stats: [
    {
      value: "85%",
      label: "entity-resolution F1 target",
      detail:
        "Embedding similarity plus LLM tiebreaker, against a 65% fuzzy-matching baseline.",
    },
    {
      value: "60% to 90%",
      label: "sanctions coverage target",
      detail:
        "A sanctions-ownership graph applying the OFAC 50% rule across multi-hop chains.",
    },
    {
      value: ">=0.85",
      label: "grounding target",
      detail:
        "Four-part LLM evaluation harness: unit, LLM-as-judge, regression, online sampling.",
    },
    {
      value: "<=0.10",
      label: "hallucination target",
      detail: "On generated risk reports, enforced by the evaluation harness.",
    },
  ] satisfies ProjectStat[],
  designPoints: [
    "Designing an LLM-powered system to ingest public regulatory filings, trace corporate ownership through sanctions lists, and flag supply-chain threats 2 to 4 quarters ahead of regulatory thresholds.",
    "Architecting an entity-resolution approach (embedding similarity plus LLM tiebreaker) targeting 85% F1 against a 65% fuzzy-matching baseline.",
    "Designing a sanctions-ownership graph that applies the OFAC 50% rule across multi-hop chains, targeting a lift in sanctions coverage from ~60% to ~90%.",
    "Defining a four-part LLM evaluation harness (unit, LLM-as-judge, regression, online sampling) with targets of >=0.85 grounding and <=0.10 hallucination on generated risk reports.",
    "Designing an agentic query layer to pair structured graph traversal for computed signals with RAG over filings for open-ended queries.",
  ],
  why: "Most people say they built a RAG system. This project is defined by measurable targets and rigorous evaluation from the start: entity resolution F1, sanctions coverage, grounding and hallucination thresholds. It also documents honest limitations (for example, supplier country coverage is genuinely incomplete because disclosure is voluntary), which signals real understanding of scope rather than a demo. The defense-domain focus also connects directly to my army background.",
};

export const experience = [
  {
    company: "Ernst & Young (EY)",
    title: "Associate Project Manager",
    dates: "Jan 2026 to Present",
    location: "Bengaluru, India",
    bullets: [
      "Own end-to-end delivery of 3 concurrent engineering projects for a mid-size US bank across lending, core banking, and payments, coordinating ~5 developers per team from scoping through production.",
      "Led merger-and-acquisition integration work following the client's acquisition of another bank, delivering against a demanding integration schedule across data migration, systems consolidation, and account reconciliation.",
      "Stay hands-on as an individual contributor, building and reviewing backend code alongside delivery ownership, ensuring architecture and quality standards hold under real deadlines.",
      "Translate ambiguous, regulation-bound banking requirements into executable delivery plans with clear ownership, dependencies, and risk controls.",
    ],
  },
  {
    company: "Ernst & Young (EY)",
    title: "Senior Technical Lead / Technical Lead",
    dates: "May 2023 to Dec 2025",
    location: "Bengaluru, India",
    bullets: [
      "Delivered Open Banking (Consumer Data Right) solutions aligned to ACCC regulatory standards for the Australian market, building to the compliance bar set by the CDR's lead regulator.",
      "Owned backend delivery of an ASP.NET Core platform integrated with AWS services, embedding with client teams to onboard 12 enterprise clients supporting $3.5M in annual recurring revenue.",
      "Architected and documented RESTful API contracts (Swagger) consumed by 5 frontend teams, cutting integration turnaround 30%.",
      "Drove engineering quality across a team of 8, instituting structured code reviews and SOLID adoption that reduced post-release defects 28%.",
      "Re-engineered SQL Server query performance through index tuning and refactoring, slashing average response time from 1.8s to 320ms on core reporting modules.",
    ],
  },
  {
    company: "Ernst & Young (EY)",
    title: "Senior Software Engineer",
    dates: "Sep 2021 to May 2023",
    location: "Bengaluru, India",
    bullets: [
      "Built scalable C#/.NET Core backend modules for a client-facing enterprise portal, driving a 20% lift in end-user satisfaction.",
      "Decomposed a legacy monolith into modular service layers, reducing complexity 30% and accelerating feature delivery by ~2 weeks per cycle.",
      "Sustained 95% sprint-velocity consistency delivering across 3 global time zones in Agile ceremonies.",
    ],
  },
  {
    company: "Aurigo Software Technologies",
    title: "Member of Technical Staff",
    dates: "Jun 2020 to Jul 2021",
    location: "Bengaluru, India",
    bullets: [
      "Identified a client pain point in parsing and generating legal documents for the US Department of Transportation, then built and demoed a prototype on personal initiative to the client and product teams.",
      "Solution was adopted into the production platform and shipped to all active clients, with a configurable DocuSign integration, cutting roughly 2 hours of manual review and alignment per document across projects that process thousands of documents monthly.",
      "Shipped feature enhancements to a capital-infrastructure SaaS platform serving 200+ North American government agencies across the US.",
      "Integrated third-party REST APIs into the .NET backend, eliminating 60% of manual data-reconciliation workflows.",
    ],
  },
  {
    company: "Indian Army",
    title: "Officer Cadet, Short Service Commission (Technical)",
    dates: "Oct 2018 to Jan 2020",
    location: "Officer's Training Academy, Chennai",
    bullets: [
      "Trained to make structured go/no-go decisions in ambiguous, high-stakes scenarios, directly applicable to production incident response, deployment calls, and technical risk triage.",
      "Drilled in decomposing complex objectives into executable plans with clear ownership and contingencies, mirroring sprint planning and cross-team dependency management.",
      "Developed the ability to lead and drive progress without complete information, a core Forward Deployed Engineer trait in ambiguous customer deployments.",
      "Internalized a zero-defect accountability culture, applied to code-review standards, CI/CD quality gates, and release governance.",
    ],
  },
  {
    company: "Fintellix Solutions (formerly iCreate), Capitec Bank",
    title: "Associate Consultant",
    dates: "Jul 2017 to Sep 2018",
    location: "Bengaluru, India",
    bullets: [
      "Delivered an n-tier ASP.NET MVC5 banking application for the South African market (SQL Server, REST APIs, full stack) serving 15,000+ active users.",
      "Led a 3-member team to build a POC that won client buy-in, resulting in a signed MOU with Verisk Financial for full-scale development.",
    ],
  },
];

export const skills = [
  {
    category: "Languages",
    items: [
      "Python",
      "C#",
      ".NET Core",
      "ASP.NET (MVC / Web API)",
      "SQL",
      "JavaScript",
    ],
  },
  {
    category: "GenAI & AI",
    items: [
      "Retrieval-Augmented Generation (RAG)",
      "Agentic AI",
      "Function-Calling / Tool-Use",
      "Vector Databases (ChromaDB)",
      "LLM Evaluation & Observability",
      "Prompt Engineering",
      "LangChain / LangGraph",
      "Model Deployment",
      "Supervised Learning",
    ],
  },
  {
    category: "System Design & Backend",
    items: [
      "Distributed Systems",
      "System Design",
      "Microservices",
      "REST APIs",
      "Event-Driven Architecture",
      "API Integration",
      "Entity Framework",
      "LINQ",
      "Authentication (OAuth / JWT)",
      "Scalability & Performance Optimization",
    ],
  },
  {
    category: "Cloud",
    items: ["AWS (EC2, S3, Lambda, RDS, CloudWatch)", "Microsoft Azure"],
  },
  {
    category: "Data",
    items: [
      "Microsoft SQL Server",
      "Azure SQL",
      "PostgreSQL",
      "Redis",
      "Data Pipelines",
      "Graph Modeling (NetworkX)",
      "Pydantic",
    ],
  },
  {
    category: "DevOps & Delivery",
    items: [
      "Azure DevOps",
      "Git",
      "GitHub Actions",
      "CI/CD Pipelines",
      "Agile Scrum",
      "TDD",
      "Code Reviews",
    ],
  },
  {
    category: "Consulting & Domain",
    items: [
      "Enterprise / Customer-Facing Delivery",
      "Stakeholder Management",
      "Secure & Compliant Deployment",
      "Regulated Industries (BFSI, Public Sector, Defense)",
    ],
  },
];

export const education = [
  {
    degree: "Post Graduate Diploma, Machine Learning & Artificial Intelligence",
    school: "IIIT Bangalore",
    year: "2022",
  },
  {
    degree: "B.E., Computer Science & Engineering",
    school: "Visvesvaraya Technological University",
    year: "2017",
  },
];

export const certifications = [
  "Microsoft Certified: Azure Fundamentals (AZ-900)",
  "GitHub Foundations",
  "EY Microsoft Azure Bronze",
  "EY Innovation Agile Bronze",
  "EY Artificial Intelligence Bronze",
];

export const currentFocus =
  "Current focus: moving from senior backend delivery into forward deployed engineering. I am building Supply Chain Tracer, an applied AI project in the defense domain, and bringing the same discipline I learned in regulated banking and public-sector work to LLM systems: measurable targets, honest evaluation, and production standards.";
```

- [ ] **Step 2: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 3: Commit**

```bash
git add lib/content.ts
git commit -m "feat: add site content module"
```

---

### Task 4: Motion primitives (SmoothScrolling, Reveal, Magnetic, TiltCard, SectionHeading)

**Files:**
- Create: `components/smooth-scrolling.tsx`
- Create: `components/reveal.tsx`
- Create: `components/magnetic.tsx`
- Create: `components/tilt-card.tsx`
- Create: `components/section-heading.tsx`
- Modify: `app/layout.tsx` (wrap children)

**Interfaces:**
- Consumes: deps from Task 1.
- Produces:
  - `SmoothScrolling({ children: React.ReactNode })` default export
  - `Reveal({ children, className?, delay?, y? })` default export
  - `Magnetic({ children })` default export
  - `TiltCard({ children, className? })` default export
  - `SectionHeading({ index: string, label: string, title: string })` default export

- [ ] **Step 1: Create `components/smooth-scrolling.tsx`**

Wiring per Lenis official docs: `autoRaf: false`, raf driven by GSAP ticker, `anchors: true` so nav anchor links smooth-scroll. Reduced motion renders children without Lenis.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScrolling({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<LenisRef>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    if (reducedMotion !== false) return;
    const lenis = lenisRef.current?.lenis;
    lenis?.on("scroll", ScrollTrigger.update);

    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
    };
  }, [reducedMotion]);

  if (reducedMotion !== false) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ autoRaf: false, anchors: true }} ref={lenisRef}>
      {children}
    </ReactLenis>
  );
}
```

- [ ] **Step 2: Create `components/reveal.tsx`**

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
};

export default function Reveal({
  children,
  className,
  delay = 0,
  y = 48,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, {
          y,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          delay,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
          },
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/magnetic.tsx`**

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export default function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    (context, contextSafe) => {
      const el = ref.current;
      if (
        !el ||
        !contextSafe ||
        !window.matchMedia(
          "(pointer: fine) and (prefers-reduced-motion: no-preference)",
        ).matches
      ) {
        return;
      }

      const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

      const onMove = contextSafe((e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        xTo((e.clientX - rect.left - rect.width / 2) * 0.3);
        yTo((e.clientY - rect.top - rect.height / 2) * 0.3);
      });
      const onLeave = contextSafe(() => {
        xTo(0);
        yTo(0);
      });

      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="inline-block">
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Create `components/tilt-card.tsx`**

```tsx
"use client";

import { useRef } from "react";

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function TiltCard({ children, className }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (
      !el ||
      !window.matchMedia(
        "(pointer: fine) and (prefers-reduced-motion: no-preference)",
      ).matches
    ) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const rx = ((e.clientY - rect.top) / rect.height - 0.5) * -4;
    const ry = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  function onMouseLeave() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`transition-transform duration-300 ease-out ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 5: Create `components/section-heading.tsx`**

```tsx
type SectionHeadingProps = {
  index: string;
  label: string;
  title: string;
};

export default function SectionHeading({
  index,
  label,
  title,
}: SectionHeadingProps) {
  return (
    <div className="mb-12">
      <p className="font-mono text-sm tracking-[0.25em] text-accent uppercase">
        {index} / {label}
      </p>
      <h2 className="mt-3 font-heading text-4xl font-medium md:text-5xl">
        {title}
      </h2>
    </div>
  );
}
```

- [ ] **Step 6: Wrap children in `app/layout.tsx`**

Add the import and wrap the body children:

```tsx
import SmoothScrolling from "@/components/smooth-scrolling";
```

```tsx
      <body className="bg-base font-body text-ink antialiased">
        <SmoothScrolling>{children}</SmoothScrolling>
      </body>
```

- [ ] **Step 7: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add smooth scroll and motion primitives"
```

---

### Task 5: Hero section

**Files:**
- Create: `components/hero.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `site` from `@/lib/content`, `Magnetic` from Task 4.
- Produces: `Hero()` default export; section has `id="top"`.

- [ ] **Step 1: Create `components/hero.tsx`**

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Magnetic from "@/components/magnetic";
import { site } from "@/lib/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-hero-item]", {
          y: 60,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          stagger: 0.12,
        });
        gsap.to("[data-hero-inner]", {
          scale: 0.94,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative flex min-h-svh items-center px-6"
    >
      <div data-hero-inner className="mx-auto w-full max-w-5xl">
        <p
          data-hero-item
          className="font-mono text-sm tracking-[0.25em] text-accent uppercase"
        >
          {site.location}
        </p>
        <h1
          data-hero-item
          className="mt-6 font-heading text-6xl font-medium tracking-tight md:text-8xl"
        >
          {site.name}
        </h1>
        <p data-hero-item className="mt-6 font-mono text-sm text-muted md:text-base">
          {site.title}
        </p>
        <p data-hero-item className="mt-8 max-w-2xl text-lg text-muted">
          {site.heroLine}
        </p>
        <div data-hero-item className="mt-10 flex flex-wrap gap-4">
          {site.links.map((link) => (
            <Magnetic key={link.label}>
              <a
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                className="glass inline-block rounded-full px-5 py-2.5 text-sm transition-colors hover:text-accent"
              >
                {link.label}
              </a>
            </Magnetic>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `app/page.tsx`**

```tsx
import AuroraBackground from "@/components/aurora-background";
import Hero from "@/components/hero";

export default function Home() {
  return (
    <>
      <AuroraBackground />
      <main>
        <Hero />
      </main>
    </>
  );
}
```

- [ ] **Step 3: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: hero section with intro stagger and scroll-away scrub"
```

---

### Task 6: Glass nav with scrollspy

**Files:**
- Create: `components/glass-nav.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `navItems` from `@/lib/content`. Requires hero `id="top"` (Task 5); highlights sections by ids `about`, `project`, `experience`, `skills`, `education` (added in Tasks 7-11; observer simply finds nothing until they exist, which is fine).
- Produces: `GlassNav()` default export.

- [ ] **Step 1: Create `components/glass-nav.tsx`**

Visibility and scrollspy use IntersectionObserver (no GSAP needed). Anchor links are plain `<a href="#id">`: Lenis (`anchors: true`) smooth-scrolls them; under reduced motion Lenis is absent and the browser jumps instantly, which is correct.

```tsx
"use client";

import { useEffect, useState } from "react";
import { navItems } from "@/lib/content";

export default function GlassNav() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.intersectionRatio < 0.4),
      { threshold: [0.4] },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Section navigation"
      className={`fixed top-5 left-1/2 z-50 -translate-x-1/2 motion-safe:transition-all motion-safe:duration-500 ${
        visible
          ? "opacity-100"
          : "pointer-events-none opacity-0 motion-safe:-translate-y-3"
      }`}
    >
      <ul className="glass flex items-center gap-1 rounded-full px-2 py-2">
        {navItems.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                active === item.id
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Add to `app/page.tsx`** (import plus render before `<main>`)

```tsx
import AuroraBackground from "@/components/aurora-background";
import GlassNav from "@/components/glass-nav";
import Hero from "@/components/hero";

export default function Home() {
  return (
    <>
      <AuroraBackground />
      <GlassNav />
      <main>
        <Hero />
      </main>
    </>
  );
}
```

- [ ] **Step 3: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: floating glass nav with scrollspy"
```

---

### Task 7: About section

**Files:**
- Create: `components/about.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `about` from `@/lib/content`, `Reveal`, `SectionHeading` from Task 4.
- Produces: `About()` default export; section `id="about"`.

- [ ] **Step 1: Create `components/about.tsx`**

```tsx
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { about } from "@/lib/content";

export default function About() {
  return (
    <section id="about" className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading index="01" label="About" title="What I do" />
        </Reveal>
        <Reveal delay={0.1}>
          <p className="max-w-3xl text-lg leading-relaxed text-muted">
            {about}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `app/page.tsx`**: add `import About from "@/components/about";` and render `<About />` after `<Hero />`.

- [ ] **Step 3: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: about section"
```

---

### Task 8: Featured project (Supply Chain Tracer pinned scene)

**Files:**
- Create: `components/featured-project.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `project` from `@/lib/content`, `Reveal`, `SectionHeading`.
- Produces: `FeaturedProject()` default export; section `id="project"`.

Desktop + motion-ok: the panel (title, what-it-is, 4 stat cards) pins and scrubs group-by-group. Mobile or reduced motion: no pin, content flows normally. Design points and the why/limitations blurb sit below the pinned scene, revealed normally, keeping the pinned viewport uncrowded.

- [ ] **Step 1: Create `components/featured-project.tsx`**

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { project } from "@/lib/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function FeaturedProject() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: pinRef.current,
              start: "top top",
              end: "+=1800",
              pin: true,
              scrub: 0.6,
            },
          });
          tl.from("[data-tracer-heading]", { y: 60, opacity: 0 })
            .from("[data-tracer-what]", { y: 60, opacity: 0 })
            .from("[data-tracer-stat]", {
              y: 80,
              opacity: 0,
              stagger: 0.35,
            });
        },
      );
    },
    { scope: sectionRef },
  );

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  }

  return (
    <section ref={sectionRef} id="project" className="px-6">
      <div ref={pinRef} className="flex min-h-svh items-center py-16">
        <div
          onMouseMove={onMouseMove}
          className="glass glow-panel mx-auto w-full max-w-5xl rounded-3xl p-8 md:p-14"
        >
          <div data-tracer-heading>
            <SectionHeading
              index="02"
              label="Featured Project"
              title={project.title}
            />
            <p className="-mt-6 mb-8 text-muted">{project.subtitle}</p>
            <ul className="mb-10 flex flex-wrap gap-2" aria-label="Technologies">
              {project.tech.map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-edge px-3 py-1 font-mono text-xs text-muted"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </div>
          <p data-tracer-what className="max-w-3xl text-lg leading-relaxed">
            {project.what}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {project.stats.map((stat) => (
              <div
                key={stat.label}
                data-tracer-stat
                className="rounded-2xl border border-edge bg-base/40 p-5"
              >
                <p className="font-mono text-2xl text-accent">{stat.value}</p>
                <p className="mt-2 text-sm font-medium">{stat.label}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl pt-8 pb-28 md:pb-40">
        <Reveal>
          <h3 className="font-heading text-2xl font-medium">
            Design intent, not demo claims
          </h3>
          <ul className="mt-6 max-w-3xl space-y-4">
            {project.designPoints.map((point) => (
              <li key={point} className="flex gap-3 text-muted">
                <span aria-hidden="true" className="mt-1 font-mono text-accent">
                  /
                </span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-10 max-w-3xl leading-relaxed text-muted">
            {project.why}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `app/page.tsx`**: add `import FeaturedProject from "@/components/featured-project";` and render `<FeaturedProject />` after `<About />`.

- [ ] **Step 3: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: supply chain tracer pinned scene"
```

---

### Task 9: Experience timeline

**Files:**
- Create: `components/experience.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `experience` from `@/lib/content`, `Reveal`, `SectionHeading`, `TiltCard`.
- Produces: `Experience()` default export; section `id="experience"`.

- [ ] **Step 1: Create `components/experience.tsx`**

```tsx
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import TiltCard from "@/components/tilt-card";
import { experience } from "@/lib/content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function Experience() {
  const listRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(lineRef.current, {
          scaleY: 0,
          transformOrigin: "top",
          ease: "none",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 70%",
            end: "bottom 60%",
            scrub: true,
          },
        });
      });
    },
    { scope: listRef },
  );

  return (
    <section id="experience" className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            index="03"
            label="Experience"
            title="Where I have worked"
          />
        </Reveal>
        <div className="relative">
          <div
            ref={lineRef}
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-[7px] w-px bg-gradient-to-b from-accent/70 via-accent/30 to-transparent"
          />
          <ol ref={listRef} className="space-y-10">
            {experience.map((role) => (
              <li key={`${role.company}-${role.dates}`} className="relative pl-10">
                <span
                  aria-hidden="true"
                  className="absolute top-2 left-0 h-[15px] w-[15px] rounded-full border border-accent/60 bg-base"
                />
                <Reveal>
                  <TiltCard>
                    <article className="glass rounded-2xl p-6 md:p-8">
                      <header className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <h3 className="font-heading text-xl font-medium">
                            {role.title}
                          </h3>
                          <p className="mt-1 text-muted">{role.company}</p>
                        </div>
                        <p className="font-mono text-xs text-muted">
                          {role.dates} | {role.location}
                        </p>
                      </header>
                      <ul className="mt-5 space-y-3">
                        {role.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3 text-sm text-muted">
                            <span
                              aria-hidden="true"
                              className="mt-0.5 font-mono text-accent"
                            >
                              /
                            </span>
                            <span className="leading-relaxed">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </TiltCard>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `app/page.tsx`**: add `import Experience from "@/components/experience";` and render `<Experience />` after `<FeaturedProject />`.

- [ ] **Step 3: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: experience timeline with scroll line draw"
```

---

### Task 10: Skills section

**Files:**
- Create: `components/skills.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `skills` from `@/lib/content`, `Reveal`, `SectionHeading`, `TiltCard`.
- Produces: `Skills()` default export; section `id="skills"`.

- [ ] **Step 1: Create `components/skills.tsx`**

```tsx
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import TiltCard from "@/components/tilt-card";
import { skills } from "@/lib/content";

export default function Skills() {
  return (
    <section id="skills" className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading index="04" label="Skills" title="What I work with" />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          {skills.map((group, i) => (
            <Reveal key={group.category} delay={(i % 2) * 0.08}>
              <TiltCard className="h-full">
                <div className="glass h-full rounded-2xl p-6">
                  <h3 className="font-heading text-lg font-medium">
                    {group.category}
                  </h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-edge px-3 py-1 font-mono text-xs text-muted"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update `app/page.tsx`**: add `import Skills from "@/components/skills";` and render `<Skills />` after `<Experience />`.

- [ ] **Step 3: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: grouped skills section"
```

---

### Task 11: Education, certifications, and footer

**Files:**
- Create: `components/education-certs.tsx`
- Create: `components/footer.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `education`, `certifications`, `currentFocus`, `site` from `@/lib/content`, `Reveal`, `SectionHeading`, `Magnetic`.
- Produces: `EducationCerts()` and `Footer()` default exports; section `id="education"`.

- [ ] **Step 1: Create `components/education-certs.tsx`**

```tsx
import Reveal from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { certifications, education } from "@/lib/content";

export default function EducationCerts() {
  return (
    <section id="education" className="px-6 py-28 md:py-40">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            index="05"
            label="Education"
            title="Education and certifications"
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <div className="glass h-full rounded-2xl p-6 md:p-8">
              <h3 className="font-heading text-lg font-medium">Education</h3>
              <ul className="mt-5 space-y-6">
                {education.map((entry) => (
                  <li key={entry.degree}>
                    <p className="font-medium">{entry.degree}</p>
                    <p className="mt-1 text-sm text-muted">
                      {entry.school} | {entry.year}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="glass h-full rounded-2xl p-6 md:p-8">
              <h3 className="font-heading text-lg font-medium">
                Certifications
              </h3>
              <ul className="mt-5 space-y-3">
                {certifications.map((cert) => (
                  <li key={cert} className="flex gap-3 text-sm text-muted">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 font-mono text-accent"
                    >
                      /
                    </span>
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/footer.tsx`**

```tsx
import Magnetic from "@/components/magnetic";
import Reveal from "@/components/reveal";
import { currentFocus, site } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="px-6 pt-12 pb-16">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="glass rounded-3xl p-8 md:p-12">
            <p className="max-w-3xl leading-relaxed text-muted">
              {currentFocus}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {site.links.map((link) => (
                <Magnetic key={link.label}>
                  <a
                    href={link.href}
                    {...(link.external
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                    className="glass inline-block rounded-full px-5 py-2.5 text-sm transition-colors hover:text-accent"
                  >
                    {link.label}
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>
        </Reveal>
        <p className="mt-10 text-center font-mono text-xs text-muted">
          {site.name} | {site.location}
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Update `app/page.tsx`** to the final composition:

```tsx
import AuroraBackground from "@/components/aurora-background";
import About from "@/components/about";
import EducationCerts from "@/components/education-certs";
import Experience from "@/components/experience";
import FeaturedProject from "@/components/featured-project";
import Footer from "@/components/footer";
import GlassNav from "@/components/glass-nav";
import Hero from "@/components/hero";
import Skills from "@/components/skills";

export default function Home() {
  return (
    <>
      <AuroraBackground />
      <GlassNav />
      <main>
        <Hero />
        <About />
        <FeaturedProject />
        <Experience />
        <Skills />
        <EducationCerts />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: education, certifications, footer with focus note"
```

---

### Task 12: Final polish (metadata, copy audit, cleanup)

**Files:**
- Modify: `app/layout.tsx` (Open Graph metadata)
- Delete: unused scaffold assets (`public/*.svg` defaults from create-next-app, if present)

**Interfaces:**
- Consumes: everything prior.
- Produces: final deliverable.

- [ ] **Step 1: Extend metadata in `app/layout.tsx`**

Replace the `metadata` export with:

```tsx
export const metadata: Metadata = {
  title: "Dhanush Varanasi | Forward Deployed Engineer",
  description:
    "Senior backend engineer who takes production-grade, cloud-native systems from prototype to production for enterprise clients in regulated domains, now building applied AI and moving toward forward deployed engineering.",
  openGraph: {
    title: "Dhanush Varanasi | Forward Deployed Engineer",
    description:
      "Senior backend engineer building production-grade systems and applied AI in regulated domains.",
    type: "website",
  },
};
```

- [ ] **Step 2: Remove unused scaffold assets**

```bash
ls public/
```

Delete any default create-next-app SVGs (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`) that no component references. Do not delete `favicon.ico` (lives in `app/`).

- [ ] **Step 3: Copy audit (dash and vocabulary rules)**

```bash
rg -n "—|–" app components lib
rg -in "leverage|delve|seamless|robust|honed|spearhead|tapestry" app components lib
```

Expected: both commands return no matches (exit code 1). If anything matches in site copy, fix it in `lib/content.ts`.

- [ ] **Step 4: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: metadata, asset cleanup, copy audit"
```
