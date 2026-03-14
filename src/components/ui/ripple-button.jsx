import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function RippleButton({
  children, onClick, className, style,
  rippleColor = 'rgba(255,255,255,0.32)',
  duration = 750,
  whileHover, whileTap,
  type = 'button',
  ...props
}) {
  const [ripples, setRipples] = useState([]);

  const handleClick = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    setRipples(prev => [...prev, { x, y, size, key: Date.now() }]);
    onClick?.(e);
  };

  useEffect(() => {
    if (ripples.length === 0) return;
    const t = setTimeout(() => setRipples(prev => prev.slice(1)), duration);
    return () => clearTimeout(t);
  }, [ripples.length, duration]);

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      className={className}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      whileHover={whileHover}
      whileTap={whileTap}
      {...props}
    >
      <span style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {ripples.map(r => (
          <span
            key={r.key}
            style={{
              position: 'absolute',
              width: r.size,
              height: r.size,
              top: r.y,
              left: r.x,
              background: rippleColor,
              borderRadius: '50%',
              transform: 'scale(0)',
              animationName: 'ripple-expand',
              animationDuration: `${duration}ms`,
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
            }}
          />
        ))}
      </span>
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </motion.button>
  );
}
