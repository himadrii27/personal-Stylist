import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  motion, AnimatePresence, animate, useInView, useMotionValue, useMotionValueEvent,
  useReducedMotion, useScroll, useSpring, useTransform,
} from 'framer-motion';
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo';
import { feature } from 'topojson-client';
import landTopo from 'world-atlas/land-110m.json';
import CrumpledPaper from './CrumpledPaper';
import ChapterIcon from './ChapterIcons';

/* ════════════════════════════════════════════════
   THE STORY OF STYLING — an unfolding, travelled map
   Paper map unfolds → scroll draws an orange route city to city
   while the camera (SVG viewBox) follows → zooms out at "Today".
═══════════════════════════════════════════════════ */

const sans   = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
const serif  = '"Instrument Serif", Georgia, serif';
const ACCENT = '#E2571A';
const INK    = '#0d0d0b';
const INK2   = '#5c5549';
const INK3   = '#9a9183';

const PAPER = {
  table: '#E4DCCD',       // surface the paper ball sits on before it opens
  sheet: '#F3EDE2',
  land:  '#E4D9C4',
  coast: '#8C806B',
  grid:  'rgba(140,128,107,0.2)',
};

/* ── Map geometry (computed once when this chunk loads) ───────────── */
const W = 1600;
const H = 820;
const projection = geoNaturalEarth1().fitExtent([[24, 24], [W - 24, H - 24]], { type: 'Sphere' });
const toPath = geoPath(projection);
const LAND_D      = toPath(feature(landTopo, landTopo.objects.land));
const GRATICULE_D = toPath(geoGraticule10());
const SPHERE_D    = toPath({ type: 'Sphere' });

const STOPS = [
  { rail: 'Darzi', lon: 77.2,   lat: 28.6, zoom: 2.4, year: 'Generations', place: 'India',
    title: 'The neighbourhood darzi',
    copy: 'Before stylists had a name, the family tailor measured you, advised you, and remembered what suited you.' },
  { rail: '1858',  lon: 2.35,   lat: 48.9, zoom: 3.2, year: '1858', place: 'Paris',
    title: 'The first couturier',
    copy: 'Charles Frederick Worth opens his house and shows designs on live models. The designer becomes the authority on what to wear.' },
  { rail: '1909',  lon: -0.13,  lat: 51.5, zoom: 3.2, year: '1909', place: 'London',
    title: 'Shopping with guidance',
    copy: 'Department stores like Selfridges turn shopping into a guided experience, with staff who advise on what to buy.' },
  { rail: '1930s', lon: -118.3, lat: 34.1, zoom: 2.4, year: '1930s–50s', place: 'Hollywood',
    title: 'The costume designer',
    copy: 'Designers like Edith Head dress the stars, and audiences copy the looks they see on screen.' },
  { rail: '1960s', lon: -74.0,  lat: 40.7, zoom: 2.4, year: '1960s', place: 'New York',
    title: "The editor's eye",
    copy: 'Editors like Diana Vreeland at Vogue make "the look", the complete styled outfit, an art form.' },
  { rail: '1983',  lon: 74.2,   lat: 16.7, zoom: 3.2, year: '1983', place: 'Kolhapur, India',
    title: 'An Oscar for Indian costume',
    copy: "Bhanu Athaiya wins India's first Academy Award for her costume design on Gandhi." },
  { rail: '1990s', lon: 72.9,   lat: 19.1, zoom: 3.2, year: '1990s', place: 'Mumbai',
    title: "Bollywood's stylists",
    copy: "Manish Malhotra's costumes for Rangeela (1995) help turn film styling into a celebrated craft, and celebrity stylists become a profession." },
  { rail: '2011',  lon: -122.4, lat: 37.8, zoom: 2.4, year: '2011', place: 'Online',
    title: 'Data meets the stylist',
    copy: "Stitch Fix pairs algorithms with human stylists and posts curated clothes to customers' doors." },
  { rail: 'Today', year: 'Today', place: 'Everywhere',
    title: 'A stylist for every event',
    copy: 'AI that knows the occasion, the weather and your budget. Not just for the red carpet.' },
].map(s => {
  if (s.lon == null) return s;
  const [x, y] = projection([s.lon, s.lat]);
  return { ...s, x, y };
});

