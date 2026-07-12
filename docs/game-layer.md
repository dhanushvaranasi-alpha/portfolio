# Game Layer

A gamified 3D overlay: a low-poly robot (CC0, RobotExpressive by Tomas
Laulhe / quaternius.com, via the three.js examples repo) roams freely
around the viewport, reacts to sections, and collects orbs sitting on the
page content, guided by a compass arrow that points to the nearest one
left to find. Strictly additive: content, scroll, and accessibility are
unaffected, and nothing is gated behind gameplay.

## Configuration

- `NEXT_PUBLIC_GAME_ENABLED` (default enabled): set to `false` in
  `.env.local` or Vercel env settings to remove the game entirely.
  Checked once in `components/game/game-gate.tsx`.
- Visitor preference: the HUD Hide button persists `game-hidden` in
  localStorage; a Show-game pill restores it.

## How it works

- `components/game/game-gate.tsx` mounts the layer via `next/dynamic`
  (no SSR) only when: flag on, WebGL available, no reduced-motion
  preference, not hidden by the visitor. Client checks use useSyncExternalStore instead of effect-driven state, per the repo lint rules.
- `components/game/game-layer.tsx` renders a fixed, pointer-events-none
  R3F canvas (dpr capped at 1.5, render loop paused on hidden tabs) plus
  the DOM HUD. An IntersectionObserver marks sections visited and plays
  one-shot clips from the `gameSections` map in `lib/game-config.ts`
  (unmapped sections fall back to idle). The observer's immediate callback also performs the initial orb measurement, and completion is detected inside event callbacks rather than an effect.
- `components/game/character.tsx` handles movement: `W`/`A`/`S`/`D` moves
  the explorer anywhere in the viewport on desktop (native scroll keys are
  never captured); on touch devices it glides toward the nearest
  uncollected orb in view and drifts back to a resting spot otherwise.
  Speeds and sizes are constants in `lib/game-config.ts`.
- `components/game/collectibles.tsx` measures `[data-game-collectible]`
  elements (cached; re-measured on resize/section change), renders orbs
  exactly where their content sits, and detects collection by distance in
  viewport px via a shared position ref.
- `components/game/compass.tsx` renders a small arrow orbiting the
  explorer that points toward the nearest uncollected orb (on or off
  screen); it hides when close to the target or when everything is
  collected.
- `lib/game-state.ts` holds pure progress logic (visited/collected/
  complete), tested in `lib/game-state.test.ts` (`bun test`).
- Completing everything triggers a one-time Dance clip, particle burst
  (`VictoryBurst`), and a "100% explored" HUD badge.

## Adding a section

Give the section an `id`, optionally add it to `gameSections` with a clip
name, and put `data-game-collectible="<id>"` on 1-2 elements inside it.

## Decisions

- Non-blocking overlay: recruiters must never need the game to read
  content, so rewards are cosmetic and no scroll keys are captured.
- Free roam over platformer (revised 2026-07-12 after visual QA): the
  original ground-line design pulled orbs down to a reachable band and
  read as a strip, not a world. The explorer now flies anywhere in the
  viewport, orbs stay at their true content positions, and the compass
  supplies the quest structure.
