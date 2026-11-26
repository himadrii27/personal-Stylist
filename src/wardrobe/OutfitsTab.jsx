import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Trash2, Plus } from 'lucide-react';
import TodayPanel from './TodayPanel';
import OutfitBoard from './OutfitBoard';
import { missingForOutfits, wearKey, resolveSlots } from './style';
import { categoryOf } from './store';
import { FlatLay, SectionHead } from './parts';
import { fmtDate } from './format';

/* Outfits: today's ideas → the builder → everything you've saved. */


export default function OutfitsTab({ items, outfits, urls, season, byId, draft, setDraft, onWear, onSaveOutfit, onDeleteOutfit, onAdd, wornTodayKeys }) {
  const missing = missingForOutfits(items);

  if (missing.length) {
    return (
      <div className="wd-need">
        <p className="wd-label">(Outfits)</p>
        <h2 className="wd-h2">A few more pieces and we can dress you.</h2>
        <p className="wd-msg">Outfit ideas need a top and a bottom, or a dress. Shoes make them complete.</p>
        <div className="wd-actions" style={{ justifyContent: 'flex-start' }}>
          {missing.map(c => <button key={c} className="wd-btn" onClick={() => onAdd(c)}><Plus size={15} /> Add a {categoryOf(c).label.toLowerCase()}</button>)}
          <button className="wd-btn wd-btn--ghost" onClick={() => onAdd('dress')}><Plus size={15} /> Add a dress</button>
        </div>
      </div>
    );
  }

  const tweak = (slots, extra = {}) => {
    setDraft({ slots, nonce: Date.now(), ...extra });
    requestAnimationFrame(() => document.getElementById('wd-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const saveIdea = (slots) => onSaveOutfit({ slots: Object.fromEntries(Object.entries(slots).map(([k, p]) => [k, p?.id || null])) });

  return (
    <div className="wd-tabpanel">
      <TodayPanel items={items} urls={urls} season={season} wornTodayKeys={wornTodayKeys}
        onWear={(slots, key) => onWear({ slots, key })} onSave={saveIdea} onTweak={tweak} />

      <OutfitBoard key={draft?.nonce || 'new'} items={items} urls={urls} season={season} draft={draft} onSave={async (o) => { await onSaveOutfit(o); setDraft(null); }} />

      <section className="wd-saved" aria-labelledby="wd-saved-title">
        <SectionHead label="Saved" title={<span id="wd-saved-title">Your outfits</span>}>
          {outfits.length ? `${outfits.length} saved look${outfits.length === 1 ? '' : 's'}` : 'Looks you save from Today or the builder land here.'}
        </SectionHead>
        {outfits.length > 0 && (
          <motion.div className="wd-outfits" layout>
            <AnimatePresence>
              {outfits.map(o => {
                const slots = resolveSlots(o.slots, byId);
                const broken = !slots.top;
                const key = wearKey(slots);
                const worn = wornTodayKeys.has(key);
                return (
                  <motion.article key={o.id} layout className="wd-outfit" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                    <FlatLay slots={slots} urls={urls} size="sm" label={o.name} />
                    <div className="wd-outfit-body">
                      <p className="wd-outfit-name">{o.name}</p>
                      <p className="wd-card-meta">{broken ? 'A piece was deleted' : o.wears?.length ? `Worn ${o.wears.length}× · last ${fmtDate(Math.max(...o.wears))}` : 'Not worn yet'}</p>
                      <div className="wd-idea-actions">
                        <button className="wd-btn wd-btn--sm" disabled={broken || worn} onClick={() => onWear({ slots, key, outfitId: o.id })}><Check size={14} /> {worn ? 'Wearing it' : 'Wear'}</button>
                        <button className="wd-icon-btn wd-icon-btn--line" aria-label={`Edit ${o.name}`} title="Edit" onClick={() => tweak(slots, { id: o.id, name: o.name })}><Pencil size={14} /></button>
                        <button className="wd-icon-btn wd-icon-btn--line" aria-label={`Delete ${o.name}`} title="Delete" onClick={() => onDeleteOutfit(o)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}
