// The wardrobe's styling brain — pure functions, no DOM, so it runs (and is tested) in Node.
//
// Pieces carry a category, one colour, and two tags (warmth, dressiness). From those we score any
// combination: do the colours sit well together (CIELAB hue/lightness), does it suit the weather,
// is it consistently casual/smart/dressy, and does it flatter the user's colour season near the face.
// Every score comes with plain-English reasons, so the UI can say *why* a look works.
import { rgbToLab, chromaOf } from '../colour/analyse.js';

/* ── colour basics ─────────────────────────────────────────── */
const labCache = new Map();
export function hexToLab(hex) {
  const key = String(hex || '#999999').toLowerCase();
  if (!labCache.has(key)) {
    const m = /^#?([0-9a-f]{6})$/i.exec(key);
    const n = m ? parseInt(m[1], 16) : 0x999999;
    labCache.set(key, rgbToLab((n >> 16) & 255, (n >> 8) & 255, n & 255));
  }
  return labCache.get(key);
}
export const deltaE = (h1, h2) => { const a = hexToLab(h1), b = hexToLab(h2); return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };
const hueDeg = ([, a, b]) => ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
const hueGap = (x, y) => { const d = Math.abs(x - y) % 360; return d > 180 ? 360 - d : d; };

/** Neutrals go with everything: whites, greys, blacks, navy/denim, browns, beige, camel. */
export function isNeutral(hex) {
  const lab = hexToLab(hex);
  const [L] = lab, C = chromaOf(lab), h = hueDeg(lab);
  if (C < 16) return true;                                  // white, grey, black, stone
  if (L < 38 && C < 34) return true;                        // navy, denim, chocolate, dark olive
  if (h >= 40 && h <= 95 && C < 38 && L > 38) return true;  // beige, camel, tan, khaki
  return false;
}

/* ── colour season fit ─────────────────────────────────────── */
export const FIT = {
  best:    { label: 'Suits you',      tip: 'Wear it near your face.' },
  neutral: { label: 'Your neutral',   tip: 'A safe base for any look.' },
  outside: { label: 'Outside palette', tip: 'Fine below the waist or with a palette colour on top.' },
  avoid:   { label: 'Not your colour', tip: 'Keep it away from your face — on bottoms, shoes or bags.' },
};
/** How a colour sits with a season: 'best' | 'neutral' | 'avoid' | 'outside'. */
export function colourFit(hex, season) {
  if (!season) return null;
  const near = (list) => Math.min(...list.map(c => deltaE(hex, c.hex)));
  const best = near(season.best), neutral = near(season.neutrals), avoid = near(season.avoid);
  if (avoid < 16 && avoid < best && avoid < neutral) return 'avoid';
  if (Math.min(best, neutral) < 24) return best <= neutral ? 'best' : 'neutral';
  return 'outside';
}

export function colourReport(items, season) {
  const groups = { best: [], neutral: [], outside: [], avoid: [] };
  if (!season) return null;
  items.forEach(it => groups[colourFit(it.colour?.hex, season)].push(it));
  const n = items.length || 1;
  const share = Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length / n]));
  return { groups, share, suits: groups.best.length + groups.neutral.length, total: items.length };
}

/* ── outfit scoring ────────────────────────────────────────── */
const LEVEL = { light: 0, mid: 1, warm: 2, casual: 0, smart: 1, dressy: 2 };
export const WEATHERS = [
  { id: 'hot',   label: 'Hot' },
  { id: 'mild',  label: 'Mild' },
  { id: 'cold',  label: 'Cold' },
  { id: 'rainy', label: 'Rainy' },
];
const piecesOf = (slots) => ['outer', 'top', 'bottom', 'shoes', 'accessory'].map(k => slots[k]).filter(Boolean);

