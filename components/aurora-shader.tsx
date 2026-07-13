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

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 auv = uv * vec2(aspect, 1.0);
  float t = u_time * 0.03;

  // Pointer, converted from y-down pixels to y-up uv space.
  vec2 mUv = vec2(u_mouse.x, u_res.y - u_mouse.y) / u_res;
  float mDist = distance(auv, mUv * vec2(aspect, 1.0));
  float mInf = smoothstep(0.5, 0.0, mDist);

  // Curtains: vertically stretched, domain-warped noise, bent by the
  // pointer and sheared in the direction of travel.
  vec2 q = vec2(uv.x * 2.2, uv.y * 0.9);
  q.x += fbm(q * 1.5 + t) * 0.35;
  q += (uv - mUv) * mInf * 0.25;
  q += u_vel * mInf * 0.010;
  float curtain = fbm(vec2(q.x * 2.0, q.y * 0.6 - t * 1.4));
  float band = smoothstep(0.35, 0.85, curtain);
  float curtain2 = fbm(vec2(q.x * 1.4 + 5.2, q.y * 0.5 + t * 1.1));
  float band2 = smoothstep(0.45, 0.9, curtain2);

  vec3 blue = vec3(0.145, 0.306, 0.678);
  vec3 violet = vec3(0.298, 0.180, 0.678);
  vec3 cyan = vec3(0.118, 0.424, 0.745);
  vec3 accent = vec3(0.353, 0.635, 1.0);

  vec3 col = vec3(0.0);
  col += blue * band * 0.50;
  col += violet * band2 * 0.35;
  col += cyan * band * band2 * 0.40;
  col += accent * pow(band, 3.0) * 0.25;

  // Brighter toward the upper region, like a sky.
  col *= smoothstep(0.0, 0.45, uv.y) * (1.0 - 0.4 * uv.y) + 0.15;

  // Faint lift around the pointer.
  col += accent * mInf * 0.05;

  // Click blooms: expanding soft rings of accent light. Dead blooms are
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
      col += accent * ring * (1.0 - k) * 0.12;
    }
  }

  // Global click surge, plus a short fade-in on mount.
  col *= (1.0 + u_boost) * min(u_time / 1.5, 1.0);

  // Edge vignette.
  col *= smoothstep(1.15, 0.4, length(uv - 0.5) * 1.6);

  float alpha = clamp(max(max(col.r, col.g), col.b) * 1.5, 0.0, 0.55);
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
    if (!gl) return;

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
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibility);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
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
