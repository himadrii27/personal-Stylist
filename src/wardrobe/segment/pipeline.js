/* ════════════════════════════════════════════════
   U2-Net background removal — pure pixel maths, no DOM.
   Shared by the browser worker and the Node evaluation harness (eval/),
   so the measured accuracy is exactly what users get.

   preprocess  : RGBA image → 1×3×320×320 float tensor (rembg's normalisation)
   postprocess : model saliency map → full-size alpha mask
                 (min-max normalise → bilinear upscale → keep the garment's
                  connected regions, drop specks → 1px feather)
═══════════════════════════════════════════════════ */

export const INPUT_SIZE = 320;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

/** Bilinear resample of a single-channel float image. */
export function resizeChannel(src, sw, sh, dw, dh) {
  const out = new Float32Array(dw * dh);
  const sx = sw / dw, sy = sh / dh;
  for (let y = 0; y < dh; y++) {
    const fy = Math.min(sh - 1, Math.max(0, (y + 0.5) * sy - 0.5));
    const y0 = Math.floor(fy), y1 = Math.min(sh - 1, y0 + 1), wy = fy - y0;
    for (let x = 0; x < dw; x++) {
      const fx = Math.min(sw - 1, Math.max(0, (x + 0.5) * sx - 0.5));
      const x0 = Math.floor(fx), x1 = Math.min(sw - 1, x0 + 1), wx = fx - x0;
      const a = src[y0 * sw + x0], b = src[y0 * sw + x1], c = src[y1 * sw + x0], d = src[y1 * sw + x1];
      out[y * dw + x] = (a * (1 - wx) + b * wx) * (1 - wy) + (c * (1 - wx) + d * wx) * wy;
    }
  }
  return out;
}

/**
 * RGBA (Uint8ClampedArray / Uint8Array, length w*h*4) → Float32Array [1,3,320,320].
 * Matches rembg: resize to 320², divide by the image max, then ImageNet mean/std.
 */
export function preprocess(rgba, w, h) {
  const S = INPUT_SIZE;
  const planes = [0, 1, 2].map(ch => {
    const c = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) c[i] = rgba[i * 4 + ch];
    return resizeChannel(c, w, h, S, S);
  });
  let max = 1e-6;
  for (const p of planes) for (let i = 0; i < p.length; i++) if (p[i] > max) max = p[i];
  const tensor = new Float32Array(3 * S * S);
  for (let ch = 0; ch < 3; ch++) {
    const p = planes[ch], off = ch * S * S;
    for (let i = 0; i < S * S; i++) tensor[off + i] = (p[i] / max - MEAN[ch]) / STD[ch];
  }
  return tensor;
}

/**
 * Keep the garment: every 4-connected region above `thr` that is at least `minShare`
 * of the largest one (so detached straps/sleeves survive, background specks don't).
 * Returns a Uint8Array keep-mask.
 */
function garmentRegions(mask, w, h, thr, minShare = 0.15) {
  const label = new Int32Array(w * h);
  const stack = new Int32Array(w * h);
  const sizes = [0];
  let next = 0;
  for (let i = 0; i < w * h; i++) {
    if (mask[i] < thr || label[i]) continue;
    next++;
    let size = 0, sp = 0;
    stack[sp++] = i; label[i] = next;
    while (sp) {
      const p = stack[--sp]; size++;
      const x = p % w, y = (p - x) / w;
      if (x > 0     && !label[p - 1] && mask[p - 1] >= thr) { label[p - 1] = next; stack[sp++] = p - 1; }
      if (x < w - 1 && !label[p + 1] && mask[p + 1] >= thr) { label[p + 1] = next; stack[sp++] = p + 1; }
      if (y > 0     && !label[p - w] && mask[p - w] >= thr) { label[p - w] = next; stack[sp++] = p - w; }
      if (y < h - 1 && !label[p + w] && mask[p + w] >= thr) { label[p + w] = next; stack[sp++] = p + w; }
    }
    sizes.push(size);
  }
  const keep = new Uint8Array(w * h);
  if (!next) return keep;
  const minSize = Math.max(...sizes) * minShare;
  for (let i = 0; i < w * h; i++) keep[i] = label[i] && sizes[label[i]] >= minSize ? 1 : 0;
  return keep;
}

