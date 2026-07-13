"use client";

import { useSyncExternalStore } from "react";
import AuroraBackground from "@/components/aurora-background";
import AuroraShader from "@/components/aurora-shader";
import { interactiveAurora } from "@/lib/config";

const noopSubscribe = () => () => {};

// Probe the canvas only once per module load.
let webGLSupported: boolean | null = null;
function supportsWebGL(): boolean {
  if (webGLSupported !== null) return webGLSupported;
  try {
    const canvas = document.createElement("canvas");
    webGLSupported = Boolean(canvas.getContext("webgl"));
  } catch {
    webGLSupported = false;
  }
  return webGLSupported;
}

function readShaderEligible(): boolean {
  return (
    interactiveAurora &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    supportsWebGL()
  );
}

// SSR renders the CSS aurora; the shader takes over after hydration on
// capable, motion-friendly clients.
export default function Aurora() {
  const shader = useSyncExternalStore(
    noopSubscribe,
    readShaderEligible,
    () => false,
  );
  return shader ? <AuroraShader /> : <AuroraBackground />;
}
