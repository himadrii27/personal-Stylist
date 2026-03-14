/**
 * TASK 2 — Visual regression / screenshot tests
 *
 * Captures baseline screenshots of key UI states and compares them
 * on subsequent runs to catch unintended visual regressions.
 *
 * Run: npx playwright test tests/visual-regression.spec.js --project=chromium
 * Update snapshots: npx playwright test tests/visual-regression.spec.js --update-snapshots
 */

import { test, expect } from '@playwright/test';

test.describe('Visual regression — Personal Stylist', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  // ── Hero section ────────────────────────────────────────────────────────────

  test('hero section renders correctly', async ({ page }) => {
    // Wait for garment cards to be visible
    await page.waitForSelector('[data-testid="garment-card"], .garment-card, canvas', {
      timeout: 8000,
    }).catch(() => {});

    await page.waitForTimeout(800); // let animations settle

    await expect(page).toHaveScreenshot('hero.png', {
      maxDiffPixels: 200,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });
  });

  test('hero garment card hover state', async ({ page }) => {
    // Hover over the first garment card if present
    const card = page.locator('.garment-card, [data-testid="garment-card"]').first();
    const count = await card.count();
    if (count > 0) {
      await card.hover();
      await page.waitForTimeout(400); // lens animation
    }

    await expect(page).toHaveScreenshot('hero-card-hover.png', {
      maxDiffPixels: 300,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });
  });

  // ── Preferences form ────────────────────────────────────────────────────────

  test('preferences form renders', async ({ page }) => {
    // Clear any saved prefs so the form shows
    await page.evaluate(() => localStorage.removeItem('personalStylistPrefs'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Scroll past hero to reveal preferences
    await page.keyboard.press('End');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('preferences-form.png', {
      maxDiffPixels: 200,
    });
  });

  // ── Occasion form ───────────────────────────────────────────────────────────

  test('occasion form visible after prefs saved', async ({ page }) => {
    // Inject saved preferences so OccasionForm shows directly
    await page.evaluate(() => {
      localStorage.setItem('personalStylistPrefs', JSON.stringify({
        gender: 'any',
        minimal_loud: 50,
        fitted_oversized: 50,
        classic_experimental: 50,
        soft_edgy: 50,
        casual_glam: 50,
      }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.keyboard.press('End');
    await page.waitForTimeout(600);

    await expect(page).toHaveScreenshot('occasion-form.png', {
      maxDiffPixels: 200,
    });
  });

  // ── Recommendation view ─────────────────────────────────────────────────────

  test('recommendation builder shows after form submit', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('personalStylistPrefs', JSON.stringify({
        gender: 'any',
        minimal_loud: 50,
        fitted_oversized: 50,
        classic_experimental: 50,
        soft_edgy: 50,
        casual_glam: 50,
      }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.keyboard.press('End');
    await page.waitForTimeout(400);

    // Fill and submit occasion form
    const occasionInput = page.locator('input[type="text"], textarea').first();
    if (await occasionInput.count() > 0) {
      await occasionInput.fill('music festival');
    }

    const submitBtn = page.locator('button[type="submit"], button:has-text("Stylize")').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(800);
    }

    await expect(page).toHaveScreenshot('recommendation-builder.png', {
      maxDiffPixels: 300,
    });
  });
});