/**
 * Model output (Float32Array of length 320*320, the `d1` saliency map) →
 * Uint8Array alpha of length w*h.
 * `options.cleanup` (default true) applies the largest-component + feather steps.
 */
export function postprocess(pred, w, h, { cleanup = true } = {}) {
  const S = INPUT_SIZE;
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < pred.length; i++) { if (pred[i] < lo) lo = pred[i]; if (pred[i] > hi) hi = pred[i]; }
  const span = hi - lo || 1;
  const norm = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) norm[i] = (pred[i] - lo) / span;

  // work at ≤512px for the clean-up, then scale to full size
  const scale = Math.min(1, 512 / Math.max(w, h));
  const mw = Math.max(1, Math.round(w * scale)), mh = Math.max(1, Math.round(h * scale));
  let m = resizeChannel(norm, S, S, mw, mh);

  if (cleanup) {
    const keep = garmentRegions(m, mw, mh, 0.5);
    // dilate the keep-mask by 2px so soft edges of the garment survive
    const grown = new Uint8Array(keep);
    for (let pass = 0; pass < 2; pass++) {
      const src = pass ? new Uint8Array(grown) : keep;
      for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
        const i = y * mw + x;
        if (src[i]) continue;
        if ((x > 0 && src[i - 1]) || (x < mw - 1 && src[i + 1]) || (y > 0 && src[i - mw]) || (y < mh - 1 && src[i + mw])) grown[i] = 1;
      }
    }
    for (let i = 0; i < m.length; i++) if (!grown[i]) m[i] = 0;
    // 3×3 box feather
    const f = new Float32Array(m.length);
    for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
      let s = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < mw && yy < mh) { s += m[yy * mw + xx]; n++; }
      }
      f[y * mw + x] = s / n;
    }
    m = f;
  }

  const full = mw === w && mh === h ? m : resizeChannel(m, mw, mh, w, h);
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = Math.max(0, Math.min(255, Math.round(full[i] * 255)));
  return alpha;
}

