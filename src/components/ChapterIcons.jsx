import { motion } from 'framer-motion';

/* ════════════════════════════════════════════════
   CHAPTER ICONS — one tiny looping scene per chapter of the story map,
   so each card reads at a glance instead of as a paragraph.
   Ink line-art + one orange accent, 72×72.
═══════════════════════════════════════════════════ */

const INK = '#3d362c';
const ACCENT = '#E2571A';
const PAPER = '#F3EDE2';
const loop = (duration, extra = {}) => ({ duration, repeat: Infinity, ease: 'easeInOut', ...extra });
const line = { fill: 'none', stroke: INK, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

function Frame({ children, label }) {
  return (
    <svg viewBox="0 0 72 72" width="72" height="72" role="img" aria-label={label} style={{ display: 'block', overflow: 'visible' }}>
      <circle cx="36" cy="36" r="34" fill={PAPER} stroke="#DDD8CF" />
      {children}
    </svg>
  );
}

// Darzi — a needle stitches a seam, stitch by stitch
function Darzi() {
  return (
    <Frame label="A needle stitching a seam">
      <path d="M14 44 H58" stroke="#C9B79C" strokeWidth="2" strokeDasharray="5 4" />
      <motion.path d="M14 44 H58" {...line} stroke={ACCENT} strokeDasharray="5 4"
        initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 1] }} transition={loop(2.4, { times: [0, 0.8, 1], ease: 'linear' })} />
      <motion.g animate={{ x: [0, 44, 44], y: [0, 0, 0] }} transition={loop(2.4, { times: [0, 0.8, 1], ease: 'linear' })}>
        <motion.g animate={{ y: [0, -7, 0] }} transition={loop(0.3)}>
          <path d="M14 44 L22 24" {...line} />
          <ellipse cx="21.4" cy="25.6" rx="1" ry="2" transform="rotate(22 21.4 25.6)" fill="none" stroke={INK} strokeWidth="1.2" />
        </motion.g>
      </motion.g>
    </Frame>
  );
}

// 1858 Paris — couture on a dress form, spotlight sweeps on
function Couture() {
  return (
    <Frame label="A gown on a dress form under a spotlight">
      <motion.path d="M36 8 L18 62 H54 Z" fill={ACCENT} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.14, 0.14, 0] }} transition={loop(2.6, { times: [0, 0.3, 0.8, 1] })} />
      <path d="M36 54 V62 M30 62 H42" {...line} />
      <motion.path d="M30 20 Q36 17 42 20 L40 32 Q46 44 48 54 H24 Q26 44 32 32 Z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round"
        animate={{ scaleY: [0.96, 1, 0.96] }} style={{ originY: 0 }} transition={loop(2.6)} />
      <path d="M32 32 Q36 34 40 32" {...line} stroke={ACCENT} />
    </Frame>
  );
}

// 1909 London — shopping bag drops in, price tag swings
function Shopping() {
  return (
    <Frame label="A shopping bag with a swinging tag">
      <motion.g animate={{ y: [-6, 0, 0, -6] }} transition={loop(2.4, { times: [0, 0.25, 0.85, 1] })}>
        <path d="M22 28 H50 L47 56 H25 Z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M29 28 Q29 18 36 18 Q43 18 43 28" {...line} />
        <motion.g style={{ originX: '43px', originY: '28px' }} animate={{ rotate: [-18, 14, -18] }} transition={loop(1.2)}>
          <path d="M43 28 L48 38" stroke={INK} strokeWidth="1.2" />
          <rect x="44" y="37" width="9" height="6" rx="1.5" fill={ACCENT} transform="rotate(20 48 40)" />
        </motion.g>
      </motion.g>
    </Frame>
  );
}

