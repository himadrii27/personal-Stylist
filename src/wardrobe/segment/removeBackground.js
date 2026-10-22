// Main-thread API for the background-removal worker.
// removeBackground(blob, { model, onProgress(label, loaded, total) })
//   → { mode: 'flat' | 'person', pieces: [{ cutout, preview, width, height, colour, category, label }], ms, model }

let worker = null;
let nextId = 1;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./segmentWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, type } = e.data;
      const job = pending.get(id);
      if (!job) return;
      if (type === 'progress') job.onProgress?.(e.data.label, e.data.loaded, e.data.total);
      else {
        pending.delete(id);
        if (type === 'done') job.resolve(e.data);
        else job.reject(new Error(e.data.message));
      }
    };
    worker.onerror = (e) => {
      for (const job of pending.values()) job.reject(new Error(e.message || 'Background removal failed to start.'));
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

export function removeBackground(blob, { model = 'u2netp', onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject, onProgress });
    getWorker().postMessage({ id, type: 'segment', blob, model });
  });
}

// Is the HD model already downloaded? (lets the UI skip the 168 MB warning)
export async function isModelCached(url) {
  try { return Boolean(await (await caches.open('wardrobe-models-v1')).match(url)); } catch { return false; }
}

export const HD_MODEL_URL = 'https://huggingface.co/BritishWerewolf/U-2-Net/resolve/main/onnx/model.onnx';
export const HD_MODEL_MB = 168;
