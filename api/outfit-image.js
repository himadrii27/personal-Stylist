import { generateOutfitImage } from '../server/gemini.js';
import { postHandler } from '../server/http.js';

export const POST = postHandler(async ({ selections, gender }) =>
  ({ url: await generateOutfitImage(process.env.GEMINI_API_KEY, selections, gender) }));
