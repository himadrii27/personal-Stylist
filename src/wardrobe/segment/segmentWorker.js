/* ════════════════════════════════════════════════
   Background-removal worker, off the main thread (onnxruntime-web, WASM):
   · U2-Net cuts the subject out of the background;
   · SegFormer-B2 "clothes" parses the photo — if a person is wearing the
     clothes, their skin/hair/face is removed and each garment becomes a piece.
   Models are fetched once with progress and kept in Cache Storage.

   in : { id, type: 'segment', blob, model: 'u2netp' | 'u2net' }
   out: { id, type: 'progress', label, loaded, total }
        { id, type: 'done', mode: 'flat' | 'person', pieces: [{ cutout, preview, width, height,
          colour, category, label }], ms, model }
        { id, type: 'error', message }
═══════════════════════════════════════════════════ */
import * as ort from 'onnxruntime-web/wasm';
import wasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import {
  INPUT_SIZE, PARSE_SIZE, preprocess, postprocess, preprocessParse, parseGarments, alphaBounds, coverage, dominantColour,
} from './pipeline.js';

ort.env.wasm.wasmPaths = { wasm: wasmUrl };

const MODELS = {
  u2netp: { url: '/models/u2netp.onnx', bytes: 4574861 },
  // Apache-2.0 mirror of rembg's u2net.onnx (same 175,997,641 bytes); CORS-enabled
  u2net: { url: 'https://huggingface.co/BritishWerewolf/U-2-Net/resolve/main/onnx/model.onnx', bytes: 175997641 },
  // SegFormer-B2 fine-tuned for clothes (mattmdjaga/segformer_b2_clothes), quantized ONNX by Xenova
  parser: { url: 'https://huggingface.co/Xenova/segformer_b2_clothes/resolve/main/onnx/model_quantized.onnx', bytes: 28837959 },
};
const MAX_SIDE_IN = 1600;   // photos are downscaled to this before processing
const MAX_SIDE_OUT = 1024;  // stored cut-outs are capped at this
const MAX_PIECES = 4;       // garments offered from one photo of a person
const LABELS = { u2netp: 'cut-out', u2net: 'HD cut-out', parser: 'clothing' };

const sessions = {};

async function loadModelBytes(name, onProgress) {
  const { url, bytes } = MODELS[name];
  const cache = await caches.open('wardrobe-models-v1').catch(() => null);
  const hit = cache && await cache.match(url);
  if (hit) return new Uint8Array(await hit.arrayBuffer());

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't download the ${name} model (${res.status}).`);
  const total = Number(res.headers.get('content-length')) || bytes;
  const reader = res.body.getReader();
  const buf = new Uint8Array(total);
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf.set(value, loaded); loaded += value.length;
    onProgress(loaded, total);
  }
  const data = loaded === total ? buf : buf.slice(0, loaded);
  if (cache) await cache.put(url, new Response(data, { headers: { 'content-type': 'application/octet-stream' } })).catch(() => {});
  return data;
}

async function getSession(name, onProgress) {
  if (!sessions[name]) {
    sessions[name] = (async () => {
      const bytes = await loadModelBytes(name, onProgress);
      return ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    })();
    sessions[name].catch(() => { delete sessions[name]; });
  }
  return sessions[name];
}

const toBlob = async (c) => {
  const b = await c.convertToBlob({ type: 'image/webp', quality: 0.92 });
  return b.type === 'image/webp' ? b : c.convertToBlob({ type: 'image/png' });
};

// photo pixels + one alpha mask → cropped cut-out, full-frame preview, colour
async function makePiece(img, alpha, w, h) {
  const box = alphaBounds(alpha, w, h);
  if (!box || coverage(alpha) < 0.004) return null;
  const data = new Uint8ClampedArray(img.data);
  for (let i = 0; i < alpha.length; i++) data[i * 4 + 3] = alpha[i];
  const full = new OffscreenCanvas(w, h);
  full.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0);
  const s = Math.min(1, MAX_SIDE_OUT / Math.max(box.w, box.h));
  const ow = Math.round(box.w * s), oh = Math.round(box.h * s);
  const crop = new OffscreenCanvas(ow, oh);
  crop.getContext('2d').drawImage(full, box.x, box.y, box.w, box.h, 0, 0, ow, oh);
  return {
    cutout: await toBlob(crop),
    preview: await toBlob(full),           // photo framing, for the before/after comparison
    width: ow, height: oh,
    colour: dominantColour(data, alpha),
  };
}

async function segment({ id, blob, model }) {
  const progress = (name) => (loaded, total) => postMessage({ id, type: 'progress', label: LABELS[name], loaded, total });
  const session = await getSession(model, progress(model));
  const parser = await getSession('parser', progress('parser'));
  const t0 = performance.now();

  // decode (respects EXIF rotation) and downscale large phone photos
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  const k = Math.min(1, MAX_SIDE_IN / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * k), h = Math.round(bitmap.height * k);
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const img = ctx.getImageData(0, 0, w, h);

  // 1 · subject vs background
  const out = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', preprocess(img.data, w, h), [1, 3, INPUT_SIZE, INPUT_SIZE]) });
  const saliency = postprocess(out[session.outputNames[0]].data, w, h);

  // 2 · is someone wearing it? → keep only the clothes, one piece per garment
  const parsed = await parser.run({ [parser.inputNames[0]]: new ort.Tensor('float32', preprocessParse(img.data, w, h), [1, 3, PARSE_SIZE, PARSE_SIZE]) });
  const garments = parseGarments(parsed[parser.outputNames[0]].data, saliency, w, h);

  let pieces = [];
  let mode = 'flat';
  if (garments.person) {
    mode = 'person';
    for (const g of garments.pieces.slice(0, MAX_PIECES)) {
      const p = await makePiece(img, g.alpha, w, h);
      if (p) pieces.push({ ...p, category: g.category, label: g.label });
    }
  } else if (coverage(saliency) >= 0.01) {
    const p = await makePiece(img, saliency, w, h);
    if (p) pieces = [{ ...p, category: null, label: null }];
  }
  if (!pieces.length) throw new Error(mode === 'person' ? 'NO_CLOTHES' : 'NOTHING_FOUND');

  return { mode, pieces, ms: Math.round(performance.now() - t0), model };
}

self.onmessage = async (e) => {
  const msg = e.data;
  if (msg.type !== 'segment') return;
  try {
    postMessage({ id: msg.id, type: 'done', ...(await segment(msg)) });
  } catch (err) {
    postMessage({ id: msg.id, type: 'error', message: err?.message || String(err) });
  }
};
