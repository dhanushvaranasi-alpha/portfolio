# 3D Game Layer Design — Portfolio Mini-Game

Date: 2026-07-12
Status: approved by user (brainstorming session)

## Goal

Add a gamified 3D character overlay to the portfolio: a low-poly explorer that
walks along the bottom of the viewport, plays section-aware animations, and
collects glowing orbs anchored to real content. Visitors can play it, ignore
it, or hide it entirely. The site's content, scroll behaviour, performance,
and accessibility are never compromised — the game is a strictly additive,
non-blocking layer.

## Decisions (locked with user)

| Decision           | Choice                                                              |
| ------------------ | ------------------------------------------------------------------- |
| Character style    | 3D glTF character (Three.js), not Lottie/pixel art                  |
| Game scope         | Full mini-game: movement, collectibles, discovery progress, rewards |
| Content gating     | None. Non-blocking overlay with a user-facing Hide button           |
| Controls (desktop) | `A`/`D` walk, `W` jump. Arrow keys and Space are NOT captured       |
| Controls (mobile)  | None: character auto-walks with scroll and auto-collects            |
| Kill switch        | `NEXT_PUBLIC_GAME_ENABLED` env flag, checked at the mount point     |
| Help               | In-HUD `?` overlay (also `H` key), gated by the same flag           |
| Reduced motion     | Game layer never mounts                                             |

## Architecture

New dependencies: `three`, `@react-three/fiber`, `@react-three/drei`
(versions verified against React 19 / Next 16 compatibility during planning).

New files:

- `lib/config.ts` — typed read of `NEXT_PUBLIC_GAME_ENABLED` (default: enabled).
- `lib/game-state.ts` — game state: visited sections, collected orbs,
  completion. Plain React state lifted into GameLayer (no state library).
- `components/game/game-layer.tsx` — owns the fixed full-viewport canvas
  (`pointer-events: none`, `aria-hidden`, `z-40`, below nav at `z-50`).
  Dynamically imported with `next/dynamic` (`ssr: false`) after the page is
  interactive. Mount conditions (all required): flag on, WebGL available,
  no `prefers-reduced-motion: reduce`, user has not hidden the game.
- `components/game/character.tsx` — loads `public/character.glb`, plays
  animation clips, handles movement and jumping on a ground line ~48px above
  the viewport bottom.
- `components/game/collectibles.tsx` — reads `[data-game-collectible]`
  element positions (cached; refreshed on resize/section change, never per
  frame) and renders glowing accent-blue (#5aa2ff) orbs at those positions.
- `components/game/hud.tsx` — glass-styled HUD pill: discovery counter
  ("X/6 discovered"), controls hint, `?` help button, Hide-game button.
  The only interactive (pointer-events enabled) part of the layer.
- `public/character.glb` — the character asset (target: under ~2MB).

Changes to existing files:

- `app/page.tsx` — mount `<GameLayer />` behind the flag check.
- Section components — add `data-game-collectible` to 1-2 existing elements
  per section (skill tags, stat cards, hero title). No other changes.

## Gameplay

World model: the character moves horizontally in page space along a ground
line near the bottom of the viewport; scrolling moves the world past it
(platformer feel). Each section is a level zone.

- Desktop: `A`/`D` walk, `W` jump. Native scroll keys (arrows, Space,
  PageUp/Down) are never captured or prevented.
- Mobile/touch: character auto-walks in the scroll direction and
  auto-collects orbs it passes. No on-screen controls.

Collectibles: 1-2 orbs per section, anchored to declared content elements.
Walking or jumping into an orb collects it (burst effect, HUD count ticks).

Quest logic:

- Entering a section (IntersectionObserver, same pattern as glass-nav)
  marks it visited.
- Collecting all its orbs marks it cleared.
- HUD shows "X/N discovered", where N is derived from the section config
  map (currently 6), so new sections update the counter automatically.
- Collecting everything triggers a one-time victory animation + particle
  burst + "100% explored" HUD badge. All rewards are cosmetic; nothing is
  ever gated.

Section-aware flavour: entering a section plays a one-shot animation clip
from a config map `{ sectionId: clipName }` (hero: wave, project: typing,
experience: salute, footer: victory), then returns to idle/walk. Unmapped
sections fall back to `idle` — new sections need zero game-code changes.

## Help overlay

A `?` button in the HUD (and the `H` key) opens a glass modal listing:
`A`/`D` walk, `W` jump, `H` help, scroll to travel, orbs explanation,
discovery counter, Hide-game. Mobile shows a touch-specific variant.
`Esc` or outside-click closes. First visit: a one-time pulse on the `?`
button; the modal never auto-opens. Lives inside the HUD, so the env flag
gates it with no extra work. No separate route.

## Visibility controls (two independent levels)

1. `NEXT_PUBLIC_GAME_ENABLED` env flag — owner kill switch, per environment
   (`.env.local` locally, Vercel dashboard in production). Off = game code
   never imported.
2. Hide-game HUD button — visitor preference, persisted in localStorage.
   Hidden = the canvas unmounts entirely (zero runtime cost) and stays
   hidden on return visits. In the hidden state, the HUD is replaced by a
   single small glass "Show game" pill in the same screen position, which
   restores the game on click.

## Asset

Source a CC0/free low-poly animated glTF character:

- Primary: Quaternius animated character packs (CC0; include idle, walk,
  run, jump, wave, victory clips on one rig).
- Secondary: Kenney character packs.
- Fallback for missing clips (e.g. salute): retarget via Mixamo + Blender.

Required clips: `idle`, `walk`, `jump`, `wave`, `victory`.
Optional: `salute`, `typing`. The config map falls back to `idle` for any
missing clip, so asset choice never breaks code.

## Performance budget

- Base site untouched: game JS (~170-200KB gzipped: three + fiber + drei)
  and the model load only inside the dynamic import, after interactivity.
- Pixel ratio clamped to 1.5; no shadow maps; one ambient + one directional
  light; single character mesh + orb sprites. Target 60fps on integrated
  graphics.
- Render loop pauses when the tab is hidden or the game is hidden.
- DOM reads (`getBoundingClientRect`) cached, refreshed on resize/section
  change only.

## Accessibility

- Canvas: `aria-hidden="true"`, `pointer-events: none`. Screen readers and
  clicks pass through to real content.
- HUD: real buttons, keyboard reachable, site's existing focus-visible
  accent outline.
- `prefers-reduced-motion: reduce`: layer never mounts (consistent with the
  rest of the site).
- No native scroll keys captured, ever.

## Verification workflow

Per repo rules: no dev server or build runs during development. Gates are
`bun run format`, `bun run lint`, `bun run typecheck` per task. Manual
visual verification by the user after implementation.

## Out of scope (v1)

- Sound effects.
- Steerable mobile controls (joystick).
- Multiple characters or skins.
- Persisting collection progress across visits (only the Hide preference
  persists).
- Any interaction that blocks or gates content.