// 1930s Hollywood — clapperboard snaps shut, star twinkles
function Hollywood() {
  return (
    <Frame label="A film clapperboard snapping">
      <rect x="18" y="32" width="36" height="22" rx="2" fill="#fff" stroke={INK} strokeWidth="2" />
      <motion.g style={{ originX: '18px', originY: '32px' }} animate={{ rotate: [-24, 0, 0, -24] }} transition={loop(1.6, { times: [0, 0.18, 0.7, 1] })}>
        <rect x="18" y="24" width="36" height="8" rx="1.5" fill={INK} />
        <path d="M24 24 L21 32 M32 24 L29 32 M40 24 L37 32 M48 24 L45 32" stroke="#fff" strokeWidth="2.4" />
      </motion.g>
      <motion.path d="M54 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill={ACCENT}
        animate={{ scale: [0.6, 1.1, 0.6], opacity: [0.5, 1, 0.5] }} style={{ originX: '54px', originY: '21px' }} transition={loop(1.6)} />
    </Frame>
  );
}

// 1960s New York — a magazine page turns to reveal "the look"
function Editor() {
  return (
    <Frame label="A magazine page turning">
      <rect x="20" y="16" width="32" height="42" rx="1.5" fill="#fff" stroke={INK} strokeWidth="2" />
      <text x="36" y="27" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" fontStyle="italic" fill={ACCENT}>the look</text>
      <path d="M28 33 Q36 30 44 33 L42 52 H30 Z" fill={INK} opacity="0.85" />
      <motion.path d="M52 16 L52 58 Q40 50 36 37 Q40 24 52 16 Z" fill={PAPER} stroke={INK} strokeWidth="1.5"
        style={{ originX: '20px' }} animate={{ scaleX: [1, -0.05, -0.05, 1], opacity: [1, 1, 0, 0] }} transition={loop(2.6, { times: [0, 0.45, 0.5, 1] })} />
    </Frame>
  );
}

// 1983 — a golden statuette rises, with a shine
function Oscar() {
  return (
    <Frame label="A golden award statuette">
      <motion.g animate={{ y: [8, 0, 0, 8] }} transition={loop(2.6, { times: [0, 0.3, 0.85, 1] })}>
        <circle cx="36" cy="20" r="4" fill="#D4A43A" />
        <path d="M32 26 H40 L39 44 H33 Z" fill="#D4A43A" />
        <path d="M30 26 H42" stroke="#B8892B" strokeWidth="2" strokeLinecap="round" />
        <rect x="29" y="44" width="14" height="4" fill="#B8892B" />
        <rect x="26" y="48" width="20" height="6" rx="1" fill={INK} />
        <motion.rect x="31" y="14" width="3" height="34" fill="#fff" opacity="0.7" transform="skewX(-20)"
          animate={{ x: [-6, 18] }} transition={loop(2.6, { ease: 'linear' })} />
      </motion.g>
    </Frame>
  );
}

// 1990s Mumbai — marquee lights chase around a film frame
function Bollywood() {
  const bulbs = [[20, 20], [30, 20], [42, 20], [52, 20], [52, 30], [52, 42], [52, 52], [42, 52], [30, 52], [20, 52], [20, 42], [20, 30]];
  return (
    <Frame label="Marquee lights around a film frame">
      <rect x="25" y="25" width="22" height="22" rx="2" fill={INK} />
      <path d="M33 31 L41 36 L33 41 Z" fill="#fff" />
      {bulbs.map(([x, y], i) => (
        <motion.circle key={i} cx={x} cy={y} r="2.6" fill={ACCENT}
          animate={{ opacity: [0.2, 1, 0.2] }} transition={loop(1.2, { delay: i * 0.1 })} />
      ))}
    </Frame>
  );
}

