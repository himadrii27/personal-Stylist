import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useLoopStep } from '../lib/useLoopStep';

/* ════════════════════════════════════════════════
   FEATURES — "Three ways to dress better"
   Full-screen colour panels that stack as you scroll (inspired by the
   Tide Label lookbook): each panel pins under the header and the next one
   slides up over it. Each has a number, a huge word, the feature copy and
   an editorial photo with the feature's animated phone screen over it.
   Flip a feature's `status` to 'live' (and give it an action) when it ships.
═══════════════════════════════════════════════════ */

const sans   = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
const serif  = '"Instrument Serif", Georgia, serif';
const ACCENT = '#E2571A';
const C = {
  bg:     '#F9F7F4',
  bg2:    '#F4F1EC',
  surface:'#EDE9E2',
  border: '#DDD8CF',
  text:   '#0d0d0b',
  text2:  '#5c5549',
  text3:  '#9a9183',
  ink:    '#3d362c',
};
const spring = { type: 'spring', bounce: 0.35, duration: 0.5 };
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function useNarrow(query = '(max-width: 760px)') {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const fn = () => setNarrow(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [query]);
  return narrow;
}

/* ── Phone frame ───────────────────────────────────────────────────── */
function StatusBar({ dark }) {
  const col = dark ? '#fff' : C.text;
  return (
    <div style={{ height: 34, padding: '0 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: sans, fontSize: 11, fontWeight: 600, color: col, position: 'relative', zIndex: 2 }}>
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <svg width="14" height="9" viewBox="0 0 14 9" aria-hidden="true"><rect x="0" y="6" width="2.5" height="3" rx="0.5" fill={col} /><rect x="3.8" y="4" width="2.5" height="5" rx="0.5" fill={col} /><rect x="7.6" y="2" width="2.5" height="7" rx="0.5" fill={col} /><rect x="11.4" y="0" width="2.5" height="9" rx="0.5" fill={col} /></svg>
        <svg width="20" height="10" viewBox="0 0 20 10" aria-hidden="true"><rect x="0.5" y="0.5" width="17" height="9" rx="2.5" fill="none" stroke={col} opacity="0.5" /><rect x="2" y="2" width="12" height="6" rx="1.5" fill={col} /><rect x="18.3" y="3.3" width="1.2" height="3.4" rx="0.6" fill={col} opacity="0.5" /></svg>
      </span>
    </div>
  );
}

function PhoneFrame({ children, beam, dark }) {
  return (
    <div className="hp-phone">
      {beam && <span className="hp-phone-beam" aria-hidden="true" />}
      <div className="hp-phone-body">
        <div className="hp-phone-screen" style={{ background: dark ? '#111' : C.bg }}>
          <span className="hp-phone-island" aria-hidden="true" />
          {children}
        </div>
      </div>
    </div>
  );
}

const chip = (on = true) => ({
  fontFamily: sans, fontSize: 10, fontWeight: 600, borderRadius: 999, padding: '4px 8px', whiteSpace: 'nowrap',
  border: `1px solid ${on ? 'rgba(226,87,26,0.4)' : C.border}`, color: on ? ACCENT : C.text2, background: on ? 'rgba(226,87,26,0.07)' : '#fff',
});

/* ── Screen 1: Style my event ──────────────────────────────────────── */
const LOOK = [
  { name: 'Ivory kurta set', note: 'Breathable silk-cotton', price: '₹2,400', bg: '#F6EFE2', d: 'M10 6 L16 3 L24 3 L30 6 L28 14 L26 13 L26 34 L14 34 L14 13 L12 14 Z', fill: '#FBF6EC' },
  { name: 'Gold juttis',     note: 'Comfortable for dancing', price: '₹1,200', bg: '#F3E6C8', d: 'M5 24 Q5 15 14 15 L24 17 Q35 19 35 26 L35 28 L5 28 Z', fill: '#D4A43A' },
  { name: 'Potli bag',       note: 'Holds phone + keys',    price: '₹1,200', bg: '#F1DCD2', d: 'M13 12 Q20 8 27 12 L30 30 Q20 35 10 30 Z M15 12 Q20 4 25 12', fill: '#B5502A' },
];

function EventScreen({ reduce }) {
  const ref = useRef(null);
  const step = useLoopStep(ref, 11, 750, reduce);   // 1–3 context chips · 4–6 items · 7 total + CTA · 8–10 hold
  const ctx = ['☀ 29° evening', 'Rooftop', 'Festive crowd'];
  return (
    <div ref={ref} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ padding: '6px 16px 0' }}>
        <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.text3 }}>Your look for</p>
        <p style={{ fontFamily: serif, fontSize: 26, lineHeight: 1.05, color: C.text, letterSpacing: '-0.02em' }}>Wedding</p>
        <p style={{ fontFamily: sans, fontSize: 11, color: C.text2 }}>Mumbai · Saturday evening</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '8px 0 10px', minHeight: 22 }}>
          {ctx.map((c, i) => (
            <motion.span key={c} initial={false} animate={{ opacity: step > i ? 1 : 0, scale: step > i ? 1 : 0.7 }} transition={spring} style={chip(i === 0)}>{c}</motion.span>
          ))}
        </div>
      </div>
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {LOOK.map((it, i) => (
          <motion.div key={it.name} initial={false}
            animate={{ opacity: step >= 4 + i ? 1 : 0, y: step >= 4 + i ? 0 : 18 }} transition={spring}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 6 }}>
            <span style={{ width: 38, height: 38, borderRadius: 9, background: it.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 40 36" width="28" height="25" aria-hidden="true"><path d={it.d} fill={it.fill} stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round" /></svg>
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: C.text }}>{it.name}</span>
              <span style={{ display: 'block', fontFamily: sans, fontSize: 9.5, color: C.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.note}</span>
            </span>
            <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, color: C.text, flexShrink: 0 }}>{it.price}</span>
          </motion.div>
        ))}
      </div>
      <motion.div initial={false} animate={{ opacity: step >= 7 ? 1 : 0, y: step >= 7 ? 0 : 24 }} transition={spring}
        style={{ margin: '8px 12px 18px', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '9px 10px', boxShadow: '0 -6px 20px rgba(60,50,35,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
          <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.text }}>₹4,800</span>
          <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 600, color: ACCENT }}>✓ under ₹5,000</span>
        </div>
        <motion.div animate={{ scale: step === 7 ? [1, 1.05, 1] : 1 }} transition={{ duration: 0.6 }}
          style={{ background: ACCENT, color: '#fff', borderRadius: 999, padding: '7px 0', textAlign: 'center', fontFamily: sans, fontSize: 11.5, fontWeight: 600 }}>
          Shop the look →
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ── Screen 2: Know your colours ───────────────────────────────────── */
const SWATCHES = ['#8B4A2B', '#C68B3E', '#6B6B3A', '#A0522D', '#D9A066', '#4E5B3A'];

