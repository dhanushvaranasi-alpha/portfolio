# 3D Game Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the gamified 3D character overlay defined in `docs/superpowers/specs/2026-07-12-game-layer-design.md`: a low-poly robot that walks along the bottom of the viewport, plays section-aware animations, collects orbs anchored to content, with HUD, help overlay, hide button, and env-flag kill switch.

**Architecture:** A `next/dynamic` (no SSR) game layer mounts behind `NEXT_PUBLIC_GAME_ENABLED`, reduced-motion, WebGL, and user-preference gates. Inside it, a React Three Fiber `Canvas` renders the character and orbs; plain DOM renders the HUD. Pure game-progress logic lives in `lib/game-state.ts` (unit tested with `bun test`). The existing site is modified only by additive `data-game-collectible` attributes and one `<GameGate />` mount in `app/page.tsx`.

**Tech Stack:** three, @react-three/fiber v9 (React 19 compatible per its peerDependencies `react >=19 <19.3`), @react-three/drei, bun test, existing Tailwind v4 tokens (`glass`, `text-accent`, fonts).

## Global Constraints

- Package manager is Bun only: `bun add`, `bunx`. Never npm/pnpm/yarn.
- NEVER run `bun run dev` or `bun run build`. Verification per task: `bun run format` then `bun run lint` then `bun run typecheck` (plus `bun test` once tests exist). All must exit clean.
- Work happens on branch `feat/game-layer`, created from `main` in Task 1.
- NEVER remove or alter existing working functionality. All changes to existing components are additive attributes or new mounts only.
- No em dashes or en dashes in any user-facing copy. Banned copy vocabulary: leverage, delve, seamless, robust, honed, spearhead, tapestry.
- Native scroll keys (arrows, Space, PageUp/Down) must never be captured or prevented. Game keys are `A`/`D`/`W`/`H`/`Escape` only.
- Canvas is `aria-hidden="true"` and `pointer-events: none`; only the HUD is interactive.
- Commit messages: short, conventional-commit prefixed, no AI/assistant/vendor mentions, no co-author trailers.
- The character asset is CC0 (RobotExpressive by Tomás Laulhé / quaternius.com, distributed in the three.js examples repo). Verified clips: Dance, Death, Idle, Jump, No, Punch, Running, Sitting, Standing, ThumbsUp, Walking, WalkJump, Wave. Size ~453KB, ~7.2k vertices.

## File Structure

```
lib/
  config.ts             NEXT_PUBLIC_GAME_ENABLED flag (typed)
  game-config.ts        section->clip map, tuning constants, storage keys, Emote type
  game-state.ts         pure progress logic (tested)
  game-state.test.ts    bun tests
components/game/
  game-gate.tsx         mount gates + hidden pref + Show-game pill (client)
  game-layer.tsx        canvas shell, section observer, progress state, HUD host
  character.tsx         glTF robot: movement, keys, mobile auto-walk, clips
  collectibles.tsx      anchor measuring, orbs, collision, bursts
  hud.tsx               counters, help overlay, hide button
public/
  character.glb         CC0 RobotExpressive model
docs/
  game-layer.md         feature doc
```

---

### Task 1: Branch, dependencies, config flag

**Files:**

- Create: `lib/config.ts`
- Modify: `package.json` (dependencies via bun, `test` script)

**Interfaces:**

- Consumes: nothing.
- Produces: branch `feat/game-layer`; packages `three`, `@react-three/fiber`, `@react-three/drei`, `@types/bun`; `bun run test` script; `gameEnabled: boolean` exported from `@/lib/config`.

- [ ] **Step 1: Create the branch**

```bash
cd /Users/dhanushvaranasi/Projects/portfolio/portfolio
git checkout main && git pull
git checkout -b feat/game-layer
```

- [ ] **Step 2: Add dependencies**

```bash
bun add three @react-three/fiber @react-three/drei
bun add -d @types/bun
```

Expected: `three`, `@react-three/fiber` (9.x), `@react-three/drei` in `dependencies`; `@types/bun` in `devDependencies`. `three` ships its own TypeScript types; do not add `@types/three`.

- [ ] **Step 3: Add test script to `package.json`**

In the `scripts` block, add (keep all existing entries untouched):

```json
"test": "bun test"
```

- [ ] **Step 4: Create `lib/config.ts`**

```ts
export const gameEnabled = process.env.NEXT_PUBLIC_GAME_ENABLED !== "false";
```

The flag defaults to enabled; set `NEXT_PUBLIC_GAME_ENABLED=false` in `.env.local` or the Vercel dashboard to disable. `NEXT_PUBLIC_` vars are inlined at build time.

- [ ] **Step 5: Verify**

```bash
bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add three.js stack and game feature flag"
```

---

### Task 2: Character asset

**Files:**

- Create: `public/character.glb`

**Interfaces:**