const N = STOPS.length;          // 9 chapters
const PIN_COUNT = N - 1;         // 8 cities; the last chapter is the zoom-out

// Curved arcs between consecutive cities (control point bowed "upward")
const SEGMENTS = STOPS.slice(0, PIN_COUNT - 1).map((a, i) => {
  const b = STOPS[i + 1];
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  let nx = -dy / dist, ny = dx / dist;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const cx = mx + nx * dist * 0.22, cy = my + ny * dist * 0.22;
  return { a, b, cx, cy, dist, d: `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}` };
});

/* ── Journey maths ────────────────────────────────────────────────── */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Each chapter holds for the first 30% and last 10% of its scroll slice, travels in between
function segState(p) {
  const t = clamp(p, 0, 1) * (N - 1);
  const i = Math.min(Math.floor(t), N - 2);
  const f = t - i;
  return { i, g: easeInOut(clamp((f - 0.3) / 0.6, 0, 1)) };
}

const activeFromP = (p) => { const { i, g } = segState(p); return g < 0.5 ? i : i + 1; };

function segFrac(p, k) {
  const { i, g } = segState(p);
  return k < i ? 1 : k === i ? g : 0;
}

function bezier(seg, t) {
  const u = 1 - t;
  return {
    x: u * u * seg.a.x + 2 * u * t * seg.cx + t * t * seg.b.x,
    y: u * u * seg.a.y + 2 * u * t * seg.cy + t * t * seg.b.y,
  };
}

// Camera = which part of the map the SVG viewBox shows
function computeView(p, blend, { w, h, mobile }) {
  const aspect = w / h;
  const worldVw = Math.max(W, H * aspect) * 1.02;
  const key = (k) => (k < PIN_COUNT
    ? { cx: STOPS[k].x, cy: STOPS[k].y, vw: worldVw / (STOPS[k].zoom * (mobile ? 1.7 : 1)),
        fx: mobile ? 0.5 : 0.64, fy: mobile ? 0.34 : 0.46 }
    : { cx: W / 2, cy: H / 2, vw: worldVw, fx: 0.5, fy: mobile ? 0.4 : 0.5 });

  const { i, g } = segState(p);
  const A = key(i), B = key(i + 1);
  const dist = Math.hypot(B.cx - A.cx, B.cy - A.cy);
  const bump = i + 1 < PIN_COUNT ? Math.min((dist / W) * 1.8, 1.1) : 0;   // zoom out mid-flight
  let cam = {
    cx: lerp(A.cx, B.cx, g),
    cy: lerp(A.cy, B.cy, g),
    vw: Math.min(lerp(A.vw, B.vw, g) * (1 + bump * Math.sin(Math.PI * g)), worldVw),
    fx: lerp(A.fx, B.fx, g),
    fy: lerp(A.fy, B.fy, g),
  };

  // Intro: glide from the whole world into the current chapter
  if (blend < 1) {
    const world = key(PIN_COUNT);
    cam = Object.fromEntries(Object.keys(cam).map(k => [k, lerp(world[k], cam[k], blend)]));
  }

  const vh = cam.vw / aspect;
  const marker = i < PIN_COUNT - 1 ? bezier(SEGMENTS[i], g) : STOPS[PIN_COUNT - 1];
  return {
    vx: cam.cx - cam.vw * cam.fx, vy: cam.cy - vh * cam.fy, vw: cam.vw, vh,
    w, h, mx: marker.x, my: marker.y,
  };
}

/* ════════════════════════════════════════════════
   SHARED PIECES
═══════════════════════════════════════════════════ */
function PaperLayers({ children, viewBox = `0 0 ${W} ${H}`, preserve = 'xMidYMid meet' }) {
  return (
    <svg viewBox={viewBox} preserveAspectRatio={preserve} aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <path d={SPHERE_D} fill="none" stroke={PAPER.coast} strokeOpacity={0.35} strokeWidth={1} />
      <path d={GRATICULE_D} fill="none" stroke={PAPER.grid} strokeWidth={0.6} />
      {children}
    </svg>
  );
}

// Old-map texture: grain + darker edges
function PaperTexture() {
  return (
    <>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05, mixBlendMode: 'multiply',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(92,85,73,0.16) 100%)',
      }} />
    </>
  );
}

