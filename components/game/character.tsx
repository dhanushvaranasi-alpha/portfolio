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
  DESKTOP_ANCHOR_Y,
  EDGE_OFFSET_PX,
  type Emote,
} from "@/lib/game-config";

type CharacterProps = {
  emote: Emote | null;
};

export default function Character({ emote }: CharacterProps) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(CHARACTER_URL);
  const { actions, mixer } = useAnimations(animations, group);
  const actionsRef = useRef(actions);
  const { viewport } = useThree();

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

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

  // Section emotes; idle between them.
  useEffect(() => {
    if (!emote) {
      playClip(DEFAULT_CLIP);
      return;
    }
    oneShot.current = true;
    playClip(emote.clip, true);
  }, [emote, playClip]);

  useFrame((state) => {
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

    // Anchor: right edge, vertically centred on desktop; bottom-right corner
    // on touch devices.
    const x = pxW - heightPx / 2 - EDGE_OFFSET_PX;
    const y = coarse
      ? pxH - heightPx / 2 - EDGE_OFFSET_PX
      : pxH * DESKTOP_ANCHOR_Y;

    // Gentle hover bob keeps the mascot feeling alive.
    const bobPx = Math.sin(state.clock.elapsedTime * 1.6) * 4;
    const scale = (heightPx * unitsPerPx) / CHARACTER_MODEL_HEIGHT;
    g.scale.setScalar(scale);
    // Model origin sits at the feet; place from the centre point.
    g.position.set(
      (x - pxW / 2) * unitsPerPx,
      (pxH / 2 - (y + heightPx / 2 - bobPx)) * unitsPerPx,
      0,
    );
    // Slight turn toward the page content.
    g.rotation.y = -Math.PI / 12;
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(CHARACTER_URL);
