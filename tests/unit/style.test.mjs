// Run: node --test tests/unit/
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isNeutral, colourFit, colourReport, harmony, scoreOutfit, suggestOutfits, missingForOutfits,
  findGaps, wearStats, weatherFromForecast, wardrobeForPrompt, optionsForSlot, outfitName, STAPLES,
} from '../../src/wardrobe/style.js';
import { normaliseItem, defaultTags } from '../../src/wardrobe/store.js';
import { seasonById, SEASONS } from '../../src/colour/seasons.js';

let n = 0;
const piece = (category, hex, name, extra = {}) =>
  normaliseItem({ id: `p${++n}`, createdAt: 1000 + n, category, colour: { hex, name }, name, ...extra });

const W = {
  whiteTee: piece('top', '#F5F5F2', 'White tee', { warmth: 'light', dressiness: 'casual' }),
  rustShirt: piece('top', '#B5542C', 'Rust shirt', { warmth: 'light', dressiness: 'smart' }),
  pinkTop: piece('top', '#F2507F', 'Hot pink top'),
  knit: piece('top', '#7A1F2B', 'Burgundy knit', { warmth: 'warm', dressiness: 'casual' }),
  jeans: piece('bottom', '#2E3A55', 'Dark jeans', { dressiness: 'casual' }),
  trousers: piece('bottom', '#1F1F1F', 'Black trousers', { dressiness: 'smart' }),
  orangeSkirt: piece('bottom', '#FF8A1F', 'Orange skirt'),
  coat: piece('outerwear', '#B98B5E', 'Camel coat', { warmth: 'warm', dressiness: 'smart' }),
  sneakers: piece('shoes', '#F2F2F0', 'White sneakers', { dressiness: 'casual' }),
  heels: piece('shoes', '#151515', 'Black heels', { dressiness: 'dressy', warmth: 'light' }),
};
const all = Object.values(W);

test('neutrals vs colours', () => {
  for (const h of ['#FFFFFF', '#000000', '#8F8F8F', '#24304F', '#2E3A55', '#C19A6B', '#C3B091', '#6B4423']) assert.ok(isNeutral(h), h);
  for (const h of ['#E10600', '#FF8A1F', '#20B45A', '#E5007E', '#2F6FE0']) assert.ok(!isNeutral(h), h);
});

test('colour fit: every season rates its own swatches correctly', () => {
  for (const s of SEASONS) {
    s.best.forEach(c => assert.ok(['best', 'neutral'].includes(colourFit(c.hex, s)), `${s.id} best ${c.name}`));
    s.avoid.forEach(c => assert.equal(colourFit(c.hex, s), 'avoid', `${s.id} avoid ${c.name}`));
  }
  assert.equal(colourFit('#123456', null), null);
});

test('colour report adds up', () => {
  const r = colourReport(all, seasonById('deep-autumn') || SEASONS[0]);
  const sum = Object.values(r.groups).reduce((s, g) => s + g.length, 0);
  assert.equal(sum, all.length);
  assert.equal(colourReport(all, null), null);
});

test('harmony: one colour + neutrals beats two clashing brights', () => {
  const calm = harmony([W.rustShirt, W.jeans, W.sneakers]).score;
  const clash = harmony([W.pinkTop, W.orangeSkirt, W.sneakers]);
  assert.ok(calm > clash.score);
  assert.ok(clash.warnings.length > 0);
});

test('weather: no warm knit in the heat, warm layer wanted in the cold', () => {
  const hotKnit = scoreOutfit({ top: W.knit, bottom: W.jeans, shoes: W.sneakers }, { weather: 'hot' });
  const hotTee = scoreOutfit({ top: W.whiteTee, bottom: W.jeans, shoes: W.sneakers }, { weather: 'hot' });
  assert.ok(hotTee.score > hotKnit.score);
  const coldTee = scoreOutfit({ top: W.whiteTee, bottom: W.jeans, shoes: W.sneakers }, { weather: 'cold' });
  const coldCoat = scoreOutfit({ outer: W.coat, top: W.whiteTee, bottom: W.jeans, shoes: W.sneakers }, { weather: 'cold' });
  assert.ok(coldCoat.score > coldTee.score);
  assert.ok(coldTee.warnings.some(w => /warm/i.test(w)));
});

test('dressiness: sneakers lose to heels for dressy', () => {
  const a = scoreOutfit({ top: W.rustShirt, bottom: W.trousers, shoes: W.heels }, { dressiness: 'dressy' }).score;
  const b = scoreOutfit({ top: W.rustShirt, bottom: W.trousers, shoes: W.sneakers }, { dressiness: 'dressy' }).score;
  assert.ok(a > b);
});

test('season: best colour near the face scores up, avoid colour scores down', () => {
  const season = SEASONS.find(s => s.id === 'warm-autumn') || SEASONS[0];
  const good = { ...W.whiteTee, colour: season.best[0] };
  const bad = { ...W.whiteTee, colour: season.avoid[0] };
  const base = { bottom: W.jeans, shoes: W.sneakers };
  assert.ok(scoreOutfit({ ...base, top: good }, { season }).score > scoreOutfit({ ...base, top: bad }, { season }).score);
});

