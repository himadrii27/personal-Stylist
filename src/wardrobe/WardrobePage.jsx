import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, Shirt, Camera, Sparkles } from 'lucide-react';
import Rail, { DeleteButton } from './Rail';
import AddPieceSheet from './AddPieceSheet';
import PieceDetail from './PieceDetail';
import OutfitsTab from './OutfitsTab';
import InsightsTab from './InsightsTab';
import {
  listItems, addItem, removeItem, restoreItem, updateItem, CATEGORIES, categoryOf,
  listOutfits, saveOutfit, removeOutfit, logWear, undoWear,
} from './store';
import { wearKey } from './style';
import { FitBadge, serif } from './parts';

/* ════════════════════════════════════════════════
   MY WARDROBE — three tabs:
   Pieces   (rail / grid, open a piece to tag it, price it, log a wear)
   Outfits  (today's ideas, the builder, saved looks)
   Insights (colour check, worth buying, what you wear)
   Everything is stored on-device.
═══════════════════════════════════════════════════ */

const TABS = [
  { id: 'pieces', label: 'Pieces' },
  { id: 'outfits', label: 'Outfits' },
  { id: 'insights', label: 'Insights' },
];
const slotFor = (item) => (item.category === 'outerwear' ? 'outer' : item.category === 'dress' ? 'top' : item.category);
const isToday = (t) => new Date(t).toDateString() === new Date().toDateString();

const urlCache = new Map();          // item id → object URL
let mounted = 0;
const cutoutUrl = (item) => {
  if (!urlCache.has(item.id)) urlCache.set(item.id, URL.createObjectURL(item.image));
  return urlCache.get(item.id);
};
function releaseCutoutUrls() {
  if (mounted) return;
  urlCache.forEach(u => URL.revokeObjectURL(u));
  urlCache.clear();
}

