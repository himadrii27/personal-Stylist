// Wardrobe hub: tabs, today, builder, insights, wear log, DB upgrade, and the event stylist using owned pieces.
// Seeds IndexedDB with drawn cut-outs; Gemini, product search and the weather API are mocked.
import { test, expect } from '@playwright/test';

const PIECES = [
  { category: 'top', hex: '#F4F3EE', name: 'White shirt', warmth: 'light', dressiness: 'smart' },
  { category: 'top', hex: '#B5542C', name: 'Rust knit', warmth: 'warm', dressiness: 'casual' },
  { category: 'top', hex: '#2F3D5C', name: 'Navy tee', warmth: 'light', dressiness: 'casual' },
  { category: 'bottom', hex: '#2E3A55', name: 'Dark jeans', warmth: 'mid', dressiness: 'casual' },
  { category: 'bottom', hex: '#C8B48F', name: 'Beige chinos', warmth: 'mid', dressiness: 'smart' },
  { category: 'outerwear', hex: '#B98B5E', name: 'Camel coat', warmth: 'warm', dressiness: 'smart' },
  { category: 'shoes', hex: '#F2F2F0', name: 'White sneakers', warmth: 'mid', dressiness: 'casual' },
  { category: 'dress', hex: '#1A1A1A', name: 'Black dress', warmth: 'light', dressiness: 'dressy' },
];

// draws a simple garment shape per category and stores it like the app would
async function seed(page, { version = 2, pieces = PIECES, ageDays = 0, prefs = true, palette = null } = {}) {
  await page.goto('/');
  await page.evaluate(async ({ version, pieces, ageDays, prefs, palette }) => {
    localStorage.clear();
    if (prefs) localStorage.setItem('personalStylistPrefs', JSON.stringify({ gender: 'Feminine', age: 'Gen Z', sliders: { minimalLoud: 50, fittedOversized: 50, classicTrendy: 50, sportyPolished: 50, safeExperimental: 50 } }));
    if (palette) localStorage.setItem('personalStylistPalette', JSON.stringify(palette));
    await new Promise((res, rej) => { const r = indexedDB.deleteDatabase('personal-stylist-wardrobe'); r.onsuccess = res; r.onerror = rej; r.onblocked = res; });
    const paths = {
      top: 'M60 40 L120 20 L180 20 L240 40 L230 110 L205 100 L205 300 L95 300 L95 100 L70 110 Z',
      outerwear: 'M50 40 L120 15 L180 15 L250 40 L250 320 L50 320 Z',
      dress: 'M110 20 L190 20 L200 110 L260 340 L40 340 L100 110 Z',
      bottom: 'M80 20 L220 20 L230 340 L170 340 L150 120 L130 340 L70 340 Z',
      shoes: 'M30 200 L150 160 L270 200 L270 260 L30 260 Z',
      accessory: 'M150 60 A90 90 0 1 0 150.1 60 Z',
    };
    const blobs = [];
    for (const p of pieces) {
      const c = document.createElement('canvas'); c.width = 300; c.height = 360;
      const g = c.getContext('2d'); g.fillStyle = p.hex; g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3;
      const path = new Path2D(paths[p.category]); g.fill(path); g.stroke(path);
      blobs.push(await new Promise(r => c.toBlob(r, 'image/png')));
    }
    await new Promise((res, rej) => {
      const req = indexedDB.open('personal-stylist-wardrobe', version);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('items', { keyPath: 'id' }).createIndex('createdAt', 'createdAt');
        if (version >= 2) req.result.createObjectStore('outfits', { keyPath: 'id' });
      };
      req.onsuccess = () => {
        const t = req.result.transaction('items', 'readwrite');
        const now = Date.now();
        pieces.forEach((p, i) => {
          const item = { id: `seed-${i}`, name: p.name, category: p.category, colour: { hex: p.hex, name: p.name.split(' ')[0] }, image: blobs[i], width: 300, height: 360, createdAt: now - ageDays * 864e5 + i };
          if (version >= 2) Object.assign(item, { warmth: p.warmth, dressiness: p.dressiness });
          t.objectStore('items').put(item);
        });
        t.oncomplete = () => { req.result.close(); res(); };
        t.onerror = () => rej(t.error);
      };
      req.onerror = () => rej(req.error);
    });
  }, { version, pieces, ageDays, prefs, palette });
  await page.reload();
}

