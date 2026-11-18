// Pure colour maths for the face reading — no DOM, no camera — so it can be tested on its own.
//
// measureFace(rgba, width, height, landmarks) samples skin (cheeks + forehead), hair (just above
// the hairline), iris and the whites of the eyes, using MediaPipe Face Landmarker's 478 points.
// The whites of the eyes are the white reference: whatever colour cast they show is mostly the
// light, so it is (partly) removed from the other readings. Everything is done in CIELAB.
import { SEASONS } from './seasons.js';

/* ── colour conversions (sRGB D65 ↔ CIELAB) ─────────────────────────── */
const lin = v => { v /= 255; return v > 0.04045 ? ((v + 0.055) / 1.055) ** 2.4 : v / 12.92; };
const f = t => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);

export function rgbToLab(r, g, b) {
  const R = lin(r), G = lin(g), B = lin(b);
  const x = f((0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047);
  const y = f(0.2126 * R + 0.7152 * G + 0.0722 * B);
  const z = f((0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function labToHex([L, a, b]) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const inv = t => (t ** 3 > 216 / 24389 ? t ** 3 : (116 * t - 16) / (24389 / 27));
  const X = inv(fx) * 0.95047, Y = inv(fy), Z = inv(fz) * 1.08883;
  const enc = v => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, '0');
  };
  return '#' + enc(3.2406 * X - 1.5372 * Y - 0.4986 * Z) + enc(-0.9689 * X + 1.8758 * Y + 0.0415 * Z) + enc(0.0557 * X - 0.2040 * Y + 1.0570 * Z);
}

export const chromaOf = ([, a, b]) => Math.hypot(a, b);
export const hueOf = ([, a, b]) => (Math.atan2(b, a) * 180) / Math.PI;
const clamp = (v, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));

/* ── landmark indices (MediaPipe face mesh) ─────────────────────────── */
const LM = {
  sideA: 234, sideB: 454, top: 10, chin: 152, nose: 1,
  cheekA: [101, 118], cheekB: [330, 347], forehead: [151, 108, 337],  // inner upper cheeks: clear of beards, hairline and ear shadow
  irisA: [468, 469, 470, 471, 472], irisB: [473, 474, 475, 476, 477],
  eyeA: [33, 133], eyeB: [263, 362],                          // outer, inner corner
};

/**
 * Pixels inside a circle → trimmed-mean Lab. Drops the lightest and darkest `trim` share
 * (glints, lashes, stray hairs). `keep: 'light'` keeps only the lighter half (whites of the eyes).
 */
function samplePatch(rgba, W, H, cx, cy, r, { trim = 0.15, keep } = {}) {
  const labs = [];
  let clipped = 0;
  const r2 = r * r, x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(W - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(H - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > r2) continue;
      const i = (y * W + x) * 4, R = rgba[i], G = rgba[i + 1], B = rgba[i + 2];
      if (Math.min(R, G, B) >= 238) clipped++;          // near-white = blown highlight (fair skin's red channel alone can hit 255)
      labs.push(rgbToLab(R, G, B));
    }
  }
  if (labs.length < 4) return null;
  labs.sort((p, q) => p[0] - q[0]);
  const lo = keep === 'light' ? Math.floor(labs.length * 0.5) : Math.floor(labs.length * trim);
  const hi = Math.ceil(labs.length * (1 - trim));
  const sel = labs.slice(lo, Math.max(lo + 1, hi));
  const mean = [0, 1, 2].map(k => sel.reduce((s, p) => s + p[k], 0) / sel.length);
  return { lab: mean, n: labs.length, clipped: clipped / labs.length };
}

const avgLab = (list) => {
  const ok = list.filter(Boolean);
  if (!ok.length) return null;
  const w = ok.reduce((s, p) => s + p.n, 0);
  return [0, 1, 2].map(k => ok.reduce((s, p) => s + p.lab[k] * p.n, 0) / w);
};
const dE = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

// whites of the eyes under neutral light: very slightly warm, not pure white
const SCLERA_AB = [1.5, 6];
const MAX_CAST = 9;            // never "correct" more than this (a, b units) — beyond it, warn instead

/**
 * One video frame → readings + any problem with the frame.
 * `pts` are MediaPipe normalised landmarks ({x, y} in 0–1).
 * Returns { issue, skin, hair, eyes, sclera, cast, scores, marks }.
 */
