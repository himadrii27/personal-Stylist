import { postJSON } from './api';

export const getGeminiOutfit = (userPrefs, occasionData, palette) =>
  postJSON('/api/outfit', { userPrefs, occasionData, palette });

export const generateOutfitImage = async (selections, gender) =>
  (await postJSON('/api/outfit-image', { selections, gender })).url;
