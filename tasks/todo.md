# Wardrobe next — plan (spec: docs/superpowers/specs/2026-11-22-wardrobe-next-design.md)

Branch: `feat/wardrobe-next` (from `feat/colour-analysis`, since it builds on the colour season).

## 1. Foundations
- [x] store.js: DB v2 (`outfits` store), item normalising (warmth/dressiness defaults, wears, price), outfit CRUD, `logWear` + undo, cascade on piece delete
- [x] style.js engine: colourFit, isNeutral, harmony, scoreOutfit (+reasons), suggestOutfits, findGaps (staples), wearStats, wardrobeForPrompt
- [x] tests/unit/style.test.mjs (node --test) — green

## 2. Pieces tab
- [x] AddPieceSheet: Warmth + Dressiness chips (pre-filled)
- [x] Detail sheet: tags edit, price, wear count, Wore it today (undo), Style this piece
- [x] Colour-fit badge on grid cards + detail (season saved only)

## 3. Hub shell
- [x] WardrobePage tabs Pieces · Outfits · Insights + "What do I wear today?" header CTA; palette passed in from App

## 4. Outfits tab
- [x] FlatLay component (outfit thumbnail from cut-outs)
- [x] Today: weather chips + Open-Meteo location, dressiness chips, 3 suggestions with reasons, Wear / Save / Tweak
- [x] Board: slots, steppers + strip picker, shuffle, live verdict, save/edit
- [x] Saved outfits grid: wear / edit / delete (undo); empty + insufficient states

## 5. Insights tab
- [x] Colour check (bar, summary, groups; no-season CTA)
- [x] Worth buying (top 3 gaps, pairs-with, Find it → /api/products with budget)
- [x] What you wear (most worn, cost per wear, sleepers → Style it)

## 6. Event stylist
- [x] Brief WardrobeNote toggle; App sends `wardrobe` list
- [x] api/outfit.js + server/gemini.js: wardrobe block, `from_wardrobe` output, ref sanitising
- [x] Recommendation: "Yours" cards pre-selected, shop only gaps, "N of 4 from your wardrobe", dress → bottom not needed, "Wear this & log it"

## 7. Entry points
- [x] Home Wardrobe panel copy; nav cells (Colours/Wardrobe everywhere); colour result → "Check my wardrobe"

## 8. Verify
- [x] Unit tests, server prompt test, build, lint
- [x] Playwright flows (seeded IndexedDB, mocked Gemini), DB upgrade test
- [x] Screenshots 375 / 1280 reviewed; existing suite unchanged
- [x] Review section below; memory updated; cleanup scratch files

## Review (2026-11-22)
- Built as specced. Engine (`src/wardrobe/style.js`) is pure and on-device; only the event stylist uses Gemini, with a text list of pieces (refs, no ids/images) when the brief's switch is on.
- Tests: `node --test tests/unit/` 19/19 (engine + prompt sanitising); `tests/wardrobe.spec.js` 10/10 on Chromium (seeded IndexedDB, mocked Gemini/products/weather), incl. v1→v2 DB upgrade and 375px no-overflow.
- Full Chromium suite: only the 3 known-stale e2e tests fail (the 5 visual-regression failures seen earlier now pass).
- Lint: only the pre-existing exhaustive-deps warning in Recommendation.jsx. Build OK.
- Found while testing: weather/occasion reasons were hidden behind colour reasons (now shown first); gap finder suggested 3 coats when shoes were missing (now favours missing categories, one per category); phone overflow on Outfits tab (grid min-width).
- Limits: scoring thresholds are hand-tuned heuristics; staples list is generic; Gemini's wardrobe picks were tested with a mock, not the live model.
