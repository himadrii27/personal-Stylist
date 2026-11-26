# Wardrobe: what comes after adding your clothes — design

## Why
Today the wardrobe is a dead end: pieces are stored (name, category, one colour, cut-out image) and nothing
else in the app uses them. The goal is to make the wardrobe *useful*: dress me from what I own, tell me which
pieces suit me, help me build looks, show the few purchases worth making, and show what I actually wear.
It must feel like one product with the existing event stylist and colour season, in the same visual language
(ivory surfaces, ink text, #E2571A accent, Instrument Serif headlines, "(Label)" section labels, `wd-*` / `cl-*` classes).

## Goals
1. **Event from my wardrobe** — the event stylist picks owned pieces first and only suggests shopping for the gaps.
2. **Colour check** — every piece is rated against the user's colour season; a summary shows how much of the wardrobe suits them.
3. **Outfit builder + "What do I wear today?"** — slot board to build/save looks; daily suggestions from weather + dressiness.
4. **Gap finder** — the 2–3 staple purchases that unlock the most new outfits, with shop links.
5. **Wear tracking** — log wears, cost per wear, "not worn lately" nudges.

## Non-goals
- No accounts or cloud sync; everything stays in IndexedDB on the device.
- No free-form mood-board canvas (user chose the slot board).
- No image upload to any server. Only a short text list of pieces (name, category, colour, tags) goes to Gemini, and only when "Use my wardrobe" is on.
- No new paid APIs.

## Anti-goals (failure even if it "works")
- Fake numbers, invented stats or claims we can't back (e.g. "92% match accuracy").
- Suggestions that ignore weather (wool coat on a hot day) or mix gym shoes with a dressy look.
- Breaking the existing wardrobe (rail, grid, add, delete/undo) or existing saved pieces.
- A cluttered hub: each screen has one clear primary action.

## Decisions (made by the user)
- Pieces get two optional tags — **Warmth** (Light / Mid / Warm) and **Dressiness** (Casual / Smart / Dressy) — pre-filled from the category, editable.
- Weather for "today": tap chips (Hot / Mild / Cold / Rainy) **plus** optional "Use my location" via Open-Meteo (free, no key). Location only sent on that tap, rounded to ~10 km.
- Builder: **slot board** (outer / top-or-dress / bottom / shoes / accessory, step through pieces per slot).
- Event mix: **own pieces first, shop the gaps**, with a "Use my wardrobe" toggle on the brief.

## Approaches considered (for the suggestion engine)
- **A. On-device rule engine (chosen):** pure JS scoring of combinations (colour harmony in CIELAB, warmth vs weather,
  dressiness spread, colour season). Instant, free, private, testable in Node. Powers Today, builder hints, gaps.
- B. Gemini for every suggestion: smarter text, but slow, costs quota, needs network, and sends the wardrobe every time.
- C. Hybrid: Gemini only for the event stylist (it already knows the occasion), rules for everything daily. → **This is A + Gemini for goal 1 only.**

## Data model (`src/wardrobe/store.js`, IndexedDB v1 → v2)
- Item adds (all optional, normalised on read so old items keep working):
  `warmth: 'light'|'mid'|'warm'`, `dressiness: 'casual'|'smart'|'dressy'`, `price?: number` (₹), `wears: number[]` (timestamps).
  Defaults by category (e.g. outerwear → warm/smart, shoes → mid/casual).
- New object store `outfits`: `{ id, name, slots: { outer, top, bottom, shoes, accessory } (item ids or null), createdAt, wears: number[] }`.
- `logWear({ itemIds, outfitId? })` writes wear timestamps to every piece (and the outfit) in one transaction; undo supported.
- Deleting a piece removes it from saved outfits' slots (outfit kept if it still has a top/dress).

## Engine (`src/wardrobe/style.js`, pure, Node-tested)
- `colourFit(hex, season)` → `'best' | 'neutral' | 'avoid' | 'outside'` (nearest palette colour by ΔE in Lab; thresholds tuned on the 12 seasons' own swatches).
- `isNeutral(hex)` — low chroma, plus navy/camel/olive bands.
- `harmony(pieces)` — neutrals go with anything; ≤2 statement colours; analogous or complementary hue pairs score up, near-miss hues (30–90° apart, both saturated) score down; some light/dark contrast scores up.
- `scoreOutfit(pieces, { weather, dressiness, season })` — harmony + weather fit (hot: no warm pieces/outer; cold: warm layer needed; rainy: outer preferred) + dressiness (all within one step of the target) + season bonus for top/outer near the face. Returns `{ score, reasons[] }` so the UI can say *why* ("Navy grounds the rust", "Light layers for 31°").
- `suggestOutfits(items, ctx, n=3)` — enumerates top×bottom or dress, ×shoes, ×optional outer/accessory (capped per category so 200 pieces stay fast), returns the n best that don't repeat the same top/dress.
- `findGaps(items, ctx)` — ~20 curated staples (white shirt, dark jeans, black trousers, camel coat, white sneakers, loafers, neutral knit…, each with hex/warmth/dressiness); for each staple not already owned (same category + ΔE < 12) count how many *new* good outfits it would create; return the top 3 with the owned pieces it pairs with. If a season is saved, staple colours are swapped to the season's nearest neutral.
- `wearStats(items, outfits, now)` — wears per piece, most worn, cost per wear (only where price set), "not worn in 60 days" (only pieces older than 30 days).
- `wardrobeForPrompt(items)` → up to 60 entries `{ ref: 'w1', name, category, colour, warmth, dressiness }`; the ref→id map stays in the browser.

## Screens & entry points
**Wardrobe hub** (`WardrobePage`) gets three tabs under the existing header: **Pieces · Outfits · Insights**, and a primary
header button **"What do I wear today?"** (opens Outfits → Today). Tab persists in the URL-less app via state.

1. **Pieces** (existing rail/grid, kept):
   - Grid cards and the detail sheet show a colour-fit dot/badge (only when a season is saved).
   - Detail sheet gains: Warmth + Dressiness chips, optional price, "Worn N times · last on …", **Wore it today** (with undo), **Style this piece** (opens builder with it locked).
   - Add sheet gains the two tag chip rows (pre-filled).
2. **Outfits**:
   - **Today** card: weather chips + "Use my location"; dressiness chips (Casual / Smart / Dressy). Shows 3 flat-lay outfit cards
     (cut-outs arranged on an ivory board) with reasons, and **Wear today** / **Save** / **Tweak** (opens board).
   - **Board** (slot builder): slots with ◀ ▶ steppers and a horizontal strip picker per slot, Shuffle, live colour/harmony verdict line, Save (name auto-suggested, editable).
   - **Saved outfits** grid: flat-lay thumbnails, worn count, Wear / Edit / Delete (undo).
   - Empty/insufficient states: "Add a top and a bottom (or a dress) and shoes to get outfit ideas" with direct add buttons.
3. **Insights**:
   - **Colour check**: stacked bar (best / neutral / outside / avoid), one-line summary, pieces grouped by fit with "wear away from the face" tip for avoid colours. No season → card linking to the Colours page.
   - **Worth buying**: top 3 gaps — swatch illustration, "pairs with N of your pieces" + thumbnails, **Find it** → inline product results via existing `/api/products` with budget chips.
   - **What you wear**: most worn, cost per wear (if prices added), sleepers with **Style it** → board. Honest empty state until wears are logged.

**Event stylist**
- Brief: a `WardrobeNote` line under the palette note: "Use my wardrobe · 14 pieces" switch (on by default when ≥3 pieces; hidden when empty with an "Add your clothes" link).
- Server prompt: an "USER'S WARDROBE" block (sanitised, capped) and a new output field `from_wardrobe: { top, bottom, outerwear, footwear, accessories[] }` of refs or "". Server drops refs that don't match `^w\d{1,3}$`.
- Recommendation: in each tab an owned pick shows first as a **"Yours"** card with its cut-out, pre-selected; header reads "Shop the gaps" and only gap categories are product-searched by default; alternatives still browsable. Left panel shows "3 of 4 from your wardrobe". A dress in the top slot marks bottom as "Not needed".
- Wearing it: on the result, **"Wear this & log it"** logs the owned pieces.

**Other entry points**
- Homepage Wardrobe feature panel: copy/points updated (outfits, today, colour check) — no fake stats.
- Wardrobe & colours nav: add the missing Colours / Wardrobe cells.
- Colour result page: "Check my wardrobe against these colours" when the wardrobe has pieces → Insights.

## Privacy
- Images never leave the device. Text list to Gemini only with the toggle on. Location only on tap, rounded to 1 decimal, sent only to Open-Meteo.

## Verification
- `node --test tests/unit/style.test.mjs` for the engine (harmony, weather, dressiness, gaps, stats, prompt sanitising).
- Server prompt test: wardrobe block rendered, hostile input bounded, bad refs dropped.
- Playwright (headless Chromium) flows with IndexedDB seeded from generated cut-outs: tabs, today suggestions per weather, board save/edit, wear log + undo, colour check with/without season, gap "Find it", event brief toggle → recommendation shows "Yours" cards (Gemini call mocked via route), DB v1→v2 upgrade keeps old pieces.
- Mobile 375px + desktop screenshots reviewed; build + lint; existing suite failures unchanged (3 e2e + 5 visual).

## Left to the builder
Exact thresholds, staple list contents, copy wording within the tone above, animation details.
