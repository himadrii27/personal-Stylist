import React, { useEffect, useRef } from 'react';
import {
  motion, AnimatePresence, animate, useInView, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useTransform,
} from 'framer-motion';
import { useLoopStep } from '../lib/useLoopStep';

/* ════════════════════════════════════════════════
   WHY STYLING MATTERS — proof you can see in seconds
   Scroll-revealed statement → 3 compact cards: count-up number,
   one line, a looping demo that shows the point, and the source.
═══════════════════════════════════════════════════ */

const sans   = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
const serif  = '"Instrument Serif", Georgia, serif';
const ACCENT = '#E2571A';
const C = {
  bg:      '#F9F7F4',
  bg2:     '#F4F1EC',
  surface: '#EDE9E2',
  border:  '#DDD8CF',
  text:    '#0d0d0b',
  text2:   '#5c5549',
  text3:   '#9a9183',
  navy:    '#2B3245',
  skin:    '#C9A27E',
};

/* ── Motion helpers ───────────────────────────────────────────────── */

function CountUp({ to, reduce }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px 0px' });
  const value = useMotionValue(reduce ? to : 0);
  const text = useTransform(value, v => String(Math.round(v)));
  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(value, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduce, value, to]);
  return <motion.span ref={ref}>{text}</motion.span>;
}

const rise = (delay = 0) => ({
  initial:     { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, margin: '-60px 0px' },
  transition:  { type: 'spring', bounce: 0.1, duration: 0.7, delay },
});

/* ════════════════════════════════════════════════
   OPENER — scroll-linked word reveal + marker stroke
═══════════════════════════════════════════════════ */
const STATEMENT = ['What', 'you', 'wear', 'speaks', 'before', 'you', 'do.'];
const MARKED_FROM = 4;   // "before you do." gets the marker

function RevealWord({ word, progress, range, reduce }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return <motion.span style={{ opacity: reduce ? 1 : opacity }}>{word}</motion.span>;
}

function ScrollRevealText({ reduce }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 90%', 'end 62%'] });
  const marker = useTransform(scrollYProgress, [0.78, 1], [0, 1]);
  // Round caps draw dots at zero length — keep the stroke hidden until it starts
  const markerOpacity = useTransform(marker, v => (v > 0.01 ? 1 : 0));
  const n = STATEMENT.length;
  const wordAt = (i) => (
    <RevealWord key={i} word={STATEMENT[i]} progress={scrollYProgress} range={[(i / n) * 0.78, ((i + 1) / n) * 0.78]} reduce={reduce} />
  );

  return (
    <h2 ref={ref} style={{
      fontFamily: serif, fontWeight: 400, fontSize: 'clamp(2.4rem, 5.4vw, 4.9rem)',
      lineHeight: 1, letterSpacing: '-0.035em', color: C.text, maxWidth: 820, margin: 0,
    }}>
      {STATEMENT.slice(0, MARKED_FROM).map((_, i) => <React.Fragment key={i}>{wordAt(i)}{' '}</React.Fragment>)}
      <span style={{ position: 'relative', display: 'inline-block', fontStyle: 'italic', isolation: 'isolate' }}>
        <svg aria-hidden="true" viewBox="0 0 300 24" preserveAspectRatio="none"
          style={{ position: 'absolute', left: '-3%', width: '106%', bottom: '0.02em', height: '0.42em', zIndex: -1, overflow: 'visible' }}>
          <motion.path
            d="M6 15 C 55 7, 110 19, 165 12 S 255 9, 294 14"
            fill="none" stroke={ACCENT} strokeOpacity={0.5} strokeWidth={13} strokeLinecap="round"
            style={{ pathLength: reduce ? 1 : marker, opacity: reduce ? 1 : markerOpacity }}
          />
        </svg>
        {STATEMENT.slice(MARKED_FROM).map((_, j) => {
          const i = MARKED_FROM + j;
          return <React.Fragment key={i}>{j > 0 && ' '}{wordAt(i)}</React.Fragment>;
        })}
      </span>
    </h2>
  );
}