async function openWardrobe(page) {
  await page.locator('.hp-nav-cell', { hasText: 'Wardrobe' }).click();
  await expect(page.getByRole('heading', { name: 'My wardrobe' })).toBeVisible();
}

test('v1 wardrobe upgrades: old pieces keep working and get default tags', async ({ page }) => {
  await seed(page, { version: 1 });
  await openWardrobe(page);
  await expect(page.getByText(`${PIECES.length} pieces`)).toBeVisible();
  await page.getByRole('tab', { name: /Pieces/ }).click();
  await page.getByRole('radio', { name: 'Grid' }).click();
  await page.getByRole('button', { name: 'Camel coat, open' }).click();
  await expect(page.getByRole('radiogroup', { name: 'Warmth' }).getByRole('radio', { name: 'Warm' })).toHaveAttribute('aria-checked', 'true');
});

test('today: weather + dressiness drive three outfit ideas; wear logs with undo', async ({ page }) => {
  await seed(page);
  await openWardrobe(page);
  await page.getByRole('button', { name: 'What do I wear today?' }).click();
  await expect(page.getByRole('tab', { name: /Outfits/ })).toHaveAttribute('aria-selected', 'true');
  const ideas = page.locator('.wd-idea');
  await expect(ideas).toHaveCount(3);

  await page.getByRole('radio', { name: 'Cold' }).click();
  await expect(ideas.first()).toContainText(/warm layer/i);
  await page.getByRole('radio', { name: 'Hot' }).click();
  await expect(ideas.first().locator('.wd-reasons')).not.toContainText(/too warm/i);
  await page.getByRole('radio', { name: 'Dressy' }).click();
  await expect(ideas.first().getByRole('img')).toHaveAttribute('aria-label', /Black dress/);

  await ideas.first().getByRole('button', { name: 'Wear today' }).click();
  await expect(page.getByRole('status')).toContainText('Logged today’s outfit');
  await expect(ideas.first().getByRole('button', { name: 'Wearing it' })).toBeDisabled();
  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();
  await expect(ideas.first().getByRole('button', { name: 'Wear today' })).toBeEnabled();
});

test('use my location fills the weather from the forecast', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 19.0761, longitude: 72.8777 });
  let asked = '';
  await page.route('https://api.open-meteo.com/**', (r) => { asked = r.request().url(); r.fulfill({ json: { current: { temperature_2m: 31.4, precipitation: 0, weather_code: 1 } } }); });
  await seed(page);
  await openWardrobe(page);
  await page.getByRole('tab', { name: /Outfits/ }).click();
  await page.getByRole('button', { name: 'Use my location' }).click();
  await expect(page.getByRole('radio', { name: /Hot · 31°/ })).toHaveAttribute('aria-checked', 'true');
  expect(asked).toContain('latitude=19.1');           // rounded before it leaves the device
  expect(asked).toContain('longitude=72.9');
});

test('builder: step through slots, verdict updates, save → edit → delete with undo', async ({ page }) => {
  await seed(page);
  await openWardrobe(page);
  await page.getByRole('tab', { name: /Outfits/ }).click();
  const board = page.locator('#wd-board');
  await expect(board.getByRole('button', { name: 'Save outfit' })).toBeDisabled();
  await board.getByRole('button', { name: 'Next top or dress' }).click();
  await board.getByRole('button', { name: 'Next bottom' }).click();
  await expect(board.locator('.wd-verdict')).toBeVisible();
  // a dress makes the bottom unnecessary
  const topSlot = board.locator('.wd-slot').nth(1);
  await topSlot.locator('.wd-slot-current').click();
  await topSlot.getByRole('option', { name: 'Black dress' }).click();
  await expect(board.getByText('Not needed with a dress')).toBeVisible();
  await board.getByRole('textbox', { name: 'Outfit name' }).fill('Gallery night');
  await board.getByRole('button', { name: 'Save outfit' }).click();
  const saved = page.locator('.wd-outfit', { hasText: 'Gallery night' });
  await expect(saved).toBeVisible();

  await saved.getByRole('button', { name: 'Edit Gallery night' }).click();
  await expect(board.getByRole('button', { name: 'Update outfit' })).toBeVisible();
  await board.getByRole('textbox', { name: 'Outfit name' }).fill('Gallery night out');
  await board.getByRole('button', { name: 'Update outfit' }).click();
  await expect(page.locator('.wd-outfit', { hasText: 'Gallery night out' })).toHaveCount(1);

  await page.getByRole('button', { name: 'Delete Gallery night out' }).click();
  await expect(page.locator('.wd-outfit')).toHaveCount(0);
  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.wd-outfit')).toHaveCount(1);

  // persists across reloads
  await page.reload();
  await openWardrobe(page);
  await page.getByRole('tab', { name: /Outfits/ }).click();
  await expect(page.locator('.wd-outfit', { hasText: 'Gallery night out' })).toBeVisible();
});

