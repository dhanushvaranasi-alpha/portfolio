"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  COLLECT_RADIUS_PX,
  GROUND_MARGIN_PX,
  ORB_DIAMETER_PX,
  ORB_MAX_HEIGHT_PX,
  ORB_MIN_HEIGHT_PX,
} from "@/lib/game-config";

export type OrbAnchor = {
  id: string;
  sectionId: string;
  docX: number;
  docY: number;
};

export function measureOrbAnchors(): OrbAnchor[] {
  const elements = Array.from(
    document.querySelectorAll<HTMLElement>("[data-game-collectible]"),
  );
  const counts: Record<string, number> = {};
  return elements.map((el) => {
    const sectionId = el.dataset.gameCollectible ?? "unknown";
    counts[sectionId] = (counts[sectionId] ?? 0) + 1;
    const rect = el.getBoundingClientRect();
    return {
      id: `${sectionId}-${counts[sectionId]}`,
      sectionId,
      docX: rect.left + rect.width / 2 + window.scrollX,
      docY: rect.top + window.scrollY,
    };
  });
}

type CollectiblesProps = {
  anchors: OrbAnchor[];
  collected: string[];
  posRef: React.MutableRefObject<{ x: number; y: number }>;
  onCollect: (id: string) => void;
};

const BURST_SECONDS = 0.35;

export default function Collectibles({
  anchors,
  collected,
  posRef,
  onCollect,
}: CollectiblesProps) {
  const groups = useRef(new Map<string, THREE.Group>());
  const bursts = useRef(new Map<string, number>());

  useFrame((state) => {
    const dom = state.gl.domElement;
    const pxW = dom.clientWidth;
    const pxH = dom.clientHeight;
    if (pxW === 0 || pxH === 0) return;
    const unitsPerPx = state.viewport.height / pxH;
    const t = state.clock.elapsedTime;
    const orbScale = ORB_DIAMETER_PX * unitsPerPx;

    for (const anchor of anchors) {
      const g = groups.current.get(anchor.id);
      if (!g) continue;
      const burstStart = bursts.current.get(anchor.id);
      if (collected.includes(anchor.id) && burstStart === undefined) {
        g.visible = false;
        continue;
      }

      const vx = anchor.docX - window.scrollX;
      const rawVy = anchor.docY - window.scrollY;
      const nearViewport =
        vx > -60 && vx < pxW + 60 && rawVy > -300 && rawVy < pxH + 300;
      if (!nearViewport) {
        g.visible = false;
        continue;
      }

      // Clamp orbs into the vertical band the character can reach.
      const vy = Math.min(
        Math.max(rawVy, pxH - GROUND_MARGIN_PX - ORB_MAX_HEIGHT_PX),
        pxH - GROUND_MARGIN_PX - ORB_MIN_HEIGHT_PX,
      );
      const bob = Math.sin(t * 2 + anchor.docX) * 6;
      g.visible = true;
      g.position.set(
        (vx - pxW / 2) * unitsPerPx,
        (pxH / 2 - (vy + bob)) * unitsPerPx,
        0,
      );

      if (burstStart !== undefined) {
        const k = (t - burstStart) / BURST_SECONDS;
        if (k >= 1) {
          g.visible = false;
        } else {
          g.scale.setScalar(orbScale * (1 + k * 2.5));
        }
        continue;
      }

      g.scale.setScalar(orbScale);
      const dx = vx - posRef.current.x;
      const dy = vy - posRef.current.y;
      if (Math.hypot(dx, dy) < COLLECT_RADIUS_PX) {
        bursts.current.set(anchor.id, t);
        onCollect(anchor.id);
      }
    }
  });

  return (
    <group>
      {anchors.map((anchor) => (
        <group
          key={anchor.id}
          ref={(node) => {
            if (node) groups.current.set(anchor.id, node);
            else groups.current.delete(anchor.id);
          }}
        >
          <mesh>
            <sphereGeometry args={[0.5, 20, 20]} />
            <meshStandardMaterial
              color="#5aa2ff"
              emissive="#5aa2ff"
              emissiveIntensity={1.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const PARTICLES = Array.from({ length: 10 }, (_, i) => i);

export function VictoryBurst({
  posRef,
}: {
  posRef: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const dom = state.gl.domElement;
    const pxW = dom.clientWidth;
    const pxH = dom.clientHeight;
    if (pxW === 0 || pxH === 0) return;
    const unitsPerPx = state.viewport.height / pxH;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const k = (state.clock.elapsedTime - start.current) / 1.2;
    if (k >= 1) {
      g.visible = false;
      return;
    }
    g.visible = true;
    g.position.set(
      (posRef.current.x - pxW / 2) * unitsPerPx,
      (pxH / 2 - posRef.current.y) * unitsPerPx,
      0,
    );
    g.children.forEach((child, i) => {
      const angle = (i / g.children.length) * Math.PI * 2;
      const radius = 30 + k * 130;
      child.position.set(
        Math.cos(angle) * radius * unitsPerPx,
        Math.sin(angle) * radius * unitsPerPx,
        0,
      );
      child.scale.setScalar((1 - k) * 10 * unitsPerPx);
    });
  });

  return (
    <group ref={group} visible={false}>
      {PARTICLES.map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.5, 12, 12]} />
          <meshStandardMaterial
            color="#5aa2ff"
            emissive="#5aa2ff"
            emissiveIntensity={2}
          />
        </mesh>
      ))}
    </group>
  );
}
