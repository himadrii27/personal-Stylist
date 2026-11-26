import { postJSON } from './api';

// wardrobe: optional [{ ref, name, category, colour, warmth, dressiness }] — text only, never images
export const getGeminiOutfit = (userPrefs, occasionData, palette, wardrobe) =>
  postJSON('/api/outfit', { userPrefs, occasionData, palette, wardrobe });

export const generateOutfitImage = async (selections, gender) =>
  (await postJSON('/api/outfit-image', { selections, gender })).url;
