# Interactive Aurora

A WebGL aurora borealis background: flowing noise curtains in the site
palette that bend subtly around the cursor, shimmer in the direction of
movement, and bloom softly on click. Replaces the static CSS aurora on
capable clients; strictly atmospheric, never intercepts input.

## Configuration

- `NEXT_PUBLIC_AURORA_INTERACTIVE` (default enabled): set to `false` in
  `.env.local` or Vercel env settings to fall back to the CSS aurora.
  Read in `lib/config.ts`, checked in `components/aurora.tsx`.

## How it works

- `components/aurora.tsx` gates via `useSyncExternalStore` (repo lint
  rules ban setState-in-effect): shader only when the flag is on, WebGL
  exists (probe cached at module level), and the visitor does not prefer
  reduced motion. SSR always emits the CSS `AuroraBackground`
  (`components/aurora-background.tsx`, unchanged); the shader takes over
  after hydration with a ~1.5s fade-in.
- `components/aurora-shader.tsx` renders one fullscreen quad with a raw
  WebGL1 fragment shader (no three.js, no dependencies). Three fbm
  curtain layers, vertically stretched and domain-warped, colored with
  the theme tokens (#254ead, #4c2ead, #1e6cbe, accent #5aa2ff), with a
  vertical falloff and edge vignette.
- Pointer input: `pointermove`/`pointerdown` on window (passive);
  position and velocity are lerped in JS each frame so the shader only
  sees calm values. Clicks push into a 3-slot bloom ring buffer
  (position + start time) and nudge a global boost that decays.
- Touch devices: the focal point orbits slowly on its own (no cursor
  needed) and taps fire the same bloom. The canvas is
  `pointer-events: none` and `aria-hidden`, so content is unaffected.
- Performance: renders at half of the dpr-clamped resolution (soft
  noise loses nothing upscaled), pauses on hidden tabs, and releases the
  GL context on unmount.

## Files

- `components/aurora.tsx` - gate + fallback selection
- `components/aurora-shader.tsx` - canvas, WebGL, shader, input
- `components/aurora-background.tsx` - CSS fallback (pre-existing)
- `lib/config.ts` - feature flag

## Decisions

- Raw WebGL1 over three.js: one quad and one shader do not justify a
  170KB dependency, and WebGL1 maximizes device compatibility.
- Half-resolution rendering: chosen for mobile GPU and battery headroom;
  visually indistinguishable for blurred noise.
- CSS aurora kept intact as the universal fallback (SSR, reduced motion,
  no WebGL, flag off).