/** Colour harmony of a set of pieces → { score, reasons, warnings }. */
export function harmony(pieces) {
  const reasons = [], warnings = [];
  let score = 0;
  const colours = pieces.filter(p => p.category !== 'accessory').map(p => p.colour?.hex).filter(Boolean);
  const bold = colours.filter(h => !isNeutral(h));
  if (!bold.length) { score += 0.5; reasons.push('Easy, all-neutral palette'); }
  if (bold.length === 1) { score += 0.8; reasons.push('One colour, grounded by neutrals'); }
  if (bold.length > 2) { score -= 1.2 * (bold.length - 2); warnings.push('Too many colours competing'); }
  for (let i = 0; i < bold.length; i++) {
    for (let j = i + 1; j < bold.length; j++) {
      const a = hexToLab(bold[i]), b = hexToLab(bold[j]);
      const d = hueGap(hueDeg(a), hueDeg(b));
      const vivid = chromaOf(a) > 40 && chromaOf(b) > 40;
      if (d < 30) { score += 0.8; reasons.push('Tonal colours that flow together'); }
      else if (d >= 150) { score += 0.7; reasons.push('Opposite colours that make each other pop'); }
      else if (d < 80 && vivid) { score -= 1.2; warnings.push('Two bright colours that clash'); }
      else score -= 0.2;
    }
  }
  const Ls = colours.map(h => hexToLab(h)[0]);
  if (Ls.length >= 2 && Math.max(...Ls) - Math.min(...Ls) >= 30) { score += 0.4; reasons.push('Light-and-dark contrast keeps it sharp'); }
  return { score, reasons, warnings };
}

/**
 * Score one outfit.
 * slots: { outer, top, bottom, shoes, accessory } of item objects (top may be a dress, then bottom is empty).
 * ctx:   { weather?: 'hot'|'mild'|'cold'|'rainy', dressiness?: 'casual'|'smart'|'dressy', season?: season object }
 */
export function scoreOutfit(slots, ctx = {}) {
  const pieces = piecesOf(slots);
  const h = harmony(pieces);
  let score = 1 + h.score;
  const reasons = [], warnings = [];          // today's context (weather, occasion, season) first, then colour harmony
  const body = pieces.filter(p => p.category !== 'shoes' && p.category !== 'accessory');
  const warmthOf = (p) => LEVEL[p.warmth] ?? 1;

  switch (ctx.weather) {
    case 'hot': {
      const heavy = body.filter(p => warmthOf(p) === 2);
      if (heavy.length) { score -= 1.6 * heavy.length; warnings.push(`${heavy[0].name} is too warm for the heat`); }
      else { score += 0.6; reasons.push('Light layers for the heat'); }
      if (slots.outer && warmthOf(slots.outer) > 0) score -= 0.8;
      break;
    }
    case 'cold': {
      const warm = body.some(p => warmthOf(p) === 2);
      if (!warm) { score -= 2.2; warnings.push('Nothing warm enough for the cold'); }
      else { score += 0.8; reasons.push('A warm layer for the cold'); }
      if (slots.top?.category === 'dress' && !slots.outer) score -= 0.6;
      break;
    }
    case 'rainy':
      if (slots.outer) { score += 0.8; reasons.push('A layer for the rain'); }
      else { score -= 0.9; warnings.push('Add a jacket for the rain'); }
      if (slots.shoes && warmthOf(slots.shoes) === 0) { score -= 0.5; warnings.push('Light shoes may get soaked'); }
      break;
    case 'mild':
      if (slots.outer && warmthOf(slots.outer) === 2 && body.filter(p => warmthOf(p) === 2).length > 1) score -= 0.6;
      break;
    default:
  }

  const levels = pieces.filter(p => p.category !== 'accessory').map(p => LEVEL[p.dressiness] ?? 1);
  if (ctx.dressiness) {
    const t = LEVEL[ctx.dressiness];
    const off = levels.map(l => Math.abs(l - t));
    score -= off.reduce((s, d) => s + (d === 2 ? 1.8 : d === 1 ? 0.45 : 0), 0);
    if (off.every(d => d === 0)) { score += 0.5; reasons.push(`Pitched just right for ${ctx.dressiness}`); }
    else if (off.some(d => d === 2)) warnings.push(`Mixes very casual and very dressy pieces`);
  } else if (levels.length && Math.max(...levels) - Math.min(...levels) === 2) {
    score -= 1.2; warnings.push('Mixes very casual and very dressy pieces');
  }

  if (ctx.season) {
    for (const p of [slots.top, slots.outer].filter(Boolean)) {
      const fit = colourFit(p.colour?.hex, ctx.season);
      if (fit === 'best') { score += 0.7; reasons.push(`${p.colour?.name || 'This colour'} near your face suits your ${ctx.season.name} colouring`); }
      else if (fit === 'neutral') score += 0.3;
      else if (fit === 'avoid') { score -= 0.9; warnings.push(`${p.colour?.name || 'This colour'} isn't your colour near the face`); }
    }
  }

  return { score: Math.round(score * 100) / 100, reasons: [...new Set([...reasons, ...h.reasons])], warnings: [...new Set([...warnings, ...h.warnings])] };
}

