# Particle Constellation

A living particle field behind the content: ~1,800 glowing accent-blue
particles (700 on mobile) that drift as a constellation, part around
the cursor with faint connection lines, ripple on click, streak with
fast scrolling, and converge into a distinct formation per section.
Strictly atmospheric: `pointer-events: none`, `aria-hidden`, negative
z-index, no new dependencies.

## Configuration

- `NEXT_PUBLIC_PARTICLES` (default enabled): set to `false` in
  `.env.local` or Vercel env settings to remove the field. Read in
  `lib/config.ts`, checked in `components/particles.tsx`.
- Reduced motion: no canvas at all. The CSS aurora remains either way.

## How it works

- `components/particles.tsx` gates via `useSyncExternalStore` (repo
  lint rules ban setState-in-effect); SSR renders nothing extra.
- `components/particle-field.tsx` owns everything: a fixed full-viewport
  2D canvas (device pixel ratio capped at 2), a spring-based simulation
  (target attraction, wander, cursor repel, ripple impulses, scroll
  drag, damping), an IntersectionObserver that switches formations per
  section, and the render loop (paused on hidden tabs). Formation
  changes tween each particle to a new target with a random stagger, so
  convergence never snaps.
- Formations by section id (`SECTION_FORMATIONS` map; the footer
  element maps to "orbit"): ambient constellation (top), sparse framing
  arc (about), network graph (project), role waypoints in the right
  margin (experience), hex lattice (skills), thinned sparse field
  (education), slow ring around the closing card (footer).
- The project graph builds with the pinned scene:
  `components/featured-project.tsx` dispatches a `tracer-pin-progress`
  CustomEvent (0..1) from its ScrollTrigger. The field reveals edges
  from 0.3 to 0.7 of the scrub, then propagates a red sanction pulse
  hop by hop (BFS from an outer node) from 0.7 to 1.0: the OFAC
  multi-hop story in light. Red appears nowhere else on the site.
- Mobile: 700 particles, no repel or connection lines (no cursor), tap
  ripples work via pointer events, scroll streaking works from touch
  scrolling.

## Files

- `components/particles.tsx` - flag/motion gate
- `components/particle-field.tsx` - simulation, formations, rendering
- `components/featured-project.tsx` - emits pin progress (additive)
- `lib/config.ts` - feature flag

## Decisions

- Canvas 2D over WebGL: validated with a live prototype; ~2k particles
  are comfortable in 2D, and the code stays dependency-free and
  debuggable. A WebGL points pass is the upgrade path if profiling
  ever demands it.
- Formations live in the margins around the centered content column,
  and each formation carries a brightness multiplier so the field dims
  while people read.
