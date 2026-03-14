import React, { useEffect, useRef, useState } from 'react';

function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handle = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);
  return mousePosition;
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function Particles({
  quantity = 80,
  staticity = 50,
  ease = 50,
  size = 0.4,
  color = '#ffffff',
  vx = 0,
  vy = 0,
  style = {},
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const ctx = useRef(null);
  const circles = useRef([]);
  const mouse = useRef({ x: 0, y: 0 });
  const canvasSize = useRef({ w: 0, h: 0 });
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const rafID = useRef(null);
  const mousePosition = useMousePosition();

  const initRef = useRef(null);
  const moveRef = useRef(null);
  const animRef = useRef(null);

  const rgb = hexToRgb(color);

  const circleParams = () => ({
    x: Math.floor(Math.random() * canvasSize.current.w),
    y: Math.floor(Math.random() * canvasSize.current.h),
    translateX: 0, translateY: 0,
    size: Math.floor(Math.random() * 2) + size,
    alpha: 0,
    targetAlpha: parseFloat((Math.random() * 0.6 + 0.1).toFixed(1)),
    dx: (Math.random() - 0.5) * 0.1,
    dy: (Math.random() - 0.5) * 0.1,
    magnetism: 0.1 + Math.random() * 4,
  });

  const drawCircle = (c, update = false) => {
    if (!ctx.current) return;
    ctx.current.translate(c.translateX, c.translateY);
    ctx.current.beginPath();
    ctx.current.arc(c.x, c.y, c.size, 0, 2 * Math.PI);
    ctx.current.fillStyle = `rgba(${rgb.join(',')},${c.alpha})`;
    ctx.current.fill();
    ctx.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!update) circles.current.push(c);
  };

  const clear = () => ctx.current?.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);

  const remap = (v, s1, e1, s2, e2) => Math.max(0, ((v - s1) * (e2 - s2)) / (e1 - s1) + s2);

  const initCanvas = () => {
    if (!containerRef.current || !canvasRef.current || !ctx.current) return;
    canvasSize.current = { w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight };
    canvasRef.current.width = canvasSize.current.w * dpr;
    canvasRef.current.height = canvasSize.current.h * dpr;
    canvasRef.current.style.width = `${canvasSize.current.w}px`;
    canvasRef.current.style.height = `${canvasSize.current.h}px`;
    ctx.current.scale(dpr, dpr);
    circles.current = [];
    for (let i = 0; i < quantity; i++) drawCircle(circleParams());
  };

  const onMouseMove = () => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const { w, h } = canvasSize.current;
    const x = mousePosition.x - rect.left - w / 2;
    const y = mousePosition.y - rect.top - h / 2;
    if (x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2) {
      mouse.current = { x, y };
    }
  };

  const animate = () => {
    clear();
    circles.current.forEach((c, i) => {
      const edge = [
        c.x + c.translateX - c.size,
        canvasSize.current.w - c.x - c.translateX - c.size,
        c.y + c.translateY - c.size,
        canvasSize.current.h - c.y - c.translateY - c.size,
      ];
      const closest = edge.reduce((a, b) => Math.min(a, b));
      const r = parseFloat(remap(closest, 0, 20, 0, 1).toFixed(2));
      c.alpha = r > 1 ? Math.min(c.alpha + 0.02, c.targetAlpha) : c.targetAlpha * r;
      c.x += c.dx + vx;
      c.y += c.dy + vy;
      c.translateX += (mouse.current.x / (staticity / c.magnetism) - c.translateX) / ease;
      c.translateY += (mouse.current.y / (staticity / c.magnetism) - c.translateY) / ease;
      drawCircle(c, true);
      if (c.x < -c.size || c.x > canvasSize.current.w + c.size ||
          c.y < -c.size || c.y > canvasSize.current.h + c.size) {
        circles.current.splice(i, 1);
        drawCircle(circleParams());
      }
    });
    rafID.current = requestAnimationFrame(animRef.current);
  };

  initRef.current = initCanvas;
  moveRef.current = onMouseMove;
  animRef.current = animate;

  useEffect(() => {
    if (canvasRef.current) ctx.current = canvasRef.current.getContext('2d');
    initRef.current();
    animRef.current();
    const onResize = () => setTimeout(() => initRef.current(), 200);
    window.addEventListener('resize', onResize);
    return () => {
      if (rafID.current) cancelAnimationFrame(rafID.current);
      window.removeEventListener('resize', onResize);
    };
  }, [color]);

  useEffect(() => { moveRef.current(); }, [mousePosition.x, mousePosition.y]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', ...style }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