export function verdict(score) {
  if (score >= 2.2) return { tone: 'great', label: 'Works beautifully' };
  if (score >= 1.2) return { tone: 'good', label: 'Works well' };
  if (score >= 0.4) return { tone: 'ok', label: 'Could work' };
  return { tone: 'poor', label: 'Worth a rethink' };
}

/* ── what you can make ─────────────────────────────────────── */
const by = (items, cat) => items.filter(i => i.category === cat);
const CAP = 24;
const capped = (list, n = CAP) => [...list].sort((a, b) => (b.wears?.length || 0) - (a.wears?.length || 0) || b.createdAt - a.createdAt).slice(0, n);

/** What the wardrobe still needs before outfit ideas are possible. [] when ready. */
export function missingForOutfits(items) {
  const hasDress = by(items, 'dress').length > 0;
  const hasPair = by(items, 'top').length > 0 && by(items, 'bottom').length > 0;
  if (hasDress || hasPair) return [];
  if (!by(items, 'top').length && !by(items, 'bottom').length) return ['top', 'bottom'];
  return by(items, 'top').length ? ['bottom'] : ['top'];
}

/** Every base + shoes + optional layer combination (capped), as slot objects. */
function* combos(items, { fixed = {} } = {}) {
  const pick = (cat, n) => fixed[cat] ? [fixed[cat]] : capped(by(items, cat), n);
  const dresses = fixed.top ? (fixed.top.category === 'dress' ? [fixed.top] : []) : capped(by(items, 'dress'));
  const tops = fixed.top ? (fixed.top.category === 'top' ? [fixed.top] : []) : pick('top');
  const bottoms = fixed.bottom ? [fixed.bottom] : pick('bottom');
  const shoeList = fixed.shoes ? [fixed.shoes] : (by(items, 'shoes').length ? pick('shoes', 12) : [null]);
  const outers = fixed.outer ? [fixed.outer] : [null, ...pick('outerwear', 8)];
  const bases = [];
  if (!fixed.bottom) dresses.forEach(d => bases.push({ top: d, bottom: null }));
  tops.forEach(t => bottoms.forEach(b => bases.push({ top: t, bottom: b })));
  for (const base of bases) for (const shoes of shoeList) for (const outer of outers) yield { outer, ...base, shoes, accessory: fixed.accessory || null };
}

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Best accessory for an outfit, if one improves it. */
function withAccessory(slots, items, ctx) {
  const acc = by(items, 'accessory');
  if (!acc.length || slots.accessory) return slots;
  let best = slots, bestScore = scoreOutfit(slots, ctx).score;
  for (const a of acc) {
    const s = scoreOutfit({ ...slots, accessory: a }, ctx).score;
    if (s > bestScore - 0.05) { best = { ...slots, accessory: a }; bestScore = s; break; }
  }
  return best;
}

/**
 * The n best outfits for today. `seed` (any integer) shuffles near-equal options so "More ideas"
 * gives fresh looks; `fixed` locks pieces into slots (e.g. "style this piece").
 * → [{ slots, score, reasons, warnings }]
 */
export function suggestOutfits(items, ctx = {}, { n = 3, seed = 0, fixed = {} } = {}) {
  if (missingForOutfits(items).length && !fixed.top) return [];
  const jitter = seed ? rng(seed) : () => 0;
  const scored = [];
  for (const slots of combos(items, { fixed })) {
    const s = scoreOutfit(slots, ctx);
    scored.push({ slots, ...s, rank: s.score + jitter() * 0.9 });
  }
  scored.sort((a, b) => b.rank - a.rank);
  const out = [], usedTops = new Set(), usedBottoms = new Map();
  for (const o of scored) {
    if (out.length >= n) break;
    const t = o.slots.top?.id, b = o.slots.bottom?.id;
    if (!fixed.top && usedTops.has(t)) continue;
    if (b && (usedBottoms.get(b) || 0) >= 2) continue;
    usedTops.add(t); if (b) usedBottoms.set(b, (usedBottoms.get(b) || 0) + 1);
    const slots = withAccessory(o.slots, items, ctx);
    out.push({ slots, ...scoreOutfit(slots, ctx) });
  }
  // when everything is locked there is exactly one combination; repeats are fine for "fixed" use
  return out;
}

