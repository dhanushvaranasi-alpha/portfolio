"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { gameEnabled } from "@/lib/config";
import { HIDDEN_STORAGE_KEY } from "@/lib/game-config";

const GameLayer = dynamic(() => import("@/components/game/game-layer"), {
  ssr: false,
});

// ── module-level external store ───────────────────────────────────────────────

const listeners = new Set<() => void>();
let hiddenOverride: boolean | null = null;

function subscribeHidden(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function setHiddenPref(next: boolean) {
  hiddenOverride = next;
  try {
    window.localStorage.setItem(HIDDEN_STORAGE_KEY, String(next));
  } catch {}
  notifyListeners();
}

// Probe the canvas only once per module load.
let _webGLSupported: boolean | null = null;
function supportsWebGL(): boolean {
  if (_webGLSupported !== null) return _webGLSupported;
  try {
    const canvas = document.createElement("canvas");
    _webGLSupported = Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
    );
  } catch {
    _webGLSupported = false;
  }
  return _webGLSupported;
}

function readEligible(): boolean {
  return (
    gameEnabled &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    supportsWebGL()
  );
}

function readHidden(): boolean {
  if (hiddenOverride !== null) return hiddenOverride;
  try {
    return window.localStorage.getItem(HIDDEN_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export default function GameGate() {
  const eligible = useSyncExternalStore(
    subscribeHidden,
    readEligible,
    () => false,
  );
  const hidden = useSyncExternalStore(subscribeHidden, readHidden, () => true);

  if (!eligible) return null;
  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHiddenPref(false)}
        className="glass text-muted hover:text-accent fixed bottom-5 left-5 z-40 rounded-full px-4 py-2 font-mono text-xs transition-colors"
      >
        Show robot
      </button>
    );
  }
  return <GameLayer onHide={() => setHiddenPref(true)} />;
}
