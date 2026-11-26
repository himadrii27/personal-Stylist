import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, X, Check, Wand2 } from 'lucide-react';
import { categoryOf } from './store';
import { FIT, colourFit } from './style';
import { TagChips, FitBadge, serif } from './parts';
import { fmtDate } from './format';

/* One piece: big cut-out, colour fit, tags, price, wear log and the two ways onward. */
export default function PieceDetail({ item, url, season, onClose, onRemove, onUpdate, onWear, onStyle }) {
  const [price, setPrice] = useState(item.price ? String(item.price) : '');
  const fit = colourFit(item.colour?.hex, season);
  const wears = item.wears || [];
  const wornToday = wears.some(t => new Date(t).toDateString() === new Date().toDateString());

  const savePrice = () => {
    const n = Math.round(Number(price.replace(/[^\d.]/g, '')));
    const next = n > 0 ? n : undefined;
    if (next !== item.price) onUpdate({ ...item, price: next });
  };

  return (
    <motion.div className="wd-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="wd-sheet wd-detail" role="dialog" aria-modal="true" aria-label={item.name}
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={e => e.stopPropagation()}>
        <div className="wd-sheet-head">
          <p className="wd-label">{categoryOf(item.category).label}</p>
          <button className="wd-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="wd-detail-img"><img src={url} alt={item.name} /></div>
        <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: '2rem', margin: '1rem 0 0.4rem' }}>{item.name}</h2>
        <p className="wd-msg" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="wd-swatch" style={{ background: item.colour?.hex }} /> {item.colour?.name}
          <FitBadge hex={item.colour?.hex} season={season} />
        </p>
        {fit && <p className="wd-detail-tip">{FIT[fit].tip}</p>}

        <div className="wd-detail-block">
          <TagChips warmth={item.warmth} dressiness={item.dressiness} onChange={patch => onUpdate({ ...item, ...patch })} />
          <label className="wd-price">
            <span className="wd-tagrow-label">Price</span>
            <span className="wd-price-field">
              <span aria-hidden="true">₹</span>
              <input inputMode="numeric" placeholder="optional" value={price} aria-label="Price in rupees"
                onChange={e => setPrice(e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
                onBlur={savePrice} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
            </span>
            <small>for cost per wear</small>
          </label>
        </div>

        <div className="wd-detail-wear">
          <p className="wd-msg">
            {wears.length ? <>Worn <strong>{wears.length}×</strong> · last on {fmtDate(Math.max(...wears))}</> : 'Not logged as worn yet'}
            {' · '}added {fmtDate(item.createdAt)}
          </p>
        </div>

        <div className="wd-actions wd-actions--split">
          <button className="wd-btn wd-btn--ghost wd-btn--sm" onClick={() => onRemove(item)}><Trash2 size={15} /> Delete</button>
          <span className="wd-actions-gap" />
          <button className="wd-btn wd-btn--ghost" onClick={() => onStyle(item)}><Wand2 size={15} /> Style this piece</button>
          <button className="wd-btn" onClick={() => onWear(item)} disabled={wornToday}>
            <Check size={15} /> {wornToday ? 'Worn today' : 'Wore it today'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
