import { searchCategoryProducts } from '../server/productSearch.js';
import { postHandler } from '../server/http.js';

export const POST = postHandler(async ({ itemName, budget }) =>
  ({ products: await searchCategoryProducts(process.env.RAPIDAPI_KEY, itemName, budget) }));
