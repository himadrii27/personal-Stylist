// Server-only: runs inside the /api functions so the Gemini key never reaches the browser.
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const PROMPT_TEMPLATE = `You are an expert fashion stylist and cultural trend analyst.

Your job is to recommend a stylish, practical outfit based on the user's preferences and event details.
You must also consider location-specific crowd style and practical survival items for the environment.

USER STYLE PROFILE

Minimal ↔ Loud: {{minimal_loud}}
Fitted ↔ Oversized: {{fitted_oversized}}
Classic ↔ Trendy: {{classic_trendy}}
Sporty ↔ Polished: {{sporty_polished}}
Safe ↔ Experimental: {{safe_experimental}}

Generation: {{generation}}
Gender Expression: {{gender}}
Clothing Gender: {{clothing_gender}}
Style Energy: {{style_energy}}
Color Mood: {{color_mood}}
Personal Colour Palette: {{palette}}

USER'S WARDROBE (pieces they already own; ref: name (category, colour, warmth, dressiness))

{{wardrobe}}

EVENT DETAILS

Occasion: {{occasion}}
Time of Day: {{time_of_day}}
Weather: {{weather}}
Location: {{location}}
Venue: {{venue}}
Artist/Event Theme: {{artist_theme}}

TASK

Based on the above information:

1. Suggest ONE primary outfit recommendation.
2. Consider the event environment, weather, and crowd culture.
3. Ensure the outfit aligns with the user's style slider preferences.
4. Think like a real stylist preparing someone for this event.

OUTPUT FORMAT

Return the response in JSON format:

{
  "outfit_name": "",
  "outfit_description": "",
  "from_wardrobe": { "top": "", "bottom": "", "outerwear": "", "footwear": "", "accessories": [] },
  "style_tags": ["", "", "", ""],
  "clothing_options": {
    "top": [
      { "name": "", "description": "" },
      { "name": "", "description": "" },
      { "name": "", "description": "" },
      { "name": "", "description": "" }
    ],
    "bottom": [
      { "name": "", "description": "" },
      { "name": "", "description": "" },
      { "name": "", "description": "" },
      { "name": "", "description": "" }
    ],
    "outerwear": [
      { "name": "", "description": "" },
      { "name": "", "description": "" },
      { "name": "", "description": "" },
      { "name": "", "description": "" }
    ],
    "footwear": [
      { "name": "", "description": "" },
      { "name": "", "description": "" },
      { "name": "", "description": "" },
      { "name": "", "description": "" }
    ]
  },
  "mandatory_accessories": [
    "",
    "",
    ""
  ],
  "general_crowd_style": {
    "description": "",
    "typical_items": [
      "",
      "",
      ""
    ]
  },
  "mandatory_survival_items": [
    "",
    "",
    ""
  ],
  "stylist_tip": ""
}

GUIDELINES

clothing_options:
CRITICAL: All clothing items MUST be appropriate for the Clothing Gender specified above. If Clothing Gender is "Men's", recommend men's clothing only (shirts, trousers, suits, etc). If "Women's", recommend women's clothing only. Never mix genders.
For EACH category (top, bottom, outerwear, footwear), provide exactly 4 distinct options that all match the user's style and the event. Options should vary in style intensity — one safe, one balanced, one bold, one editorial/avant-garde.

Personal Colour Palette:
If a palette is given (not "Not analysed"), it was read from the user's own face. Build every option mainly from its best colours and neutrals, especially tops, outerwear and anything worn near the face; never use its "avoid" colours near the face. Name the colour in each item (e.g. "rust overshirt"). Treat Color Mood as the overall mood within that palette, and suggest jewellery in the palette's metal.

From Wardrobe:
If a wardrobe is listed (not "None"), dress the user from it FIRST. For each of top, bottom, outerwear and footwear, give the ref (e.g. "w3") of the owned piece that best suits this event, weather, style profile and colour palette, or "" when nothing owned fits well — never force a bad fit. A dress goes in "top" and then "bottom" must be "". Shoes go in "footwear". "accessories" may hold up to 2 refs of owned accessories. Use only refs from the list, each once, matching its category. Leave outerwear "" if the weather doesn't need a layer. If the wardrobe is "None", return every field as "" and accessories as [].
When a category is filled from the wardrobe, its 4 clothing_options are alternatives that would pair with the owned pieces. outfit_name and outfit_description describe the whole look, naming the owned pieces.

Mandatory Accessories:
Items that elevate the outfit and match the event vibe.

General Crowd Style:
Describe how most people at this event/location typically dress.

Mandatory Survival Items:
Practical items needed for the environment (e.g. earplugs, portable charger, water bottle, jacket, etc).

Style Tags:
3–5 short aesthetic tags (2–3 words max each) that capture the DNA of this outfit. Examples: Earth Tone, Rave Ready, Layered Look, Bold Silhouette, Street-Luxe, Dark Romantic.

Stylist Tip:
Provide one short insider fashion tip.

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no extra text.`;

