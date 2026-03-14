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

function describeSlider(value, lowLabel, highLabel) {
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

function buildPrompt({ sliders, age, gender }, occasionData) {
  const { occasion, time, weather, location, venue, artist, styleEnergy, colorMood } = occasionData;

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
    .replace('{{occasion}}',        occasion || 'Casual outing')
    .replace('{{time_of_day}}',     time || 'Day')
    .replace('{{weather}}',         weather || 'Sunny')
    .replace('{{location}}',        location || 'Not specified')
    .replace('{{venue}}',           venue || 'Not specified')
    .replace('{{artist_theme}}',    artist || 'None');
}

export async function getGeminiOutfit(userPrefs, occasionData) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
  }

  const prompt = buildPrompt(userPrefs, occasionData);
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
    console.log(`[Gemini] ${model} raw response:`, data);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error(`[Gemini] ${model} no text in response:`, JSON.stringify(data));
      throw new Error('No response from Gemini.');
    }

    try {
      const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      return JSON.parse(clean);
    } catch (parseErr) {
      console.error(`[Gemini] ${model} JSON parse failed. Raw text:`, text);
      throw new Error('Gemini returned invalid JSON. Please try again.');
    }
  }

  throw lastError ?? new Error('All Gemini models failed.');
}

export async function generateOutfitImage(selections, gender) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key not configured.');
  }

  const genderDesc = gender === 'Feminine' ? 'woman' : gender === 'Masculine' ? 'man' : 'person';
  const outfitParts = [
    selections.top       && `top: ${selections.top}`,
    selections.bottom    && `bottom: ${selections.bottom}`,
    selections.outerwear && `outerwear: ${selections.outerwear}`,
    selections.footwear  && `footwear: ${selections.footwear}`,
  ].filter(Boolean).join(', ');

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