function Compass({ rotate, size }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ rotate }}>
      <circle cx="50" cy="50" r="46" fill="none" stroke={PAPER.coast} strokeOpacity="0.5" />
      <circle cx="50" cy="50" r="38" fill="none" stroke={PAPER.coast} strokeOpacity="0.25" strokeDasharray="2 4" />
      <path d="M50 8 L57 50 L50 92 L43 50 Z" fill={PAPER.coast} fillOpacity="0.35" />
      <path d="M8 50 L50 43 L92 50 L50 57 Z" fill={PAPER.coast} fillOpacity="0.2" />
      <path d="M50 8 L57 50 L43 50 Z" fill={ACCENT} />
      <text x="50" y="6" textAnchor="middle" fontSize="9" fontFamily="Georgia, serif" fill={INK2} dy="-1">N</text>
    </motion.svg>
  );
}

// Card: a looping mini-scene + year + title, then the chapter's sentence.
function ChapterCard({ stop, index, onGetStarted, mobile }) {
  const finale = index === N - 1;
  return (
    <div style={{
      background: 'rgba(249,247,244,0.96)', border: '1px solid #DDD8CF', borderRadius: 14,
      padding: mobile ? '0.9rem 1rem' : '1.1rem 1.25rem',
      boxShadow: '0 18px 50px rgba(60,50,35,0.14)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    }}>
      <div style={{ display: 'flex', gap: mobile ? '0.85rem' : '1.1rem', alignItems: 'center' }}>
        <div style={{ flexShrink: 0, transform: mobile ? 'scale(0.86)' : 'none', transformOrigin: 'left center' }}>
          <ChapterIcon rail={stop.rail} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: sans, fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {stop.place}
            </span>
            <span style={{ fontFamily: sans, fontSize: '0.625rem', color: INK3, flexShrink: 0 }}>
              {String(index + 1).padStart(2, '0')}/{String(N).padStart(2, '0')}
            </span>
          </div>
          <p style={{ fontFamily: serif, fontSize: mobile ? '1.9rem' : '2.4rem', lineHeight: 1, letterSpacing: '-0.03em', color: ACCENT, margin: '0.15rem 0 0.2rem' }}>
            {stop.year}
          </p>
          <p style={{ fontFamily: sans, fontSize: mobile ? '0.875rem' : '0.9375rem', fontWeight: 700, letterSpacing: '-0.01em', color: INK }}>
            {stop.title}
          </p>
        </div>
      </div>
      <p style={{ fontFamily: sans, fontSize: mobile ? '0.8125rem' : '0.875rem', lineHeight: 1.55, color: INK2, marginTop: '0.7rem', paddingTop: '0.6rem', borderTop: '1px solid #E8E2D8' }}>
        {stop.copy}
      </p>
      {finale && onGetStarted && (
        <motion.button
          onClick={() => onGetStarted()}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          style={{
            marginTop: '0.85rem', background: ACCENT, color: '#fff', border: 'none', borderRadius: 999,
            padding: '0.7rem 1.4rem', fontFamily: sans, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 8px 28px rgba(226,87,26,0.28)',
          }}
        >
          Meet yours →
        </motion.button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   ANIMATED JOURNEY
═══════════════════════════════════════════════════ */
function RouteSegment({ seg, index, progress }) {
  const drawn = useTransform(progress, v => segFrac(v, index));
  const id = `hp-route-mask-${index}`;
  return (
    <g>
      <mask id={id} maskUnits="userSpaceOnUse" x={-W} y={-H} width={W * 3} height={H * 3}>
        <motion.path d={seg.d} fill="none" stroke="#fff" strokeWidth={14} style={{ pathLength: drawn }} />
      </mask>
      <path d={seg.d} fill="none" stroke={ACCENT} strokeWidth={2.4} strokeDasharray="7 6" strokeLinecap="round" mask={`url(#${id})`} />
    </g>
  );
}

function Pin({ stop, index, view, state, finale, onSelect }) {
  const x = useTransform(view, v => ((stop.x - v.vx) / v.vw) * v.w);
  const y = useTransform(view, v => ((stop.y - v.vy) / v.vh) * v.h);
  const isActive = state === 'active';
  const size = isActive || finale ? 13 : state === 'reached' ? 9 : 7;
  return (
    <motion.div style={{ position: 'absolute', left: 0, top: 0, x, y, zIndex: isActive ? 3 : 2 }}>
      <button
        onClick={() => onSelect(index)}
        aria-label={`${stop.year}, ${stop.place}`}
        tabIndex={-1}
        style={{
          position: 'absolute', transform: 'translate(-50%, -50%)', width: 28, height: 28,
          background: 'none', border: 'none', padding: 0, cursor: 'pointer', pointerEvents: 'auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {(isActive || finale) && (
          <span className="hp-ping" style={{ position: 'absolute', width: size, height: size, borderRadius: '50%', background: ACCENT }} />
        )}
        <span style={{
          width: size, height: size, borderRadius: '50%', transition: 'all 0.35s ease',
          background: isActive || finale ? ACCENT : state === 'reached' ? INK : 'transparent',
          border: state === 'ahead' && !finale ? `1.5px solid ${PAPER.coast}` : '2px solid #F9F7F4',
          opacity: state === 'ahead' && !finale ? 0.55 : 1,
          boxShadow: isActive ? '0 0 0 4px rgba(226,87,26,0.18)' : 'none',
        }} />
      </button>
      <AnimatePresence>
        {isActive && !finale && (
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute', left: 14, top: -32, whiteSpace: 'nowrap',
              fontFamily: serif, fontSize: '1.25rem', color: INK, letterSpacing: '-0.01em',
              textShadow: `0 0 8px ${PAPER.sheet}, 0 0 4px ${PAPER.sheet}`,
            }}
          >
            {stop.place}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Draws the world-view map onto a canvas, framed exactly like the live SVG at blend 0
function paintWorldMap(ctx, cw, ch, stage) {
  const v = computeView(0, 0, stage);
  const k = cw / v.vw;
  ctx.fillStyle = PAPER.sheet; ctx.fillRect(0, 0, cw, ch);
  ctx.setTransform(k, 0, 0, k, -v.vx * k, -v.vy * k);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(140,128,107,0.35)'; ctx.lineWidth = 1; ctx.stroke(new Path2D(SPHERE_D));
  ctx.strokeStyle = PAPER.grid; ctx.lineWidth = 0.6; ctx.stroke(new Path2D(GRATICULE_D));
  const land = new Path2D(LAND_D);
  ctx.fillStyle = PAPER.land; ctx.fill(land);
  ctx.strokeStyle = PAPER.coast; ctx.lineWidth = 0.8; ctx.stroke(land);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function MapJourney({ onGetStarted }) {
  const outerRef = useRef(null);
  const stageRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: outerRef, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.5, restDelta: 0.0001 });
  const blend = useMotionValue(0);
  const size = useMotionValue({ w: 1280, h: 800, mobile: false });
  const [mobile, setMobile] = useState(false);
  const [stage, setStage] = useState({ w: 0, h: 0, mobile: false });

  useEffect(() => {
    const el = stageRef.current;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const m = width < 768;
      size.set({ w: width, h: height, mobile: m });
      setMobile(m);
      setStage(prev => (prev.w === width && prev.h === height ? prev : { w: width, h: height, mobile: m }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [size]);

  const view    = useTransform([progress, blend, size], ([p, b, s]) => computeView(p, b, s));
  const viewBox = useTransform(view, v => `${v.vx} ${v.vy} ${v.vw} ${v.vh}`);
  const markerX = useTransform(view, v => ((v.mx - v.vx) / v.vw) * v.w);
  const markerY = useTransform(view, v => ((v.my - v.vy) / v.vh) * v.h);
  const compassRotate = useTransform(progress, v => v * 140);

  const [active, setActive] = useState(0);
  useMotionValueEvent(progress, 'change', v => setActive(activeFromP(v)));
  const finale = active === N - 1;

  // Intro: a crumpled paper ball opens into the map once the stage is on screen,
  // the title shows briefly on the flat sheet, then the camera glides in
  const inView = useInView(stageRef, { once: true, amount: 0.35 });
  const [flat, setFlat] = useState(false);
  const [opened, setOpened] = useState(false);
  const paintMap = useCallback((ctx, cw, ch) => paintWorldMap(ctx, cw, ch, stage), [stage]);
  useEffect(() => {
    if (!flat) return;
    const id = setTimeout(() => setOpened(true), 1100);
    return () => clearTimeout(id);
  }, [flat]);
  useEffect(() => {
    if (!opened) return;
    const controls = animate(blend, 1, { duration: 1.6, ease: [0.65, 0, 0.35, 1] });
    return () => controls.stop();
  }, [opened, blend]);

  const railRef = useRef(null);
  useEffect(() => {
    const rail = railRef.current;
    const btn = rail?.querySelectorAll('button')[active];
    if (!btn) return;
    rail.scrollTo({ left: btn.offsetLeft - rail.clientWidth / 2 + btn.offsetWidth / 2, behavior: 'smooth' });
  }, [active]);

  // Skip the whole journey: jump to the section above / below the map
  const skip = (dir) => {
    const section = outerRef.current.closest('section') || outerRef.current;
    const target = dir === 'up' ? section.previousElementSibling : section.nextElementSibling;
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: dir === 'up' ? section.offsetTop - window.innerHeight : section.offsetTop + section.offsetHeight, behavior: 'smooth' });
  };

  const goTo = (k) => {
    const el = outerRef.current;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + span * (k / (N - 1)) + 2, behavior: 'smooth' });
  };

  const stop = STOPS[active];
  const gutter = 'clamp(1rem, 4vw, 2.5rem)';

  return (
    <div ref={outerRef} className="hp-story-outer">
      <div ref={stageRef} className="hp-story-stage" style={{ background: PAPER.sheet }}>

        {/* ── Live map (camera = animated viewBox) ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: opened ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <motion.svg viewBox={viewBox} preserveAspectRatio="none" aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
            <path d={SPHERE_D} fill="none" stroke={PAPER.coast} strokeOpacity={0.35} strokeWidth={1} />
            <path d={GRATICULE_D} fill="none" stroke={PAPER.grid} strokeWidth={0.6} />
            <path d={LAND_D} fill={PAPER.land} stroke={PAPER.coast} strokeWidth={0.8} strokeLinejoin="round" />
            {SEGMENTS.map((seg, i) => <RouteSegment key={i} seg={seg} index={i} progress={progress} />)}
          </motion.svg>

          {/* Pins + traveller (HTML overlay so they stay crisp and constant-size) */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {STOPS.slice(0, PIN_COUNT).map((s, i) => (
              <Pin
                key={s.rail} stop={s} index={i} view={view} finale={finale} onSelect={goTo}
                state={i === active ? 'active' : i < active ? 'reached' : 'ahead'}
              />
            ))}
            <motion.div style={{ position: 'absolute', left: 0, top: 0, x: markerX, y: markerY, zIndex: 4 }}>
              <motion.span
                animate={{ opacity: finale ? 0 : 1, scale: finale ? 0.4 : 1 }}
                style={{
                  position: 'absolute', width: 18, height: 18, left: -9, top: -9, borderRadius: '50%',
                  background: '#fff', border: `4px solid ${ACCENT}`,
                  boxShadow: '0 4px 14px rgba(226,87,26,0.45)',
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* ── Crumpled paper ball → opens into the map (intro only) ── */}
        <AnimatePresence>
          {!opened && (
            <motion.div
              key="paper"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{ position: 'absolute', inset: 0, zIndex: 5, background: PAPER.table }}
            >
              {/* contact shadow under the ball; fades as the paper opens */}
              {stage.h > 0 && (() => {
                const d = 0.34 * stage.h * Math.min(stage.w / stage.h, 1);   // ≈ ball diameter on screen
                return (
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0.55 }}
                    animate={{ opacity: inView ? 0 : 0.55 }}
                    transition={{ delay: 0.7, duration: 0.7 }}
                    style={{
                      position: 'absolute', left: '50%', top: stage.h / 2 + d * 0.46, x: '-50%',
                      width: d * 0.95, height: d * 0.14, borderRadius: '50%',
                      background: 'radial-gradient(ellipse at center, rgba(60,50,35,0.45), rgba(60,50,35,0) 70%)',
                      filter: 'blur(6px)',
                    }}
                  />
                );
              })()}
              <CrumpledPaper width={stage.w} height={stage.h} play={inView} paint={paintMap} onDone={() => setFlat(true)} />

              {/* Cartouche, printed on the flattened sheet */}
              <motion.div
                initial={false}
                animate={flat ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'absolute', left: '50%', top: '50%', x: '-50%', y: '-50%',
                  textAlign: 'center', padding: '1.5rem 2.25rem', background: 'rgba(243,237,226,0.92)',
                  border: `1px solid ${PAPER.coast}`, outline: `1px solid ${PAPER.coast}`, outlineOffset: 5,
                }}
              >
                <p style={{ fontFamily: sans, fontSize: '0.6875rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: INK3, marginBottom: '0.5rem' }}>
                  A map of
                </p>
                <p style={{ fontFamily: serif, fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', lineHeight: 1, color: INK, letterSpacing: '-0.02em' }}>
                  The Story of <em style={{ color: ACCENT }}>Styling</em>
                </p>
                <p style={{ fontFamily: sans, fontSize: '0.75rem', color: INK3, marginTop: '0.5rem' }}>
                  Generations ago — Today
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <PaperTexture />
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6,
          background: `radial-gradient(ellipse ${mobile ? '95% 30%' : '42% 38%'} at 0% 0%, ${PAPER.sheet} 45%, rgba(243,237,226,0) 100%)`,
        }} />

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={opened ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ position: 'absolute', top: mobile ? 76 : 92, left: gutter, zIndex: 6, maxWidth: 420, pointerEvents: 'none' }}
        >
          <p style={{ fontFamily: sans, fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.04em', color: INK3, marginBottom: '0.6rem' }}>
            (The story of styling)
          </p>
          <p style={{ fontFamily: serif, fontSize: mobile ? '1.9rem' : 'clamp(2.25rem, 3.6vw, 3.25rem)', lineHeight: 0.98, letterSpacing: '-0.03em', color: INK }}>
            Styling isn't new.
          </p>
          <p style={{ fontFamily: serif, fontSize: mobile ? '1.9rem' : 'clamp(2.25rem, 3.6vw, 3.25rem)', lineHeight: 0.98, letterSpacing: '-0.03em', color: INK3 }}>
            Access to it is.
          </p>
        </motion.div>

        {/* ── Compass ── */}
        <motion.div
          initial={{ opacity: 0, rotate: -180, scale: 0.6 }}
          animate={opened ? { opacity: 1, rotate: 0, scale: 1 } : {}}
          transition={{ type: 'spring', bounce: 0.25, duration: 1.1, delay: 0.2 }}
          style={{ position: 'absolute', top: mobile ? 78 : 92, right: gutter, zIndex: 6 }}
        >
          <Compass rotate={compassRotate} size={mobile ? 52 : 76} />
        </motion.div>

        {/* ── Chapter card ── */}
        <div
          aria-live="polite"
          style={{
            position: 'absolute', zIndex: 7,
            left: gutter, right: mobile ? gutter : 'auto',
            bottom: mobile ? 78 : 104, width: mobile ? 'auto' : 360,
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {opened && (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -18, filter: 'blur(4px)' }}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.55 }}
              >
                <ChapterCard stop={stop} index={active} onGetStarted={onGetStarted} mobile={mobile} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Year rail ── */}
        <motion.nav
          aria-label="Chapters"
          initial={{ opacity: 0 }}
          animate={{ opacity: opened ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          ref={railRef}
          className="hp-rail"
          style={{
            position: 'absolute', zIndex: 7, bottom: mobile ? 18 : 28,
            left: gutter, right: mobile ? `calc(${gutter} + 46px)` : gutter, display: 'flex', justifyContent: mobile ? 'flex-start' : 'center',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', gap: mobile ? '0.25rem' : '0.5rem', padding: '0 0 10px' }}>
            <div style={{ position: 'absolute', left: 8, right: 8, bottom: 2, height: 2, background: 'rgba(140,128,107,0.25)', borderRadius: 2 }} />
            <motion.div style={{ position: 'absolute', left: 8, right: 8, bottom: 2, height: 2, background: ACCENT, borderRadius: 2, scaleX: progress, transformOrigin: 'left center' }} />
            {STOPS.map((s, i) => (
              <button
                key={s.rail}
                onClick={() => goTo(i)}
                aria-label={`Go to ${s.year}, ${s.place}`}
                aria-current={i === active ? 'step' : undefined}
                style={{
                  background: i === active ? 'rgba(226,87,26,0.1)' : 'transparent',
                  border: 'none', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap',
                  padding: mobile ? '0.35rem 0.6rem' : '0.4rem 0.8rem',
                  fontFamily: sans, fontSize: mobile ? '0.75rem' : '0.8125rem',
                  fontWeight: i === active ? 700 : 500,
                  color: i === active ? ACCENT : i < active ? INK2 : INK3,
                  transition: 'color 0.25s, background 0.25s',
                }}
              >
                {s.rail}
              </button>
            ))}
          </div>
        </motion.nav>

        {/* Scroll hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: opened && active === 0 ? 1 : 0 }}
          transition={{ duration: 0.4, delay: opened ? 1.6 : 0 }}
          style={{
            position: 'absolute', zIndex: 6, right: gutter, bottom: mobile ? 290 : 110,
            fontFamily: sans, fontSize: '0.75rem', color: INK3, pointerEvents: 'none',
          }}
        >
          Scroll to travel ↓
        </motion.p>

        {/* Skip the map: ↑ back above it, ↓ past it */}
        <button
          type="button"
          className="hp-map-skip"
          onClick={() => skip('up')}
          aria-label="Skip the map, back to the section above"
          style={mobile
            ? { top: 140, right: gutter, width: 38, height: 38, padding: 0, justifyContent: 'center' }
            : { top: 80, left: '50%', transform: 'translateX(-50%)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          {!mobile && <span>Skip map</span>}
        </button>
        <button
          type="button"
          className="hp-map-skip"
          onClick={() => skip('down')}
          aria-label="Skip the map, continue to the next section"
          style={mobile
            ? { bottom: 18, right: gutter, width: 38, height: 38, padding: 0, justifyContent: 'center' }
            : { bottom: 28, right: gutter }}
        >
          {!mobile && <span>Skip map</span>}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   REDUCED MOTION — static map + chapter list
═══════════════════════════════════════════════════ */
function StaticStory({ onGetStarted }) {
  return (
    <div className="hp-section" style={{ background: PAPER.sheet }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <p style={{ fontFamily: sans, fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.04em', color: INK3, marginBottom: '1.25rem' }}>
          (The story of styling)
        </p>
        <p style={{ fontFamily: serif, fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 0.95, letterSpacing: '-0.03em', color: INK }}>Styling isn't new.</p>
        <p style={{ fontFamily: serif, fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 0.95, letterSpacing: '-0.03em', color: INK3, marginBottom: '2.5rem' }}>Access to it is.</p>

        <div style={{ position: 'relative', aspectRatio: `${W} / ${H}`, marginBottom: '2.5rem' }}>
          <PaperLayers>
            <path d={LAND_D} fill={PAPER.land} stroke={PAPER.coast} strokeWidth={0.8} />
            {SEGMENTS.map((seg, i) => (
              <path key={i} d={seg.d} fill="none" stroke={ACCENT} strokeWidth={2.4} strokeDasharray="7 6" />
            ))}
            {STOPS.slice(0, PIN_COUNT).map((s, i) => (
              <g key={s.rail} transform={`translate(${s.x} ${s.y})`}>
                <circle r={11} fill={ACCENT} stroke="#F9F7F4" strokeWidth={2} />
                <text textAnchor="middle" dy="4" fontSize="11" fontFamily="Inter, sans-serif" fontWeight="700" fill="#fff">{i + 1}</text>
              </g>
            ))}
          </PaperLayers>
        </div>

        <div className="hp-steps">
          {STOPS.map((s, i) => (
            <ChapterCard key={s.rail} stop={s} index={i} onGetStarted={onGetStarted} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StoryMap({ onGetStarted }) {
  const reduce = useReducedMotion();
  return reduce ? <StaticStory onGetStarted={onGetStarted} /> : <MapJourney onGetStarted={onGetStarted} />;
}