/* ════════════════════════════════════════════════
   DEMO 1 — 5 seconds: off-the-peg vs tailored
═══════════════════════════════════════════════════ */
// Faceless, shoulders-down — like the study's cropped photos
function SuitFigure({ fit }) {
  const t = fit === 'tailored';
  return (
    <svg viewBox="0 0 120 250" style={{ width: '100%', height: 'auto', display: 'block' }} aria-hidden="true">
      {t ? (
        <>
          <path d="M33 118 L59 118 L56 234 L41 234 Z" fill={C.navy} />
          <path d="M61 118 L87 118 L79 234 L64 234 Z" fill={C.navy} />
          <rect x="36" y="232" width="22" height="9" rx="4" fill="#1a1a18" />
          <rect x="62" y="232" width="22" height="9" rx="4" fill="#1a1a18" />
          <path d="M26 26 L15 108 L25 110 L35 42 Z" fill={C.navy} />
          <path d="M94 26 L105 108 L95 110 L85 42 Z" fill={C.navy} />
          <circle cx="20" cy="116" r="6" fill={C.skin} />
          <circle cx="100" cy="116" r="6" fill={C.skin} />
          <rect x="15" y="106" width="11" height="4" fill="#F4F1EC" />
          <rect x="94" y="106" width="11" height="4" fill="#F4F1EC" />
          <path d="M26 24 Q60 10 94 24 L88 70 L92 122 L28 122 L32 70 Z" fill={C.navy} />
        </>
      ) : (
        <>
          <path d="M28 124 L59 124 L60 238 L34 238 Z" fill={C.navy} />
          <path d="M61 124 L92 124 L86 238 L60 238 Z" fill={C.navy} />
          {/* fabric pooling at the hem */}
          <path d="M34 228 q6 -5 12 0 t12 0 M62 228 q6 -5 12 0 t12 0" stroke="#1d2232" strokeWidth="2" fill="none" />
          <rect x="31" y="236" width="28" height="7" rx="3.5" fill="#1a1a18" />
          <rect x="60" y="236" width="28" height="7" rx="3.5" fill="#1a1a18" />
          <path d="M22 28 L9 126 L24 128 L36 44 Z" fill={C.navy} />
          <path d="M98 28 L111 126 L96 128 L84 44 Z" fill={C.navy} />
          <path d="M20 28 Q60 12 100 28 L100 132 L20 132 Z" fill={C.navy} />
        </>
      )}
      <path d="M50 17 L60 54 L70 17 Z" fill="#F9F7F4" />
      <path d="M58 21 L62 21 L63.5 52 L60 58 L56.5 52 Z" fill={ACCENT} />
      <path d="M50 17 L60 54 L46 34 Z M70 17 L60 54 L74 34 Z" fill="#1d2232" />
      <circle cx="60" cy={t ? 84 : 92} r="2.2" fill="#1d2232" />
    </svg>
  );
}

const TRAITS = ['Confident', 'Successful', 'Higher earner'];

