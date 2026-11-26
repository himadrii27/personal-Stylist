import { WARMTH, DRESSINESS } from './store';
import { FIT, colourFit } from './style';

/* Small building blocks shared by the wardrobe tabs. */

export const serif = '"Instrument Serif", Georgia, serif';

/** Two one-tap rows: Warmth and Dressiness. */
export function TagChips({ warmth, dressiness, onChange, compact }) {
  const row = (label, list, value, key) => (
    <div className={`wd-tagrow${compact ? ' wd-tagrow--compact' : ''}`}>
      <span className="wd-tagrow-label">{label}</span>
      <div className="wd-chips" role="radiogroup" aria-label={label}>
        {list.map(o => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id}
            className={`wd-chip wd-chip--sm${value === o.id ? ' is-on' : ''}`} onClick={() => onChange({ [key]: o.id })}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="wd-tags">
      {row('Warmth', WARMTH, warmth, 'warmth')}
      {row('Dressiness', DRESSINESS, dressiness, 'dressiness')}
    </div>
  );
}

/** Colour-season badge for a piece (renders nothing without a season). */
export function FitBadge({ hex, season, size = 'md' }) {
  const fit = colourFit(hex, season);
  if (!fit) return null;
  return <span className={`wd-fit wd-fit--${fit} wd-fit--${size}`} title={FIT[fit].tip}><i aria-hidden="true" />{FIT[fit].label}</span>;
}

/* Where each slot sits on the flat-lay board, as % of the board (left, top, width, height). */
const LAYOUT = {
  withOuter: {
    outer: [2, 6, 40, 50], top: [36, 2, 40, 40], bottom: [38, 40, 34, 56], shoes: [72, 72, 26, 24], accessory: [74, 10, 24, 22],
  },
  plain: {
    top: [22, 2, 50, 42], bottom: [26, 42, 42, 54], shoes: [70, 72, 28, 24], accessory: [72, 8, 26, 24],
  },
  dress: {
    outer: [2, 6, 40, 50], top: [30, 2, 44, 80], shoes: [72, 72, 26, 24], accessory: [74, 10, 24, 22],
  },
};
const ORDER = ['outer', 'bottom', 'top', 'shoes', 'accessory'];   // back to front

/** An outfit laid flat on an ivory board, built from the pieces' cut-outs. */
export function FlatLay({ slots, urls, size = 'md', label }) {
  const isDress = slots.top?.category === 'dress';
  const L = isDress ? LAYOUT.dress : slots.outer ? LAYOUT.withOuter : LAYOUT.plain;
  const names = ORDER.map(k => slots[k]?.name).filter(Boolean);
  return (
    <div className={`wd-flatlay wd-flatlay--${size}`} role="img" aria-label={label || names.join(', ')}>
      {ORDER.map(k => {
        const p = slots[k];
        if (!p || !L[k]) return null;
        const [x, y, w, h] = L[k];
        return (
          <span key={k} className="wd-flatlay-slot" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}>
            {urls[p.id] ? <img src={urls[p.id]} alt="" draggable="false" /> : <span className="wd-flatlay-ghost" style={{ background: p.colour?.hex }} />}
          </span>
        );
      })}
    </div>
  );
}

/** "(Label)" + serif heading + optional line, like the homepage sections. */
export function SectionHead({ label, title, children, action }) {
  return (
    <div className="wd-sec-head">
      <div>
        <p className="wd-label">({label})</p>
        <h2 className="wd-h2" style={{ fontFamily: serif }}>{title}</h2>
        {children && <p className="wd-msg">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function Thumb({ item, url, size = 44 }) {
  return (
    <span className="wd-thumb" style={{ width: size, height: size }} title={item.name}>
      {url ? <img src={url} alt="" /> : <span style={{ background: item.colour?.hex }} />}
    </span>
  );
}

