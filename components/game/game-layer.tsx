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
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Play a one-shot clip when a mapped section becomes active.
  useEffect(() => {
    const sections = gameSections
      .map((section) => ({ section, el: document.getElementById(section.id) }))
      .filter(
        (
          entry,
        ): entry is {
          section: (typeof gameSections)[number];
          el: HTMLElement;
        } => entry.el !== null,
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
