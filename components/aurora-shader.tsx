"use client";

import { useEffect, useRef } from "react";

const MAX_BLOOMS = 3;

const VERTEX_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec2 u_vel;
uniform vec3 u_blooms[${MAX_BLOOMS}];
uniform float u_boost;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.05 + vec2(13.7, 7.3);
    a *= 0.5;
  }
  return v;
}

// Curtain brightness profile around a ribbon: a bright core with a long
// soft tail hanging below and a quick falloff above, like a real auroral
// curtain seen from the ground. Defined for all d (no pow on negatives).
float curtain(float d) {
  float below = exp(d * 5.5);
  float above = exp(-d * 20.0);
  return mix(below, above, step(0.0, d));
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 auv = uv * vec2(aspect, 1.0);
  float x = uv.x * aspect;
  float t = u_time * 0.05;

  // Pointer, converted from y-down pixels to y-up uv space.
  vec2 mUv = vec2(u_mouse.x, u_res.y - u_mouse.y) / u_res;
  float mDist = distance(auv, mUv * vec2(aspect, 1.0));
  float mInf = smoothstep(0.45, 0.0, mDist);

  // Two ribbons flowing across the page, undulating slowly. The pointer
  // gently tugs the ribbon height toward itself.
  float wave = fbm(vec2(x * 0.9 - t * 0.9, t * 0.4)) - 0.5;
  wave += (fbm(vec2(x * 2.3 + t * 0.6, t * 0.25)) - 0.5) * 0.35;
  wave += (mUv.y - uv.y) * mInf * 0.15;
  float wave2 = fbm(vec2(x * 0.7 + t * 0.7 + 11.0, t * 0.3)) - 0.5;

  float band1 = 0.66 + wave * 0.20;
  float band2 = 0.84 + wave2 * 0.12;

  // Vertical ray striations drifting sideways; pointer motion shears
  // them locally in the direction of travel.
  float rayShift = u_vel.x * mInf * 0.02;
  float rays =
    0.55 + 0.45 * fbm(vec2(x * 5.5 + t * 1.6 + rayShift, uv.y * 0.7));
  float rays2 = 0.6 + 0.4 * fbm(vec2(x * 4.0 - t * 1.1 + 3.0, uv.y * 0.6));

  float d1 = uv.y - band1;
  float d2 = uv.y - band2;
  float i1 = curtain(d1) * rays;
  float i2 = curtain(d2) * rays2 * 0.45;

  // Natural auroral colors: oxygen-green core with a teal wash, a pink
  // lower fringe, and a faint violet upper band.
  vec3 green = vec3(0.16, 0.85, 0.47);
  vec3 teal = vec3(0.10, 0.52, 0.45);
  vec3 pink = vec3(0.80, 0.28, 0.52);
  vec3 violet = vec3(0.42, 0.30, 0.72);

  vec3 col = vec3(0.0);
  col += green * i1 * 0.55;
  col += teal * i1 * i1 * 0.25;
  float fringe = exp(-(d1 + 0.045) * (d1 + 0.045) * 900.0);
  col += pink * fringe * rays * 0.30;
  col += violet * i2 * 0.50;
  col += green * i2 * 0.18;

  // Faint lift around the pointer.
  col += green * mInf * 0.035;

  // Click blooms: expanding soft rings of auroral light. Dead blooms are
  // skipped with a branch: pow(x, y) is undefined for x < 0 in GLSL (NaN
  // on some GPUs, and NaN survives multiplication by zero), so the ring
  // falloff squares by multiplication and never runs for inactive slots.
  for (int i = 0; i < ${MAX_BLOOMS}; i++) {
    vec3 b = u_blooms[i];
    float age = u_time - b.z;
    if (b.z >= 0.0 && age >= 0.0 && age <= 1.6) {
      vec2 bUv = vec2(b.x, u_res.y - b.y) / u_res;
      float d = distance(auv, bUv * vec2(aspect, 1.0));
      float k = age / 1.6;
      float delta = (d - k * 0.45) * 9.0;
      float ring = exp(-delta * delta);
      col += mix(green, vec3(0.70, 0.95, 0.80), 0.4) * ring * (1.0 - k) * 0.10;
    }
  }

  // Global click surge, plus a short fade-in on mount.
  col *= (1.0 + u_boost) * min(u_time / 1.5, 1.0);

  // Edge vignette.
  col *= smoothstep(1.2, 0.45, length(uv - 0.5) * 1.5);

  float alpha = clamp(max(max(col.r, col.g), col.b) * 1.5, 0.0, 0.6);
  gl_FragColor = vec4(col, alpha);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function AuroraShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // premultipliedAlpha: false because the shader writes straight
    // (non-premultiplied) alpha; the default would composite too bright.
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
    });
    // A canvas has one context for life. If it is gone or lost (for
    // example after a GPU reset), hide the canvas rather than let the
    // browser paint a dead-canvas placeholder over the page.
    if (!gl || gl.isContextLost()) {
      canvas.style.display = "none";
      return;
    }
    canvas.style.display = "";

    const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    const program = gl.createProgram();
    if (!vert || !frag || !program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uVel = gl.getUniformLocation(program, "u_vel");
    const uBlooms = gl.getUniformLocation(program, "u_blooms");
    const uBoost = gl.getUniformLocation(program, "u_boost");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    // Render at half of the (clamped) device resolution: the visuals are
    // soft noise, and this keeps fullscreen fbm cheap on mobile GPUs.
    function resize() {
      if (!canvas || !gl) return;
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
      canvas.width = Math.max(1, Math.floor(window.innerWidth * scale));
      canvas.height = Math.max(1, Math.floor(window.innerHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const startTime = performance.now();
    const target = { x: window.innerWidth / 2, y: window.innerHeight * 0.4 };
    const smooth = { x: target.x, y: target.y };
    const vel = { x: 0, y: 0 };
    const blooms = new Float32Array(MAX_BLOOMS * 3).fill(-1);
    let bloomIndex = 0;
    let boost = 0;
    let raf = 0;

    function nowSeconds() {
      return (performance.now() - startTime) / 1000;
    }

    function onPointerMove(e: PointerEvent) {
      target.x = e.clientX;
      target.y = e.clientY;
    }
    function onPointerDown(e: PointerEvent) {
      const base = (bloomIndex % MAX_BLOOMS) * 3;
      blooms[base] = e.clientX;
      blooms[base + 1] = e.clientY;
      blooms[base + 2] = nowSeconds();
      bloomIndex += 1;
      boost = Math.min(boost + 0.06, 0.12);
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    function frame() {
      if (!canvas || !gl) return;
      const t = nowSeconds();

      // Touch devices have no cursor: let the focal point orbit slowly so
      // the warp stays alive on its own.
      if (coarse) {
        target.x = window.innerWidth * (0.5 + 0.25 * Math.sin(t * 0.13));
        target.y = window.innerHeight * (0.4 + 0.18 * Math.cos(t * 0.09));
      }

      const prevX = smooth.x;
      const prevY = smooth.y;
      smooth.x += (target.x - smooth.x) * 0.06;
      smooth.y += (target.y - smooth.y) * 0.06;
      vel.x += (smooth.x - prevX - vel.x) * 0.1;
      vel.y += (smooth.y - prevY - vel.y) * 0.1;
      boost *= 0.96;

      // Pointer-space values scale to render pixels.
      const s = canvas.width / window.innerWidth;
      const scaledBlooms = new Float32Array(MAX_BLOOMS * 3);
      for (let i = 0; i < MAX_BLOOMS; i++) {
        scaledBlooms[i * 3] = blooms[i * 3] * s;
        scaledBlooms[i * 3 + 1] = blooms[i * 3 + 1] * s;
        scaledBlooms[i * 3 + 2] = blooms[i * 3 + 2];
      }

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, smooth.x * s, smooth.y * s);
      gl.uniform2f(uVel, vel.x * s, vel.y * s);
      gl.uniform3fv(uBlooms, scaledBlooms);
      gl.uniform1f(uBoost, boost);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }

    function onVisibility() {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    }
    document.addEventListener("visibilitychange", onVisibility);

    // Genuine context loss (GPU reset, driver crash): stop the loop and
    // hide the canvas so the page just shows the dark background.
    function onContextLost(e: Event) {
      e.preventDefault();
      cancelAnimationFrame(raf);
      if (canvas) canvas.style.display = "none";
    }
    canvas.addEventListener("webglcontextlost", onContextLost);

    raf = requestAnimationFrame(frame);

    // Deliberately NOT calling WEBGL_lose_context.loseContext() here: a
    // canvas keeps one context for life, and React Strict Mode re-runs
    // this effect on the same element in development. Killing the context
    // on cleanup would leave the remount with a permanently dead canvas.
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