- Consumes: nothing.
- Produces: `/character.glb` served from `public/`, with animation clips named exactly: `Dance`, `Idle`, `Jump`, `Punch`, `ThumbsUp`, `Walking`, `Wave`, `Yes` (plus others unused).

- [ ] **Step 1: Download the model**

```bash
cd /Users/dhanushvaranasi/Projects/portfolio/portfolio
curl -sL -o public/character.glb "https://github.com/mrdoob/three.js/raw/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb"
ls -lh public/character.glb
```

Expected: file ~453KB. If the size differs wildly (under 100KB = an error page), stop and report.

- [ ] **Step 2: Verify the clips**

```bash
npx @gltf-transform/cli inspect public/character.glb 2>/dev/null | grep -A 40 ANIMATIONS
```

Expected: a table listing 14 animations including `Idle`, `Walking`, `Jump`, `Wave`, `ThumbsUp`, `Yes`, `Punch`, `Dance`.

- [ ] **Step 3: Commit**

```bash
git add public/character.glb
git commit -m "feat: add cc0 robot character asset"
```

---

### Task 3: Game config and tested game state

**Files:**

- Create: `lib/game-config.ts`
- Create: `lib/game-state.ts`
- Test: `lib/game-state.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces (used by Tasks 5-7):
  - `gameSections: { id: string; clip?: string }[]`, `Emote` type, and all constants from `@/lib/game-config` exactly as written below.
  - From `@/lib/game-state`: `GameProgress` type `{ visited: string[]; collected: string[] }`, `emptyProgress`, `markVisited(p, sectionId)`, `collectOrb(p, orbId)`, `isComplete(p, sectionIds, orbIds)`. All pure; idempotent calls return the same object reference.

- [ ] **Step 1: Write the failing test `lib/game-state.test.ts`**

```ts
import { describe, expect, test } from "bun:test";
import {
  collectOrb,
  emptyProgress,
  isComplete,
  markVisited,
} from "@/lib/game-state";

describe("markVisited", () => {
  test("adds a section once", () => {
    const p = markVisited(emptyProgress, "about");
    expect(p.visited).toEqual(["about"]);
    expect(emptyProgress.visited).toEqual([]);
  });

  test("is idempotent and returns the same reference", () => {
    const p = markVisited(emptyProgress, "about");
    expect(markVisited(p, "about")).toBe(p);
  });
});

describe("collectOrb", () => {
  test("adds an orb once", () => {
    const p = collectOrb(emptyProgress, "skills-1");
    expect(p.collected).toEqual(["skills-1"]);
    expect(emptyProgress.collected).toEqual([]);
  });

  test("is idempotent and returns the same reference", () => {
    const p = collectOrb(emptyProgress, "skills-1");
    expect(collectOrb(p, "skills-1")).toBe(p);
  });
});

