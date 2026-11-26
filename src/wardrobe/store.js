// Wardrobe storage: IndexedDB, on this device only (no account, photos never uploaded).
// Item:   { id, name, category, colour: { hex, name }, image: Blob, width, height, model, createdAt,
//           warmth?, dressiness?, price?, wears?: number[] }
// Outfit: { id, name, slots: { outer, top, bottom, shoes, accessory } (item ids or null), createdAt, wears: number[] }
// v1 had only `items`; v2 adds `outfits`. Older items get their new fields filled in on read.

const DB_NAME = 'personal-stylist-wardrobe';
const STORE = 'items';
const OUTFITS = 'outfits';
let dbPromise = null;

function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = (e) => {
        const d = req.result;
        if (e.oldVersion < 1) d.createObjectStore(STORE, { keyPath: 'id' }).createIndex('createdAt', 'createdAt');
        if (e.oldVersion < 2) d.createObjectStore(OUTFITS, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { dbPromise = null; reject(req.error); };
    });
  }
  return dbPromise;
}

function tx(stores, mode, fn) {
  return db().then(d => new Promise((resolve, reject) => {
    const t = d.transaction(stores, mode);
    const pick = Array.isArray(stores) ? stores.map(s => t.objectStore(s)) : [t.objectStore(stores)];
    const result = fn(...pick);
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
  }));
}

export const CATEGORIES = [
  { id: 'top',       label: 'Top',       hanger: 'shoulder' },
  { id: 'dress',     label: 'Dress',     hanger: 'shoulder' },
  { id: 'outerwear', label: 'Outerwear', hanger: 'shoulder' },
  { id: 'bottom',    label: 'Bottom',    hanger: 'clip' },
  { id: 'shoes',     label: 'Shoes',     hanger: 'shelf' },
  { id: 'accessory', label: 'Accessory', hanger: 'shelf' },
];
export const categoryOf = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

export const WARMTH = [
  { id: 'light', label: 'Light' },
  { id: 'mid',   label: 'Mid' },
  { id: 'warm',  label: 'Warm' },
];
export const DRESSINESS = [
  { id: 'casual', label: 'Casual' },
  { id: 'smart',  label: 'Smart' },
  { id: 'dressy', label: 'Dressy' },
];
const TAG_DEFAULTS = {
  top:       { warmth: 'light', dressiness: 'casual' },
  dress:     { warmth: 'light', dressiness: 'smart' },
  outerwear: { warmth: 'warm',  dressiness: 'smart' },
  bottom:    { warmth: 'mid',   dressiness: 'casual' },
  shoes:     { warmth: 'mid',   dressiness: 'casual' },
  accessory: { warmth: 'mid',   dressiness: 'smart' },
};
export const defaultTags = (category) => ({ ...(TAG_DEFAULTS[category] || TAG_DEFAULTS.top) });

/** Fill in fields added after a piece was saved, so every reader sees the same shape. */
export function normaliseItem(item) {
  const d = defaultTags(item.category);
  return {
    ...item,
    warmth: WARMTH.some(w => w.id === item.warmth) ? item.warmth : d.warmth,
    dressiness: DRESSINESS.some(w => w.id === item.dressiness) ? item.dressiness : d.dressiness,
    wears: Array.isArray(item.wears) ? item.wears : [],
  };
}

/* ── pieces ─────────────────────────────────────────────── */
export const listItems = () =>
  tx(STORE, 'readonly', s => s.getAll()).then(items => items.map(normaliseItem).sort((a, b) => a.createdAt - b.createdAt));

export const addItem = (item) => {
  const full = normaliseItem({ id: crypto.randomUUID(), createdAt: Date.now(), ...item });
  return tx(STORE, 'readwrite', s => s.put(full)).then(() => full);
};

export const updateItem = (item) => tx(STORE, 'readwrite', s => s.put(item)).then(() => item);

/** Delete a piece and clear it from any saved outfit's slots. Returns the outfits that changed (for undo). */
export const removeItem = (id) => tx([STORE, OUTFITS], 'readwrite', (items, outfits) => {
  items.delete(id);
  const changed = [];
  const req = outfits.getAll();
  req.onsuccess = () => {
    for (const o of req.result) {
      const hit = Object.entries(o.slots || {}).filter(([, v]) => v === id);
      if (!hit.length) continue;
      changed.push(o);
      outfits.put({ ...o, slots: { ...o.slots, ...Object.fromEntries(hit.map(([k]) => [k, null])) } });
    }
  };
  return { get result() { return changed; } };
});

/** Put a deleted piece back, together with the outfits it was taken out of. */
export const restoreItem = (item, outfits = []) => tx([STORE, OUTFITS], 'readwrite', (s, o) => {
  s.put(item);
  outfits.forEach(x => o.put(x));
});

/* ── outfits ────────────────────────────────────────────── */
export const SLOTS = ['outer', 'top', 'bottom', 'shoes', 'accessory'];
export const listOutfits = () =>
  tx(OUTFITS, 'readonly', s => s.getAll()).then(list => list.map(o => ({ wears: [], ...o })).sort((a, b) => b.createdAt - a.createdAt));

export const saveOutfit = (outfit) => {
  const full = { id: crypto.randomUUID(), createdAt: Date.now(), wears: [], ...outfit };
  return tx(OUTFITS, 'readwrite', s => s.put(full)).then(() => full);
};
export const removeOutfit = (id) => tx(OUTFITS, 'readwrite', s => s.delete(id));

/* ── wear log ───────────────────────────────────────────── */
/**
 * Log one wear (now) on each piece, and on the outfit if given, in one transaction.
 * Resolves to { at, items, outfit } with the updated records; pass it to undoWear to take it back.
 */
export function logWear({ itemIds = [], outfitId = null, at = Date.now() }) {
  const ids = [...new Set(itemIds.filter(Boolean))];
  return tx([STORE, OUTFITS], 'readwrite', (items, outfits) => {
    const out = { at, items: [], outfit: null };
    ids.forEach(id => {
      const r = items.get(id);
      r.onsuccess = () => {
        if (!r.result) return;
        const next = normaliseItem(r.result);
        next.wears = [...next.wears, at];
        items.put(next);
        out.items.push(next);
      };
    });
    if (outfitId) {
      const r = outfits.get(outfitId);
      r.onsuccess = () => {
        if (!r.result) return;
        const next = { ...r.result, wears: [...(r.result.wears || []), at] };
        outfits.put(next);
        out.outfit = next;
      };
    }
    return { get result() { return out; } };
  });
}

export function undoWear({ at, items = [], outfit = null }) {
  const drop = (list) => {
    const i = (list || []).lastIndexOf(at);
    return i < 0 ? list : [...list.slice(0, i), ...list.slice(i + 1)];
  };
  return tx([STORE, OUTFITS], 'readwrite', (s, o) => {
    const out = { items: [], outfit: null };
    items.forEach(it => { const next = { ...it, wears: drop(it.wears) }; s.put(next); out.items.push(next); });
    if (outfit) { out.outfit = { ...outfit, wears: drop(outfit.wears) }; o.put(out.outfit); }
    return { get result() { return out; } };
  });
}
