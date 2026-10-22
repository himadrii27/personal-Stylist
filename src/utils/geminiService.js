import { postJSON } from './api';

export const getGeminiOutfit = (userPrefs, occasionData) =>
  postJSON('/api/outfit', { userPrefs, occasionData });

export const generateOutfitImage = async (selections, gender) =>
  (await postJSON('/api/outfit-image', { selections, gender })).url;
