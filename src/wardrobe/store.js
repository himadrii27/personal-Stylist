// Wardrobe storage: IndexedDB, on this device only (no account, photos never uploaded).
// Item: { id, name, category, colour: { hex, name }, image: Blob, width, height, model, createdAt }

const DB_NAME = 'personal-stylist-wardrobe';
const STORE = 'items';
let dbPromise = null;

function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx(mode, fn) {
  return db().then(d => new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode);
    const result = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(result?.result ?? result);
    t.onerror = () => reject(t.error);
  }));
}

export const listItems = () =>
  tx('readonly', s => s.getAll()).then(items => items.sort((a, b) => a.createdAt - b.createdAt));

export const addItem = (item) => {
  const full = { id: crypto.randomUUID(), createdAt: Date.now(), ...item };
  return tx('readwrite', s => s.put(full)).then(() => full);
};

export const updateItem = (item) => tx('readwrite', s => s.put(item)).then(() => item);
export const removeItem = (id) => tx('readwrite', s => s.delete(id));

export const CATEGORIES = [
  { id: 'top',       label: 'Top',       hanger: 'shoulder' },
  { id: 'dress',     label: 'Dress',     hanger: 'shoulder' },
  { id: 'outerwear', label: 'Outerwear', hanger: 'shoulder' },
  { id: 'bottom',    label: 'Bottom',    hanger: 'clip' },
  { id: 'shoes',     label: 'Shoes',     hanger: 'shelf' },
  { id: 'accessory', label: 'Accessory', hanger: 'shelf' },
];
export const categoryOf = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