/** Tight bounding box of alpha > `thr`, padded. Returns null if nothing was found. */
export function alphaBounds(alpha, w, h, thr = 24, pad = 0.04) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (alpha[y * w + x] > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  const p = Math.round(Math.max(x1 - x0, y1 - y0) * pad);
  x0 = Math.max(0, x0 - p); y0 = Math.max(0, y0 - p); x1 = Math.min(w - 1, x1 + p); y1 = Math.min(h - 1, y1 + p);
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Share of the frame the garment covers (0–1); used to warn when nothing was detected. */
export function coverage(alpha, thr = 128) {
  let n = 0;
  for (let i = 0; i < alpha.length; i++) if (alpha[i] >= thr) n++;
  return n / alpha.length;
}

/** Mean colour of solid garment pixels → { hex, name }. */
const NAMED = [
  ['Black', 20, 20, 20], ['Charcoal', 64, 64, 66], ['Grey', 128, 128, 128], ['White', 240, 240, 236], ['Ivory', 236, 228, 210],
  ['Beige', 205, 185, 150], ['Camel', 190, 145, 95], ['Brown', 110, 70, 45], ['Rust', 170, 80, 45], ['Red', 190, 40, 40],
  ['Burgundy', 110, 25, 40], ['Pink', 230, 160, 175], ['Orange', 230, 120, 40], ['Mustard', 205, 160, 50], ['Yellow', 235, 210, 70],
  ['Coral', 235, 125, 110], ['Olive', 110, 110, 60], ['Green', 50, 130, 70], ['Teal', 30, 120, 120], ['Sky blue', 140, 190, 230], ['Blue', 50, 90, 180],
  ['Navy', 30, 40, 75], ['Purple', 110, 60, 140], ['Lavender', 180, 160, 210], ['Denim', 85, 110, 145],
];
// sRGB → CIELAB (D65), so "nearest colour name" matches how people see colour
function toLab(r, g, b) {
  const lin = v => { v /= 255; return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92; };
  const R = lin(r), G = lin(g), B = lin(b);
  const f = t => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function dominantColour(rgba, alpha) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < alpha.length; i += 3) {             // sample every 3rd pixel
    if (alpha[i] < 200) continue;
    r += rgba[i * 4]; g += rgba[i * 4 + 1]; b += rgba[i * 4 + 2]; n++;
  }
  if (!n) return { hex: '#999999', name: 'Grey' };
  r /= n; g /= n; b /= n;
  const lab = toLab(r, g, b);
  let best = NAMED[0], bd = Infinity;
  for (const c of NAMED) {
    const q = toLab(c[1], c[2], c[3]);
    const d = (lab[0] - q[0]) ** 2 + (lab[1] - q[1]) ** 2 + (lab[2] - q[2]) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  const hex = '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  return { hex, name: best[0] };
}

/** Segmentation quality metrics against a ground-truth mask (both Uint8Array 0–255, same size). */
export function scoreMasks(pred, gt, thr = 128) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (let i = 0; i < pred.length; i++) {
    const p = pred[i] >= thr, g = gt[i] >= thr;
    if (p && g) tp++; else if (p) fp++; else if (g) fn++; else tn++;
  }
  const iou = tp / Math.max(1, tp + fp + fn);
  const pixelAcc = (tp + tn) / pred.length;
  const precision = tp / Math.max(1, tp + fp), recall = tp / Math.max(1, tp + fn);
  const f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall);
  return { iou, pixelAcc, precision, recall, f1 };
}

/* ════════════════════════════════════════════════
   Removing the person: SegFormer-B2 "clothes" human parsing
   (Xenova/segformer_b2_clothes, quantized ONNX, 512² in → 18×128² logits out).
   If the photo shows a person, each garment class becomes its own piece:
   class mask (what is clothing) × U2-Net alpha (clean outline against the background).
═══════════════════════════════════════════════════ */

export const PARSE_SIZE = 512;
export const PARSE_LABELS = ['Background', 'Hat', 'Hair', 'Sunglasses', 'Upper-clothes', 'Skirt', 'Pants', 'Dress', 'Belt',
  'Left-shoe', 'Right-shoe', 'Face', 'Left-leg', 'Right-leg', 'Left-arm', 'Right-arm', 'Bag', 'Scarf'];
const PERSON_CLASSES = [2, 11, 12, 13, 14, 15];          // hair, face, legs, arms
const FACE = 11, LIMBS = [12, 13, 14, 15];
export const PIECE_GROUPS = [
  { category: 'top',       label: 'Top',      classes: [4] },
  { category: 'dress',     label: 'Dress',    classes: [7] },
  { category: 'bottom',    label: 'Bottoms',  classes: [6] },   // trousers, jeans and shorts
  { category: 'bottom',    label: 'Skirt',    classes: [5] },
  { category: 'shoes',     label: 'Shoes',    classes: [9, 10] },
  { category: 'accessory', label: 'Bag',      classes: [16] },
  { category: 'accessory', label: 'Scarf',    classes: [17] },
  { category: 'accessory', label: 'Hat',      classes: [1] },
  { category: 'accessory', label: 'Belt',     classes: [8] },
];

/** RGBA → Float32Array [1,3,512,512] (SegFormer: rescale 1/255, ImageNet mean/std). */
export function preprocessParse(rgba, w, h) {
  const S = PARSE_SIZE;
  const tensor = new Float32Array(3 * S * S);
  for (let ch = 0; ch < 3; ch++) {
    const c = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) c[i] = rgba[i * 4 + ch];
    const r = resizeChannel(c, w, h, S, S), off = ch * S * S;
    for (let i = 0; i < S * S; i++) tensor[off + i] = (r[i] / 255 - MEAN[ch]) / STD[ch];
  }
  return tensor;
}

