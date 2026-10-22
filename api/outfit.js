import { getGeminiOutfit } from '../server/gemini.js';
import { postHandler } from '../server/http.js';

export const POST = postHandler(({ userPrefs, occasionData }) =>
  getGeminiOutfit(process.env.GEMINI_API_KEY, userPrefs, occasionData));
