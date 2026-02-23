import React, { useRef, useEffect, useState } from 'react';

const WAVES = [
  { amplitude: 40, frequency: 0.008, speed: 0.0008, offsetY: 0.75, opacity: 0.12, color: '#0066ff' },
  { amplitude: 60, frequency: 0.006, speed: 0.0005, offsetY: 0.82, opacity: 0.08, color: '#0066ff' },
  { amplitude: 35, frequency: 0.01, speed: 0.001, offsetY: 0.88, opacity: 0.06, color: '#0066ff' },
];

/**
 * Liquid Pixel Wave background – Framer-style liquid wave aesthetic.
 * Inspired by Framer component: https://framer.com/m/Liquidpixelwave-1Sdx6m.js@8VrAX37mLewDZravPtF0
 * Layered SVG waves with smooth time-based motion and a subtle pixel grid.
 */
function LiquidPixelWave({ className = '', style = {} }) {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [height, setHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [paths, setPaths] = useState([]);
  const timeRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const onResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const buildPath = (t, amp, freq, offsetYPercent) => {
    const baseY = height * offsetYPercent;
    const pts = [];
    const segments = Math.max(40, Math.floor(width / 20));
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * width;
      const y = baseY + Math.sin(i * freq + t) * amp + Math.sin(i * freq * 0.7 + t * 1.3) * (amp * 0.5);
      pts.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    pts.push(`L ${width} ${height + 100} L 0 ${height + 100} Z`);
    return pts.join(' ');
  };

  useEffect(() => {
    const tick = () => {
      timeRef.current += 16;
      const t = timeRef.current * 0.001;
      setPaths(
        WAVES.map((w) => buildPath(t * 0.6 * (1 + w.speed * 500), w.amplitude, w.frequency, w.offsetY))
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [width, height]);

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        ...style
      }}
      aria-hidden
    >
      <svg
        width={width}
        height={height}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
      >
        <defs>
          <filter id="liquidBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -6" result="soft" />
            <feBlend in="SourceGraphic" in2="soft" mode="normal" />
          </filter>
        </defs>
        {WAVES.map((w, i) => (
          <path
            key={i}
            d={paths[i] || buildPath(0, w.amplitude, w.frequency, w.offsetY)}
            fill={w.color}
            fillOpacity={w.opacity}
            style={{ filter: 'url(#liquidBlur)', transition: 'd 0.15s ease-out' }}
          />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,102,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,102,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          opacity: 0.7,
        }}
      />
    </div>
  );
}

export default LiquidPixelWave;
