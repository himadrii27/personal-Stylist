import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { categoryOf } from './store';

/* ════════════════════════════════════════════════
   THE WARDROBE — an open cabinet with a wooden rail and a shelf.
   Tops, dresses and outerwear hang from shoulder hangers, bottoms from
   clip hangers; shoes and accessories sit on the shelf. Every piece swings
   on its hook when it arrives and when you hover it.
═══════════════════════════════════════════════════ */

const WOOD = '#B98A5B';
const WOOD_DARK = '#8E6440';
const SLOT_W = 168;      // width per hanging piece
const DROP_H = 230;      // max garment height under the hanger

export function Hanger({ type = 'shoulder', width = 132 }) {
  if (type === 'clip') {
    return (
      <svg width={width} height={52} viewBox="0 0 132 52" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        <path d="M66 2 q-9 0 -9 8 q0 6 9 9" fill="none" stroke="#6f6a63" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M66 19 V30" stroke="#6f6a63" strokeWidth="2.4" />
        <rect x="14" y="29" width="104" height="8" rx="3" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1" />
        <rect x="20" y="36" width="12" height="15" rx="2" fill="#7c776f" />
        <rect x="100" y="36" width="12" height="15" rx="2" fill="#7c776f" />
      </svg>
    );
  }
  return (
    <svg width={width} height={52} viewBox="0 0 132 52" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <path d="M66 2 q-9 0 -9 8 q0 6 9 9" fill="none" stroke="#6f6a63" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M66 19 V24" stroke="#6f6a63" strokeWidth="2.4" />
      <path d="M66 22 C 54 28, 22 38, 6 46 Q 3 49 7 50 L 125 50 Q 129 49 126 46 C 110 38, 78 28, 66 22 Z" fill={WOOD} stroke={WOOD_DARK} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M14 47 H118" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// One hanging piece; `arriving` plays the hook-and-swing entrance
export function DeleteButton({ item, onDelete }) {
  return (
    <button type="button" className="wd-del" onClick={e => { e.stopPropagation(); onDelete(item); }} aria-label={`Delete ${item.name}`} title="Delete">
      <X size={14} strokeWidth={2.4} />
    </button>
  );
}

function HangingPiece({ item, url, onOpen, onDelete, arriving, reduce }) {
  const hanger = categoryOf(item.category).hanger;
  const scale = Math.min(1, (SLOT_W - 18) / item.width, DROP_H / item.height);
  return (
    <motion.div
      className="wd-piece"
      initial={arriving && !reduce ? { y: -140, rotate: -18, opacity: 0 } : false}
      animate={{ y: 0, rotate: 0, opacity: 1 }}
      exit={reduce ? undefined : { y: 60, opacity: 0, rotate: 8, transition: { duration: 0.35 } }}
      transition={{ type: 'spring', stiffness: 120, damping: 7, mass: 0.9 }}
      whileHover={reduce ? undefined : { rotate: [0, 4, -3, 2, 0], transition: { duration: 1.1 } }}
      style={{ width: SLOT_W, transformOrigin: '50% 2px' }}
    >
      <button type="button" className="wd-piece-open" onClick={() => onOpen(item)} aria-label={`${item.name}, open`}>
      <Hanger type={hanger} width={hanger === 'clip' ? 112 : 132} />
      <img
        src={url}
        alt=""
        draggable="false"
        style={{
          width: item.width * scale, height: item.height * scale,
          marginTop: hanger === 'clip' ? -6 : -14,
          filter: 'drop-shadow(0 14px 18px rgba(40,28,15,0.22))',
        }}
      />
      <span className="wd-piece-name">{item.name}</span>
      </button>
      <DeleteButton item={item} onDelete={onDelete} />
    </motion.div>
  );
}

function ShelfPiece({ item, url, onOpen, onDelete, arriving, reduce }) {
  const scale = Math.min(1, 120 / item.width, 96 / item.height);
  return (
    <motion.div
      className="wd-shelf-piece"
      initial={arriving && !reduce ? { y: -60, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      exit={reduce ? undefined : { y: 30, opacity: 0, transition: { duration: 0.3 } }}
      transition={{ type: 'spring', bounce: 0.45, duration: 0.8 }}
      whileHover={reduce ? undefined : { y: -6 }}
    >
      <button type="button" className="wd-piece-open" onClick={() => onOpen(item)} aria-label={`${item.name}, open`}>
        <img src={url} alt="" draggable="false" style={{ width: item.width * scale, height: item.height * scale, filter: 'drop-shadow(0 8px 10px rgba(40,28,15,0.22))' }} />
        <span className="wd-piece-name">{item.name}</span>
      </button>
      <DeleteButton item={item} onDelete={onDelete} />
    </motion.div>
  );
}

const RAIL_ORDER = ['outerwear', 'dress', 'top', 'bottom'];

export default function Rail({ items, urls, onOpen, onDelete, arrivingId }) {
  const reduce = useReducedMotion();
  const hanging = items.filter(i => categoryOf(i.category).hanger !== 'shelf')
    .sort((a, b) => RAIL_ORDER.indexOf(a.category) - RAIL_ORDER.indexOf(b.category) || a.createdAt - b.createdAt);
  const shelf = items.filter(i => categoryOf(i.category).hanger === 'shelf');
  const empty = items.length === 0;

  return (
    <div className="wd-cabinet">
      <div className="wd-cabinet-inner">
        <div className="wd-rail-row">
          <div className="wd-rod" aria-hidden="true" />
          <div className="wd-rail-scroll">
            {empty
              ? Array.from({ length: 6 }, (_, i) => (
                <motion.div
                  key={i}
                  className="wd-piece wd-piece--empty"
                  animate={reduce ? undefined : { rotate: [-3, 3, -3] }}
                  transition={{ duration: 3.2 + i * 0.35, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                  style={{ width: SLOT_W, transformOrigin: '50% 2px' }}
                >
                  <Hanger width={132} />
                </motion.div>
              ))
              : (
                <AnimatePresence initial={false}>
                  {hanging.map(item => (
                    <HangingPiece key={item.id} item={item} url={urls[item.id]} onOpen={onOpen} onDelete={onDelete} arriving={item.id === arrivingId} reduce={reduce} />
                  ))}
                </AnimatePresence>
              )}
          </div>
        </div>
        <div className="wd-shelf-row">
          <div className="wd-shelf-items">
            <AnimatePresence initial={false}>
              {shelf.map(item => (
                <ShelfPiece key={item.id} item={item} url={urls[item.id]} onOpen={onOpen} onDelete={onDelete} arriving={item.id === arrivingId} reduce={reduce} />
              ))}
            </AnimatePresence>
          </div>
          <div className="wd-shelf" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
