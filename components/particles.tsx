"use client";

import { useSyncExternalStore } from "react";
import ParticleField from "@/components/particle-field";
import { particlesEnabled } from "@/lib/config";

const noopSubscribe = () => () => {};

function readEligible(): boolean {
  return (
    particlesEnabled &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// SSR and reduced-motion clients render nothing extra; the CSS aurora
// remains the base atmosphere either way.
export default function Particles() {
  const eligible = useSyncExternalStore(
    noopSubscribe,
    readEligible,
    () => false,
  );
  return eligible ? <ParticleField /> : null;
}
