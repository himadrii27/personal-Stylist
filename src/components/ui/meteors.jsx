import React, { useEffect, useState } from 'react';

export function Meteors({ number = 14 }) {
  const [styles, setStyles] = useState([]);

  useEffect(() => {
    setStyles(
      Array.from({ length: number }, () => ({
        left: `${Math.floor(Math.random() * window.innerWidth)}px`,
        animationDelay: `${(Math.random() * 2 + 0.1).toFixed(2)}s`,
        animationDuration: `${(Math.random() * 7 + 3).toFixed(1)}s`,
      }))
    );
  }, [number]);

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      pointerEvents: 'none', zIndex: 1,
    }}>
      {styles.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '-5%',
            left: s.left,
            width: '2px',
            height: '2px',
            borderRadius: '50%',
            background: 'rgba(192,132,252,0.85)',
            transform: 'rotate(215deg)',
            animationName: 'meteor-fall',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDelay: s.animationDelay,
            animationDuration: s.animationDuration,
          }}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: '70px',
            height: '1px',
            transform: 'translateY(-50%)',
            background: 'linear-gradient(to right, rgba(192,132,252,0.55), rgba(255,107,157,0.2), transparent)',
            zIndex: -1,
          }} />
        </span>
      ))}
    </div>
  );
}