/** Next/previous piece for a board slot, cycling through what's owned (null = empty slot when allowed). */
export function optionsForSlot(items, slot, slots = {}) {
  if (slot === 'top') return [...by(items, 'top'), ...by(items, 'dress')];
  if (slot === 'bottom') return slots.top?.category === 'dress' ? [] : by(items, 'bottom');
  if (slot === 'outer') return by(items, 'outerwear');
  return by(items, slot === 'shoes' ? 'shoes' : 'accessory');
}

export function outfitName(slots) {
  const main = slots.top?.name, second = slots.top?.category === 'dress' ? (slots.outer?.name || slots.shoes?.name) : slots.bottom?.name;
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  return [cap(main), second?.toLowerCase()].filter(Boolean).join(' & ').slice(0, 60) || 'My outfit';
}

/* ── gap finder ────────────────────────────────────────────── */
const st = (id, name, category, hex, warmth, dressiness, colour, query) => ({ id, name, category, warmth, dressiness, colour: { hex, name: colour }, query, staple: true });
export const STAPLES = [
  st('white-shirt',   'Crisp white shirt',      'top',       '#F4F3EE', 'light', 'smart',  'White',      'white oxford shirt'),
  st('black-tee',     'Black T-shirt',          'top',       '#1E1E1E', 'light', 'casual', 'Black',      'black cotton t-shirt'),
  st('cream-knit',    'Cream knit jumper',      'top',       '#EDE3D0', 'warm',  'casual', 'Cream',      'cream knit sweater'),
  st('striped-tee',   'Navy striped tee',       'top',       '#2F3D5C', 'light', 'casual', 'Navy',       'navy breton striped t-shirt'),
  st('dark-jeans',    'Dark straight jeans',    'bottom',    '#2E3A55', 'mid',   'casual', 'Indigo',     'dark wash straight jeans'),
  st('black-trouser', 'Black tailored trousers', 'bottom',   '#1F1F1F', 'mid',   'smart',  'Black',      'black tailored trousers'),
  st('beige-chino',   'Beige chinos',           'bottom',    '#C8B48F', 'mid',   'smart',  'Beige',      'beige chinos'),
  st('camel-coat',    'Camel coat',             'outerwear', '#B98B5E', 'warm',  'smart',  'Camel',      'camel wool coat'),
  st('denim-jacket',  'Denim jacket',           'outerwear', '#5A7BA6', 'mid',   'casual', 'Denim blue', 'denim jacket'),
  st('navy-blazer',   'Navy blazer',            'outerwear', '#24304F', 'mid',   'smart',  'Navy',       'navy blazer'),
  st('trench',        'Trench coat',            'outerwear', '#C9B28A', 'mid',   'smart',  'Stone',      'trench coat'),
  st('white-sneaker', 'White leather sneakers', 'shoes',     '#F2F2F0', 'mid',   'casual', 'White',      'white leather sneakers'),
  st('black-loafer',  'Black loafers',          'shoes',     '#1A1A1A', 'mid',   'smart',  'Black',      'black leather loafers'),
  st('brown-boot',    'Brown leather boots',    'shoes',     '#6B4A2E', 'warm',  'casual', 'Brown',      'brown leather chelsea boots'),
  st('black-dressy',  'Black dress shoes',      'shoes',     '#151515', 'light', 'dressy', 'Black',      'black formal shoes'),
  st('black-dress',   'Little black dress',     'dress',     '#1A1A1A', 'light', 'dressy', 'Black',      'black midi dress'),
];
STAPLES.at(-1).only = 'feminine';        // skipped for people who dress masculine

const GOOD = 1.2;
/**
 * The few purchases that would unlock the most new outfits.
 * opts: { season?, gender?: 'Masculine'|'Feminine'|… , limit = 3 }
 * → [{ staple, count, pairsWith: [ids] }]
 */
