"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { OrbAnchor } from "@/components/game/collectibles";
import { COLLECT_RADIUS_PX, COMPASS_ORBIT_PX } from "@/lib/game-config";

type CompassProps = {
  anchors: OrbAnchor[];
  collected: string[];
  posRef: React.RefObject<{ x: number; y: number }>;
};

// A small arrow orbiting the character that points toward the nearest
// uncollected orb, on or off screen, so there is always a "go here next".
export default function Compass({ anchors, collected, posRef }: CompassProps) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const dom = state.gl.domElement;
    const pxW = dom.clientWidth;
    const pxH = dom.clientHeight;
    if (pxW === 0 || pxH === 0) return;
    const unitsPerPx = state.viewport.height / pxH;

    let best: { x: number; y: number } | null = null;
    let bestDist = Infinity;
    for (const anchor of anchors) {
      if (collected.includes(anchor.id)) continue;
      const vx = anchor.docX - window.scrollX;
      const vy = anchor.docY - window.scrollY;
      const dist = Math.hypot(vx - posRef.current.x, vy - posRef.current.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = { x: vx, y: vy };
      }
    }

    // Nothing left to find, or close enough that the orb itself is the guide.
    if (best === null || bestDist < COLLECT_RADIUS_PX * 1.5) {
      g.visible = false;
      return;
    }

    g.visible = true;
    // Angle in world space: viewport y grows down, world y grows up.
    const angle = Math.atan2(
      posRef.current.y - best.y,
      best.x - posRef.current.x,
    );
    const centerX = (posRef.current.x - pxW / 2) * unitsPerPx;
    const centerY = (pxH / 2 - posRef.current.y) * unitsPerPx;
    const orbit = COMPASS_ORBIT_PX * unitsPerPx;
    g.position.set(
      centerX + Math.cos(angle) * orbit,
      centerY + Math.sin(angle) * orbit,
      0,
    );
    // Cone geometry points along +Y; rotate it to point along the angle.
    g.rotation.z = angle - Math.PI / 2;
    const pulse = 1 + 0.15 * Math.sin(state.clock.elapsedTime * 4);
    g.scale.setScalar(16 * unitsPerPx * pulse);
  });

  return (
    <group ref={group} visible={false}>
      <mesh>
        <coneGeometry args={[0.4, 1, 12]} />
        <meshStandardMaterial
          color="#5aa2ff"
          emissive="#5aa2ff"
          emissiveIntensity={1.8}
        />
      </mesh>
    </group>
  );
}