function SuitDemo({ reduce }) {
  const ref = useRef(null);
  const step = useLoopStep(ref, 10, 900, reduce);   // 0–5 timer, 6–8 traits, 9 hold
  const elapsed = Math.min(step, 5);
  const traits = Math.max(0, Math.min(step - 5, 3));
  const done = step >= 5;

  return (
    <div ref={ref} style={stage}>
      <div style={{ position: 'absolute', top: 10, right: 10, width: 42, height: 42 }}>
        <svg viewBox="0 0 54 54" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx="27" cy="27" r="23" fill="none" stroke={C.border} strokeWidth="4" />
          <motion.circle
            cx="27" cy="27" r="23" fill="none" stroke={ACCENT} strokeWidth="4" strokeLinecap="round"
            initial={false}
            animate={{ pathLength: elapsed / 5, opacity: elapsed ? 1 : 0 }}
            transition={step === 0 ? { duration: 0.3 } : { duration: 0.9, ease: 'linear' }}
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: sans, fontSize: '0.75rem', fontWeight: 700, color: done ? ACCENT : C.text,
        }}>
          {done ? '✓' : `${5 - elapsed}s`}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', alignItems: 'end', height: '100%', padding: '1.25rem 1.5rem 0.75rem' }}>
        <figure style={{ margin: 0 }}>
          <motion.div animate={{ opacity: done ? 0.4 : 1, filter: done ? 'grayscale(1)' : 'grayscale(0)' }} transition={{ duration: 0.5 }} style={{ maxWidth: 82, margin: '0 auto' }}>
            <SuitFigure fit="peg" />
          </motion.div>
          <figcaption style={figCaption}>Off-the-peg</figcaption>
        </figure>
        <figure style={{ margin: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 6, left: -18, right: -18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, zIndex: 2 }}>
            <AnimatePresence>
              {TRAITS.slice(0, traits).map((t) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0, y: 12, scale: 0.7 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', bounce: 0.5, duration: 0.5 }}
                  style={chip}
                >
                  <span style={{ color: ACCENT }}>▲</span> {t}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <motion.div animate={{ scale: done ? 1.04 : 1 }} transition={{ type: 'spring', bounce: 0.4 }} style={{ maxWidth: 82, margin: '0 auto' }}>
            <SuitFigure fit="tailored" />
          </motion.div>
          <figcaption style={{ ...figCaption, color: done ? ACCENT : C.text2 }}>Tailored</figcaption>
        </figure>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   DEMO 2 — 36%: a rail of clothes that don't get worn
═══════════════════════════════════════════════════ */
const RAIL = [
  { kind: 'tee',   color: '#C9B79C' }, { kind: 'dress', color: C.navy },   { kind: 'shirt', color: ACCENT },
  { kind: 'tee',   color: '#8C806B' }, { kind: 'shirt', color: '#D9CBB3' }, { kind: 'dress', color: '#B5502A' },
  { kind: 'tee',   color: '#5C5549' }, { kind: 'shirt', color: '#3D4A3C' }, { kind: 'dress', color: '#C9B79C' },
  { kind: 'tee',   color: '#E4D9C4' }, { kind: 'shirt', color: '#9a9183' },
];
const GHOST_ORDER = [2, 5, 7, 9];   // 4 of 11 ≈ 36%

function HangerGarment({ kind, color, ghost }) {
  const body = {
    tee:   'M6 22 L14 16 L26 16 L34 22 L30 30 L27 28 L27 62 L13 62 L13 28 L10 30 Z',
    shirt: 'M7 22 L14 16 L26 16 L33 22 L32 64 L8 64 Z',
    dress: 'M13 16 L27 16 L28 30 L36 66 L4 66 L12 30 Z',
  }[kind];
  return (
    <svg viewBox="0 0 40 70" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }} aria-hidden="true">
      <path d="M20 2 a3 3 0 1 1 0 6 v4 L6 20 h28 L20 12" fill="none" stroke="#8C806B" strokeWidth="1.4" />
      <path
        d={body}
        fill={ghost ? 'transparent' : color}
        stroke={ghost ? '#9a9183' : 'rgba(0,0,0,0.12)'}
        strokeWidth={ghost ? 1.2 : 0.8}
        strokeDasharray={ghost ? '3 2.5' : 'none'}
        style={{ transition: 'fill 0.6s, stroke 0.6s' }}
      />
    </svg>
  );
}