// 2011 Online — a parcel opens and clothes pop out
function Delivery() {
  return (
    <Frame label="A delivery box opening with clothes">
      <motion.path d="M27 40 L31 30 L36 33 L41 30 L45 40" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round"
        animate={{ y: [10, -6, -6, 10], opacity: [0, 1, 1, 0] }} transition={loop(2.4, { times: [0, 0.35, 0.8, 1] })} />
      <path d="M20 38 H52 V56 H20 Z" fill="#E4D9C4" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <motion.path d="M20 38 L14 30" {...line} style={{ originX: '20px', originY: '38px' }} animate={{ rotate: [40, 0, 0, 40] }} transition={loop(2.4, { times: [0, 0.25, 0.85, 1] })} />
      <motion.path d="M52 38 L58 30" {...line} style={{ originX: '52px', originY: '38px' }} animate={{ rotate: [-40, 0, 0, -40] }} transition={loop(2.4, { times: [0, 0.25, 0.85, 1] })} />
      <path d="M30 47 H42" stroke={ACCENT} strokeWidth="2.4" strokeLinecap="round" />
    </Frame>
  );
}

// 2020s Paris & Mumbai — a model walks the catwalk in an embroidered lehenga, cameras flash
function Runway() {
  return (
    <Frame label="A model walking a runway in an embroidered outfit">
      <path d="M30 60 L33 26 H39 L42 60" fill="#E4D9C4" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <motion.g style={{ originX: '36px', originY: '52px' }}
        animate={{ y: [-8, 0, 0, -8], scale: [0.72, 1, 1, 0.72], opacity: [0, 1, 1, 0] }}
        transition={loop(3, { times: [0, 0.45, 0.85, 1] })}>
        <circle cx="36" cy="22" r="3.6" fill={INK} />
        <path d="M33 27 H39 L40 35 H32 Z" fill={INK} />
        <path d="M32 35 H40 L46 53 H26 Z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        {[[31, 46], [36, 43], [41, 46], [33, 50], [39, 50]].map(([x, y], i) => (
          <motion.circle key={i} cx={x} cy={y} r="1.5" fill={ACCENT}
            animate={{ opacity: [0.3, 1, 0.3] }} transition={loop(1.1, { delay: i * 0.15 })} />
        ))}
      </motion.g>
      {[[15, 30, 0], [57, 26, 0.7], [16, 46, 1.4], [56, 44, 2.1]].map(([x, y, delay]) => (
        <motion.path key={`${x}-${y}`} d={`M${x} ${y - 4} l1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2 z`} fill={ACCENT}
          style={{ originX: `${x}px`, originY: `${y}px` }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }} transition={loop(2.8, { delay, times: [0, 0.12, 0.3] })} />
      ))}
    </Frame>
  );
}

// Today — a chat bubble turns into an outfit
function Today() {
  return (
    <Frame label="A message turning into an outfit">
      <motion.g animate={{ opacity: [1, 1, 0, 0, 1] }} transition={loop(3, { times: [0, 0.35, 0.45, 0.9, 1] })}>
        <path d="M18 22 H54 V42 H32 L24 50 V42 H18 Z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        {[28, 36, 44].map((x, i) => (
          <motion.circle key={x} cx={x} cy="32" r="2.4" fill={ACCENT} animate={{ y: [0, -3, 0] }} transition={loop(0.6, { delay: i * 0.12 })} />
        ))}
      </motion.g>
      <motion.g animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.8, 0.8, 1, 1, 0.8] }} style={{ originX: '36px', originY: '36px' }} transition={loop(3, { times: [0, 0.4, 0.5, 0.9, 1] })}>
        <path d="M28 18 L36 15 L44 18 L48 26 L43 28 L43 36 H29 V28 L24 26 Z" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M29 36 H43 L45 56 H38 L36 42 L34 56 H27 Z" fill={INK} />
        <path d="M54 16 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" fill={ACCENT} />
      </motion.g>
    </Frame>
  );
}

const ICONS = {
  Darzi, '1858': Couture, '1909': Shopping, '1930s': Hollywood, '1960s': Editor,
  '1983': Oscar, '1990s': Bollywood, '2011': Delivery, '2020s': Runway, Today,
};

export default function ChapterIcon({ rail }) {
  const Icon = ICONS[rail];
  return Icon ? <Icon /> : null;
}
