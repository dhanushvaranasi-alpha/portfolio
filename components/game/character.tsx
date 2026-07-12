"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import type { OrbAnchor } from "@/components/game/collectibles";
import {
  CHARACTER_HEIGHT_PX,
  CHARACTER_MODEL_HEIGHT,
  CHARACTER_URL,
  DEFAULT_CLIP,
  EDGE_MARGIN_PX,
  MOVE_SPEED_PX,
  REST_POINT,
  WALK_CLIP,
  type Emote,
} from "@/lib/game-config";

type CharacterProps = {
  emote: Emote | null;
  posRef: React.RefObject<{ x: number; y: number }>;
  anchors: OrbAnchor[];
  collected: string[];
};

// Nearest uncollected orb currently inside the viewport, in viewport px.
function nearestOrbTarget(
  anchors: OrbAnchor[],
  collected: string[],
  from: { x: number; y: number },
  pxW: number,
  pxH: number,
): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null;
  let bestDist = Infinity;
  for (const anchor of anchors) {
    if (collected.includes(anchor.id)) continue;
    const vx = anchor.docX - window.scrollX;
    const vy = anchor.docY - window.scrollY;
    if (vx < 0 || vx > pxW || vy < 0 || vy > pxH) continue;
    const dist = Math.hypot(vx - from.x, vy - from.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = { x: vx, y: vy };
    }
  }
  return best;
}

export default function Character({
  emote,
  posRef,
  anchors,
  collected,
}: CharacterProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(CHARACTER_URL);
  const { actions, mixer } = useAnimations(animations, group);
  const actionsRef = useRef(actions);
  const { viewport } = useThree();

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  const keys = useRef({ left: false, right: false, up: false, down: false });
  const pos = useRef<{ x: number; y: number } | null>(null); // centre, viewport px
  const facing = useRef(1); // -1 left, 1 right
  const oneShot = useRef(false); // a one-shot clip is playing
  const current = useRef<string | null>(null);
  const [coarse] = useState(
    () => window.matchMedia("(pointer: coarse)").matches,
  );

  const playClip = useCallback((name: string, once = false) => {
    const action = actionsRef.current[name];
    if (!action || current.current === name) return;
    if (current.current) actionsRef.current[current.current]?.fadeOut(0.2);
    action.reset().fadeIn(0.2);
    if (once) {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat, Infinity);
    }
    action.play();
    current.current = name;
  }, []);

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
      if (e.code === "KeyW") keys.current.up = true;
      if (e.code === "KeyS") keys.current.down = true;
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "KeyA") keys.current.left = false;
      if (e.code === "KeyD") keys.current.right = false;
      if (e.code === "KeyW") keys.current.up = false;
      if (e.code === "KeyS") keys.current.down = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
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

    if (pos.current === null) {
      pos.current = { x: pxW * REST_POINT.x, y: pxH * REST_POINT.y };
    }
    const p = pos.current;

    let dx = 0;
    let dy = 0;
    if (coarse) {
      // Touch devices: glide toward the nearest uncollected orb in view,
      // otherwise drift back to the resting spot.
      const target = nearestOrbTarget(anchors, collected, p, pxW, pxH) ?? {
        x: pxW * REST_POINT.x,
        y: pxH * REST_POINT.y,
      };
      const ox = target.x - p.x;
      const oy = target.y - p.y;
      const dist = Math.hypot(ox, oy);
      if (dist > 6) {
        dx = ox / dist;
        dy = oy / dist;
      }
    } else {
      dx = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
      dy = (keys.current.down ? 1 : 0) - (keys.current.up ? 1 : 0);
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
      }
    }
    const moving = dx !== 0 || dy !== 0;
    if (dx !== 0) facing.current = dx > 0 ? 1 : -1;

    const minX = heightPx / 2 + EDGE_MARGIN_PX;
    const minY = heightPx / 2 + EDGE_MARGIN_PX;
    p.x = Math.min(
      Math.max(p.x + dx * MOVE_SPEED_PX * delta, minX),
      pxW - minX,
    );
    p.y = Math.min(
      Math.max(p.y + dy * MOVE_SPEED_PX * delta, minY),
      pxH - minY,
    );

    if (!oneShot.current) {
      playClip(moving ? WALK_CLIP : DEFAULT_CLIP);
    }

    // Gentle hover bob while idle keeps the explorer feeling alive.
    const bobPx = moving ? 0 : Math.sin(state.clock.elapsedTime * 2) * 4;
    const scale = (heightPx * unitsPerPx) / CHARACTER_MODEL_HEIGHT;
    g.scale.setScalar(scale);
    // Model origin sits at the feet; position from the centre point.
    g.position.set(
      (p.x - pxW / 2) * unitsPerPx,
      (pxH / 2 - (p.y + heightPx / 2 - bobPx)) * unitsPerPx,
      0,
    );
    const targetRot =
      dx !== 0 ? (facing.current > 0 ? Math.PI / 2 : -Math.PI / 2) : 0;
    g.rotation.y += (targetRot - g.rotation.y) * Math.min(1, delta * 8);

    // Character centre in viewport px from the top-left corner.
    posRef.current.x = p.x;
    posRef.current.y = p.y;
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(CHARACTER_URL);