describe("isComplete", () => {
  const sections = ["top", "about"];
  const orbs = ["top-1", "about-1"];

  test("false when sections or orbs are missing", () => {
    let p = markVisited(emptyProgress, "top");
    p = collectOrb(p, "top-1");
    expect(isComplete(p, sections, orbs)).toBe(false);
  });

  test("true when everything is visited and collected", () => {
    let p = emptyProgress;
    p = markVisited(p, "top");
    p = markVisited(p, "about");
    p = collectOrb(p, "top-1");
    p = collectOrb(p, "about-1");
    expect(isComplete(p, sections, orbs)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
bun test
```

Expected: FAIL, cannot resolve `@/lib/game-state`.

- [ ] **Step 3: Implement `lib/game-state.ts`**

```ts
export type GameProgress = {
  visited: string[];
  collected: string[];
};

export const emptyProgress: GameProgress = { visited: [], collected: [] };

export function markVisited(
  progress: GameProgress,
  sectionId: string,
): GameProgress {
  if (progress.visited.includes(sectionId)) return progress;
  return { ...progress, visited: [...progress.visited, sectionId] };
}

export function collectOrb(
  progress: GameProgress,
  orbId: string,
): GameProgress {
  if (progress.collected.includes(orbId)) return progress;
  return { ...progress, collected: [...progress.collected, orbId] };
}

export function isComplete(
  progress: GameProgress,
  sectionIds: string[],
  orbIds: string[],
): boolean {
  return (
    sectionIds.every((id) => progress.visited.includes(id)) &&
    orbIds.every((id) => progress.collected.includes(id))
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
bun test
```

Expected: all tests pass.

- [ ] **Step 5: Create `lib/game-config.ts`**

```ts
export type GameSection = {
  id: string;
  clip?: string;
};

export type Emote = { clip: string; key: number };

// Section ids must match the DOM ids on the page sections. `clip` is a
// one-shot animation played when the section becomes active; sections
// without one fall back to the idle loop, so future sections need no
// game-code changes.
export const gameSections: GameSection[] = [
  { id: "top", clip: "Wave" },
  { id: "about", clip: "Yes" },
  { id: "project", clip: "ThumbsUp" },
  { id: "experience", clip: "Punch" },
  { id: "skills" },
  { id: "education" },
];

export const CHARACTER_URL = "/character.glb";
export const CHARACTER_MODEL_HEIGHT = 4.5; // world units, from asset bbox
export const CHARACTER_HEIGHT_PX = { desktop: 110, mobile: 64 };

export const DEFAULT_CLIP = "Idle";
export const WALK_CLIP = "Walking";
export const JUMP_CLIP = "Jump";
export const VICTORY_CLIP = "Dance";

export const GROUND_MARGIN_PX = 48;
export const WALK_SPEED_PX = 260;
export const JUMP_VELOCITY_PX = 800;
export const GRAVITY_PX = 2000;

export const ORB_DIAMETER_PX = 26;
export const ORB_MIN_HEIGHT_PX = 40;
export const ORB_MAX_HEIGHT_PX = 200;
export const COLLECT_RADIUS_PX = 80;

export const HIDDEN_STORAGE_KEY = "game-hidden";
export const HELP_SEEN_STORAGE_KEY = "game-help-seen";
```

- [ ] **Step 6: Verify**

```bash
bun test && bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: game config and tested progress state"
```

---

### Task 4: Collectible anchors on existing sections

**Files:**

- Modify: `components/hero.tsx`
- Modify: `components/about.tsx`
- Modify: `components/featured-project.tsx`
- Modify: `components/experience.tsx`
- Modify: `components/skills.tsx`
- Modify: `components/education-certs.tsx`

**Interfaces:**

- Consumes: nothing.
- Produces: seven `data-game-collectible="<sectionId>"` attributes (top 1, about 1, project 2, experience 1, skills 1, education 1) that Task 6's `measureOrbAnchors()` discovers via `querySelectorAll("[data-game-collectible]")`. Attribute value = section id. NOTHING else about these components changes.

- [ ] **Step 1: Add the attributes (exact edits)**

In `components/hero.tsx`, change:

```tsx
        <h1
          data-hero-item
          className="font-heading mt-6 text-6xl font-medium tracking-tight md:text-8xl"
        >
```

to:

```tsx
        <h1
          data-hero-item
          data-game-collectible="top"
          className="font-heading mt-6 text-6xl font-medium tracking-tight md:text-8xl"
        >
```

In `components/about.tsx`, change:

```tsx
          <p className="text-muted max-w-3xl text-lg leading-relaxed">
```

to:

```tsx
          <p
            data-game-collectible="about"
            className="text-muted max-w-3xl text-lg leading-relaxed"
          >
```

In `components/featured-project.tsx`, change:

```tsx
          <p data-tracer-what className="max-w-3xl text-lg leading-relaxed">
```

to:

```tsx
          <p
            data-tracer-what
            data-game-collectible="project"
            className="max-w-3xl text-lg leading-relaxed"
          >
```

and change:

```tsx
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
```

to:

```tsx
          <div
            data-game-collectible="project"
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
```

In `components/experience.tsx`, change:

```tsx
          <ol ref={listRef} className="space-y-10">
```

to:

```tsx
          <ol
            ref={listRef}
            data-game-collectible="experience"
            className="space-y-10"
          >
```

In `components/skills.tsx`, change:

```tsx
        <div className="grid gap-5 md:grid-cols-2">
```

to:

```tsx
        <div data-game-collectible="skills" className="grid gap-5 md:grid-cols-2">
```

In `components/education-certs.tsx`, change:

```tsx
        <div className="grid gap-5 md:grid-cols-2">
```

to:

```tsx
        <div
          data-game-collectible="education"
          className="grid gap-5 md:grid-cols-2"
        >
```

- [ ] **Step 2: Verify**

```bash
bun test && bun run format && bun run lint && bun run typecheck
```

Expected: all clean. Prettier may rewrap the edited lines; that is fine.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: declare collectible anchor points on sections"
```

---

### Task 5: Game gate, layer shell, and character

**Files:**

- Create: `components/game/game-gate.tsx`
- Create: `components/game/game-layer.tsx`
- Create: `components/game/character.tsx`
- Modify: `app/page.tsx`

**Interfaces:**

- Consumes: `gameEnabled` from `@/lib/config`; `gameSections`, `Emote`, clip/physics constants from `@/lib/game-config`; `/character.glb` from Task 2.
- Produces:
  - `GameGate()` default export mounted in `app/page.tsx`.
  - `GameLayer()` default export (no props yet; Task 7 adds `onHide`).
  - `Character({ emote, posRef })` default export. `posRef` is a ref to `{ x: number; y: number }` = character centre in viewport px measured from the top-left corner; Task 6 reads it every frame for collision.

- [ ] **Step 1: Create `components/game/game-gate.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { gameEnabled } from "@/lib/config";
import { HIDDEN_STORAGE_KEY } from "@/lib/game-config";

const GameLayer = dynamic(() => import("@/components/game/game-layer"), {
  ssr: false,
});

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function GameGate() {
  const [ready, setReady] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!gameEnabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!supportsWebGL()) return;
    setHidden(window.localStorage.getItem(HIDDEN_STORAGE_KEY) === "true");
    setReady(true);
  }, []);

  function setHiddenPref(next: boolean) {
    setHidden(next);
    window.localStorage.setItem(HIDDEN_STORAGE_KEY, String(next));
  }

  if (!ready) return null;
  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHiddenPref(false)}
        className="glass text-muted hover:text-accent fixed bottom-5 left-5 z-40 rounded-full px-4 py-2 font-mono text-xs transition-colors"
      >
        Show game
      </button>
    );
  }
  return <GameLayer />;
}
```

Note: `setHiddenPref(true)` has no caller until Task 7 wires the HUD Hide button; the Show pill path already works for visitors who hid the game previously.

- [ ] **Step 2: Create `components/game/game-layer.tsx`**

```tsx
"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Character from "@/components/game/character";
import { gameSections, type Emote } from "@/lib/game-config";

export default function GameLayer() {
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  const [emote, setEmote] = useState<Emote | null>(null);
  const emoteKey = useRef(0);
  const posRef = useRef({ x: 0, y: 0 });

  const playEmote = useCallback((clip: string) => {
    emoteKey.current += 1;
    setEmote({ clip, key: emoteKey.current });
  }, []);

  // Pause rendering when the tab is hidden.
  useEffect(() => {
    function onVisibility() {
      setFrameloop(document.hidden ? "never" : "always");
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Play a one-shot clip when a mapped section becomes active.
  useEffect(() => {
    const sections = gameSections
      .map((section) => ({ section, el: document.getElementById(section.id) }))
      .filter(
        (
          entry,
        ): entry is { section: (typeof gameSections)[number]; el: HTMLElement } =>
          entry.el !== null,
      );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const match = sections.find((s) => s.el === entry.target);
          if (match?.section.clip) playEmote(match.section.clip);
        }
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    sections.forEach((s) => observer.observe(s.el));
    return () => observer.disconnect();
  }, [playEmote]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div aria-hidden="true" className="absolute inset-0">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 10], fov: 50 }}
          gl={{ alpha: true, antialias: true }}
          frameloop={frameloop}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[3, 5, 4]} intensity={1.5} />
          <Suspense fallback={null}>
            <Character emote={emote} posRef={posRef} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/game/character.tsx`**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import {
  CHARACTER_HEIGHT_PX,
  CHARACTER_MODEL_HEIGHT,
  CHARACTER_URL,
  DEFAULT_CLIP,
  GRAVITY_PX,
  GROUND_MARGIN_PX,
  JUMP_CLIP,
  JUMP_VELOCITY_PX,
  WALK_CLIP,
  WALK_SPEED_PX,
  type Emote,
} from "@/lib/game-config";

type CharacterProps = {
  emote: Emote | null;
  posRef: React.MutableRefObject<{ x: number; y: number }>;
};

export default function Character({ emote, posRef }: CharacterProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(CHARACTER_URL);
  const { actions, mixer } = useAnimations(animations, group);
  const { viewport } = useThree();

  const keys = useRef({ left: false, right: false });
  const wantJump = useRef(false);
  const xPx = useRef(0); // offset from viewport centre, px
  const jumpPx = useRef(0); // height above ground, px
  const vyPx = useRef(0);
  const facing = useRef(1); // -1 left, 1 right
  const oneShot = useRef(false); // a one-shot clip is playing
  const current = useRef<string | null>(null);
  const lastScrollAt = useRef(0);
  const scrollDir = useRef(0);
  const [coarse] = useState(() =>
    window.matchMedia("(pointer: coarse)").matches,
  );

  const playClip = useCallback(
    (name: string, once = false) => {
      const action = actions[name];
      if (!action || current.current === name) return;
      if (current.current) actions[current.current]?.fadeOut(0.2);
      action.reset().fadeIn(0.2);
      if (once) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity);
      }
      action.play();
      current.current = name;
    },
    [actions],
  );

  // Return to idle whenever a one-shot clip finishes.
  useEffect(() => {
    function onFinished() {
      oneShot.current = false;
      playClip(DEFAULT_CLIP);
    }
    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
  }, [mixer, playClip]);

  // Section emotes.
  useEffect(() => {
    if (!emote) return;
    oneShot.current = true;
    playClip(emote.clip, true);
  }, [emote, playClip]);

  // Desktop keys. Never captures native scroll keys (arrows, Space).
  useEffect(() => {
    if (coarse) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "KeyA") keys.current.left = true;
      if (e.code === "KeyD") keys.current.right = true;
      if (e.code === "KeyW" && !e.repeat) wantJump.current = true;
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "KeyA") keys.current.left = false;
      if (e.code === "KeyD") keys.current.right = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [coarse]);

  // Mobile: walk in the direction of scrolling.
  useEffect(() => {
    if (!coarse) return;
    let lastY = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      scrollDir.current = y > lastY ? 1 : y < lastY ? -1 : scrollDir.current;
      lastY = y;
      lastScrollAt.current = performance.now();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [coarse]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dom = state.gl.domElement;
    const pxW = dom.clientWidth;
    const pxH = dom.clientHeight;
    if (pxW === 0 || pxH === 0) return;
    const unitsPerPx = viewport.height / pxH;
    const heightPx = coarse
      ? CHARACTER_HEIGHT_PX.mobile
      : CHARACTER_HEIGHT_PX.desktop;

    let dir = 0;
    if (coarse) {
      const active = performance.now() - lastScrollAt.current < 1200;
      dir = active ? scrollDir.current : 0;
    } else {
      dir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
    }
    if (dir !== 0) facing.current = dir;

    const halfW = pxW / 2 - heightPx / 2;
    xPx.current = Math.min(
      Math.max(xPx.current + dir * WALK_SPEED_PX * delta, -halfW),
      halfW,
    );

    if (wantJump.current && jumpPx.current === 0) {
      vyPx.current = JUMP_VELOCITY_PX;
      if (!oneShot.current) {
        oneShot.current = true;
        playClip(JUMP_CLIP, true);
      }
    }
    wantJump.current = false;
    if (jumpPx.current > 0 || vyPx.current !== 0) {
      jumpPx.current += vyPx.current * delta;
      vyPx.current -= GRAVITY_PX * delta;
      if (jumpPx.current <= 0) {
        jumpPx.current = 0;
        vyPx.current = 0;
      }
    }

    if (!oneShot.current) {
      playClip(dir !== 0 ? WALK_CLIP : DEFAULT_CLIP);
    }

    const scale = (heightPx * unitsPerPx) / CHARACTER_MODEL_HEIGHT;
    const groundY = -viewport.height / 2 + GROUND_MARGIN_PX * unitsPerPx;
    g.scale.setScalar(scale);
    g.position.set(
      xPx.current * unitsPerPx,
      groundY + jumpPx.current * unitsPerPx,
      0,
    );
    const targetRot =
      dir !== 0 ? (facing.current > 0 ? Math.PI / 2 : -Math.PI / 2) : 0;
    g.rotation.y += (targetRot - g.rotation.y) * Math.min(1, delta * 8);

    // Character centre in viewport px from the top-left corner.
    posRef.current.x = pxW / 2 + xPx.current;
    posRef.current.y = pxH - GROUND_MARGIN_PX - jumpPx.current - heightPx / 2;
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(CHARACTER_URL);
```

- [ ] **Step 4: Mount in `app/page.tsx`**

Add the import (alphabetical position after `Footer`):

```tsx
import GameGate from "@/components/game/game-gate";
```

and render `<GameGate />` after `<Footer />`:

```tsx
      <Footer />
      <GameGate />
```

- [ ] **Step 5: Verify**

```bash
bun test && bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 3d character layer with keyboard and scroll controls"
```

---

### Task 6: Collectibles, progress, and victory

**Files:**

- Create: `components/game/collectibles.tsx`
- Modify: `components/game/game-layer.tsx` (full replacement below)

**Interfaces:**

- Consumes: `posRef` contract from Task 5 (character centre, viewport px from top-left); `data-game-collectible` attributes from Task 4; `game-state` functions from Task 3.
- Produces: `measureOrbAnchors(): OrbAnchor[]` with `OrbAnchor = { id, sectionId, docX, docY }` (`id` format `${sectionId}-${n}`, document-space coordinates); `Collectibles` and `VictoryBurst` components; `GameLayer` now owns `GameProgress` state. Task 7 consumes the progress values via HUD props.

- [ ] **Step 1: Create `components/game/collectibles.tsx`**

```tsx
"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  COLLECT_RADIUS_PX,
  GROUND_MARGIN_PX,
  ORB_DIAMETER_PX,
  ORB_MAX_HEIGHT_PX,
  ORB_MIN_HEIGHT_PX,
} from "@/lib/game-config";

export type OrbAnchor = {
  id: string;
  sectionId: string;
  docX: number;
  docY: number;
};

export function measureOrbAnchors(): OrbAnchor[] {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>("[data-game-collectible]"),
  );
  const counts: Record<string, number> = {};
  return elements.map((el) => {
    const sectionId = el.dataset.gameCollectible ?? "unknown";
    counts[sectionId] = (counts[sectionId] ?? 0) + 1;
    const rect = el.getBoundingClientRect();
    return {
      id: `${sectionId}-${counts[sectionId]}`,
      sectionId,
      docX: rect.left + rect.width / 2 + window.scrollX,
      docY: rect.top + window.scrollY,
    };
  });
}

type CollectiblesProps = {
  anchors: OrbAnchor[];
  collected: string[];
  posRef: React.MutableRefObject<{ x: number; y: number }>;
  onCollect: (id: string) => void;
};

const BURST_SECONDS = 0.35;

export default function Collectibles({
  anchors,
  collected,
  posRef,
  onCollect,
}: CollectiblesProps) {
  const groups = useRef(new Map<string, THREE.Group>());
  const bursts = useRef(new Map<string, number>());

  useFrame((state) => {
    const dom = state.gl.domElement;
    const pxW = dom.clientWidth;
    const pxH = dom.clientHeight;
    if (pxW === 0 || pxH === 0) return;
    const unitsPerPx = state.viewport.height / pxH;
    const t = state.clock.elapsedTime;
    const orbScale = ORB_DIAMETER_PX * unitsPerPx;

    for (const anchor of anchors) {
      const g = groups.current.get(anchor.id);
      if (!g) continue;
      const burstStart = bursts.current.get(anchor.id);
      if (collected.includes(anchor.id) && burstStart === undefined) {
        g.visible = false;
        continue;
      }

      const vx = anchor.docX - window.scrollX;
      const rawVy = anchor.docY - window.scrollY;
      const nearViewport =
        vx > -60 && vx < pxW + 60 && rawVy > -300 && rawVy < pxH + 300;
      if (!nearViewport) {
        g.visible = false;
        continue;
      }

      // Clamp orbs into the vertical band the character can reach.
      const vy = Math.min(
        Math.max(rawVy, pxH - GROUND_MARGIN_PX - ORB_MAX_HEIGHT_PX),
        pxH - GROUND_MARGIN_PX - ORB_MIN_HEIGHT_PX,
      );
      const bob = Math.sin(t * 2 + anchor.docX) * 6;
      g.visible = true;
      g.position.set(
        (vx - pxW / 2) * unitsPerPx,
        (pxH / 2 - (vy + bob)) * unitsPerPx,
        0,
      );

      if (burstStart !== undefined) {
        const k = (t - burstStart) / BURST_SECONDS;
        if (k >= 1) {
          g.visible = false;
        } else {
          g.scale.setScalar(orbScale * (1 + k * 2.5));
        }
        continue;
      }

      g.scale.setScalar(orbScale);
      const dx = vx - posRef.current.x;
      const dy = vy - posRef.current.y;
      if (Math.hypot(dx, dy) < COLLECT_RADIUS_PX) {
        bursts.current.set(anchor.id, t);
        onCollect(anchor.id);
      }
    }
  });

  return (
    <group>
      {anchors.map((anchor) => (
        <group
          key={anchor.id}
          ref={(node) => {
            if (node) groups.current.set(anchor.id, node);
            else groups.current.delete(anchor.id);
          }}
        >
          <mesh>
            <sphereGeometry args={[0.5, 20, 20]} />
            <meshStandardMaterial
              color="#5aa2ff"
              emissive="#5aa2ff"
              emissiveIntensity={1.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const PARTICLES = Array.from({ length: 10 }, (_, i) => i);

export function VictoryBurst({
  posRef,
}: {
  posRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const dom = state.gl.domElement;
    const pxW = dom.clientWidth;
    const pxH = dom.clientHeight;
    if (pxW === 0 || pxH === 0) return;
    const unitsPerPx = state.viewport.height / pxH;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const k = (state.clock.elapsedTime - start.current) / 1.2;
    if (k >= 1) {
      g.visible = false;
      return;
    }
    g.visible = true;
    g.position.set(
      (posRef.current.x - pxW / 2) * unitsPerPx,
      (pxH / 2 - posRef.current.y) * unitsPerPx,
      0,
    );
    g.children.forEach((child, i) => {
      const angle = (i / g.children.length) * Math.PI * 2;
      const radius = 30 + k * 130;
      child.position.set(
        Math.cos(angle) * radius * unitsPerPx,
        Math.sin(angle) * radius * unitsPerPx,
        0,
      );
      child.scale.setScalar((1 - k) * 10 * unitsPerPx);
    });
  });

  return (
    <group ref={group} visible={false}>
      {PARTICLES.map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.5, 12, 12]} />
          <meshStandardMaterial
            color="#5aa2ff"
            emissive="#5aa2ff"
            emissiveIntensity={2}
          />
        </mesh>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Replace `components/game/game-layer.tsx` entirely with:**

```tsx
"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Character from "@/components/game/character";
import Collectibles, {
  measureOrbAnchors,
  VictoryBurst,
  type OrbAnchor,
} from "@/components/game/collectibles";
import { gameSections, VICTORY_CLIP, type Emote } from "@/lib/game-config";
import {
  collectOrb,
  emptyProgress,
  isComplete,
  markVisited,
  type GameProgress,
} from "@/lib/game-state";

export default function GameLayer() {
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  const [emote, setEmote] = useState<Emote | null>(null);
  const [anchors, setAnchors] = useState<OrbAnchor[]>([]);
  const [progress, setProgress] = useState<GameProgress>(emptyProgress);
  const [celebrated, setCelebrated] = useState(false);
  const emoteKey = useRef(0);
  const posRef = useRef({ x: 0, y: 0 });

  const playEmote = useCallback((clip: string) => {
    emoteKey.current += 1;
    setEmote({ clip, key: emoteKey.current });
  }, []);

  // Pause rendering when the tab is hidden.
  useEffect(() => {
    function onVisibility() {
      setFrameloop(document.hidden ? "never" : "always");
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Measure orb anchors on mount and (debounced) on resize.
  useEffect(() => {
    setAnchors(measureOrbAnchors());
    let timer: number | undefined;
    function onResize() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setAnchors(measureOrbAnchors()), 200);
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Active section: mark visited, re-measure anchors, play one-shot clip.
  useEffect(() => {
    const sections = gameSections
      .map((section) => ({ section, el: document.getElementById(section.id) }))
      .filter(
        (
          entry,
        ): entry is { section: (typeof gameSections)[number]; el: HTMLElement } =>
          entry.el !== null,
      );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const match = sections.find((s) => s.el === entry.target);
          if (!match) continue;
          setProgress((prev) => markVisited(prev, match.section.id));
          setAnchors(measureOrbAnchors());
          if (match.section.clip) playEmote(match.section.clip);
        }
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    sections.forEach((s) => observer.observe(s.el));
    return () => observer.disconnect();
  }, [playEmote]);

  const sectionIds = gameSections.map((s) => s.id);
  const orbIds = anchors.map((a) => a.id);
  const complete = anchors.length > 0 && isComplete(progress, sectionIds, orbIds);

  // One-time celebration once everything is discovered and collected.
  useEffect(() => {
    if (!complete || celebrated) return;
    setCelebrated(true);
    playEmote(VICTORY_CLIP);
  }, [complete, celebrated, playEmote]);

  const handleCollect = useCallback((id: string) => {
    setProgress((prev) => collectOrb(prev, id));
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div aria-hidden="true" className="absolute inset-0">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 10], fov: 50 }}
          gl={{ alpha: true, antialias: true }}
          frameloop={frameloop}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[3, 5, 4]} intensity={1.5} />
          <Suspense fallback={null}>
            <Character emote={emote} posRef={posRef} />
          </Suspense>
          <Collectibles
            anchors={anchors}
            collected={progress.collected}
            posRef={posRef}
            onCollect={handleCollect}
          />
          {celebrated ? <VictoryBurst posRef={posRef} /> : null}
        </Canvas>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

```bash
bun test && bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: collectible orbs with progress and victory burst"
```

---

### Task 7: HUD, help overlay, and hide wiring

**Files:**

- Create: `components/game/hud.tsx`
- Modify: `components/game/game-layer.tsx` (add `onHide` prop + render HUD)
- Modify: `components/game/game-gate.tsx` (pass `onHide`)

**Interfaces:**

- Consumes: progress values from Task 6's `GameLayer` state; `HELP_SEEN_STORAGE_KEY` from `@/lib/game-config`; `setHiddenPref` from Task 5's `GameGate`.
- Produces: `Hud({ discovered, totalSections, collectedOrbs, totalOrbs, complete, onHide })` default export; `GameLayer` signature becomes `GameLayer({ onHide }: { onHide: () => void })`.

- [ ] **Step 1: Create `components/game/hud.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { HELP_SEEN_STORAGE_KEY } from "@/lib/game-config";

type HudProps = {
  discovered: number;
  totalSections: number;
  collectedOrbs: number;
  totalOrbs: number;
  complete: boolean;
  onHide: () => void;
};

export default function Hud({
  discovered,
  totalSections,
  collectedOrbs,
  totalOrbs,
  complete,
  onHide,
}: HudProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    setPulse(window.localStorage.getItem(HELP_SEEN_STORAGE_KEY) !== "true");
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "KeyH") setHelpOpen((open) => !open);
      if (e.code === "Escape") setHelpOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!helpOpen) return;
    setPulse(false);
    window.localStorage.setItem(HELP_SEEN_STORAGE_KEY, "true");
  }, [helpOpen]);

  return (
    <>
      <div className="glass pointer-events-auto fixed bottom-5 left-5 z-40 flex items-center gap-3 rounded-full px-4 py-2 font-mono text-xs">
        <span>
          {discovered}/{totalSections} discovered
        </span>
        <span className="text-muted">
          {collectedOrbs}/{totalOrbs} orbs
        </span>
        {complete ? <span className="text-accent">100% explored</span> : null}
        {!coarse ? (
          <span className="text-muted hidden lg:inline">
            A/D move | W jump
          </span>
        ) : null}
        <button
          type="button"
          aria-label="Game help"
          onClick={() => setHelpOpen(true)}
          className={`hover:text-accent rounded-full px-2 py-0.5 transition-colors ${
            pulse ? "text-accent motion-safe:animate-pulse" : "text-muted"
          }`}
        >
          ?
        </button>
        <button
          type="button"
          onClick={onHide}
          className="text-muted hover:text-accent rounded-full px-2 py-0.5 transition-colors"
        >
          Hide
        </button>
      </div>
      {helpOpen ? (
        <div
          className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center px-6"
          role="dialog"
          aria-modal="true"
          aria-label="Game help"
        >
          <button
            type="button"
            aria-label="Close help"
            onClick={() => setHelpOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="glass relative max-w-md rounded-3xl p-8">
            <h2 className="font-heading text-xl font-medium">How to play</h2>
            {coarse ? (
              <p className="text-muted mt-4 text-sm leading-relaxed">
                The explorer walks along with you as you scroll and picks up
                the glowing orbs it passes. Visit every section to reach
                100%.
              </p>
            ) : (
              <dl className="mt-5 space-y-3 font-mono text-sm">
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">A / D</dt>
                  <dd>Walk left / right</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">W</dt>
                  <dd>Jump</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">H</dt>
                  <dd>Toggle this help</dd>
                </div>
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Scroll</dt>
                  <dd>Travel through the page</dd>
                </div>
              </dl>
            )}
            <p className="text-muted mt-5 text-sm leading-relaxed">
              Glowing orbs sit near the content. Walk or jump into them to
              collect. Discover every section and collect every orb for a
              small celebration. The Hide button turns the game off; your
              choice is remembered.
            </p>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="glass hover:text-accent mt-6 rounded-full px-5 py-2 text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 2: Wire it into `components/game/game-layer.tsx`**

Add the import:

```tsx
import Hud from "@/components/game/hud";
```

Change the function signature from:

```tsx
export default function GameLayer() {
```

to:

```tsx
export default function GameLayer({ onHide }: { onHide: () => void }) {
```

and add the HUD as a sibling of the canvas wrapper `div` (directly before the closing `</div>` of the outer container):

```tsx
      <Hud
        discovered={progress.visited.length}
        totalSections={sectionIds.length}
        collectedOrbs={progress.collected.length}
        totalOrbs={anchors.length}
        complete={complete}
        onHide={onHide}
      />
```

- [ ] **Step 3: Pass `onHide` in `components/game/game-gate.tsx`**

Change:

```tsx
  return <GameLayer />;
```

to:

```tsx
  return <GameLayer onHide={() => setHiddenPref(true)} />;
```

- [ ] **Step 4: Verify**

```bash
bun test && bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: game hud with help overlay and hide toggle"
```

---

### Task 8: Feature documentation and final audit

**Files:**

- Create: `docs/game-layer.md`

**Interfaces:**

- Consumes: everything prior.
- Produces: final deliverable on `feat/game-layer`.

- [ ] **Step 1: Create `docs/game-layer.md`**

```markdown
# Game Layer

A gamified 3D overlay: a low-poly robot (CC0, RobotExpressive by Tomas
Laulhe / quaternius.com, via the three.js examples repo) walks along the
bottom of the viewport, reacts to sections, and collects orbs anchored to
page content. Strictly additive: content, scroll, and accessibility are
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
  preference, not hidden by the visitor.
- `components/game/game-layer.tsx` renders a fixed, pointer-events-none
  R3F canvas (dpr capped at 1.5, render loop paused on hidden tabs) plus
  the DOM HUD. An IntersectionObserver marks sections visited and plays
  one-shot clips from the `gameSections` map in `lib/game-config.ts`
  (unmapped sections fall back to idle).
- `components/game/character.tsx` handles movement: `A`/`D` walk and `W`
  jump on desktop (native scroll keys are never captured); on touch
  devices the character auto-walks with scroll. Physics and sizes are
  constants in `lib/game-config.ts`.
- `components/game/collectibles.tsx` measures `[data-game-collectible]`
  elements (cached; re-measured on resize/section change), renders orbs
  clamped into the character's reachable band, and detects collection by
  distance in viewport px via a shared position ref.
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
- Orbs clamp into a reachable band instead of sitting at their element's
  exact height, so every orb is collectable from the ground line.
```

- [ ] **Step 2: Copy audit**

```bash
rg -n "—|–" components/game lib/game-config.ts lib/game-state.ts docs/game-layer.md
rg -in "leverage|delve|seamless|robust|honed|spearhead|tapestry" components/game docs/game-layer.md
```

Expected: both return no matches (exit code 1).

- [ ] **Step 3: Verify everything**

```bash
bun test && bun run format && bun run lint && bun run typecheck
```

Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: game layer feature documentation"
```