function Face({ size = 120 }) {
  return (
    <svg viewBox="0 0 100 120" width={size} height={size * 1.2} aria-hidden="true" style={{ overflow: 'visible' }}>
      <path d="M22 50 Q20 14 50 12 Q80 14 78 50 Q86 36 80 24 Q70 4 50 4 Q30 4 20 24 Q14 36 22 50 Z" fill="#4a3226" />
      <ellipse cx="50" cy="56" rx="26" ry="32" fill="#D9B08C" />
      <path d="M40 90 L40 102 Q50 108 60 102 L60 90" fill="#D9B08C" />
      <path d="M14 122 Q20 102 40 100 Q50 106 60 100 Q80 102 86 122" fill="#E7DCCB" />
      <path d="M40 52 h6 M54 52 h6 M46 72 Q50 75 54 72" stroke="#5a3d2b" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function ColourScreen({ reduce }) {
  const ref = useRef(null);
  const step = useLoopStep(ref, 12, 750, reduce);   // 0–3 camera + scan · 4 flash · 5+ result
  const result = step >= 5;
  const scanning = step >= 1 && step <= 3;
  return (
    <div ref={ref} style={{ height: '100%', position: 'relative' }}>
      <AnimatePresence initial={false}>
        {!result ? (
          <motion.div key="cam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 1, transition: { duration: 0.45 } }} transition={{ duration: 0.3 }}
            style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', flexDirection: 'column', zIndex: 1 }}>
            <StatusBar dark />
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: '8% 6%', borderRadius: 18, background: 'radial-gradient(ellipse at 50% 40%, #3a3330, #1a1716 70%)' }} />
              <div style={{ position: 'relative' }}>
                <Face size={118} />
                <motion.span initial={false} animate={{ opacity: scanning ? 1 : 0, top: scanning ? ['8%', '88%', '8%'] : '8%' }}
                  transition={{ duration: 1.6, repeat: scanning ? Infinity : 0, ease: 'easeInOut' }}
                  style={{ position: 'absolute', left: -14, right: -14, height: 2, background: ACCENT, boxShadow: `0 0 12px ${ACCENT}` }} />
                {[[59, 42], [76, 79], [32, 22]].map(([x, y], i) => (
                  <motion.span key={i} initial={false} animate={{ opacity: step >= 2 ? 1 : 0, scale: step >= 2 ? 1 : 0 }} transition={{ ...spring, delay: i * 0.12 }}
                    style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: 12, height: 12, marginLeft: -6, marginTop: -6, borderRadius: '50%', border: `2px solid ${ACCENT}`, background: 'rgba(226,87,26,0.15)' }} />
                ))}
              </div>
              <div style={{ position: 'absolute', width: '68%', aspectRatio: '0.78', border: '2px dashed rgba(255,255,255,0.45)', borderRadius: '50%' }} />
              <motion.div initial={false} animate={{ opacity: step === 4 ? [0, 0.9, 0] : 0 }} transition={{ duration: 0.5 }}
                style={{ position: 'absolute', inset: 0, background: '#fff' }} />
            </div>
            <p style={{ textAlign: 'center', fontFamily: sans, fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: '6px 0 10px' }}>
              {step >= 2 ? 'Reading your undertone…' : 'Hold still · natural light'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <span style={{ width: 46, height: 46, borderRadius: '50%', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.span animate={{ scale: step === 4 ? 0.8 : 1 }} style={{ width: 34, height: 34, borderRadius: '50%', background: '#fff' }} />
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div key="res" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: C.bg, zIndex: 2 }}>
            <StatusBar />
            <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', background: C.surface, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 4px 12px rgba(60,50,35,0.15)' }}>
                  <Face size={40} />
                </span>
                <div>
                  <p style={{ fontFamily: sans, fontSize: 10, color: C.text3, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>You're a</p>
                  <p style={{ fontFamily: serif, fontSize: 24, lineHeight: 1, color: C.text, letterSpacing: '-0.02em' }}>Warm <em style={{ color: ACCENT }}>Autumn</em></p>
                </div>
              </div>
              <p style={{ fontFamily: sans, fontSize: 10.5, color: C.text2, lineHeight: 1.45 }}>Golden undertone, medium depth, soft contrast.</p>
              <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, color: C.text, marginTop: 2 }}>Your best colours</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {SWATCHES.map((c, i) => (
                  <motion.span key={c} initial={{ scale: 0, opacity: 0 }} animate={{ scale: step >= 6 ? 1 : 0, opacity: step >= 6 ? 1 : 0 }}
                    transition={{ ...spring, delay: i * 0.06 }} style={{ aspectRatio: '1', borderRadius: 10, background: c, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.5)' }} />
                ))}
              </div>
              <motion.div initial={false} animate={{ opacity: step >= 7 ? 1 : 0, y: step >= 7 ? 0 : 8 }} transition={spring}
                style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ ...chip(false), display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'linear-gradient(135deg,#f3d27a,#b8892b)' }} /> Best metal: gold
                </span>
                <span style={chip(false)}>Avoid: icy pastels</span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Screen 3: Virtual wardrobe ────────────────────────────────────── */
