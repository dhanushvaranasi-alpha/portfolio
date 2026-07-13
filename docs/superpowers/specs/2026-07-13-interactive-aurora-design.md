# Interactive Aurora Design

Date: 2026-07-13
Status: approved by user (brainstorming session)

## Goal

Replace the static CSS aurora background with a live aurora borealis:
a WebGL fragment shader rendering flowing light curtains that respond
subtly to cursor movement, movement direction, and clicks. Subtle and
professional; the atmosphere is felt more than seen. The existing CSS
aurora remains as the fallback.

## Decisions (locked with user)

| Decision       | Choice                                                        |
| -------------- | ------------------------------------------------------------- |
| Rendering      | True shader aurora (raw WebGL, no three.js, no new deps)      |
| Click response | Both, very subtle: local light bloom + faint global surge     |
| Fallback       | Existing CSS `AuroraBackground` (untouched)                   |
| Kill switch    | `NEXT_PUBLIC_AURORA_INTERACTIVE` env flag, default enabled    |
| Mobile         | Autonomous drift (no cursor); taps fire the bloom             |

## Architecture

- `lib/config.ts` (new on this branch): typed read of
  `NEXT_PUBLIC_AURORA_INTERACTIVE`, default enabled.
- `components/aurora.tsx` (client gate): renders `<AuroraShader />` when
  the flag is on, WebGL is available (probe cached at module level), and
  `prefers-reduced-motion: reduce` is not set; otherwise renders the
  existing `<AuroraBackground />`. Gating via `useSyncExternalStore`
  (repo lint rules ban setState-in-effect); server snapshot is false, so
  SSR always emits the CSS fallback and the shader takes over after
  hydration with a short fade-in.
- `components/aurora-shader.tsx` (client): fixed full-viewport canvas,
  `pointer-events: none`, `aria-hidden`, negative z-index. Raw WebGL1
  (max compatibility, incl. iOS Safari): one fullscreen quad, one
  fragment shader, a requestAnimationFrame loop. All state in refs and
  effect-local variables; no React state.
- `app/page.tsx`: `<AuroraBackground />` becomes `<Aurora />`. One line.

## Shader design

- Three layered value-noise (fbm) curtains, vertically stretched,
  domain-warped, drifting slowly. Palette from the existing tokens:
  deep blue #254ead, violet #4c2ead, cyan #1e6cbe, highlights toward
  accent #5aa2ff. Vertical falloff (brighter upper region) and an edge
  vignette. Intensity calibrated to match the current CSS aurora's
  presence; a ~1.5s fade-in on mount.
- Uniforms: resolution, time, smoothed pointer position, smoothed
  pointer velocity, up to 3 concurrent click blooms (position + start
  time), global boost.
- Pointer: position and velocity are lerped in JS every frame before
  reaching the shader, so input is always calm. Influence is a radial
  falloff around the cursor that bends the noise domain and lifts
  brightness slightly; velocity shears the curtains in the direction of
  travel.
- Click bloom: an expanding soft ring of accent light fading over
  ~1.6s. Global boost eases up a few percent per click and decays.

## Mobile and input

- Pointer events (`pointermove`, `pointerdown`) on `window`, passive.
  They cover mouse and touch; the canvas never intercepts input.
- Coarse pointers (touch): no cursor flow exists, so the pointer
  uniform follows a slow autonomous orbit, keeping the warp alive; taps
  fire the same click bloom.
- Half-resolution rendering (device pixel ratio clamped to 1.5, then
  halved) keeps fullscreen fbm cheap on mobile GPUs and batteries.

## Performance and safety

- Render loop pauses when the tab is hidden.
- No new dependencies; the shader component is self-contained.
- WebGL context loss handled by falling back gracefully (canvas goes
  transparent; page background remains correct).
- Reduced motion or missing WebGL: CSS aurora, which already renders
  static blobs under reduced motion.

## Out of scope

- Scroll-linked aurora changes.
- Per-section color themes.
- Sound or haptics.