function RailDemo({ reduce }) {
  const ref = useRef(null);
  const step = useLoopStep(ref, 7, 900, reduce);   // 0 full · 1–4 pieces go unworn · 5–6 hold
  const ghosts = Math.min(step, 4);
  const wears = 100 - ghosts * 9;                    // 100 → 64

  return (
    <div ref={ref} style={{ ...stage, padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.4rem' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ height: 3, background: '#8C806B', borderRadius: 2, margin: '0 -4px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${RAIL.length}, 1fr)`, gap: 3, marginTop: -2 }}>
          {RAIL.map((g, i) => {
            const ghost = GHOST_ORDER.slice(0, ghosts).includes(i);
            return (
              <motion.div
                key={i}
                animate={ghost ? { opacity: 0.65, y: 3, rotate: [0, -6, 4, 0] } : { opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformOrigin: '50% 0%' }}
              >
                <HangerGarment {...g} ghost={ghost} />
              </motion.div>
            );
          })}
        </div>
        <p style={{ fontFamily: sans, fontSize: '0.6875rem', color: C.text3, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 0, borderTop: `1.5px dashed ${C.text3}`, display: 'inline-block' }} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={ghosts} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {ghosts} of {RAIL.length} barely worn
            </motion.span>
          </AnimatePresence>
        </p>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
          <span style={{ fontFamily: sans, fontSize: '0.75rem', fontWeight: 600, color: C.text }}>Wears per piece</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={wears}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              style={{ fontFamily: sans, fontSize: '0.75rem', fontWeight: 700, color: ghosts ? ACCENT : C.text }}
            >
              {wears === 100 ? '15 yrs ago' : `−${100 - wears}%`}
            </motion.span>
          </AnimatePresence>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: C.surface, overflow: 'hidden' }}>
          <motion.div
            initial={false}
            animate={{ width: `${wears}%`, backgroundColor: ghosts ? ACCENT : C.text }}
            transition={{ type: 'spring', bounce: 0, duration: 0.8 }}
            style={{ height: '100%', borderRadius: 999 }}
          />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   DEMO 3 — 5 pieces, 6 outfits
═══════════════════════════════════════════════════ */
const TOPS = [
  { name: 'Tee',   color: '#F9F7F4', d: 'M8 14 L22 6 L58 6 L72 14 L66 28 L58 24 L58 56 L22 56 L22 24 L14 28 Z' },
  { name: 'Shirt', color: '#C9B79C', d: 'M10 14 L24 6 L56 6 L70 14 L68 58 L12 58 Z' },
];
const BOTTOMS = [
  { name: 'Trousers', color: C.navy,    d: 'M18 2 L62 2 L60 66 L44 66 L40 22 L36 66 L20 66 Z' },
  { name: 'Skirt',    color: '#B5502A', d: 'M22 2 L58 2 L68 54 L12 54 Z' },
  { name: 'Shorts',   color: '#8C806B', d: 'M16 2 L64 2 L66 36 L44 38 L40 18 L36 38 L14 36 Z' },
];

function Garment({ item, size = 80 }) {
  return (
    <svg viewBox="0 0 80 68" width={size} height={size * 0.85} style={{ display: 'block' }} aria-hidden="true">
      <path d={item.d} fill={item.color} stroke="rgba(13,13,11,0.18)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function MixDemo({ reduce }) {
  const ref = useRef(null);
  const step = useLoopStep(ref, 8, 1000, reduce);   // 0–5 the six looks · 6–7 hold on "6 of 6"
  const look = Math.min(step, 5);
  const top = TOPS[Math.floor(look / 3)];
  const bottom = BOTTOMS[look % 3];

  const tile = (item, on) => (
    <motion.div
      key={item.name}
      animate={{ scale: on ? 1.06 : 1, borderColor: on ? ACCENT : C.border }}
      transition={{ type: 'spring', bounce: 0.4, duration: 0.4 }}
      style={{ background: C.bg, borderRadius: 8, padding: '0.3rem', display: 'flex', justifyContent: 'center', border: '1.5px solid' }}
      title={item.name}
    >
      <Garment item={item} size={30} />
    </motion.div>
  );

  return (
    <div ref={ref} style={{ ...stage, padding: '1rem 1.1rem', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '0.9rem', alignItems: 'center' }}>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 6 }}>
          {TOPS.map(t => tile(t, t === top))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {BOTTOMS.map(b => tile(b, b === bottom))}
        </div>
        <p style={{ fontFamily: sans, fontSize: '0.6875rem', color: C.text3, marginTop: 10, textAlign: 'center' }}>
          2 tops × 3 bottoms
        </p>
      </div>

      <div style={{
        background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={top.name} initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }}>
            <Garment item={top} size={64} />
          </motion.div>
        </AnimatePresence>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={bottom.name} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.5 }} style={{ marginTop: -4 }}>
            <Garment item={bottom} size={64} />
          </motion.div>
        </AnimatePresence>
        <p style={{ fontFamily: sans, fontSize: '0.75rem', fontWeight: 700, color: C.text, marginTop: 6 }}>
          Look <span style={{ color: ACCENT }}>{look + 1}</span>/6
        </p>
      </div>
    </div>
  );
}

