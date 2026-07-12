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
  const actionsRef = useRef(actions);
  const { viewport } = useThree();

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

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
