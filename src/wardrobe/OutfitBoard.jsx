import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shuffle, Bookmark, RotateCcw } from 'lucide-react';
import { optionsForSlot, scoreOutfit, suggestOutfits, verdict, outfitName } from './style';
import { FlatLay, Thumb, SectionHead } from './parts';

/* The outfit builder: one row per slot, step through what you own, see if it works, save it. */

const ROWS = [
  { k: 'outer', label: 'Layer', optional: true },
  { k: 'top', label: 'Top or dress' },
  { k: 'bottom', label: 'Bottom' },
  { k: 'shoes', label: 'Shoes', optional: true },
  { k: 'accessory', label: 'Accessory', optional: true },
];
const EMPTY = { outer: null, top: null, bottom: null, shoes: null, accessory: null };

export default function OutfitBoard({ items, urls, season, draft, onSave }) {
  const [slots, setSlots] = useState(() => ({ ...EMPTY, ...draft?.slots }));
  const [name, setName] = useState(draft?.name || '');
  const [nameTouched, setNameTouched] = useState(Boolean(draft?.name));
  const [open, setOpen] = useState(null);           // slot whose picker strip is open
  const [seed, setSeed] = useState(1);
  const fixed = draft?.fixed || null;              // piece locked by "Style this piece"

  // the parent remounts this with a new key for each draft (tweak an idea, edit an outfit, style one piece)

  const set = (k, item) => setSlots(prev => {
    const next = { ...prev, [k]: item };
    if (k === 'top' && item?.category === 'dress') next.bottom = null;
    return next;
  });
  const step = (k, dir, optional) => {
    const opts = optionsForSlot(items, k, slots);
    const list = optional || !slots[k] ? [null, ...opts] : opts;
    const i = list.findIndex(p => (p?.id || null) === (slots[k]?.id || null));
    set(k, list[(i + dir + list.length) % list.length] || null);
  };
  const shuffle = () => {
    const slot = fixed ? (fixed.category === 'outerwear' ? 'outer' : fixed.category === 'dress' ? 'top' : fixed.category) : null;
    const [o] = suggestOutfits(items, { season }, { n: 1, seed: seed * 7919, fixed: slot ? { [slot]: fixed } : {} });
    setSeed(s => s + 1);
    if (o) setSlots({ ...EMPTY, ...o.slots });
  };

  const ready = Boolean(slots.top && (slots.bottom || slots.top.category === 'dress'));
  const result = useMemo(() => (ready ? scoreOutfit(slots, { season }) : null), [slots, season, ready]);
  const v = result && verdict(result.score);
  const autoName = ready ? outfitName(slots) : '';
  const shown = nameTouched ? name : autoName;

  const save = () => {
    onSave({ id: draft?.id, name: (shown || 'My outfit').trim().slice(0, 60), slots: Object.fromEntries(Object.entries(slots).map(([k, p]) => [k, p?.id || null])) });
  };

  return (
    <section className="wd-board-wrap" id="wd-board" aria-labelledby="wd-board-title">
      <SectionHead label="Build" title={draft?.id ? 'Edit outfit' : 'Build an outfit'}
        action={<button className="wd-btn wd-btn--ghost wd-btn--sm" onClick={shuffle}><Shuffle size={14} /> Shuffle</button>}>
        Step through your pieces slot by slot. We'll tell you if it works.
      </SectionHead>
      <div className="wd-board">
        <div className="wd-board-preview">
          {ready || slots.top || slots.outer || slots.shoes ? <FlatLay slots={slots} urls={urls} size="lg" /> : (
            <div className="wd-flatlay wd-flatlay--lg wd-flatlay--empty"><p>Pick a top or dress to start, or hit Shuffle.</p></div>
          )}
          <AnimatePresence mode="wait">
            {v && (
              <motion.div key={v.label + result.score} className="wd-board-verdict" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p className={`wd-verdict wd-verdict--${v.tone}`}><i aria-hidden="true" />{v.label}</p>
                <ul className="wd-reasons">
                  {result.reasons.slice(0, 2).map(r => <li key={r}>{r}</li>)}
                  {result.warnings.slice(0, 2).map(r => <li key={r} className="is-warn">{r}</li>)}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="wd-board-rows">
          {ROWS.map(({ k, label, optional }) => {
            const opts = optionsForSlot(items, k, slots);
            const p = slots[k];
            const disabled = k === 'bottom' && slots.top?.category === 'dress';
            return (
              <div key={k} className={`wd-slot${disabled ? ' is-off' : ''}`}>
                <span className="wd-slot-label">{label}{fixed && p?.id === fixed.id ? ' · styling' : ''}</span>
                <div className="wd-slot-row">
                  <button className="wd-icon-btn wd-icon-btn--line" onClick={() => step(k, -1, optional)} disabled={disabled || !opts.length} aria-label={`Previous ${label.toLowerCase()}`}><ChevronLeft size={16} /></button>
                  <button type="button" className="wd-slot-current" onClick={() => setOpen(open === k ? null : k)} disabled={disabled || !opts.length} aria-expanded={open === k}>
                    {disabled ? <span className="wd-slot-none">Not needed with a dress</span>
                      : !opts.length ? <span className="wd-slot-none">None in your wardrobe</span>
                      : p ? <><Thumb item={p} url={urls[p.id]} size={40} /><span className="wd-slot-name">{p.name}</span></>
                      : <span className="wd-slot-none">{optional ? 'None' : 'Choose…'}</span>}
                  </button>
                  <button className="wd-icon-btn wd-icon-btn--line" onClick={() => step(k, 1, optional)} disabled={disabled || !opts.length} aria-label={`Next ${label.toLowerCase()}`}><ChevronRight size={16} /></button>
                </div>
                <AnimatePresence initial={false}>
                  {open === k && (
                    <motion.div className="wd-strip" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                      <div className="wd-strip-inner" role="listbox" aria-label={label}>
                        {optional && <button role="option" aria-selected={!p} className={`wd-strip-item${!p ? ' is-on' : ''}`} onClick={() => { set(k, null); setOpen(null); }}><span className="wd-slot-none">None</span></button>}
                        {opts.map(o => (
                          <button key={o.id} role="option" aria-selected={p?.id === o.id} className={`wd-strip-item${p?.id === o.id ? ' is-on' : ''}`} onClick={() => { set(k, o); setOpen(null); }} title={o.name}>
                            <Thumb item={o} url={urls[o.id]} size={52} />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          <div className="wd-board-save">
            <input className="wd-name" value={shown} placeholder="Name this outfit" aria-label="Outfit name" maxLength={60}
              onChange={e => { setName(e.target.value); setNameTouched(true); }} disabled={!ready} />
            <div className="wd-actions" style={{ marginTop: 10 }}>
              <button className="wd-link wd-link--icon" onClick={() => { setSlots(EMPTY); setName(''); setNameTouched(false); }}><RotateCcw size={13} /> Clear</button>
              <button className="wd-btn" onClick={save} disabled={!ready}><Bookmark size={15} /> {draft?.id ? 'Update outfit' : 'Save outfit'}</button>
            </div>
            {!ready && <p className="wd-hint">An outfit needs a top and a bottom, or a dress.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
