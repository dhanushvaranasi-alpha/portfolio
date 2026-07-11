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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
