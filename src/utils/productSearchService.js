import { postJSON } from './api';

export async function searchCategoryProducts(itemName, budget) {
  return (await postJSON('/api/products', { itemName, budget })).products;
}

export async function searchAllCategories(selections, budget) {
  const entries = Object.entries(selections).filter(([, v]) => v?.name);
  const results = await Promise.allSettled(
    entries.map(([cat, item]) => searchCategoryProducts(item.name, budget).then(products => ({ cat, products })))
  );

  const out = {};
  for (const r of results) {
    if (r.status === 'fulfilled') {
      out[r.value.cat] = r.value.products;
    }
  }
  return out;
}
