'use client';

import { useEffect, useRef } from 'react';

const vertexShader = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x),
      local.y
    );
  }

  float fractalNoise(vec2 point) {
    float value = 0.0;
    value += noise(point) * 0.55;
    value += noise(point * 2.0) * 0.28;
    value += noise(point * 4.0) * 0.12;
    value += noise(point * 8.0) * 0.05;
    return value;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    float time = uTime * 0.12;
    float pointer = (uPointer.x - 0.5) * 0.09;
    float landscape = fractalNoise(vec2(uv.x * 2.7 + pointer, time * 0.22));

    float firstCrest = 0.67
      + 0.085 * sin(uv.x * 5.4 + time * 1.1 + landscape * 2.1)
      + 0.035 * sin(uv.x * 11.0 - time * 0.7);
    float secondCrest = 0.54
      + 0.065 * sin(uv.x * 4.0 - time * 0.8 + landscape * 1.5)
      + 0.03 * sin(uv.x * 8.5 + time * 0.5);

    float firstBand = 1.0 - smoothstep(firstCrest - 0.26, firstCrest + 0.11, uv.y);
    float secondBand = 1.0 - smoothstep(secondCrest - 0.19, secondCrest + 0.1, uv.y);
    float light = 0.5 + 0.5 * sin((uv.x + uv.y * 0.25) * 4.0 + time);

    vec3 gold = mix(vec3(0.76, 0.51, 0.12), vec3(1.0, 0.82, 0.3), uv.x);
    vec3 olive = mix(vec3(0.37, 0.44, 0.31), vec3(0.64, 0.7, 0.48), uv.x);
    vec3 color = mix(gold, olive, smoothstep(0.12, 0.82, uv.x));
    color = mix(color, vec3(0.99, 0.93, 0.75), smoothstep(0.72, 1.0, uv.x) * 0.34);
    color += vec3(0.06, 0.05, 0.02) * light * landscape;

    float alpha = clamp(firstBand * 0.38 + secondBand * 0.2, 0.0, 0.54);
    alpha *= 0.9 + 0.1 * min(aspect, 1.8);
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export function HeroAurora() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.dataset.auroraRunning = String(!reducedMotion);

    const fallback = () => {
      container.dataset.auroraEngine = 'fallback';
      return undefined;
    };

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
    });
    if (!gl) return fallback();

    const program = createProgram(gl);
    if (!program) return fallback();

    const position = gl.getAttribLocation(program, 'aPosition');
    const time = gl.getUniformLocation(program, 'uTime');
    const resolution = gl.getUniformLocation(program, 'uResolution');
    const pointer = gl.getUniformLocation(program, 'uPointer');
    const buffer = gl.createBuffer();
    if (position < 0 || !time || !resolution || !pointer || !buffer) return fallback();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(program);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0);

    const pointerPosition = { x: 0.5, y: 0.5 };
    const size = { width: 1, height: 1 };
    let currentTime = 0;
    let lastTime = performance.now();
    let frame = 0;
    let visible = true;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      size.width = Math.max(1, container.clientWidth);
      size.height = Math.max(1, container.clientHeight);
      canvas.width = Math.round(size.width * ratio);
      canvas.height = Math.round(size.height * ratio);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolution, canvas.width, canvas.height);
    };

    const render = () => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(time, currentTime);
      gl.uniform2f(pointer, pointerPosition.x, pointerPosition.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const wake = () => {
      if (!reducedMotion && visible && !frame) frame = requestAnimationFrame(loop);
    };

    function loop(now: number) {
      frame = 0;
      if (!visible || document.hidden) return;
      currentTime += Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      render();
      wake();
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerPosition.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width)));
      pointerPosition.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height)));
      wake();
    };

    const onVisibilityChange = () => {
      lastTime = performance.now();
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        lastTime = performance.now();
        wake();
      }
    });

    container.dataset.auroraEngine = 'webgl';
    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    resize();
    render();
    wake();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <div ref={containerRef} className="hero-aurora" aria-hidden="true" data-aurora-engine="pending">
      <canvas ref={canvasRef} className="hero-aurora-canvas" />
      <span className="hero-aurora-fallback" />
    </div>
  );
}
