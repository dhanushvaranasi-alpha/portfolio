"use client";

import { useEffect, useRef } from "react";

type Target = { x: number; y: number };
type FormationName =
  "ambient" | "arc" | "graph" | "waypoints" | "lattice" | "sparse" | "orbit";

type Graph = {
  nodes: Target[];
  edges: [number, number][];
  hops: number[];
  maxHop: number;
};

// Section id -> formation. Unmapped sections keep the previous formation;
// the footer element (no id) maps to "orbit" below.
const SECTION_FORMATIONS: Record<string, FormationName> = {
  top: "ambient",
  about: "arc",
  project: "graph",
  experience: "waypoints",
  skills: "lattice",
  education: "sparse",
};

// Formation-wide tuning: global brightness multiplier and how visible the
// cursor constellation lines are while the formation holds.
const FORMATION_META: Record<FormationName, { dim: number; lines: number }> = {
  ambient: { dim: 1, lines: 1 },
  arc: { dim: 0.7, lines: 1 },
  graph: { dim: 1.1, lines: 0.35 },
  waypoints: { dim: 0.95, lines: 0.6 },
  lattice: { dim: 0.8, lines: 0.35 },
  sparse: { dim: 0.55, lines: 1 },
  orbit: { dim: 0.9, lines: 0.8 },
};

const TAU = Math.PI * 2;
const DESKTOP_COUNT = 1800;
const MOBILE_COUNT = 700;
const REPEL_RADIUS = 130;
const LINE_NEAR = 110;
const LINE_LINK = 64;
const LINE_CAP = 60;
const RIPPLE_MS = 1200;
const GRAPH_NODES = 14;
const EXPERIENCE_ROLES = 6;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ── formation target generators (viewport px) ───────────────────────────────

function ambientTargets(n: number, W: number, H: number): Target[] {
  const out: Target[] = [];
  for (let i = 0; i < n; i++) {
    // Denser toward the right: the hero text sits left.
    const x = i % 5 < 3 ? rand(W * 0.45, W) : rand(0, W);
    out.push({ x, y: rand(0, H) });
  }
  return out;
}

function arcTargets(n: number, W: number, H: number): Target[] {
  const out: Target[] = [];
  const cx = W * 0.78;
  const cy = H * 0.5;
  const r = Math.min(W, H) * 0.36;
  for (let i = 0; i < n; i++) {
    if (i % 4 === 0) {
      const a = rand(-Math.PI * 0.55, Math.PI * 0.55);
      const rr = r + rand(-14, 14);
      out.push({ x: cx + Math.cos(a) * rr * 0.55, y: cy + Math.sin(a) * rr });
    } else {
      out.push({ x: rand(0, W), y: rand(0, H) });
    }
  }
  return out;
}

function buildGraph(W: number, H: number): Graph {
  const cx = W * 0.62;
  const cy = H * 0.5;
  const R = Math.min(W, H) * 0.34;
  const nodes: Target[] = [];
  for (let i = 0; i < GRAPH_NODES; i++) {
    const a = i * 2.399963; // golden angle spiral layout
    const r = R * Math.sqrt((i + 1) / GRAPH_NODES);
    nodes.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.8 });
  }
  const edges: [number, number][] = [];
  for (let i = 0; i < GRAPH_NODES; i++) {
    const byDist = nodes
      .map((node, j) => ({
        d: Math.hypot(node.x - nodes[i].x, node.y - nodes[i].y),
        j,
      }))
      .filter((e) => e.d > 1)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const { j } of byDist) {
      const dup = edges.some(
        ([a, b]) => (a === i && b === j) || (a === j && b === i),
      );
      if (!dup) edges.push([i, j]);
    }
  }
  // Hop distance from the outermost node (the pulse origin) via BFS.
  const start = GRAPH_NODES - 1;
  const hops = new Array<number>(GRAPH_NODES).fill(-1);
  hops[start] = 0;
  const queue = [start];
  while (queue.length > 0) {
    const cur = queue.shift() as number;
    for (const [a, b] of edges) {
      const next = a === cur ? b : b === cur ? a : -1;
      if (next >= 0 && hops[next] === -1) {
        hops[next] = hops[cur] + 1;
        queue.push(next);
      }
    }
  }
  let maxHop = 0;
  for (const h of hops) maxHop = Math.max(maxHop, h);
  return { nodes, edges, hops, maxHop };
}