/* ── Shared demo styles ───────────────────────────────────────────── */
const stage = {
  position: 'relative', height: 236, borderRadius: 12, background: C.bg,
  border: `1px solid ${C.border}`, overflow: 'hidden',
};
const figCaption = { fontFamily: sans, fontSize: '0.75rem', fontWeight: 600, color: C.text2, textAlign: 'center', marginTop: 6, transition: 'color 0.4s' };
const chip = {
  background: '#fff', border: `1px solid ${C.border}`, borderRadius: 999, padding: '0.22rem 0.6rem',
  fontFamily: sans, fontSize: '0.6875rem', fontWeight: 600, color: C.text, whiteSpace: 'nowrap',
  boxShadow: '0 6px 18px rgba(60,50,35,0.14)',
};

/* ════════════════════════════════════════════════
   PROOF CARD + SECTION
═══════════════════════════════════════════════════ */
const PROOFS = [
  {
    to: 5, unit: 'sec', Demo: SuitDemo,
    line: 'A better-fitting suit, same man: rated more confident and successful.',
    source: { label: 'Howlett et al., 2013', href: 'https://uhra.herts.ac.uk/handle/2299/12766' },
  },
  {
    to: 36, unit: '%', Demo: RailDemo,
    line: 'Fewer wears per piece than 15 years ago. We buy more, wear less.',
    source: { label: 'Ellen MacArthur Foundation, 2017', href: 'https://www.ellenmacarthurfoundation.org/a-new-textiles-economy' },
  },
  {
    to: 6, unit: 'looks', Demo: MixDemo,
    line: 'From just 5 pieces. Styling gets more out of what you own.',
  },
];

function ProofCard({ proof, index, reduce }) {
  const { Demo } = proof;
  const mx = useMotionValue(-400);
  const my = useMotionValue(-400);
  const glow = useMotionTemplate`radial-gradient(260px circle at ${mx}px ${my}px, rgba(226,87,26,0.13), transparent 70%)`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 60, rotateX: 18 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-60px 0px' }}
      transition={{ type: 'spring', bounce: 0.15, duration: 0.85, delay: index * 0.12 }}
      whileHover={{ y: -6 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left); my.set(e.clientY - r.top);
      }}
      onPointerLeave={() => { mx.set(-400); my.set(-400); }}
      style={{
        position: 'relative', background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem',
        transformPerspective: 1200, overflow: 'hidden',
      }}
    >
      <motion.div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: glow, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '0.9rem' }}>
        <p style={{ fontFamily: serif, fontSize: 'clamp(3.5rem, 5.5vw, 4.75rem)', lineHeight: 0.8, letterSpacing: '-0.04em', color: ACCENT, flexShrink: 0 }}>
          <CountUp to={proof.to} reduce={reduce} />
          <span style={{ fontSize: '0.42em', letterSpacing: '-0.02em', marginLeft: '0.08em' }}>{proof.unit}</span>
        </p>
        <p style={{ fontFamily: sans, fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.01em', color: C.text, paddingBottom: 2 }}>
          {proof.line}
        </p>
      </div>

      <div style={{ position: 'relative' }}><Demo reduce={reduce} /></div>

      <p style={{ position: 'relative', fontFamily: sans, fontSize: '0.6875rem', color: C.text3, minHeight: '1em' }}>
        {proof.source
          ? <a href={proof.source.href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textUnderlineOffset: 3 }}>Source: {proof.source.label}</a>
          : 'Simple maths: 2 × 3 = 6'}
      </p>
    </motion.article>
  );
}

export default function StylingMatters({ onGetStarted }) {
  const reduce = useReducedMotion();
  return (
    <section id="why-styling" className="hp-section" style={{ background: C.bg, overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
          <div>
            <motion.p {...rise(0)} style={{ fontFamily: sans, fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.04em', color: C.text3, marginBottom: '1rem' }}>
              #Why styling matters
            </motion.p>
            <ScrollRevealText reduce={reduce} />
          </div>
          <motion.button
            {...rise(0.2)}
            onClick={() => onGetStarted()}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0',
              fontFamily: sans, fontSize: '0.9375rem', fontWeight: 600, color: C.text,
              textDecoration: 'underline', textUnderlineOffset: 6, textDecorationColor: ACCENT, textDecorationThickness: 2,
            }}
          >
            Get a stylist for your event →
          </motion.button>
        </div>

        <div className="hp-proof-grid">
          {PROOFS.map((p, i) => <ProofCard key={p.unit} proof={p} index={i} reduce={reduce} />)}
        </div>
      </div>
    </section>
  );
}
