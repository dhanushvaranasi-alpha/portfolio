# Mascot Layer

A scroll-reactive 3D mascot: a low-poly robot (CC0, RobotExpressive by
Tomas Laulhe / quaternius.com, via the three.js examples repo) sits at
the edge of the viewport and performs a short action as each section
scrolls into view. Strictly additive: content, scroll, and accessibility
are unaffected.

## Configuration

- `NEXT_PUBLIC_GAME_ENABLED` (default enabled): set to `false` in
  `.env.local` or Vercel env settings to remove the mascot entirely.
  Checked once in `components/game/game-gate.tsx`.
- Visitor preference: the Hide robot button persists `game-hidden` in
  localStorage; a Show robot pill restores it.

## How it works

- `components/game/game-gate.tsx` mounts the layer via `next/dynamic`
  (no SSR) only when: flag on, WebGL available, no reduced-motion
  preference, not hidden by the visitor. Client checks use
  useSyncExternalStore instead of effect-driven state, per the repo lint
  rules. Storage access is guarded so blocked-storage browsers degrade
  safely.
- `components/game/game-layer.tsx` renders a fixed, pointer-events-none
  R3F canvas (dpr capped at 1.5, render loop paused on hidden tabs) plus
  the Hide robot button. An IntersectionObserver plays one-shot clips
  from the `gameSections` map in `lib/game-config.ts` when a section
  becomes active (unmapped sections fall back to idle).
- `components/game/character.tsx` anchors the robot at the right edge,
  vertically centred on desktop and in the bottom-right corner on touch
  devices, with a gentle idle hover. Section clips play once and fade
  back to the idle loop. Positions and sizes are constants in
  `lib/game-config.ts`.

## Section actions

Wave (hero), Yes nod (about), ThumbsUp (project), Punch (experience),
Jump (skills), Dance (education). All clip names are verified against
the asset.

## Adding a section

Give the section an `id` and add it to `gameSections` with a clip name.

## Decisions

- Non-blocking overlay: recruiters never need the mascot to read the
  content, and no keys or scroll behavior are captured.
- Revised 2026-07-13 after visual QA: the earlier mini-game (movement
  controls, collectible orbs, HUD, quest progress) read as gimmicky in
  practice and is removed. The mascot keeps the personality at a
  fraction of the complexity; the git history preserves the game version
  on `feat/game-layer` and `feat/game-free-roam` if it is ever wanted
  again.