export function findGaps(items, { season = null, gender = null, limit = 3 } = {}) {
  const ctx = { season };
  const owned = (s) => items.some(i => i.category === s.category && deltaE(i.colour?.hex, s.colour.hex) < 14);
  const results = [];
  for (const raw of STAPLES) {
    if (raw.only === 'feminine' && gender === 'Masculine') continue;
    if (owned(raw)) continue;
    const staple = { ...raw, id: `staple:${raw.id}`, createdAt: 0, wears: [] };
    const slot = staple.category === 'outerwear' ? 'outer' : staple.category === 'dress' ? 'top' : staple.category;
    const pool = [...items, staple];
    let count = 0;
    const pairs = new Set();
    for (const slots of combos(pool, { fixed: { [slot]: staple } })) {
      if (scoreOutfit(slots, ctx).score < GOOD) continue;
      count++;
      piecesOf(slots).forEach(p => { if (!p.staple) pairs.add(p.id); });
    }
    if (count && pairs.size) {
      const fills = !items.some(i => i.category === staple.category);   // a category they don't own at all
      results.push({ staple, count, pairsWith: [...pairs], fills, fit: colourFit(staple.colour.hex, season) });
    }
  }
  // rank: fills a missing category > pairs with more pieces > makes more outfits; one pick per category
  const ranked = results.filter(r => r.fit !== 'avoid')
    .sort((a, b) => b.fills - a.fills || b.pairsWith.length - a.pairsWith.length || b.count - a.count);
  const seen = new Set(), out = [];
  for (const r of ranked) {
    if (out.length >= limit) break;
    if (limit <= 6 && seen.has(r.staple.category)) continue;
    seen.add(r.staple.category);
    out.push(r);
  }
  return out;
}

/* ── wear stats ────────────────────────────────────────────── */
const DAY = 86400000;
export function wearStats(items, outfits = [], now = Date.now()) {
  const total = items.reduce((s, i) => s + (i.wears?.length || 0), 0);
  const last = (i) => (i.wears?.length ? Math.max(...i.wears) : null);
  const mostWorn = items.filter(i => i.wears?.length).sort((a, b) => b.wears.length - a.wears.length || last(b) - last(a)).slice(0, 3);
  const withPrice = items.filter(i => Number(i.price) > 0)
    .map(i => ({ item: i, wears: i.wears?.length || 0, perWear: Math.round(Number(i.price) / Math.max(1, i.wears?.length || 0)) }))
    .sort((a, b) => b.perWear - a.perWear);
  const sleepers = items
    .filter(i => now - i.createdAt > 30 * DAY && (!last(i) || now - last(i) > 60 * DAY))
    .sort((a, b) => (last(a) || a.createdAt) - (last(b) || b.createdAt));
  const firstWear = items.flatMap(i => i.wears || []).reduce((m, t) => Math.min(m, t), Infinity);
  const favouriteOutfit = [...outfits].filter(o => o.wears?.length).sort((a, b) => b.wears.length - a.wears.length)[0] || null;
  return { total, mostWorn, withPrice, sleepers, since: Number.isFinite(firstWear) ? firstWear : null, favouriteOutfit, lastWorn: last };
}

/* ── weather ───────────────────────────────────────────────── */
/** Open-Meteo "current" block → one of WEATHERS. */
export function weatherFromForecast({ temperature_2m: t, precipitation: p = 0, weather_code: code = 0 } = {}) {
  const wet = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95 || p > 0.2;
  if (wet) return 'rainy';
  if (t >= 26) return 'hot';
  if (t <= 14) return 'cold';
  return 'mild';
}

/* ── for the event stylist ─────────────────────────────────── */
/** Short text list of pieces for the outfit prompt, plus the ref → id map (which never leaves the browser). */
export function wardrobeForPrompt(items, max = 60) {
  const list = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, max);
  const refs = {};
  const pieces = list.map((it, k) => {
    const ref = `w${k + 1}`;
    refs[ref] = it.id;
    return { ref, name: it.name, category: it.category, colour: it.colour?.name, warmth: it.warmth, dressiness: it.dressiness };
  });
  return { pieces, refs };
}

/** Identity of an outfit for "already worn today" checks: the sorted ids of its pieces. */
export const wearKey = (slots) => Object.values(slots || {}).map(p => (typeof p === 'string' ? p : p?.id)).filter(Boolean).sort().join(',');

/** Saved outfit slots (ids) → piece objects; missing pieces become null. */
export const resolveSlots = (slots, byId) => Object.fromEntries(Object.entries(slots || {}).map(([k, id]) => [k, (id && byId[id]) || null]));