function graphTargets(n: number, graph: Graph): Target[] {
  const out: Target[] = [];
  for (let i = 0; i < n; i++) {
    if (i % 10 < 6) {
      const node = graph.nodes[i % graph.nodes.length];
      const a = rand(0, Math.PI * 2);
      const r = rand(0, 16);
      out.push({ x: node.x + Math.cos(a) * r, y: node.y + Math.sin(a) * r });
    } else {
      const [ai, bi] = graph.edges[i % graph.edges.length];
      const t = Math.random();
      out.push({
        x:
          graph.nodes[ai].x +
          (graph.nodes[bi].x - graph.nodes[ai].x) * t +
          rand(-5, 5),
        y:
          graph.nodes[ai].y +
          (graph.nodes[bi].y - graph.nodes[ai].y) * t +
          rand(-5, 5),
      });
    }
  }
  return out;
}

function waypointTargets(n: number, W: number, H: number): Target[] {
  const out: Target[] = [];
  const x0 = W * 0.88;
  const top = H * 0.18;
  const bottom = H * 0.85;
  for (let i = 0; i < n; i++) {
    if (i % 10 < 4) {
      out.push({ x: x0 + rand(-3, 3), y: rand(top, bottom) });
    } else {
      const stop = i % EXPERIENCE_ROLES;
      const sy = top + ((bottom - top) * stop) / (EXPERIENCE_ROLES - 1);
      const a = rand(0, Math.PI * 2);
      const r = rand(0, 26);
      out.push({ x: x0 + Math.cos(a) * r * 1.6, y: sy + Math.sin(a) * r });
    }
  }
  return out;
}

function latticeTargets(n: number, W: number, H: number): Target[] {
  const spacing = 44;
  const ox = W * 0.12;
  const oy = H * 0.14;
  const cols = Math.max(1, Math.floor((W * 0.76) / spacing));
  const rows = Math.max(1, Math.floor((H * 0.72) / (spacing * 0.87)));
  const out: Target[] = [];
  for (let i = 0; i < n; i++) {
    const cell = i % (cols * rows);
    const r = Math.floor(cell / cols);
    const c = cell % cols;
    const hexOffset = (r % 2) * spacing * 0.5;
    out.push({
      x: ox + c * spacing + hexOffset + rand(-2, 2),
      y: oy + r * spacing * 0.87 + rand(-2, 2),
    });
  }
  return out;
}

function sparseTargets(n: number, W: number, H: number): Target[] {
  const out: Target[] = [];
  for (let i = 0; i < n; i++) {
    if (i % 5 < 3) {
      out.push({ x: rand(0, W), y: rand(0, H) });
    } else {
      // Sent just past the edges: the field visibly thins out.
      const edge = i % 4;
      if (edge === 0) out.push({ x: rand(-80, -20), y: rand(0, H) });
      else if (edge === 1) out.push({ x: rand(W + 20, W + 80), y: rand(0, H) });
      else if (edge === 2) out.push({ x: rand(0, W), y: rand(-80, -20) });
      else out.push({ x: rand(0, W), y: rand(H + 20, H + 80) });
    }
  }
  return out;
}

function orbitTargets(n: number, W: number, H: number): Target[] {
  const out: Target[] = [];
  const cx = W * 0.5;
  const cy = H * 0.55;
  const r = Math.min(W, H) * 0.32;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rand(-0.05, 0.05);
    const rr = r + rand(-18, 18);
    out.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * 0.7 });
  }
  return out;
}

