# Particle Constellation Design

Date: 2026-07-13
Status: approved by user (brainstorming session, validated with a live
Canvas prototype)

## Goal

A living particle field as the site's visual centerpiece: a subtle
constellation of glowing accent-blue particles drifting behind the
content, parting around the cursor with faint connection lines,
rippling on click, streaking with fast scroll, and converging into a
distinct formation for each section - peaking in a supply-chain network
graph with a red sanction pulse during the pinned project scene.
Strictly atmospheric: never intercepts input, never competes with text.

## Decisions (locked with user)

| Decision        | Choice                                                    |
| --------------- | --------------------------------------------------------- |
| Centerpiece     | Particle constellation (validated via live prototype)     |
| Formations      | A shape per section                                        |
| Cursor physics  | Repel (part like water) + local connection lines           |
| Click / tap     | Radial ripple pushing particles outward                    |
| Project scene   | Graph builds with the pinned scrub + red sanction pulse    |
| Ambient density | Subtle: noticed when looked for, never competing with text |
| Scroll velocity | Yes: fast scrolling briefly streaks the field              |
| Kill switch     | `NEXT_PUBLIC_PARTICLES` env flag, default enabled          |

## Architecture

- `lib/config.ts` (new on this branch): typed read of
  `NEXT_PUBLIC_PARTICLES`, default enabled.
- `components/particle-field.tsx` (client): fixed full-viewport 2D
  canvas (`pointer-events: none`, `aria-hidden`, negative z-index,
  rendered after the CSS aurora so it paints above the blobs). Owns the
  simulation, input listeners, section observer, and render loop. All
  state in refs and effect-local variables; no React state.
- `components/particles.tsx` (client gate): renders `ParticleField`
  only when the flag is on and `prefers-reduced-motion: reduce` is not
  set, via `useSyncExternalStore` (repo lint rules ban
  setState-in-effect). SSR and reduced motion render nothing extra; the
  existing CSS aurora remains either way.
- `app/page.tsx`: render `<Particles />` after `<AuroraBackground />`.
- `components/featured-project.tsx` (small additive change): the
  existing pinned ScrollTrigger gains an `onUpdate` that dispatches a
  `tracer-pin-progress` CustomEvent (detail: 0..1) so the particle
  layer can build the graph in sync with the scrub without coupling the
  components.

Rendering is Canvas 2D (validated by the prototype): ~1,800 particles
on desktop, ~700 on mobile, additive glow, device pixel ratio capped at
2. If profiling ever demands it, a WebGL points pass is the documented
upgrade path; it is not v1.

## Simulation

Each particle: position, velocity, per-section target, stagger delay,
size, brightness. Forces per frame: spring toward target, gentle
wander, cursor repel (radius ~130px), click-ripple band impulses,
scroll-velocity streak (velocity added along scroll direction,
rendered as short motion trails when speed is high), damping.

Connection lines: among particles within ~110px of the cursor, link
pairs closer than ~64px with faint accent lines (capped subset).
Subdued while a tight formation is active. No lines on touch devices.

## Formations by section

Formations are generated target sets, placed in the low-density margins
around the centered content column; particles behind text stay dim.
Config map `{ sectionId: formationName }` mirrors the site's section
observer pattern; unmapped sections fall back to ambient.

- `top` (hero): ambient constellation, denser toward the right;
  particles drift in from the edges on first load.
- `about`: thinned, slowed field with a sparse wide arc framing the
  paragraph's empty side. The calmest section.
- `project`: the showpiece, driven by `tracer-pin-progress`:
  - 0.00-0.30: particles converge into ~14 graph nodes (golden-angle
    layout, right-of-centre), staggered.
  - 0.30-0.70: edges connect progressively (nearest-neighbour pairs),
    drawn as faint lines; particles also settle along edges.
  - 0.70-1.00: one outer node flashes red (#ff5a5a-family, used only
    here) and the pulse propagates hop-by-hop along edges toward the
    centre: the multi-hop sanctions story. Disperses on unpin.
- `experience`: loose clusters in the right margin, one per role,
  joined by a faint thread; each cluster brightens as its card reveals.
- `skills`: calm hexagonal lattice behind everything, dimmed.
- `education`: lattice dissolves toward sparse ambient, dimmer.
- footer (no id needed; triggered when education scrolls past): gentle
  gather into a slow orbit around the closing card.

Transitions: staggered per-particle delays (~0.7-1.2s total), spring
easing; formations never snap.

## Mobile

- ~40% particle count, same formations with simplified counts.
- No cursor: no repel, no connection lines; autonomous drift keeps the
  field alive. Tap fires the same radial ripple (pointer events).
- Scroll streaking works from touch scrolling (velocity from scrollY
  deltas).

## Performance and safety

- rAF loop pauses when the tab is hidden.
- Section observer reuses the site's IntersectionObserver pattern;
  formation target regeneration happens on section change and debounced
  resize only.
- Canvas never intercepts input; content and accessibility unaffected.
- Reduced motion / flag off: no canvas at all (CSS aurora remains).
- No new dependencies.

## Out of scope (v1)

- WebGL renderer.
- Per-particle color themes beyond the accent palette + red pulse.
- Interaction with the chatbot or any future features.