/** SegFormer logits (18×128×128) → per-pixel class map at (mw, mh). */
export function labelMap(logits, mw, mh, classes = 18, lw = 128, lh = 128) {
  const best = new Float32Array(mw * mh).fill(-Infinity);
  const label = new Uint8Array(mw * mh);
  for (let k = 0; k < classes; k++) {
    const up = resizeChannel(logits.subarray(k * lw * lh, (k + 1) * lw * lh), lw, lh, mw, mh);
    for (let i = 0; i < up.length; i++) if (up[i] > best[i]) { best[i] = up[i]; label[i] = k; }
  }
  return label;
}

function featherBox(m, w, h, r = 1) {
  const f = new Float32Array(m.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0, n = 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h) { s += m[yy * w + xx]; n++; }
    }
    f[y * w + x] = s / n;
  }
  return f;
}

/**
 * Split a photo of a person into garment pieces.
 * logits: SegFormer output; saliency: U2-Net alpha (Uint8Array, w*h) for the same photo.
 * Returns { person: boolean, personShare, pieces: [{ category, label, alpha: Uint8Array(w*h), share }] }.
 */
export function parseGarments(logits, saliency, w, h, { minFaceShare = 0.003, minLimbShare = 0.003, minPieceShare = 0.004 } = {}) {
  const scale = Math.min(1, PARSE_SIZE / Math.max(w, h));
  const mw = Math.max(1, Math.round(w * scale)), mh = Math.max(1, Math.round(h * scale));
  const labels = labelMap(logits, mw, mh);
  const N = mw * mh;
  // a person = a face AND some arms/legs (a printed face on a graphic tee has no limbs)
  let person = 0, face = 0, limbs = 0;
  for (let i = 0; i < N; i++) {
    const l = labels[i];
    if (PERSON_CLASSES.includes(l)) person++;
    if (l === FACE) face++; else if (LIMBS.includes(l)) limbs++;
  }
  const personShare = person / N;
  if (face / N < minFaceShare || limbs / N < minLimbShare) return { person: false, personShare, pieces: [] };

  const sal = new Float32Array(w * h);
  for (let i = 0; i < sal.length; i++) sal[i] = saliency[i] / 255;
  const salSmall = resizeChannel(sal, w, h, mw, mh);

  const pieces = [];
  for (const g of PIECE_GROUPS) {
    let m = new Float32Array(N), area = 0;
    for (let i = 0; i < N; i++) if (g.classes.includes(labels[i])) { m[i] = 1; area++; }
    if (area / N < minPieceShare) continue;
    const keep = garmentRegions(m, mw, mh, 0.5);          // drop stray specks of this class
    for (let i = 0; i < N; i++) m[i] *= keep[i];
    m = featherBox(m, mw, mh, 1);
    // outline from U2-Net where it agrees with the parser; parser alone if U2-Net missed it
    let overlap = 0, mass = 0;
    for (let i = 0; i < N; i++) { mass += m[i]; overlap += m[i] * salSmall[i]; }
    const useSaliency = overlap / Math.max(1, mass) > 0.5;
    const full = resizeChannel(m, mw, mh, w, h);
    const alpha = new Uint8Array(w * h);
    for (let i = 0; i < alpha.length; i++) {
      const v = useSaliency ? Math.min(1, full[i] * 1.15) * sal[i] : full[i];
      alpha[i] = Math.max(0, Math.min(255, Math.round(v * 255)));
    }
    pieces.push({ category: g.category, label: g.label, alpha, share: area / N });
  }
  pieces.sort((a, b) => b.share - a.share);
  return { person: true, personShare, pieces };
}