// ── component ────────────────────────────────────────────────────────────────

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const fine = !coarse;
    const count = coarse ? MOBILE_COUNT : DESKTOP_COUNT;

    let W = window.innerWidth;
    let H = window.innerHeight;
    function resizeCanvas() {
      if (!canvas || !ctx) return;
      W = window.innerWidth;
      H = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();

    // Particles enter from the viewport edges on first load.
    const particles = Array.from({ length: count }, () => {
      const side = Math.floor(rand(0, 4));
      const x =
        side === 0
          ? rand(-60, -10)
          : side === 1
            ? rand(W + 10, W + 60)
            : rand(0, W);
      const y =
        side === 2
          ? rand(-60, -10)
          : side === 3
            ? rand(H + 10, H + 60)
            : rand(0, H);
      return {
        x,
        y,
        vx: 0,
        vy: 0,
        tx: x,
        ty: y,
        px: x,
        py: y,
        delay: 0,
        seed: rand(0, 1000),
        size: rand(0.6, 2.1),
        bright: rand(0.35, 1),
      };
    });

    let formation: FormationName = "ambient";
    let formedAt = performance.now();
    let graph: Graph = buildGraph(W, H);
    let pinProgress = 0;
    let pinDriven = false;

    function applyFormation(name: FormationName) {
      formation = name;
      formedAt = performance.now();
      if (name === "graph") {
        graph = buildGraph(W, H);
        // Fresh build on every entry; the scrub (or the mobile timer)
        // drives it forward again from here.
        pinProgress = 0;
      }
      const targets =
        name === "ambient"
          ? ambientTargets(count, W, H)
          : name === "arc"
            ? arcTargets(count, W, H)
            : name === "graph"
              ? graphTargets(count, graph)
              : name === "waypoints"
                ? waypointTargets(count, W, H)
                : name === "lattice"
                  ? latticeTargets(count, W, H)
                  : name === "sparse"
                    ? sparseTargets(count, W, H)
                    : orbitTargets(count, W, H);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.px = p.tx;
        p.py = p.ty;
        p.tx = targets[i].x;
        p.ty = targets[i].y;
        p.delay = rand(0, 900);
      }
    }
    applyFormation("ambient");

    // ── input ────────────────────────────────────────────────────────────
    const mouse = { x: -9999, y: -9999 };
    function onPointerMove(e: PointerEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    const ripples: { x: number; y: number; t0: number }[] = [];
    function onPointerDown(e: PointerEvent) {
      ripples.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    function onPinProgress(e: Event) {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === "number") {
        pinProgress = detail;
        pinDriven = true;
      }
    }
    window.addEventListener("tracer-pin-progress", onPinProgress);

    // ── section tracking ─────────────────────────────────────────────────
    const watched: { el: Element; name: FormationName }[] = [];
    for (const [id, name] of Object.entries(SECTION_FORMATIONS)) {
      const el = document.getElementById(id);
      if (el) watched.push({ el, name });
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const match = watched.find((w) => w.el === entry.target);
          if (match && match.name !== formation) applyFormation(match.name);
        }
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    watched.forEach((w) => observer.observe(w.el));

    // The footer is shorter than the mid-viewport band the section observer
    // uses, so it gets its own threshold-based observer.
    const footer = document.querySelector("footer");
    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && formation !== "orbit") {
          applyFormation("orbit");
        }
      },
      { threshold: 0.4 },
    );
    if (footer) footerObserver.observe(footer);

    // Mobile browser chrome shows/hides on scroll, firing resize with small
    // height-only changes; rebuilding formations for those would visibly
    // scatter the field mid-scroll. Only regenerate for real layout changes.
    let resizeTimer: number | undefined;
    let prevW = W;
    let prevH = H;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resizeCanvas();
        const layoutChanged = W !== prevW || Math.abs(H - prevH) > 150;
        prevW = W;
        prevH = H;
        if (layoutChanged) applyFormation(formation);
      }, 200);
    }
    window.addEventListener("resize", onResize);

    // ── simulation + render ──────────────────────────────────────────────
    let lastScrollY = window.scrollY;
    let scrollVel = 0;
    let raf = 0;
    let lastFrame = performance.now();

    function frame(now: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const t = now / 1000;
      const meta = FORMATION_META[formation];

      // Normalize physics to a 60fps baseline so 120Hz displays and
      // throttled tabs behave identically. dt is in "60fps frames".
      const dt = Math.min(now - lastFrame, 50) / 16.667;
      lastFrame = now;
      const damp = Math.pow(0.9, dt);

      // Smoothed scroll velocity drives the streak effect.
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      scrollVel += (dy - scrollVel) * Math.min(0.2 * dt, 1);

      // Graph edges reveal with the pinned scrub (0.3 -> 0.7), and the
      // sanction pulse propagates hop by hop after 0.7. Below the 768px
      // breakpoint the pinned scene (and its progress event) does not
      // exist, so the graph plays out on a timer after forming instead.
      if (formation === "graph") {
        const prog = pinDriven
          ? pinProgress
          : Math.min((now - formedAt) / 5000, 1);
        const reveal = Math.min(Math.max((prog - 0.3) / 0.4, 0), 1);
        const shown = Math.floor(reveal * graph.edges.length);
        const pulseK = Math.min(Math.max((prog - 0.7) / 0.3, 0), 1);
        const litHops = pulseK * (graph.maxHop + 1);
        for (let i = 0; i < shown; i++) {
          const [a, b] = graph.edges[i];
          const lit =
            pulseK > 0 &&
            graph.hops[a] >= 0 &&
            graph.hops[b] >= 0 &&
            graph.hops[a] < litHops &&
            graph.hops[b] < litHops;
          ctx.strokeStyle = lit
            ? "rgba(255, 96, 96, 0.35)"
            : "rgba(90, 162, 255, 0.16)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(graph.nodes[a].x, graph.nodes[a].y);
          ctx.lineTo(graph.nodes[b].x, graph.nodes[b].y);
          ctx.stroke();
        }
        if (pulseK > 0) {
          for (let i = 0; i < graph.nodes.length; i++) {
            if (graph.hops[i] < 0 || graph.hops[i] >= litHops) continue;
            const flare = 1 - Math.min(litHops - graph.hops[i], 1) * 0.5;
            ctx.fillStyle = `rgba(255, 96, 96, ${0.22 * flare})`;
            ctx.beginPath();
            ctx.arc(graph.nodes[i].x, graph.nodes[i].y, 9, 0, TAU);
            ctx.fill();
          }
        }
      }

      ctx.globalCompositeOperation = "lighter";
      const near: { x: number; y: number }[] = [];

      for (const p of particles) {
        const active = now - formedAt > p.delay;
        const tx = active ? p.tx : p.px;
        const ty = active ? p.ty : p.py;

        p.vx += ((tx - p.x) * 0.012 + Math.sin(t * 0.7 + p.seed) * 0.012) * dt;
        p.vy +=
          ((ty - p.y) * 0.012 + Math.cos(t * 0.6 + p.seed * 1.3) * 0.012) * dt;

        // Scroll drag: the field lags behind fast scrolling, then springs back.
        p.vy -= scrollVel * 0.05 * dt;

        if (fine) {
          const dx = p.x - mouse.x;
          const dyp = p.y - mouse.y;
          const md = Math.hypot(dx, dyp);
          if (md < REPEL_RADIUS && md > 0.01) {
            const f = (1 - md / REPEL_RADIUS) * 0.9 * dt;
            p.vx += (dx / md) * f;
            p.vy += (dyp / md) * f;
          }
          if (md < LINE_NEAR && near.length < LINE_CAP) near.push(p);
        }

        for (const r of ripples) {
          const age = now - r.t0;
          if (age > RIPPLE_MS) continue;
          const rd = Math.hypot(p.x - r.x, p.y - r.y);
          const wave = age * 0.45;
          const q = (rd - wave) / 42;
          const band = Math.exp(-(q * q)) * (1 - age / RIPPLE_MS);
          if (band > 0.01 && rd > 0.01) {
            p.vx += ((p.x - r.x) / rd) * band * 2.4 * dt;
            p.vy += ((p.y - r.y) / rd) * band * 2.4 * dt;
          }
        }

        p.vx *= damp;
        p.vy *= damp;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const alpha = 0.42 * p.bright * meta.dim;
        const speed = Math.hypot(p.vx, p.vy);
        if (speed > 2.4) {
          // Streak: fast particles render as short trails.
          ctx.strokeStyle = `rgba(150, 195, 255, ${alpha})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(150, 195, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, TAU);
          ctx.fill();
        }
      }

      // Constellation lines near the cursor (desktop only).
      if (fine && near.length > 1) {
        ctx.strokeStyle = `rgba(90, 162, 255, ${0.16 * meta.lines})`;
        ctx.lineWidth = 0.7;
        for (let i = 0; i < near.length; i++) {
          for (let j = i + 1; j < near.length; j++) {
            const d = Math.hypot(near[i].x - near[j].x, near[i].y - near[j].y);
            if (d < LINE_LINK) {
              ctx.beginPath();
              ctx.moveTo(near[i].x, near[i].y);
              ctx.lineTo(near[j].x, near[j].y);
              ctx.stroke();
            }
          }
        }
      }
      ctx.globalCompositeOperation = "source-over";

      while (ripples.length > 0 && now - ripples[0].t0 > RIPPLE_MS) {
        ripples.shift();
      }
      raf = requestAnimationFrame(frame);
    }

    function onVisibility() {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        lastScrollY = window.scrollY;
        lastFrame = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("tracer-pin-progress", onPinProgress);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      footerObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[-1] h-full w-full"
    />
  );
}
