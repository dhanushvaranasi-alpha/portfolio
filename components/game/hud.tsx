"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { HELP_SEEN_STORAGE_KEY } from "@/lib/game-config";

// ── module-level stores ───────────────────────────────────────────────────────

// Stable no-op subscribe for media-query snapshot (changes don't need reactivity).
const noopSubscribe = () => () => {};

// Help-seen store: notified whenever markHelpSeen() is called.
const helpSeenListeners = new Set<() => void>();
let helpSeenOverride = false;

function subscribeHelpSeen(listener: () => void): () => void {
  helpSeenListeners.add(listener);
  return () => helpSeenListeners.delete(listener);
}

function markHelpSeen() {
  helpSeenOverride = true;
  try {
    window.localStorage.setItem(HELP_SEEN_STORAGE_KEY, "true");
  } catch {}
  helpSeenListeners.forEach((l) => l());
}

// ── component ─────────────────────────────────────────────────────────────────

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

  const coarse = useSyncExternalStore(
    noopSubscribe,
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );

  const pulse = useSyncExternalStore(
    subscribeHelpSeen,
    () => {
      if (helpSeenOverride) return false;
      try {
        return window.localStorage.getItem(HELP_SEEN_STORAGE_KEY) !== "true";
      } catch {
        return false;
      }
    },
    () => false,
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "KeyH") {
        setHelpOpen((open) => {
          if (!open) markHelpSeen();
          return !open;
        });
      }
      if (e.code === "Escape") setHelpOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
          <span className="text-muted hidden lg:inline">A/D move | W jump</span>
        ) : null}
        <button
          type="button"
          aria-label="Game help"
          onClick={() => {
            markHelpSeen();
            setHelpOpen(true);
          }}
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
          aria-labelledby="game-help-title"
        >
          <button
            type="button"
            aria-label="Close help"
            onClick={() => setHelpOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="glass relative max-w-md rounded-3xl p-8">
            <h2
              id="game-help-title"
              className="font-heading text-xl font-medium"
            >
              How to play
            </h2>
            {coarse ? (
              <p className="text-muted mt-4 text-sm leading-relaxed">
                The explorer walks along with you as you scroll and picks up the
                glowing orbs it passes. Visit every section to reach 100%.
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
              collect. Discover every section and collect every orb for a small
              celebration. The Hide button turns the game off; your choice is
              remembered.
            </p>
            <button
              type="button"
              autoFocus
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