// requests come from the open internet: keep free-text fields short and sliders numeric
const clip = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');
const slider = (v) => Math.max(0, Math.min(100, Math.round(Number(v) || 50)));

function describeSlider(v, lowLabel, highLabel) {
  const value = slider(v);
  if (value <= 20) return `${value}/100 — strongly ${lowLabel}`;
  if (value <= 40) return `${value}/100 — leaning ${lowLabel}`;
  if (value <= 60) return `${value}/100 — balanced`;
  if (value <= 80) return `${value}/100 — leaning ${highLabel}`;
  return `${value}/100 — strongly ${highLabel}`;
}

function genderToClothingLabel(gender) {
  if (gender === 'Masculine') return "Men's";
  if (gender === 'Feminine') return "Women's";
  return 'Unisex/Gender-neutral';
}

// colour season from the on-device face reading (see src/colour/seasons.js → paletteForPrompt)
function describePalette(p) {
  if (!p || typeof p !== 'object') return 'Not analysed';
  const list = (v) => (Array.isArray(v) ? v.slice(0, 16).map(x => clip(x, 30)).filter(Boolean).join(', ') : '');
  const season = clip(p.season, 40);
  if (!season) return 'Not analysed';
  return `${season} season. Best colours: ${list(p.best) || 'n/a'}. Avoid near the face: ${list(p.avoid) || 'n/a'}. Metal: ${clip(p.metal, 40) || 'n/a'}.`;
}

// the user's own pieces, as refs the browser maps back to its IndexedDB ids
const WARDROBE_CATS = ['top', 'dress', 'outerwear', 'bottom', 'shoes', 'accessory'];
const REF = /^w\d{1,3}$/;
function cleanWardrobe(w) {
  if (!Array.isArray(w)) return [];
  const oneOf = (v, list) => (list.includes(v) ? v : '');
  const seen = new Set();
  return w.slice(0, 60).map(p => ({
    ref: REF.test(p?.ref) ? p.ref : '',
    name: clip(p?.name, 40).replace(/[\r\n]+/g, ' '),
    category: oneOf(p?.category, WARDROBE_CATS),
    colour: clip(p?.colour, 24).replace(/[\r\n]+/g, ' '),
    warmth: oneOf(p?.warmth, ['light', 'mid', 'warm']),
    dressiness: oneOf(p?.dressiness, ['casual', 'smart', 'dressy']),
  })).filter(p => p.ref && p.category && !seen.has(p.ref) && seen.add(p.ref));
}
function describeWardrobe(list) {
  if (!list.length) return 'None';
  return list.map(p => `${p.ref}: ${p.name || 'piece'} (${p.category}, ${p.colour || 'unknown colour'}, ${p.warmth || 'mid'}, ${p.dressiness || 'casual'})`).join('\n');
}
const SLOT_CATS = { top: ['top', 'dress'], bottom: ['bottom'], outerwear: ['outerwear'], footwear: ['shoes'] };
/** Keep only refs that exist, sit in the right slot and are used once; a dress clears the bottom. */
export function cleanPicks(picks, list) {
  const byRef = Object.fromEntries(list.map(p => [p.ref, p]));
  const used = new Set();
  const take = (ref, cats) => {
    const p = typeof ref === 'string' && byRef[ref.trim()];
    if (!p || !cats.includes(p.category) || used.has(p.ref)) return '';
    used.add(p.ref);
    return p.ref;
  };
  const out = Object.fromEntries(Object.entries(SLOT_CATS).map(([slot, cats]) => [slot, take(picks?.[slot], cats)]));
  if (out.top && byRef[out.top].category === 'dress') { if (out.bottom) used.delete(out.bottom); out.bottom = ''; }
  out.accessories = (Array.isArray(picks?.accessories) ? picks.accessories : []).map(r => take(r, ['accessory'])).filter(Boolean).slice(0, 2);
  return out;
}

export { buildPrompt, cleanWardrobe };

const OCCASION_FIELDS = ['occasion', 'time', 'weather', 'location', 'venue', 'artist', 'styleEnergy', 'colorMood'];

