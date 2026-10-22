import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/* ════════════════════════════════════════════════
   DOT TEXT — a word made of dots that scatter away from the cursor
   and spring back (as on the Squareo lookbook). The word is snapped to a
   coarse pixel grid and every pixel is filled with a 3×3 cluster of dots.
═══════════════════════════════════════════════════ */

export default function DotText({ text, color = '#E2571A', sizeVar = '--hp-tile', sizeFactor = 0.6, minSize = 52 }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let dots = [], raf = 0, pointer = null, awake = false, W = 0, H = 0, dpr = 1, radius = 2, reach = 60;
    let cancelled = false;

    const build = async () => {
      const tile = parseFloat(getComputedStyle(wrap).getPropertyValue(sizeVar)) || 150;
      let fontSize = Math.max(minSize, tile * sizeFactor);
      try { await document.fonts.load(`700 ${fontSize}px "Zalando Sans Expanded"`); } catch { /* fall back to whatever is available */ }
      if (cancelled) return;
      // never wider than the space it sits in (phones)
      const maxW = (wrap.parentElement?.parentElement?.clientWidth || window.innerWidth) * 0.92;
      const m = document.createElement('canvas').getContext('2d');
      m.font = `700 ${fontSize}px "Zalando Sans Expanded"`;
      const natural = m.measureText(text.toUpperCase()).width * 1.08;
      if (natural > maxW) fontSize *= maxW / natural;
      const font = `700 ${fontSize}px "Zalando Sans Expanded"`;

      // Rasterise the word, snap it to a coarse pixel grid, then fill each pixel with a 3×3 cluster of dots
      const probe = document.createElement('canvas').getContext('2d');
      probe.font = font;
      const label = text.toUpperCase();
      const P = Math.max(4, Math.round(fontSize / 11));        // pixel size (finer on small screens so letters stay legible)
      const cols = Math.ceil((probe.measureText(label).width + P * 2) / P);
      const rows = Math.ceil((fontSize * 0.82) / P);
      W = cols * P; H = rows * P;
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d');
      o.font = font; o.fillStyle = '#000'; o.textBaseline = 'alphabetic'; o.textAlign = 'center';
      o.fillText(label, W / 2, H - (H - fontSize * 0.7) / 2);   // cap height ≈ 0.7em, centred vertically
      const data = o.getImageData(0, 0, W, H).data;

      const K = P >= 8 ? 3 : 2, sub = P / K;               // dots per pixel side
      radius = sub * (K === 3 ? 0.36 : 0.42); reach = fontSize * 0.55;
      dots = [];
      for (let cy = 0; cy < rows; cy++) {
        for (let cx = 0; cx < cols; cx++) {
          let a = 0, n = 0;                                      // average coverage of this pixel
          for (let y = cy * P + 1; y < (cy + 1) * P; y += 2) for (let x = cx * P + 1; x < (cx + 1) * P; x += 2) { a += data[(y * W + x) * 4 + 3]; n++; }
          if (a / n < 120) continue;
          for (let j = 0; j < K; j++) for (let i = 0; i < K; i++) {
            const x = cx * P + (i + 0.5) * sub, y = cy * P + (j + 0.5) * sub;
            dots.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
          }
        }
      }

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      draw();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color;
      ctx.beginPath();
      for (const d of dots) { ctx.moveTo(d.x + radius, d.y); ctx.arc(d.x, d.y, radius, 0, Math.PI * 2); }
      ctx.fill();
    };

    const step = () => {
      let energy = 0;
      for (const d of dots) {
        if (pointer) {
          const dx = d.x - pointer.x, dy = d.y - pointer.y, dist = Math.hypot(dx, dy);
          if (dist < reach && dist > 0.01) {
            const f = (1 - dist / reach) ** 2 * 6;
            d.vx += (dx / dist) * f; d.vy += (dy / dist) * f;
          }
        }
        d.vx += (d.hx - d.x) * 0.07; d.vy += (d.hy - d.y) * 0.07;   // spring home
        d.vx *= 0.8; d.vy *= 0.8;
        d.x += d.vx; d.y += d.vy;
        energy += Math.abs(d.vx) + Math.abs(d.vy) + Math.abs(d.hx - d.x) + Math.abs(d.hy - d.y);
      }
      draw();
      if (pointer || energy > 0.5) raf = requestAnimationFrame(step);
      else awake = false;
    };
    const wake = () => { if (!awake && !reduce) { awake = true; raf = requestAnimationFrame(step); } };

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      pointer = x > -reach && y > -reach && x < W + reach && y < H + reach ? { x, y } : null;
      if (pointer) wake();
    };
    const onLeave = () => { pointer = null; wake(); };

    build();
    const ro = new ResizeObserver(() => build());
    ro.observe(wrap);
    const zone = wrap.closest('.hp-lb-centre') || wrap;
    zone.addEventListener('pointermove', onMove);
    zone.addEventListener('pointerleave', onLeave);
    return () => {
      cancelled = true; cancelAnimationFrame(raf); ro.disconnect();
      zone.removeEventListener('pointermove', onMove);
      zone.removeEventListener('pointerleave', onLeave);
    };
  }, [text, color, sizeVar, sizeFactor, minSize, reduce]);

  return (
    <span ref={wrapRef} style={{ display: 'inline-block', lineHeight: 0 }}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ display: 'block' }} />
    </span>
  );
}