export default function WardrobePage({ season = null, gender = null, initialTab = 'pieces', onOpenColours }) {
  const [items, setItems] = useState(null);           // null while loading
  const [outfits, setOutfits] = useState([]);
  const [tab, setTab] = useState(initialTab);
  const [view, setView] = useState('rail');
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(null);          // null | { camera: bool, hint?: category }
  const [openId, setOpenId] = useState(null);
  const [arrivingId, setArrivingId] = useState(null);
  const [draft, setDraft] = useState(null);            // what the builder should load
  const [toast, setToast] = useState(null);            // { text, actionLabel?, action? }
  const toastTimer = useRef(null);

  useEffect(() => {
    listItems().then(setItems).catch(() => setItems([]));
    listOutfits().then(setOutfits).catch(() => setOutfits([]));
  }, []);
  useEffect(() => { setTab(initialTab); }, [initialTab]);

  // object URLs for the stored cut-outs: one per piece, kept while this page is open
  const urls = useMemo(() => Object.fromEntries((items || []).map(i => [i.id, cutoutUrl(i)])), [items]);
  useEffect(() => {
    mounted++;
    return () => { mounted--; setTimeout(releaseCutoutUrls, 0); };   // StrictMode remounts straight away; only a real leave releases
  }, []);

  const byId = useMemo(() => Object.fromEntries((items || []).map(i => [i.id, i])), [items]);
  const open = openId ? byId[openId] : null;

  const say = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const replaceItems = (list) => setItems(prev => prev.map(i => list.find(x => x.id === i.id) || i));
  const replaceOutfit = (o) => o && setOutfits(prev => prev.map(x => (x.id === o.id ? o : x)));

  /* pieces */
  const handleAdd = async (pieces) => {
    const saved = [];
    for (const piece of pieces) saved.push(await addItem(piece));
    setItems(prev => [...(prev || []), ...saved]);
    setArrivingId(saved[saved.length - 1]?.id);
    setAdding(null);
    setTab('pieces');
    setView('rail');
  };
  const handleRemove = async (item) => {
    const changed = await removeItem(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    setOutfits(prev => prev.map(o => {
      const hit = changed.find(c => c.id === o.id);
      return hit ? { ...o, slots: Object.fromEntries(Object.entries(o.slots).map(([k, v]) => [k, v === item.id ? null : v])) } : o;
    }));
    setOpenId(null);
    say({
      text: `“${item.name}” deleted`, actionLabel: 'Undo',
      action: async () => {
        await restoreItem(item, changed);
        setItems(prev => [...prev, item].sort((a, b) => a.createdAt - b.createdAt));
        setOutfits(prev => prev.map(o => changed.find(c => c.id === o.id) || o));
      },
    });
  };
  const handleUpdate = async (item) => { await updateItem(item); replaceItems([item]); };

  /* wear log */
  const handleWear = async ({ slots, outfitId = null }) => {
    const itemIds = Object.values(slots).map(p => p?.id).filter(Boolean);
    const rec = await logWear({ itemIds, outfitId });
    replaceItems(rec.items); replaceOutfit(rec.outfit);
    say({
      text: itemIds.length > 1 ? 'Logged today’s outfit' : 'Logged as worn today', actionLabel: 'Undo',
      action: async () => { const back = await undoWear(rec); replaceItems(back.items); replaceOutfit(back.outfit); },
    });
  };
  // which piece-sets were logged together today (one timestamp per wear)
  const wornTodayKeys = useMemo(() => {
    const groups = new Map();
    (items || []).forEach(i => (i.wears || []).filter(isToday).forEach(t => groups.set(t, [...(groups.get(t) || []), i.id])));
    return new Set([...groups.values()].map(ids => wearKey(ids)));
  }, [items]);

  /* outfits */
  const handleSaveOutfit = async ({ id, name, slots }) => {
    const existing = id && outfits.find(o => o.id === id);
    const autoName = name || [byId[slots.top]?.name, byId[slots.bottom]?.name].filter(Boolean).join(' & ') || 'My outfit';
    const saved = await saveOutfit(existing ? { ...existing, name: autoName, slots } : { name: autoName, slots });
    setOutfits(prev => (existing ? prev.map(o => (o.id === saved.id ? saved : o)) : [saved, ...prev]));
    say({ text: existing ? 'Outfit updated' : 'Saved to your outfits', actionLabel: 'View', action: () => document.getElementById('wd-saved-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) });
  };
  const handleDeleteOutfit = async (o) => {
    await removeOutfit(o.id);
    setOutfits(prev => prev.filter(x => x.id !== o.id));
    say({ text: `“${o.name}” deleted`, actionLabel: 'Undo', action: async () => { await saveOutfit(o); setOutfits(prev => [o, ...prev]); } });
  };

  /* moving between tabs */
  const goTab = (id, scrollTo) => {
    setTab(id);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = scrollTo && document.getElementById(scrollTo);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else document.querySelector('.wd-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }));
  };
  const styleThis = (item) => {
    setOpenId(null);
    setDraft({ slots: { [slotFor(item)]: item }, fixed: item, nonce: Date.now() });
    goTab('outfits', 'wd-board');
  };

  const counts = useMemo(() => Object.fromEntries(CATEGORIES.map(c => [c.id, (items || []).filter(i => i.category === c.id).length])), [items]);
  const shown = (items || []).filter(i => filter === 'all' || i.category === filter);
  const empty = items && items.length === 0;

  return (
    <div className="wd-page">
      <header className="wd-head">
        <div>
          <p className="wd-label">(Your wardrobe)</p>
          <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(2.4rem, 5vw, 3.6rem)', lineHeight: 0.95, letterSpacing: '-0.03em', margin: 0 }}>
            My wardrobe
          </h1>
          <p className="wd-msg" style={{ marginTop: 6 }}>
            {items === null ? 'Opening…' : empty ? 'Nothing here yet' : `${items.length} piece${items.length === 1 ? '' : 's'}${outfits.length ? ` · ${outfits.length} outfit${outfits.length === 1 ? '' : 's'}` : ''}`} · stored on this device
          </p>
        </div>
        {!empty && items && (
          <div className="wd-head-actions">
            <button className="wd-btn wd-btn--ghost" onClick={() => setAdding({ camera: false })}><Plus size={16} /> Add</button>
            <button className="wd-btn" onClick={() => goTab('outfits', 'wd-today-title')}><Sparkles size={16} /> What do I wear today?</button>
          </div>
        )}
      </header>

      {items && !empty && (
        <nav className="wd-tabs" role="tablist" aria-label="Wardrobe">
          {TABS.map(t => (
            <button key={t.id} role="tab" id={`wd-tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`wd-panel-${t.id}`}
              className={tab === t.id ? 'is-on' : ''} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'pieces' && <sup>{items.length}</sup>}
              {t.id === 'outfits' && outfits.length > 0 && <sup>{outfits.length}</sup>}
              {tab === t.id && <motion.span layoutId="wd-tab-line" className="wd-tabs-line" />}
            </button>
          ))}
        </nav>
      )}

      {items && (empty || tab === 'pieces') && (
        <div role="tabpanel" id="wd-panel-pieces" aria-labelledby="wd-tab-pieces">
          {!empty && (
            <div className="wd-subbar">
              <div className="wd-toggle" role="radiogroup" aria-label="View">
                <button role="radio" aria-checked={view === 'rail'} className={view === 'rail' ? 'is-on' : ''} onClick={() => setView('rail')}><Shirt size={15} /> Rail</button>
                <button role="radio" aria-checked={view === 'grid'} className={view === 'grid' ? 'is-on' : ''} onClick={() => setView('grid')}><LayoutGrid size={15} /> Grid</button>
              </div>
              {view === 'grid' && (
                <div className="wd-chips">
                  <button className={`wd-chip${filter === 'all' ? ' is-on' : ''}`} onClick={() => setFilter('all')}>All · {items.length}</button>
                  {CATEGORIES.filter(c => counts[c.id]).map(c => (
                    <button key={c.id} className={`wd-chip${filter === c.id ? ' is-on' : ''}`} onClick={() => setFilter(c.id)}>{c.label} · {counts[c.id]}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(view === 'rail' || empty) && (
            <div style={{ position: 'relative' }}>
              <Rail items={items} urls={urls} onOpen={i => setOpenId(i.id)} onDelete={handleRemove} arrivingId={arrivingId} />
              {empty && (
                <div className="wd-empty-wrap">
                  <motion.div className="wd-empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)', margin: '0 0 0.4rem' }}>Your wardrobe is empty.</h2>
                    <p className="wd-msg">Photograph a piece you love. We'll cut it out and hang it here — then dress you from it.</p>
                    <div className="wd-actions" style={{ justifyContent: 'center', marginTop: '1.1rem' }}>
                      <button className="wd-btn" onClick={() => setAdding({ camera: true })}><Camera size={16} /> Add your first piece</button>
                      <button className="wd-link" onClick={() => setAdding({ camera: false })}>or upload a photo</button>
                    </div>
                    <ul className="wd-tips wd-tips--row">
                      <li>Lay it flat or hang it</li><li>Plain, contrasting background</li><li>Good daylight</li>
                    </ul>
                  </motion.div>
                </div>
              )}
            </div>
          )}

          {!empty && view === 'grid' && (
            <motion.div className="wd-grid" layout>
              <AnimatePresence>
                {shown.map(item => (
                  <motion.div key={item.id} layout className="wd-card"
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}>
                    <button type="button" className="wd-piece-open wd-card-open" onClick={() => setOpenId(item.id)} aria-label={`${item.name}, open`}>
                      <span className="wd-card-img"><img src={urls[item.id]} alt="" /></span>
                      <span className="wd-card-name">{item.name}</span>
                      <span className="wd-card-meta">
                        <span className="wd-swatch wd-swatch--sm" style={{ background: item.colour?.hex }} />{categoryOf(item.category).label}
                        {item.wears?.length ? <> · {item.wears.length}× worn</> : null}
                      </span>
                      <FitBadge hex={item.colour?.hex} season={season} size="sm" />
                    </button>
                    <DeleteButton item={item} onDelete={handleRemove} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      )}

      {items && !empty && tab === 'outfits' && (
        <div role="tabpanel" id="wd-panel-outfits" aria-labelledby="wd-tab-outfits">
          <OutfitsTab items={items} outfits={outfits} urls={urls} season={season} byId={byId}
            draft={draft} setDraft={setDraft} wornTodayKeys={wornTodayKeys}
            onWear={handleWear} onSaveOutfit={handleSaveOutfit} onDeleteOutfit={handleDeleteOutfit}
            onAdd={(hint) => setAdding({ camera: false, hint })} />
        </div>
      )}

      {items && !empty && tab === 'insights' && (
        <div role="tabpanel" id="wd-panel-insights" aria-labelledby="wd-tab-insights">
          <InsightsTab items={items} outfits={outfits} urls={urls} season={season} gender={gender} byId={byId}
            onOpenColours={onOpenColours} onOpen={i => setOpenId(i.id)} onStyle={styleThis} />
        </div>
      )}

      <AddPieceSheet open={Boolean(adding)} startWithCamera={adding?.camera} hintCategory={adding?.hint} onClose={() => setAdding(null)} onAdd={handleAdd} />
      <AnimatePresence>
        {open && (
          <PieceDetail key={open.id} item={open} url={urls[open.id]} season={season}
            onClose={() => setOpenId(null)} onRemove={handleRemove} onUpdate={handleUpdate}
            onWear={(it) => handleWear({ slots: { one: it } })} onStyle={styleThis} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {toast && (
          <motion.div className="wd-toast" role="status" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
            <span>{toast.text}</span>
            {toast.action && <button type="button" onClick={() => { const a = toast.action; setToast(null); clearTimeout(toastTimer.current); a(); }}>{toast.actionLabel}</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