test('piece detail: tags, price, wore it today, style this piece', async ({ page }) => {
  await seed(page);
  await openWardrobe(page);
  await page.getByRole('radio', { name: 'Grid' }).click();
  await page.getByRole('button', { name: 'Dark jeans, open' }).click();
  const sheet = page.getByRole('dialog', { name: 'Dark jeans' });
  await sheet.getByRole('radiogroup', { name: 'Dressiness' }).getByRole('radio', { name: 'Smart' }).click();
  await sheet.getByRole('textbox', { name: 'Price in rupees' }).fill('2400');
  await sheet.getByRole('textbox', { name: 'Price in rupees' }).press('Enter');
  await sheet.getByRole('button', { name: 'Wore it today' }).click();
  await expect(sheet.getByRole('button', { name: 'Worn today' })).toBeDisabled();
  await expect(sheet).toContainText('Worn 1×');
  await sheet.getByRole('button', { name: 'Style this piece' }).click();
  const board = page.locator('#wd-board');
  await expect(board.locator('.wd-slot').nth(2)).toContainText('Dark jeans');
  await board.getByRole('button', { name: 'Shuffle' }).click();
  await expect(board.locator('.wd-slot').nth(2)).toContainText('Dark jeans');   // the styled piece stays put

  await page.getByRole('tab', { name: /Insights/ }).click();
  await expect(page.getByText('1 wear logged')).toBeVisible();
  await expect(page.locator('.wd-rank-row', { hasText: 'Dark jeans' }).last()).toContainText('₹2,400');
});

test('insights: colour check needs a season; gaps shop via products API', async ({ page }) => {
  await page.route('**/api/products', (r) => r.fulfill({ json: { products: [{ title: 'Leather loafer', price: '₹3,499', image: null, url: 'https://example.com/a', store: 'Shop' }] } }));
  await seed(page, { pieces: PIECES.filter(p => p.category !== 'shoes') });
  await openWardrobe(page);
  await page.getByRole('tab', { name: /Insights/ }).click();
  await expect(page.getByRole('button', { name: 'Find my colours' })).toBeVisible();
  const gaps = page.locator('.wd-gap');
  await expect(gaps.first()).toBeVisible();
  expect(await gaps.count()).toBeLessThanOrEqual(3);
  await expect(gaps.first()).toContainText(/don't own any shoes/);
  await gaps.first().getByRole('button', { name: '₹5,000' }).click();
  await expect(gaps.first().getByRole('link', { name: /Leather loafer/ })).toHaveAttribute('href', 'https://example.com/a');

  // with a saved season the colour check rates every piece
  await seed(page, { palette: { seasonId: 'warm-autumn', at: Date.now(), source: 'photo' } });
  await openWardrobe(page);
  await page.getByRole('tab', { name: /Insights/ }).click();
  await expect(page.getByText(/% of your wardrobe suits you/)).toBeVisible();
  await expect(page.getByText('Warm Autumn', { exact: true })).toBeVisible();
});

test('sleepers show after two months unworn, with a way to style them', async ({ page }) => {
  await seed(page, { ageDays: 90 });
  await openWardrobe(page);
  await page.getByRole('radio', { name: 'Grid' }).click();
  await page.getByRole('button', { name: 'White shirt, open' }).click();
  await page.getByRole('button', { name: 'Wore it today' }).click();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('tab', { name: /Insights/ }).click();
  const sleepers = page.locator('.wd-sleeper');
  await expect(sleepers.first()).toBeVisible();
  await expect(page.locator('.wd-sleeper', { hasText: 'White shirt' })).toHaveCount(0);
  await sleepers.first().getByRole('button', { name: 'Style it' }).click();
  await expect(page.locator('#wd-board')).toBeInViewport();
});

test('too few pieces: outfits tab explains what to add', async ({ page }) => {
  await seed(page, { pieces: PIECES.filter(p => p.category === 'shoes') });
  await openWardrobe(page);
  await page.getByRole('tab', { name: /Outfits/ }).click();
  await expect(page.getByText('A few more pieces and we can dress you.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add a top' })).toBeVisible();
});