function buildPrompt(userPrefs = {}, occasionData = {}, palette = null, wardrobe = []) {
  const sliders = userPrefs.sliders || {};
  const age = clip(userPrefs.age), gender = clip(userPrefs.gender);
  const { occasion, time, weather, location, venue, artist, styleEnergy, colorMood } =
    Object.fromEntries(OCCASION_FIELDS.map(k => [k, clip(occasionData[k])]));

  return PROMPT_TEMPLATE
    .replace('{{minimal_loud}}',      describeSlider(sliders.minimalLoud,      'Minimal',  'Loud'))
    .replace('{{fitted_oversized}}',  describeSlider(sliders.fittedOversized,  'Fitted',   'Oversized'))
    .replace('{{classic_trendy}}',    describeSlider(sliders.classicTrendy,    'Classic',  'Trendy'))
    .replace('{{sporty_polished}}',   describeSlider(sliders.sportyPolished,   'Sporty',   'Polished'))
    .replace('{{safe_experimental}}', describeSlider(sliders.safeExperimental, 'Safe',     'Experimental'))
    .replace('{{generation}}',      age || 'Millennial')
    .replace('{{gender}}',          gender || 'Unisex')
    .replace('{{clothing_gender}}', genderToClothingLabel(gender))
    .replace('{{style_energy}}',    styleEnergy || 'Not specified')
    .replace('{{color_mood}}',      colorMood || 'Not specified')
    .replace('{{palette}}',         describePalette(palette))
    .replace('{{wardrobe}}',        describeWardrobe(wardrobe))
    .replace('{{occasion}}',        occasion || 'Casual outing')
    .replace('{{time_of_day}}',     time || 'Day')
    .replace('{{weather}}',         weather || 'Sunny')
    .replace('{{location}}',        location || 'Not specified')
    .replace('{{venue}}',           venue || 'Not specified')
    .replace('{{artist_theme}}',    artist || 'None');
}

export async function getGeminiOutfit(apiKey, userPrefs, occasionData, palette, rawWardrobe) {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured. Add GEMINI_API_KEY to your .env file.');
  }

  const wardrobe = cleanWardrobe(rawWardrobe);
  const prompt = buildPrompt(userPrefs, occasionData, palette, wardrobe);
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, topK: 40, topP: 0.95, maxOutputTokens: 8192, responseMimeType: 'application/json' },
  });

  let lastError;
  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `Gemini API error ${response.status}`;
      console.error(`[Gemini] ${model} HTTP ${response.status}:`, msg, err);
      // If quota exceeded, try next model; otherwise throw immediately
      if (msg.toLowerCase().includes('quota') || response.status === 429) {
        lastError = new Error(`${model}: quota exceeded — billing not yet active on your Google Cloud project. Enable billing at console.cloud.google.com.`);
        continue;
      }
      throw new Error(msg);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error(`[Gemini] ${model} no text in response:`, JSON.stringify(data));
      throw new Error('No response from Gemini.');
    }

    try {
      const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const outfit = JSON.parse(clean);
      if (outfit && typeof outfit === 'object') outfit.from_wardrobe = cleanPicks(outfit.from_wardrobe, wardrobe);
      return outfit;
    } catch {
      console.error(`[Gemini] ${model} JSON parse failed. Raw text:`, text);
      throw new Error('Gemini returned invalid JSON. Please try again.');
    }
  }

  throw lastError ?? new Error('All Gemini models failed.');
}

export async function generateOutfitImage(apiKey, selections = {}, gender) {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured.');
  }

  const genderDesc = gender === 'Feminine' ? 'woman' : gender === 'Masculine' ? 'man' : 'person';
  const outfitParts = ['top', 'bottom', 'outerwear', 'footwear']
    .map(k => clip(selections[k]) && `${k}: ${clip(selections[k])}`)
    .filter(Boolean).join(', ');

  const prompt = `Full body fashion editorial photo of a ${genderDesc} model wearing: ${outfitParts}. Clean white studio background, professional fashion photography, sharp focus, high resolution, full body shot from head to toe showing the complete outfit, fashion magazine editorial style.`;

  const IMAGE_MODELS = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image'];
  let lastImgError;
  for (const imgModel of IMAGE_MODELS) {
    const url = `${GEMINI_BASE}/${imgModel}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      lastImgError = new Error(err?.error?.message || `Image generation failed (${response.status}).`);
      continue;
    }

    const data = await response.json();
    const imagePart = data?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
    if (!imagePart) { lastImgError = new Error('No image returned. Try again.'); continue; }
    const { mimeType, data: b64 } = imagePart.inlineData;
    return `data:${mimeType};base64,${b64}`;
  }
  throw lastImgError ?? new Error('Image generation unavailable.');
}