const shirt = 'M8 9 L15 5 L25 5 L32 9 L30 18 L27 16 L27 38 L13 38 L13 16 L10 18 Z';
const trousers = 'M12 4 L28 4 L29 38 L22 38 L20 14 L18 38 L11 38 Z';
const dress = 'M15 4 L25 4 L26 14 L33 38 L7 38 L14 14 Z';
const CLOSET = [
  { d: shirt, fill: '#C9B79C', bg: '#F3EDE2' }, { d: trousers, fill: '#3d362c', bg: '#EDE9E2' },
  { d: dress, fill: '#B5502A', bg: '#F1DCD2' }, { d: shirt, fill: '#E4D9C4', bg: '#F6F1E7' },
  { d: trousers, fill: '#8C806B', bg: '#EFEAE1' },
];
const NEW_ITEM = { d: shirt, fill: '#2B3245', bg: '#E3E6EE' };

function Tile({ item, highlight }) {
  return (
    <div style={{ aspectRatio: '1', borderRadius: 12, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: highlight ? `0 0 0 2px ${ACCENT}` : 'none', transition: 'box-shadow 0.3s' }}>
      <svg viewBox="0 0 40 42" width="44" height="46" aria-hidden="true"><path d={item.d} fill={item.fill} stroke="rgba(0,0,0,0.12)" strokeWidth="0.8" strokeLinejoin="round" /></svg>
    </div>
  );
}