test('event stylist: wardrobe toggle sends pieces as text; result shows owned pieces and shops only the gaps', async ({ page }) => {
  let sent = null;
  const searched = [];
  await page.route('**/api/outfit', async (r) => {
    sent = r.request().postDataJSON();
    const ref = (cat) => (sent.wardrobe || []).find(p => p.category === cat)?.ref || '';
    await r.fulfill({ json: {
      outfit_name: 'Easy dinner', outfit_description: 'Your rust knit with dark jeans.', style_tags: ['Warm'],
      from_wardrobe: { top: ref('top'), bottom: ref('bottom'), outerwear: '', footwear: ref('shoes'), accessories: [] },
      clothing_options: Object.fromEntries(['top', 'bottom', 'outerwear', 'footwear'].map(c => [c, [1, 2, 3, 4].map(i => ({ name: `${c} option ${i}`, description: 'd' }))])),
      mandatory_accessories: ['Gold hoops'], general_crowd_style: { description: '', typical_items: [] }, mandatory_survival_items: [], stylist_tip: 'Tip',
    } });
  });
  await page.route('**/api/products', async (r) => { searched.push(r.request().postDataJSON().itemName); await r.fulfill({ json: { products: [] } }); });
  await seed(page);
  await page.locator('.hp-nav-cta').click();
  const sw = page.getByRole('switch', { name: /Style me from my wardrobe/ });
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await page.getByPlaceholder('e.g. Mumbai, New York, Tokyo').fill('Mumbai');
  await expect(page.getByRole('button', { name: 'Continue to Style' })).toBeEnabled();
  await page.getByRole('button', { name: 'Continue to Style' }).click();
  await page.getByRole('button', { name: /Stylize Me/ }).click();

  await expect(page.getByText('Shop the Gaps')).toBeVisible();
  expect(sent.wardrobe.length).toBe(PIECES.length);
  sent.wardrobe.forEach(p => { expect(p.ref).toMatch(/^w\d+$/); expect(p).not.toHaveProperty('id'); expect(p).not.toHaveProperty('image'); });
  await expect(page.getByText(/3 of 4/)).toBeVisible();
  await expect(page.getByText('YOURS').first()).toBeVisible();
  await page.getByRole('button', { name: '₹5,000' }).click();
  await expect.poll(() => searched.length).toBe(1);
  expect(searched).toEqual(['outerwear option 1']);    // only the slot the wardrobe couldn't fill

  await page.getByRole('button', { name: /Log your pieces/ }).click();
  await expect(page.getByRole('button', { name: /Logged as worn today/ })).toBeDisabled();

  // switching it off sends no wardrobe
  await page.locator('.hp-nav-cta', { hasText: 'Brief' }).click();
  await page.getByRole('switch', { name: /Style me from my wardrobe/ }).click();
  await page.getByPlaceholder('e.g. Mumbai, New York, Tokyo').fill('Mumbai');   // the brief starts fresh
  await page.getByRole('button', { name: 'Continue to Style' }).click();
  await page.getByRole('button', { name: /Stylize Me/ }).click();
  await expect(page.getByText('Shop This Look')).toBeVisible();
  expect(sent.wardrobe).toBeUndefined();
});

test('phone layout: no horizontal scroll on the hub', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await seed(page);
  await openWardrobe(page);
  for (const tab of ['Pieces', 'Outfits', 'Insights']) {
    await page.getByRole('tab', { name: new RegExp(tab) }).click();
    await page.waitForTimeout(300);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(over, tab).toBeLessThanOrEqual(0);
  }
});
