import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/* ════════════════════════════════════════════════
   LOOKBOOK HERO — a frame of square photo tiles around the headline
   (inspired by the Squareo lookbook template). The hero pins for a short
   stretch while scrolling drives the tiles around the frame like a conveyor
   belt (they split as they turn each corner). Hovering a tile wipes up an
   orange panel with its occasion. Phones get two strips (top/bottom) instead.
   Centre content comes from the caller as children.
═══════════════════════════════════════════════════ */

const ACCENT = '#E2571A';
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=360&h=360&q=70`;

// occasion ids match OCCASIONS in OccasionForm.jsx (clicking a tile pre-fills the brief)
const TILES = [
  { src: img('1610030469983-98e550d6193c'), occasion: 'Wedding',    alt: 'Woman in a silk saree' },
  { src: img('1487222477894-8943e31ef7b2'), occasion: 'Party',      alt: 'Man in a leather jacket' },
  { src: img('1542291026-7eec264c27ff'),    occasion: 'Casual',     alt: 'Red running sneaker' },
  { text: 'Dress for the moment' },
  { src: img('1509631179647-0177331693ae'), occasion: 'Concert',    alt: 'Woman in striped trousers' },
  { src: img('1507679799987-c73779587ccf'), occasion: 'Office',     alt: 'Man in a navy suit' },
  { src: img('1483985988355-763728e1935b'), occasion: 'Date Night', alt: 'Woman in a burgundy coat' },
  { src: img('1617627143750-d86bc21e42bb'), occasion: 'Wedding',    alt: 'Woman in a pink and gold saree' },
  { src: img('1572635196237-14b3f281503f'), occasion: 'Casual',     alt: 'Black sunglasses' },
  { src: img('1529139574466-a303027c1d8b'), occasion: 'Concert',    alt: 'Woman in a red tee' },
  { src: img('1594938298603-c8148c4dae35'), occasion: 'Office',     alt: 'Man in a checked blue suit' },
  { src: img('1515886657613-9f3515b0c78f'), occasion: 'Casual',     alt: 'Woman in a yellow tracksuit' },
  { text: 'Your stylist, on call' },
  { src: img('1515562141207-7a88fb7ce338'), occasion: 'Wedding',    alt: 'Pearl necklace' },
  { src: img('1581044777550-4cfa60707c03'), occasion: 'Date Night', alt: 'Woman in a pink ruffled top' },
  { src: img('1520975954732-35dd22299614'), occasion: 'Party',      alt: 'Man in a biker jacket' },
  { src: img('1617922001439-4a2e6562f328'), occasion: 'Dinner',     alt: 'Woman in a white dress and hat' },
  { src: img('1552374196-1ab2a1c593e8'),    occasion: 'Dinner',     alt: 'Man in a camel blazer' },
];

const SCROLL_PUSH = 1.1;    // belt px per page-scroll px (while the hero is on screen)
const EASE = 0.12;          // how quickly the belt catches up with the scroll (momentum)

function Tile({ tile, index, size, onGetStarted }) {
  if (tile.text) {
    return (
      <div className="hp-lb-tile hp-lb-text" style={{ fontSize: Math.max(13, size * 0.13) }}>
        {tile.text}
      </div>
    );
  }
  return (
    <div className="hp-lb-tile" onClick={() => onGetStarted(tile.occasion)} title={`Style a ${tile.occasion.toLowerCase()} look`}>
      <img src={tile.src} alt={tile.alt} draggable="false" />
      <span className="hp-lb-hover">
        <span>{tile.occasion}</span>
        <span>Look {String(index + 1).padStart(3, '0')}</span>
      </span>
    </div>
  );
}

export default function LookbookHero({ children, onGetStarted }) {
  const wrapRef = useRef(null);
  const frameRef = useRef(null);
  const reduce = useReducedMotion();
  const [geo, setGeo] = useState(null);

  // Fit the frame: square tiles, 7 across on desktop, 4–6 rows depending on height
  useEffect(() => {
    const el = wrapRef.current;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width < 640) {
        const T = Math.floor((width - 32) / 2);
        setGeo({ mobile: true, T, W: width - 32 });
        return;
      }
      const Wa = width - 2 * Math.min(48, width * 0.04);
      const Ha = height - 56 - 56 - 96;                  // header + bottom bar + breathing room / scroll cue
      // every shape has a perimeter of 18 tiles = one of each, no repeats; pick the one with the biggest tiles
      const [cols, rows, T] = [[7, 4], [6, 5], [5, 6]]
        .map(([c, r]) => [c, r, Math.floor(Math.min(150, Wa / c, Ha / r))])
        .reduce((best, cur) => (cur[2] > best[2] ? cur : best));
      setGeo({ mobile: false, T, cols, rows, W: cols * T, H: rows * T });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Conveyor belt: rAF writes transforms directly (no React re-render per frame)
  useEffect(() => {
    if (!geo) return;
    const frame = frameRef.current;
    const lanes = [...frame.querySelectorAll('.hp-lb-lane')];
    const items = lanes.map(l => [...l.children]);
    let off = 0, target = 0, raf = 0, visible = true;

    let place;
    if (geo.mobile) {
      const { T, W } = geo;
      const n = items[0].length, cycle = n * T;
      place = () => items.forEach((els, li) => els.forEach((el, k) => {
        const p = (((k * T + off) % cycle) + cycle) % cycle;
        const x = li === 0 ? p - T : W - p;                  // top → right, bottom → left
        el.style.transform = `translate3d(${x}px,0,0)`;
        el.style.visibility = x > -T && x < W ? 'visible' : 'hidden';
      }));
    } else {
      const { T, W, H } = geo;
      const Lh = W - T, Lv = H - T, P = 2 * Lh + 2 * Lv;
      const starts = [0, Lh, Lh + Lv, 2 * Lh + Lv];
      const lens = [Lh, Lv, Lh, Lv];
      place = () => items.forEach((els, li) => els.forEach((el, k) => {
        let d = (k * T + off - starts[li]) % P;
        if (d < 0) d += P;
        if (d > P - T) d -= P;                               // wrap so tiles enter cleanly
        const vis = d > 0 && d < lens[li] + T;
        el.style.visibility = vis ? 'visible' : 'hidden';
        if (!vis) return;
        const p = d - T;                                     // −T (hidden) … lane length (hidden)
        const t = li === 0 ? `${p}px,0`                      // top: moving right
          : li === 1 ? `0,${p}px`                            // right: moving down
          : li === 2 ? `${Lh - T - p}px,0`                   // bottom: moving left
          : `0,${Lv - T - p}px`;                             // left: moving up
        el.style.transform = `translate3d(${t},0)`;
      }));
    }
    place();
    if (reduce) return;

    let lastY = window.scrollY;
    const onScroll = () => { const y = window.scrollY; if (visible) target += (y - lastY) * SCROLL_PUSH; lastY = y; };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(frame);
    window.addEventListener('scroll', onScroll, { passive: true });
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible || Math.abs(target - off) < 0.05) return;
      off += (target - off) * EASE;
      place();
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [geo, reduce]);

  const renderLane = (key, style, list) => (
    <div key={key} className="hp-lb-lane" style={style}>
      {list.map(({ tile, i }) => (
        <div key={i} className="hp-lb-slot" style={{ width: geo.T, height: geo.T }}>
          <Tile tile={tile} index={i} size={geo.T} onGetStarted={onGetStarted} />
        </div>
      ))}
    </div>
  );

  let ring = null;
  if (geo && !geo.mobile) {
    const { T, W, H, cols, rows } = geo;
    const n = 2 * (cols - 1) + 2 * (rows - 1);
    const list = Array.from({ length: n }, (_, i) => ({ tile: TILES[i % TILES.length], i }));
    ring = (
      <div ref={frameRef} className="hp-lb-frame" style={{ width: W, height: H, '--hp-tile': `${T}px` }} aria-hidden="true">
        {renderLane('t', { left: 0, top: 0, width: W - T, height: T }, list)}
        {renderLane('r', { left: W - T, top: 0, width: T, height: H - T }, list)}
        {renderLane('b', { left: T, top: H - T, width: W - T, height: T }, list)}
        {renderLane('l', { left: 0, top: T, width: T, height: H - T }, list)}
      </div>
    );
  }

  return (
    <div className={reduce ? undefined : 'hp-lb-pin'}>
    <section ref={wrapRef} className={`hp-hero hp-lb${geo?.mobile ? ' hp-lb--mobile' : ''}`}>
      {geo && !geo.mobile && (
        <div className="hp-lb-stage" style={{ '--hp-tile': `${geo.T}px` }}>
          <div style={{ position: 'relative', width: geo.W, height: geo.H }}>
            {ring}
            <div className="hp-lb-centre" style={{ left: geo.T, top: geo.T, width: geo.W - 2 * geo.T, height: geo.H - 2 * geo.T }}>
              {children}
            </div>
          </div>
          <p className="hp-lb-scroll">Scroll</p>
        </div>
      )}
      <div className="hp-lb-bar">
        <button className="hp-lb-bar-btn" onClick={() => onGetStarted()}>
          <span className="hp-lb-bar-sq" aria-hidden="true" /> Style my event
        </button>
        <span className="hp-lb-bar-mid">Your AI stylist</span>
        <span className="hp-lb-bar-end">Event · Colour · Wardrobe</span>
      </div>
      {geo?.mobile && (
        <div ref={frameRef} className="hp-lb-stage" style={{ '--hp-tile': `${geo.T}px` }}>
          <div className="hp-lb-strip" style={{ width: geo.W, height: geo.T }} aria-hidden="true">
            {renderLane('t', { inset: 0 }, TILES.slice(0, 9).map((tile, i) => ({ tile, i })))}
          </div>
          <div className="hp-lb-centre hp-lb-centre--mobile">{children}</div>
          <div className="hp-lb-strip" style={{ width: geo.W, height: geo.T }} aria-hidden="true">
            {renderLane('b', { inset: 0 }, TILES.slice(9).map((tile, i) => ({ tile, i: i + 9 })))}
          </div>
        </div>
      )}
    </section>
    </div>
  );
}