test('suggestions: distinct tops, respect weather, need a base', () => {
  const s = suggestOutfits(all, { weather: 'cold', dressiness: 'casual' }, { n: 3 });
  assert.equal(s.length, 3);
  assert.equal(new Set(s.map(o => o.slots.top.id)).size, 3);
  assert.ok(s[0].slots.outer || s[0].slots.top.warmth === 'warm', 'top cold pick has a warm layer');
  assert.deepEqual(suggestOutfits([W.sneakers, W.coat], {}), []);
  assert.deepEqual(missingForOutfits([W.sneakers]), ['top', 'bottom']);
  assert.deepEqual(missingForOutfits([W.whiteTee]), ['bottom']);
  assert.deepEqual(missingForOutfits([W.whiteTee, W.jeans]), []);
  const dress = piece('dress', '#1A1A1A', 'Black dress', { dressiness: 'dressy' });
  assert.deepEqual(missingForOutfits([dress]), []);
  const d = suggestOutfits([dress, W.heels], { dressiness: 'dressy' });
  assert.equal(d[0].slots.bottom, null);
});

test('suggestions: seed shuffles but stays valid; fixed piece is always used', () => {
  const a = suggestOutfits(all, {}, { seed: 7 });
  a.forEach(o => assert.ok(o.slots.top && (o.slots.bottom || o.slots.top.category === 'dress')));
  const f = suggestOutfits(all, {}, { fixed: { bottom: W.orangeSkirt } });
  f.forEach(o => assert.equal(o.slots.bottom.id, W.orangeSkirt.id));
});

test('suggestions stay fast on a big wardrobe', () => {
  const big = [];
  for (let i = 0; i < 200; i++) big.push(piece(['top', 'bottom', 'shoes', 'outerwear', 'accessory'][i % 5], `#${((i * 2654435761) >>> 8 & 0xffffff).toString(16).padStart(6, '0')}`, `p${i}`));
  const t = performance.now();
  suggestOutfits(big, { weather: 'mild' });
  findGaps(big, {});
  assert.ok(performance.now() - t < 3000, `took ${performance.now() - t}ms`);
});

test('board slot options', () => {
  const dress = piece('dress', '#1A1A1A', 'Black dress');
  assert.ok(optionsForSlot([...all, dress], 'top').some(p => p.id === dress.id));
  assert.deepEqual(optionsForSlot(all, 'bottom', { top: dress }), []);
  assert.equal(outfitName({ top: W.rustShirt, bottom: W.jeans }), 'Rust shirt & dark jeans');
});

test('gaps: missing shoes are the top buy; owned staples are skipped', () => {
  const noShoes = [W.whiteTee, W.rustShirt, W.jeans, W.trousers];
  const g = findGaps(noShoes, {});
  assert.ok(g.length > 0 && g.length <= 3);
  assert.ok(g.some(x => x.staple.category === 'shoes'), JSON.stringify(g.map(x => x.staple.name)));
  g.forEach(x => assert.ok(x.pairsWith.every(id => noShoes.some(p => p.id === id))));
  const withSneakers = findGaps(all, {});
  assert.ok(!withSneakers.some(x => x.staple.id === 'staple:white-sneaker'));
  assert.ok(!findGaps(all, { gender: 'Masculine', limit: 20 }).some(x => x.staple.category === 'dress'));
  assert.equal(STAPLES.find(s => s.id === 'black-dress').only, 'feminine');
});

test('wear stats', () => {
  const now = 200 * 86400000;
  const items = [
    { ...W.jeans, createdAt: 0, wears: [now - 1, now - 2, now - 3], price: 3000 },
    { ...W.whiteTee, createdAt: 0, wears: [], price: 900 },
    { ...W.coat, createdAt: now - 86400000, wears: [] },
  ];
  const s = wearStats(items, [], now);
  assert.equal(s.total, 3);
  assert.equal(s.mostWorn[0].id, W.jeans.id);
  assert.equal(s.withPrice.find(x => x.item.id === W.jeans.id).perWear, 1000);
  assert.deepEqual(s.sleepers.map(i => i.id), [W.whiteTee.id]);  // the new coat isn't a sleeper yet
  assert.equal(wearStats([], [], now).since, null);
});

test('weather from forecast', () => {
  assert.equal(weatherFromForecast({ temperature_2m: 31, weather_code: 1 }), 'hot');
  assert.equal(weatherFromForecast({ temperature_2m: 8, weather_code: 3 }), 'cold');
  assert.equal(weatherFromForecast({ temperature_2m: 20, weather_code: 63 }), 'rainy');
  assert.equal(weatherFromForecast({ temperature_2m: 20, weather_code: 0, precipitation: 1.2 }), 'rainy');
  assert.equal(weatherFromForecast({ temperature_2m: 20, weather_code: 2 }), 'mild');
});

test('prompt list uses refs and keeps ids local', () => {
  const { pieces, refs } = wardrobeForPrompt(all);
  assert.equal(pieces.length, all.length);
  pieces.forEach(p => { assert.match(p.ref, /^w\d+$/); assert.ok(!('id' in p)); assert.ok(refs[p.ref]); });
  assert.equal(wardrobeForPrompt(all, 3).pieces.length, 3);
});

test('old pieces get tag defaults', () => {
  const old = normaliseItem({ id: 'x', category: 'outerwear' });
  assert.deepEqual({ warmth: old.warmth, dressiness: old.dressiness, wears: old.wears }, { ...defaultTags('outerwear'), wears: [] });
  assert.equal(normaliseItem({ id: 'y', category: 'top', warmth: 'bogus' }).warmth, 'light');
});