export function measureFace(rgba, W, H, pts) {
  if (!pts || pts.length < 478) return { issue: 'noface' };
  const P = i => [pts[i].x * W, pts[i].y * H];
  const [ax, ay] = P(LM.sideA), [bx, by] = P(LM.sideB);
  const faceW = Math.hypot(bx - ax, by - ay);
  const [tx, ty] = P(LM.top), [chx, chy] = P(LM.chin);
  const faceH = Math.hypot(chx - tx, chy - ty);
  const midX = (ax + bx) / 2, midY = (ty + chy) / 2;

  // framing checks first — no point measuring a face at the edge or turned away
  if (faceW < W * 0.2) return { issue: 'far' };
  if (faceW > W * 0.8) return { issue: 'close' };
  if (Math.abs(midX / W - 0.5) > 0.2 || Math.abs(midY / H - 0.5) > 0.25) return { issue: 'centre' };
  const [nx] = P(LM.nose);
  if (Math.abs(nx - midX) / faceW > 0.09) return { issue: 'turn' };

  const marks = [];
  const patch = (i, r, kind, opt) => { const [x, y] = P(i); marks.push({ x, y, r, kind }); return samplePatch(rgba, W, H, x, y, r, opt); };
  const at = (x, y, r, kind, opt) => { marks.push({ x, y, r, kind }); return samplePatch(rgba, W, H, x, y, r, opt); };

  // skin
  const rs = faceW * 0.045;
  const cheekA = LM.cheekA.map(i => patch(i, rs, 'skin'));
  const cheekB = LM.cheekB.map(i => patch(i, rs, 'skin'));
  const forehead = LM.forehead.map(i => patch(i, rs, 'skin'));
  const skinLab = avgLab([...cheekA, ...cheekB, ...forehead]);
  if (!skinLab) return { issue: 'noface' };
  const sideA = avgLab(cheekA), sideB = avgLab(cheekB);
  const clipped = [...cheekA, ...cheekB, ...forehead].filter(Boolean).reduce((s, p) => s + p.clipped, 0) / 7;

  // irises: ring between pupil and limbal edge
  const iris = (ids) => {
    const [cx, cy] = P(ids[0]);
    const ir = ids.slice(1).reduce((s, i) => s + Math.hypot(P(i)[0] - cx, P(i)[1] - cy), 0) / 4;
    const rr = Math.max(1.2, ir * 0.3);
    return { cx, cy, ir, ring: [at(cx + ir * 0.5, cy, rr, 'eye', { trim: 0.2 }), at(cx - ir * 0.5, cy, rr, 'eye', { trim: 0.2 })] };
  };
  const eyeA = iris(LM.irisA), eyeB = iris(LM.irisB);
  const eyeLab = avgLab([...eyeA.ring, ...eyeB.ring]);

  // whites of the eyes: halfway from the iris edge to each corner, lighter half of the pixels
  const sclera = [];
  for (const [e, corners] of [[eyeA, LM.eyeA], [eyeB, LM.eyeB]]) {
    for (const ci of corners) {
      const [qx, qy] = P(ci), d = Math.hypot(qx - e.cx, qy - e.cy);
      if (d < e.ir * 1.4) continue;                         // eye too closed to see any white
      const t = (e.ir + (d - e.ir) * 0.45) / d;
      sclera.push(at(e.cx + (qx - e.cx) * t, e.cy + (qy - e.cy) * t, Math.max(1.5, e.ir * 0.28), 'white', { keep: 'light', trim: 0.05 }));
    }
  }
  const scleraLab = avgLab(sclera);
  const scleraOk = scleraLab && scleraLab[0] > 45 && chromaOf(scleraLab) < 22;

  // hair: walk up from the top of the face mesh until the colour stops being skin — that's the hairline.
  // Three columns (centre and either side of the parting); nothing found within reach → no hair reading.
  const ux = (tx - chx) / faceH, uy = (ty - chy) / faceH;
  const rh = faceW * 0.045;
  // Hair = clearly darker than the forehead (upper-forehead shading and shine don't qualify). Platinum
  // hair on fair skin won't — then there's no hair reading and the eyes carry the contrast.
  const brow = avgLab(forehead) || skinLab;
  const isHair = p => p && p.lab[0] < brow[0] - 15 && dE(p.lab, brow) > 20;
  const hairPatches = [-0.15, 0, 0.15].map(s => {
    const spot = k => {
      const x = tx + ux * faceH * k + (-uy) * faceW * s, y = ty + uy * faceH * k + ux * faceW * s;
      return y - rh < 0 ? null : { x, y, p: samplePatch(rgba, W, H, x, y, rh) };
    };
    for (let k = 0.03; k <= 0.4; k += 0.03) {
      const a = spot(k);
      if (!a) return null;
      if (!isHair(a.p)) continue;
      const b = spot(k + 0.05);                     // one step further, so the patch sits in the hair, not on the hairline
      const hit = b && isHair(b.p) ? b : a;
      marks.push({ x: hit.x, y: hit.y, r: rh, kind: 'hair' });
      return hit.p;
    }
    return null;
  });
  const hairLab = avgLab(hairPatches);

  // light quality checks (`light` is returned for debugging / tuning)
  const light = { sideDiff: sideA && sideB ? Math.abs(sideA[0] - sideB[0]) : 0, clipped, scleraL: scleraLab?.[0] ?? null };
  if (scleraOk ? scleraLab[0] < 52 : skinLab[0] < 22) return { issue: 'dark', marks, light };
  if (clipped > 0.15) return { issue: 'glare', marks, light };
  if (sideA && sideB && Math.abs(sideA[0] - sideB[0]) > 22) return { issue: 'uneven', marks, light };

  // colour cast from the whites of the eyes, clamped; a big cast is reported, not silently "fixed"
  let cast = [0, 0];
  if (scleraOk) cast = [clamp(scleraLab[1] - SCLERA_AB[0], -MAX_CAST, MAX_CAST), clamp(scleraLab[2] - SCLERA_AB[1], -MAX_CAST, MAX_CAST)];
  const tooTinted = scleraOk && Math.hypot(scleraLab[1] - SCLERA_AB[0], scleraLab[2] - SCLERA_AB[1]) > 16;
  const fix = lab => lab && [lab[0], lab[1] - cast[0], lab[2] - cast[1]];

  const skin = fix(skinLab), hair = fix(hairLab), eyes = fix(eyeLab);
  return {
    issue: tooTinted ? 'tint' : null,
    skin, hair, eyes, sclera: scleraOk ? scleraLab : null, cast, marks, light,
    scores: scoreFeatures({ skin, hair, eyes }),
  };
}

