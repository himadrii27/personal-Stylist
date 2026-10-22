import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, Shirt, Trash2, X, Camera } from 'lucide-react';
import Rail, { DeleteButton } from './Rail';
import AddPieceSheet from './AddPieceSheet';
import { listItems, addItem, removeItem, updateItem, CATEGORIES, categoryOf } from './store';

/* ════════════════════════════════════════════════
   MY WARDROBE — empty state → add pieces → see them hang on the rail,
   or browse them as a filterable grid. Everything is stored on-device.
═══════════════════════════════════════════════════ */

const serif = '"Instrument Serif", Georgia, serif';

function ItemDetail({ item, url, onClose, onRemove }) {
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
        <p className="wd-msg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="wd-swatch" style={{ background: item.colour?.hex }} /> {item.colour?.name} · added {new Date(item.createdAt).toLocaleDateString()}
        </p>
        <div className="wd-actions">
          <button className="wd-btn wd-btn--ghost" onClick={() => onRemove(item)}><Trash2 size={15} /> Delete from wardrobe</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function WardrobePage() {
  const [items, setItems] = useState(null);           // null while loading
  const [view, setView] = useState('rail');
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(null);          // null | { camera: bool }
  const [open, setOpen] = useState(null);
  const [arrivingId, setArrivingId] = useState(null);

  useEffect(() => { listItems().then(setItems).catch(() => setItems([])); }, []);

  // object URLs for the stored cut-outs (revoked when the list changes)
  const urls = useMemo(() => Object.fromEntries((items || []).map(i => [i.id, URL.createObjectURL(i.image)])), [items]);
  useEffect(() => () => Object.values(urls).forEach(u => URL.revokeObjectURL(u)), [urls]);

  const handleAdd = async (pieces) => {
    const saved = [];
    for (const piece of pieces) saved.push(await addItem(piece));
    setItems(prev => [...(prev || []), ...saved]);
    setArrivingId(saved[saved.length - 1]?.id);
    setAdding(null);
    setView('rail');
  };
  // delete with a short undo window; the item is re-saved as-is if undone
  const [undo, setUndo] = useState(null);           // the last deleted item
  const undoTimer = useRef(null);
  const handleRemove = async (item) => {
    await removeItem(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    setOpen(null);
    setUndo(item);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 6000);
  };
  const handleUndo = async () => {
    if (!undo) return;
    clearTimeout(undoTimer.current);
    await updateItem(undo);
    setItems(prev => [...prev, undo]);
    setUndo(null);
  };
  useEffect(() => () => clearTimeout(undoTimer.current), []);

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
            {items === null ? 'Opening…' : empty ? 'Nothing here yet' : `${items.length} piece${items.length === 1 ? '' : 's'}`} · stored on this device
          </p>
        </div>
        {!empty && items && (
          <div className="wd-head-actions">
            <div className="wd-toggle" role="tablist" aria-label="View">
              <button role="tab" aria-selected={view === 'rail'} className={view === 'rail' ? 'is-on' : ''} onClick={() => setView('rail')}><Shirt size={15} /> Rail</button>
              <button role="tab" aria-selected={view === 'grid'} className={view === 'grid' ? 'is-on' : ''} onClick={() => setView('grid')}><LayoutGrid size={15} /> Grid</button>
            </div>
            <button className="wd-btn" onClick={() => setAdding({ camera: false })}><Plus size={16} /> Add</button>
          </div>
        )}
      </header>

      {items && (view === 'rail' || empty) && (
        <div style={{ position: 'relative' }}>
          <Rail items={items} urls={urls} onOpen={setOpen} onDelete={handleRemove} arrivingId={arrivingId} />
          {empty && (
            <div className="wd-empty-wrap">
            <motion.div className="wd-empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 'clamp(1.8rem, 3.6vw, 2.6rem)', margin: '0 0 0.4rem' }}>Your wardrobe is empty.</h2>
              <p className="wd-msg">Photograph a piece you love. We'll cut it out and hang it here.</p>
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

      {items && !empty && view === 'grid' && (
        <>
          <div className="wd-chips" style={{ marginBottom: '1.25rem' }}>
            <button className={`wd-chip${filter === 'all' ? ' is-on' : ''}`} onClick={() => setFilter('all')}>All · {items.length}</button>
            {CATEGORIES.filter(c => counts[c.id]).map(c => (
              <button key={c.id} className={`wd-chip${filter === c.id ? ' is-on' : ''}`} onClick={() => setFilter(c.id)}>{c.label} · {counts[c.id]}</button>
            ))}
          </div>
          <motion.div className="wd-grid" layout>
            <AnimatePresence>
              {shown.map(item => (
                <motion.div key={item.id} layout className="wd-card"
                  initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}>
                  <button type="button" className="wd-piece-open wd-card-open" onClick={() => setOpen(item)} aria-label={`${item.name}, open`}>
                    <span className="wd-card-img"><img src={urls[item.id]} alt="" /></span>
                    <span className="wd-card-name">{item.name}</span>
                    <span className="wd-card-meta"><span className="wd-swatch wd-swatch--sm" style={{ background: item.colour?.hex }} />{categoryOf(item.category).label}</span>
                  </button>
                  <DeleteButton item={item} onDelete={handleRemove} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      <AddPieceSheet open={Boolean(adding)} startWithCamera={adding?.camera} onClose={() => setAdding(null)} onAdd={handleAdd} />
      <AnimatePresence>
        {open && <ItemDetail item={open} url={urls[open.id]} onClose={() => setOpen(null)} onRemove={handleRemove} />}
      </AnimatePresence>
      <AnimatePresence>
        {undo && (
          <motion.div className="wd-toast" role="status" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
            <span>“{undo.name}” deleted</span>
            <button type="button" onClick={handleUndo}>Undo</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
