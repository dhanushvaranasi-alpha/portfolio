"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Character from "@/components/game/character";
import Collectibles, {
  measureOrbAnchors,
  VictoryBurst,
  type OrbAnchor,
} from "@/components/game/collectibles";
import Compass from "@/components/game/compass";
import Hud from "@/components/game/hud";
import { gameSections, VICTORY_CLIP, type Emote } from "@/lib/game-config";
import {
  collectOrb,
  emptyProgress,
  isComplete,
  markVisited,
  type GameProgress,
} from "@/lib/game-state";

const sectionIds = gameSections.map((s) => s.id);

export default function GameLayer({ onHide }: { onHide: () => void }) {
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");
  const [emote, setEmote] = useState<Emote | null>(null);
  const [anchors, setAnchors] = useState<OrbAnchor[]>([]);
  const [progress, setProgress] = useState<GameProgress>(emptyProgress);
  const [celebrated, setCelebrated] = useState(false);
  const emoteKey = useRef(0);
  const posRef = useRef({ x: 0, y: 0 });

  // Refs to avoid stale closures in event callbacks.
  const anchorsRef = useRef<OrbAnchor[]>([]);
  const progressRef = useRef<GameProgress>(emptyProgress);
  const celebratedRef = useRef(false);

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

  // Debounced resize listener re-measures orb positions.
  // Initial measurement is handled by the IntersectionObserver callback,
  // which fires immediately on observe() for already-intersecting sections.
  useEffect(() => {
    let timer: number | undefined;
    function onResize() {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const next = measureOrbAnchors();
        anchorsRef.current = next;
        setAnchors(next);
      }, 200);
    }
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Check for completion transition and trigger celebration in event callbacks.
  const checkCompletion = useCallback(
    (nextProgress: GameProgress, currentAnchors: OrbAnchor[]) => {
      if (celebratedRef.current) return;
      const orbIds = currentAnchors.map((a) => a.id);
      if (orbIds.length > 0 && isComplete(nextProgress, sectionIds, orbIds)) {
        celebratedRef.current = true;
        setCelebrated(true);
        playEmote(VICTORY_CLIP);
      }
    },
    [playEmote],
  );

  // Active section: mark visited, re-measure anchors, play one-shot clip.
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
          if (!match) continue;

          // Re-measure anchors on each visit (covers initial measurement too).
          const freshAnchors = measureOrbAnchors();
          anchorsRef.current = freshAnchors;
          setAnchors(freshAnchors);

          const nextProgress = markVisited(
            progressRef.current,
            match.section.id,
          );
          progressRef.current = nextProgress;
          setProgress(nextProgress);

          checkCompletion(nextProgress, freshAnchors);

          if (match.section.clip) playEmote(match.section.clip);
        }
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    sections.forEach((s) => observer.observe(s.el));
    return () => observer.disconnect();
  }, [playEmote, checkCompletion]);

  const handleCollect = useCallback(
    (id: string) => {
      const nextProgress = collectOrb(progressRef.current, id);
      progressRef.current = nextProgress;
      setProgress(nextProgress);
      checkCompletion(nextProgress, anchorsRef.current);
    },
    [checkCompletion],
  );

  const complete = isComplete(
    progress,
    sectionIds,
    anchors.map((a) => a.id),
  );

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
            <Character
              emote={emote}
              posRef={posRef}
              anchors={anchors}
              collected={progress.collected}
            />
          </Suspense>
          <Collectibles
            anchors={anchors}
            collected={progress.collected}
            posRef={posRef}
            onCollect={handleCollect}
          />
          <Compass
            anchors={anchors}
            collected={progress.collected}
            posRef={posRef}
          />
          {celebrated ? <VictoryBurst posRef={posRef} /> : null}
        </Canvas>
      </div>
      <Hud
        discovered={progress.visited.length}
        totalSections={sectionIds.length}
        collectedOrbs={progress.collected.length}
        totalOrbs={anchors.length}
        complete={complete}
        onHide={onHide}
      />
    </div>
  );
}
