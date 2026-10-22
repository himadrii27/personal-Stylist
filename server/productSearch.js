// Server-only: runs inside /api/products so the RapidAPI key never reaches the browser.
const RAPIDAPI_HOST = 'real-time-product-search.p.rapidapi.com';

const BUDGET_PARAMS = {
  '₹2,000':   { max_price: 2000 },
  '₹5,000':   { max_price: 5000 },
  '₹10,000':  { max_price: 10000 },
  '₹20,000+': { min_price: 20000 },
};

export async function searchCategoryProducts(apiKey, itemName, budget) {
  if (!apiKey) throw new Error('RapidAPI key not configured.');
  if (typeof itemName !== 'string' || !itemName.trim()) throw new Error('Missing product name.');

  const priceParams = BUDGET_PARAMS[budget] || {};
  const params = new URLSearchParams({
    q: itemName.slice(0, 120),
    country: 'in',
    language: 'en',
    page: '1',
    limit: '3',
    sort_by: 'BEST_MATCH',
    product_condition: 'ANY',
  });
  if (priceParams.max_price) params.set('max_price', priceParams.max_price);
  if (priceParams.min_price) params.set('min_price', priceParams.min_price);

  const response = await fetch(
    `https://${RAPIDAPI_HOST}/search-v2?${params}`,
    {
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': apiKey,
      },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || `Product search failed (${response.status})`);
  }

  const data = await response.json();
  return (data?.data?.products || []).slice(0, 3).map((p) => ({
    title: p.product_title || 'Untitled',
    price: p.product_price || '',
    image: p.product_photos?.[0] || null,
    // prefer direct store link; fall back to Google Shopping URL
    url:   p.offer?.offer_page_url || p.product_url || null,
    store: p.offer?.store_name || '',
  }));
}