/**
 * Skin/hair/eye Lab → the three season axes, each clamped to [-1, 1].
 * Thresholds were set on synthetic and real portrait readings (skin hue ~40–80°, L ~30–85); an estimate.
 */
export function scoreFeatures({ skin, hair, eyes }) {
  const temp = clamp((hueOf(skin) - 58) / 13);     // measured skin hues run ~40–80°; neutral ≈ 54–62°

  // overall lightness of the person: skin counts most, then hair, then eyes
  const parts = [[skin[0], 0.55], [hair?.[0], 0.25], [eyes?.[0], 0.2]].filter(([v]) => v != null);
  const wsum = parts.reduce((s, [, w]) => s + w, 0);
  const L = parts.reduce((s, [v, w]) => s + v * w, 0) / wsum;
  const value = clamp((L - 48) / 18);

  // clarity: the contrast between skin and the darkest feature (hair or eyes).
  // Skin and eye chroma aren't used: skin chroma rises with depth (repeats the value axis) and
  // ordinary brown eyes read as "vivid" in Lab.
  const darkest = Math.min(hair?.[0] ?? Infinity, eyes?.[0] ?? Infinity);
  // The bar scales with skin lightness: deeper skin has less room for contrast against dark hair,
  // and a fixed bar would wrongly call every deep complexion "soft".
  const bar = 0.55 * skin[0] + 6;
  const contrast = Number.isFinite(darkest) ? skin[0] - darkest : bar;
  const chroma = clamp((contrast - bar) / 20);

  return { temp, value, chroma };
}

// undertone matters most in draping, so it gets a little more weight
const W_AXIS = { temp: 1.25, value: 1, chroma: 1 };

/** Season ranking for a set of scores, nearest first, with a 0–1 match strength. */
export function rankSeasons(scores) {
  return SEASONS
    .map(s => ({ season: s, d: Math.sqrt(Object.keys(W_AXIS).reduce((acc, k) => acc + W_AXIS[k] * (scores[k] - s.at[k]) ** 2, 0)) }))
    .sort((p, q) => p.d - q.d)
    .map(r => ({ ...r, match: Math.max(0, 1 - r.d / 2) }));
}

/** Plain-language read-out of the scores. */
export function describe({ temp, value, chroma }) {
  const t = temp > 0.3 ? 'Warm (golden)' : temp < -0.3 ? 'Cool (rosy)' : 'Neutral';
  const v = value > 0.35 ? 'Light' : value < -0.35 ? 'Deep' : 'Medium';
  const c = chroma > 0.3 ? 'High contrast' : chroma < -0.3 ? 'Soft contrast' : 'Medium contrast';
  return { undertone: t, depth: v, contrast: c };
}

/** Median of several readings — robust to the odd bad frame. */
export function medianScores(list) {
  const med = k => { const v = list.map(s => s[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
  return { temp: med('temp'), value: med('value'), chroma: med('chroma') };
}
export function spread(list) {
  const sd = k => { const m = list.reduce((s, x) => s + x[k], 0) / list.length; return Math.sqrt(list.reduce((s, x) => s + (x[k] - m) ** 2, 0) / list.length); };
  return Math.max(sd('temp'), sd('value'), sd('chroma'));
}
export const averageLab = (list) => list.length ? [0, 1, 2].map(k => list.reduce((s, p) => s + p[k], 0) / list.length) : null;