function WardrobeScreen({ reduce }) {
  const ref = useRef(null);
  const step = useLoopStep(ref, 12, 750, reduce);   // 0–2 grid fills · 3 photo drops · 4 tags · 5 settles · 6+ outfit sheet
  const filled = Math.min(5, (step + 1) * 2);
  const added = step >= 5;
  const outfit = step >= 6;
  return (
    <div ref={ref} style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <div style={{ padding: '6px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontFamily: serif, fontSize: 24, lineHeight: 1, color: C.text, letterSpacing: '-0.02em' }}>My wardrobe</p>
          <p style={{ fontFamily: sans, fontSize: 10, color: C.text3, marginTop: 3 }}>{added ? 6 : filled} pieces</p>
        </div>
        <motion.span animate={{ scale: step === 3 ? [1, 0.88, 1] : 1 }} style={{ ...chip(true), fontSize: 11 }}>+ Add</motion.span>
      </div>
      <div style={{ padding: '0 14px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {CLOSET.map((it, i) => (
          <motion.div key={i} initial={false} animate={{ opacity: i < filled ? 1 : 0, scale: i < filled ? 1 : 0.85 }} transition={spring}>
            <Tile item={it} highlight={outfit && i === 1} />
          </motion.div>
        ))}
        <motion.div initial={false} animate={{ opacity: added ? 1 : 0, scale: added ? 1 : 0.85 }} transition={spring}>
          <Tile item={NEW_ITEM} highlight={outfit} />
        </motion.div>
      </div>

      {/* new photo dropping in from "+ Add", getting tagged */}
      <AnimatePresence>
        {step >= 3 && step < 5 && (
          <motion.div key="new" initial={{ opacity: 0, scale: 0.3, x: 60, y: -120 }} animate={{ opacity: 1, scale: 1, x: 0, y: 0 }} exit={{ opacity: 0, scale: 0.5, x: 46, y: 70 }}
            transition={spring}
            style={{ position: 'absolute', left: '50%', top: '42%', marginLeft: -62, width: 124, background: '#fff', borderRadius: 14, padding: 7, boxShadow: '0 18px 40px rgba(60,50,35,0.25)', zIndex: 3 }}>
            <Tile item={NEW_ITEM} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {['Shirt', 'Navy', 'Smart'].map((t, i) => (
                <motion.span key={t} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: step >= 4 ? 1 : 0, scale: step >= 4 ? 1 : 0.6 }}
                  transition={{ ...spring, delay: i * 0.1 }} style={chip(true)}>{t}</motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* outfit bottom sheet */}
      <motion.div initial={false} animate={{ y: outfit ? 0 : '110%' }} transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#fff', borderRadius: '18px 18px 0 0', padding: '8px 14px 22px', boxShadow: '0 -10px 30px rgba(60,50,35,0.15)', zIndex: 4 }}>
        <span style={{ display: 'block', width: 34, height: 4, borderRadius: 2, background: C.border, margin: '0 auto 8px' }} />
        <p style={{ fontFamily: sans, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT }}>✦ From your closet</p>
        <p style={{ fontFamily: serif, fontSize: 19, color: C.text, letterSpacing: '-0.01em', margin: '2px 0 8px' }}>Outfit for dinner</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Tile item={NEW_ITEM} />
          <Tile item={CLOSET[1]} />
        </div>
      </motion.div>
    </div>
  );
}

/* ── Feature data ──────────────────────────────────────────────────── */
const FEATURES = [
  {
    key: 'event', status: 'live', Screen: EventScreen, word: 'Style',
    bg: '#D8C6A5', fg: '#121212', sub: 'rgba(18,18,18,0.7)', line: 'rgba(18,18,18,0.18)',
    photo: '/features/style.jpg', photoAlt: 'An outfit laid out on marble: blush coat, cream knit, denim and a quilted bag', photoPos: '50% 50%', caption: 'Fig. 01 — The complete look',
    title: 'Style my event',
    copy: 'An outfit for the occasion, the weather and your budget.',
    points: ['Reads the venue, weather & crowd', 'A complete look, top to toe', 'Real pieces within budget'],
    cta: 'Style my event →',
  },
  {
    key: 'colours', status: 'soon', Screen: ColourScreen, dark: true, word: 'Colour',
    bg: '#B4532E', fg: '#FBF3EC', sub: 'rgba(251,243,236,0.78)', line: 'rgba(251,243,236,0.28)',
    photo: '/features/colour.jpg', photoAlt: 'A fabric swatch book and colour fan in warm autumn tones', photoPos: '62% 50%', caption: 'Fig. 02 — Your palette, read from you',
    title: 'Know your colours',
    copy: 'Take a photo of your face. Find the shades that make you glow.',
    points: ['Snap or upload a selfie', 'We read your undertone', 'Get your season & best colours'],
  },
  {
    key: 'wardrobe', status: 'live', Screen: WardrobeScreen, word: 'Wardrobe',
    bg: '#16212A', fg: '#F4EFE6', sub: 'rgba(244,239,230,0.72)', line: 'rgba(244,239,230,0.2)',
    photo: '/features/wardrobe.jpg', photoAlt: 'A minimal rail of neutral-toned clothes', photoPos: '50% 70%', caption: 'Fig. 03 — Everything you own, in one place',
    title: 'Virtual wardrobe',
    copy: 'Photograph what you own. We cut it out and hang it in your digital wardrobe.',
    points: ['Take or upload a photo', 'Background removed on your device', 'Everything hanging in one place'],
    cta: 'Open my wardrobe →',
  },
];

/* ── One stacking panel ────────────────────────────────────────────── */
function FeaturePanel({ feature, index, reduce, narrow, onAction }) {
  const ref = useRef(null);
  const { Screen } = feature;
  const live = feature.status === 'live';
  // parallax while the panel slides into place
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start start'] });
  const still = reduce || narrow;
  const wordY  = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [140, 0]);
  const phoneY = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [120, 0]);
  const photoS = useTransform(scrollYProgress, [0, 1], still ? [1, 1] : [1.14, 1]);

  return (
    <article ref={ref} className="hp-stack-panel" style={{ background: feature.bg, color: feature.fg, zIndex: index + 1 }}>
      <div className="hp-stack-inner">
        <div className="hp-stack-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: sans, fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.04em' }}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <span style={{ width: 40, height: 1, background: feature.line }} />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: feature.sub }}>
              {live && <span className="hp-live-dot" style={{ background: feature.fg }} />}
              {live ? 'Live now' : 'Coming soon'}
            </span>
          </div>

          <div className="hp-stack-copy">
            <motion.h3 className="hp-stack-word" style={{ y: wordY, '--chars': feature.word.length }}>{feature.word}</motion.h3>
            <p style={{ fontFamily: serif, fontSize: 'clamp(1.6rem, 2.4vw, 2.2rem)', lineHeight: 1.05, letterSpacing: '-0.02em', margin: '0.4rem 0 0.6rem' }}>
              {feature.title}
            </p>
            <p style={{ fontFamily: sans, fontSize: '1rem', lineHeight: 1.55, color: feature.sub, maxWidth: 440 }}>{feature.copy}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '1.1rem 0 1.5rem', maxWidth: 440, borderTop: `1px solid ${feature.line}` }}>
              {feature.points.map((pt, i) => (
                <li key={pt} style={{ display: 'flex', gap: 14, alignItems: 'baseline', padding: '0.6rem 0', borderBottom: `1px solid ${feature.line}`, fontFamily: sans, fontSize: '0.875rem' }}>
                  <span style={{ fontFamily: serif, fontSize: '0.95rem', color: feature.sub, minWidth: 18 }}>{['i', 'ii', 'iii'][i]}</span>
                  {pt}
                </li>
              ))}
            </ul>
            {live ? (
              <motion.button
                onClick={() => onAction?.()}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: '#121212', color: '#fff', border: 'none', borderRadius: 999, padding: '0.85rem 1.6rem',
                  fontFamily: sans, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
                }}
              >
                {feature.cta}
              </motion.button>
            ) : (
              <span style={{ display: 'inline-block', fontFamily: sans, fontSize: '0.8125rem', fontWeight: 600, padding: '0.7rem 1.3rem', borderRadius: 999, border: `1px dashed ${feature.line}`, color: feature.sub }}>
                Coming soon
              </span>
            )}
          </div>
        </div>

        <div className="hp-stack-visual">
          <figure className="hp-stack-photo">
            <motion.img src={feature.photo} alt={feature.photoAlt} loading="lazy" style={{ scale: photoS, objectPosition: feature.photoPos }} />
          </figure>
          <p className="hp-stack-caption" style={{ color: feature.sub }}>{feature.caption}</p>
          <motion.div className="hp-stack-phone" style={{ y: phoneY }}>
            <PhoneFrame beam={live} dark={feature.dark}>
              <Screen reduce={reduce} />
            </PhoneFrame>
          </motion.div>
        </div>
      </div>
    </article>
  );
}

