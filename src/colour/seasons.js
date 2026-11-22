// The 12-season colour system. Each season sits at a point on three axes, all in [-1, 1]:
//   temp  : cool (-1) … warm (+1)      — skin undertone
//   value : deep (-1) … light (+1)     — how light or dark skin, hair and eyes are overall
//   chroma: soft (-1) … bright (+1)    — contrast between features and how vivid the skin is
// analyse.js measures a face on the same axes and picks the nearest season.

const c = (hex, name) => ({ hex, name });

export const SEASONS = [
  {
    id: 'light-spring', name: 'Light Spring', family: 'Spring', at: { temp: 0.4, value: 1, chroma: 0.3 },
    blurb: 'Light and warm with a fresh, delicate glow. Clear pastels with a touch of gold flatter you.',
    best: [c('#F6C9A8', 'Peach'), c('#F4A28C', 'Light coral'), c('#F7E07E', 'Butter yellow'), c('#A8D8B9', 'Mint'), c('#8FD1D3', 'Aqua'), c('#9FB8E8', 'Periwinkle'), c('#F3B7C8', 'Warm pink'), c('#C9E07A', 'Light lime')],
    neutrals: [c('#F5EEDC', 'Ivory'), c('#D9C3A0', 'Light camel'), c('#B8A48A', 'Stone'), c('#8A9BB5', 'Soft navy')],
    avoid: [c('#000000', 'Black'), c('#4B1E2E', 'Burgundy'), c('#5A5A5A', 'Charcoal'), c('#3A4A2A', 'Dark olive')],
    metal: 'Light gold',
  },
  {
    id: 'warm-spring', name: 'Warm Spring', family: 'Spring', at: { temp: 1, value: 0.3, chroma: 0.5 },
    blurb: 'Golden and sunny. Warm, clear colours with yellow underneath make you light up.',
    best: [c('#F28C38', 'Tangerine'), c('#F26B5B', 'Coral'), c('#F2C230', 'Golden yellow'), c('#7FB241', 'Leaf green'), c('#2DB3A6', 'Warm turquoise'), c('#E8A25F', 'Apricot'), c('#D96A3A', 'Poppy'), c('#47A6C9', 'Warm sky')],
    neutrals: [c('#F3E6C8', 'Cream'), c('#C49A6C', 'Camel'), c('#8B5E3C', 'Golden brown'), c('#2F4D7A', 'Warm navy')],
    avoid: [c('#000000', 'Black'), c('#8E8E9A', 'Cool grey'), c('#B03A6E', 'Fuchsia'), c('#6E5A8E', 'Dusty purple')],
    metal: 'Yellow gold',
  },
  {
    id: 'bright-spring', name: 'Bright Spring', family: 'Spring', at: { temp: 0.4, value: 0, chroma: 1 },
    blurb: 'Clear and vivid with a warm lean. Saturated, high-energy colours suit you; dull shades drain you.',
    best: [c('#FF5A4E', 'Hot coral'), c('#FF8A1F', 'Bright orange'), c('#FFD31A', 'Lemon'), c('#20B45A', 'Kelly green'), c('#00B3C7', 'Bright turquoise'), c('#2F6FE0', 'Clear blue'), c('#F2507F', 'Warm pink'), c('#7A4FD6', 'Violet')],
    neutrals: [c('#FFFFF5', 'Clear white'), c('#C9A27E', 'Light camel'), c('#1F2F5C', 'Bright navy'), c('#3B3B3B', 'Dark grey')],
    avoid: [c('#B9A99A', 'Dusty taupe'), c('#8E9A84', 'Sage'), c('#A88C8C', 'Mauve'), c('#7B6A50', 'Muted khaki')],
    metal: 'Bright gold',
  },
  {
    id: 'light-summer', name: 'Light Summer', family: 'Summer', at: { temp: -0.4, value: 1, chroma: -0.2 },
    blurb: 'Light, cool and gentle. Airy pastels with a blue base look effortless on you.',
    best: [c('#AFC8E8', 'Powder blue'), c('#C7B8E0', 'Lavender'), c('#F2B8C6', 'Rose pink'), c('#9AD0C2', 'Seafoam'), c('#E9A3B5', 'Soft raspberry'), c('#8FB0D9', 'Cornflower'), c('#D8C4E8', 'Lilac'), c('#B9DDE2', 'Ice aqua')],
    neutrals: [c('#F4F2EE', 'Soft white'), c('#C9C6C2', 'Light grey'), c('#B7A79A', 'Rose taupe'), c('#5D6F8F', 'Grey navy')],
    avoid: [c('#000000', 'Black'), c('#F28C38', 'Orange'), c('#8B5E3C', 'Golden brown'), c('#C6A000', 'Mustard')],
    metal: 'Silver',
  },
  {
    id: 'cool-summer', name: 'Cool Summer', family: 'Summer', at: { temp: -1, value: 0.2, chroma: -0.3 },
    blurb: 'Cool and rosy. Blue-based, medium shades look calm and polished on you.',
    best: [c('#5B7DB1', 'Slate blue'), c('#C2577A', 'Raspberry'), c('#8E6BAF', 'Soft plum'), c('#4F9A94', 'Spruce teal'), c('#D98BA6', 'Cool pink'), c('#7E9CC9', 'Periwinkle'), c('#A64D79', 'Berry'), c('#6CA6A0', 'Cool jade')],
    neutrals: [c('#F2F2F2', 'Soft white'), c('#8D8F96', 'Blue grey'), c('#5A4F57', 'Cocoa grey'), c('#2E3C5C', 'Navy')],
    avoid: [c('#F28C38', 'Orange'), c('#C6A000', 'Mustard'), c('#8B5E3C', 'Golden brown'), c('#9CA03A', 'Olive')],
    metal: 'Silver',
  },
  {
    id: 'soft-summer', name: 'Soft Summer', family: 'Summer', at: { temp: -0.4, value: 0, chroma: -1 },
    blurb: 'Muted and cool-leaning. Smoky, greyed shades harmonise with you; neon and black overpower.',
    best: [c('#8FA3B8', 'Dusty blue'), c('#B58A9E', 'Mauve'), c('#8EA38E', 'Sage'), c('#A7798A', 'Dusty rose'), c('#6F8FA0', 'Steel teal'), c('#9A8BB0', 'Smoky lavender'), c('#B9969A', 'Rosewood'), c('#7E9C94', 'Grey jade')],
    neutrals: [c('#EAE5DD', 'Oyster'), c('#A49A91', 'Taupe'), c('#6E6A6A', 'Pewter'), c('#4A556A', 'Slate navy')],
    avoid: [c('#000000', 'Black'), c('#FFFFFF', 'Bright white'), c('#FF8A1F', 'Bright orange'), c('#FFD31A', 'Lemon')],
    metal: 'Brushed silver',
  },
  {
    id: 'soft-autumn', name: 'Soft Autumn', family: 'Autumn', at: { temp: 0.4, value: 0, chroma: -1 },
    blurb: 'Muted and warm-leaning. Earthy, softened colours blend beautifully with your natural tones.',
    best: [c('#C08A6A', 'Soft terracotta'), c('#A9A26B', 'Moss'), c('#D3A77A', 'Honey beige'), c('#7F9A7D', 'Muted sage'), c('#C28B7E', 'Dusty peach'), c('#5F8C8C', 'Soft teal'), c('#B5925C', 'Light ochre'), c('#9E6D62', 'Rose brown')],
    neutrals: [c('#EFE6D6', 'Oatmeal'), c('#B49B7E', 'Mushroom'), c('#7A6552', 'Coffee'), c('#5D6656', 'Olive grey')],
    avoid: [c('#000000', 'Black'), c('#FFFFFF', 'Bright white'), c('#E5007E', 'Hot pink'), c('#2F6FE0', 'Electric blue')],
    metal: 'Antique gold',
  },
  {
    id: 'warm-autumn', name: 'Warm Autumn', family: 'Autumn', at: { temp: 1, value: -0.2, chroma: -0.5 },
    blurb: 'Golden, rich and earthy. Spice tones and warm greens make your skin glow.',
    best: [c('#B5542C', 'Rust'), c('#C68B3E', 'Mustard'), c('#6B6B3A', 'Olive'), c('#A0522D', 'Sienna'), c('#D9A066', 'Camel'), c('#2F6B5E', 'Forest teal'), c('#C8682E', 'Pumpkin'), c('#7A3B2E', 'Brick')],
    neutrals: [c('#F1E3C8', 'Cream'), c('#B88A5A', 'Tan'), c('#5A3A26', 'Chocolate'), c('#4E5B3A', 'Khaki')],
    avoid: [c('#000000', 'Black'), c('#8E8E9A', 'Cool grey'), c('#E5007E', 'Fuchsia'), c('#AFC8E8', 'Icy blue')],
    metal: 'Gold & bronze',
  },
  {
    id: 'deep-autumn', name: 'Deep Autumn', family: 'Autumn', at: { temp: 0.4, value: -1, chroma: -0.2 },
    blurb: 'Deep and warm. Rich, dark earth tones carry your natural depth.',
    best: [c('#7A2E2A', 'Oxblood'), c('#2F5A4A', 'Deep forest'), c('#8C4A1E', 'Burnt orange'), c('#B07A2A', 'Bronze'), c('#5A2E4A', 'Aubergine'), c('#1F5C66', 'Deep teal'), c('#9A3B24', 'Paprika'), c('#4A5A2A', 'Dark olive')],
    neutrals: [c('#EDE0C8', 'Warm ivory'), c('#8A6A4A', 'Walnut'), c('#3A2A20', 'Espresso'), c('#2A2F3A', 'Charcoal navy')],
    avoid: [c('#F3B7C8', 'Pastel pink'), c('#AFC8E8', 'Powder blue'), c('#C9C6C2', 'Light grey'), c('#C7B8E0', 'Lavender')],
    metal: 'Antique brass',
  },
  {
    id: 'deep-winter', name: 'Deep Winter', family: 'Winter', at: { temp: -0.4, value: -1, chroma: 0.3 },
    blurb: 'Deep with cool clarity. Dark, rich jewel tones and true black suit you.',
    best: [c('#7A0F2E', 'Deep cherry'), c('#0F4D3A', 'Pine'), c('#1E2F6E', 'Sapphire'), c('#4B1E5E', 'Deep plum'), c('#B0124A', 'Raspberry'), c('#005F6B', 'Deep teal'), c('#C8102E', 'True red'), c('#2E1A47', 'Midnight purple')],
    neutrals: [c('#FFFFFF', 'Pure white'), c('#000000', 'Black'), c('#3B3B3B', 'Charcoal'), c('#1B2340', 'Ink navy')],
    avoid: [c('#F6C9A8', 'Peach'), c('#D9A066', 'Camel'), c('#C68B3E', 'Mustard'), c('#B9A99A', 'Dusty taupe')],
    metal: 'Silver & platinum',
  },
  {
    id: 'cool-winter', name: 'Cool Winter', family: 'Winter', at: { temp: -1, value: -0.2, chroma: 0.6 },
    blurb: 'Cool and crisp. Icy brights and blue-based jewel tones look striking on you.',
    best: [c('#0047AB', 'Cobalt'), c('#C2185B', 'Magenta'), c('#00897B', 'Emerald teal'), c('#6A1B9A', 'Royal purple'), c('#D50032', 'Blue red'), c('#B3E5FC', 'Icy blue'), c('#F8BBD0', 'Icy pink'), c('#1A237E', 'Indigo')],
    neutrals: [c('#FFFFFF', 'Pure white'), c('#000000', 'Black'), c('#757A85', 'Cool grey'), c('#1B2340', 'Navy')],
    avoid: [c('#F28C38', 'Orange'), c('#C68B3E', 'Mustard'), c('#8B5E3C', 'Golden brown'), c('#A9A26B', 'Moss')],
    metal: 'Silver',
  },
  {
    id: 'bright-winter', name: 'Bright Winter', family: 'Winter', at: { temp: -0.4, value: 0, chroma: 1 },
    blurb: 'High contrast and vivid with a cool lean. Bold, saturated colours and stark contrasts are yours.',
    best: [c('#E5007E', 'Hot pink'), c('#0066FF', 'Electric blue'), c('#00A86B', 'Jade'), c('#E10600', 'Scarlet'), c('#7B2FBE', 'Ultraviolet'), c('#00BCD4', 'Bright cyan'), c('#FFE600', 'Icy lemon'), c('#FF3E7F', 'Shocking pink')],
    neutrals: [c('#FFFFFF', 'Pure white'), c('#000000', 'Black'), c('#2B2B2B', 'Jet'), c('#14246B', 'Bright navy')],
    avoid: [c('#B9A99A', 'Dusty taupe'), c('#C08A6A', 'Soft terracotta'), c('#8EA38E', 'Sage'), c('#C68B3E', 'Mustard')],
    metal: 'Polished silver',
  },
];

export const seasonById = (id) => SEASONS.find(s => s.id === id);

// localStorage: the user's saved result (no image is ever stored — only the season and averaged colours)
const KEY = 'personalStylistPalette';
export function loadPalette() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY));
    return p && seasonById(p.seasonId) ? p : null;
  } catch { return null; }
}
export function savePalette(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage blocked */ } }
export function clearPalette() { try { localStorage.removeItem(KEY); } catch { /* storage blocked */ } }

/** Compact form sent to the outfit API, so Gemini dresses the user in their colours. */
export function paletteForPrompt(p) {
  const s = p && seasonById(p.seasonId);
  if (!s) return null;
  return { season: s.name, best: [...s.best, ...s.neutrals].map(x => x.name), avoid: s.avoid.map(x => x.name), metal: s.metal };
}