function RevealWords({ text, color, delay = 0 }) {
  return (
    <span style={{ display: 'block', color }}>
      {text.split(' ').map((w, i) => (
        <React.Fragment key={i}>
          {i > 0 && ' '}
          <motion.span
            initial={{ opacity: 0, y: 30, rotateX: -30 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: '-60px 0px' }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.7, delay: delay + i * 0.1 }}
            style={{ display: 'inline-block', transformPerspective: 1500, transformOrigin: 'bottom center' }}
          >
            {w}
          </motion.span>
        </React.Fragment>
      ))}
    </span>
  );
}

export default function FeaturesSection({ onGetStarted, onOpenWardrobe }) {
  const reduce = useReducedMotion();
  const narrow = useNarrow();
  const actions = { event: () => onGetStarted(), wardrobe: () => onOpenWardrobe?.() };

  return (
    <section id="features" style={{ background: C.bg, position: 'relative' }}>
      <div className="hp-section" style={{ paddingTop: 'clamp(2.5rem, 5vw, 4.5rem)', paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px 0px' }}
              style={{ fontFamily: sans, fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.04em', color: C.text3, marginBottom: '1.25rem' }}
            >
              (What we do)
            </motion.p>
            <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 0.95, letterSpacing: '-0.03em', margin: 0 }}>
              <RevealWords text="Three ways" color={C.text} />
              <RevealWords text="to dress better." color={C.text3} delay={0.2} />
            </h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px 0px' }}
            transition={{ delay: 0.3 }}
            style={{ fontFamily: sans, fontSize: '0.9375rem', lineHeight: 1.6, color: C.text2, maxWidth: 340 }}
          >
            Dress for the occasion, learn the colours that suit you, and get more out of what you already own.
          </motion.p>
        </div>
      </div>

      <div className="hp-stack">
        {FEATURES.map((f, i) => (
          <FeaturePanel key={f.key} feature={f} index={i} reduce={reduce} narrow={narrow} onAction={actions[f.key]} />
        ))}
      </div>
    </section>
  );
}
