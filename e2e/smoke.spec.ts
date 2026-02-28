import { test, expect, devices } from '@playwright/test';

test.describe('Smoke Test: Public conversion paths', () => {
  test('should expose core guest flows on desktop and mobile', async ({ page, browser }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Agrisoko/i);
    await expect(page.getByRole('link', { name: 'Listings', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Buy Requests', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up free|create free account/i }).first()).toBeVisible();

    await page.goto('/browse');
    await expect(page).toHaveURL(/\/browse/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(/Marketplace|Browse/i);

    await page.goto('/request');
    await expect(page).toHaveURL(/\/request/);

    await page.goto('/login?mode=signup&next=/browse');
    await expect(page).toHaveURL(/mode=signup/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('select')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /create free account/i })).toBeVisible();

    const context = await browser.newContext({ ...devices['iPhone 12'] });
    const mobilePage = await context.newPage();
    await mobilePage.goto('/');
    await mobilePage.getByRole('button', { name: /open menu/i }).click();
    await expect(mobilePage.getByRole('link', { name: 'Sell', exact: true })).toBeVisible();
    await expect(mobilePage.getByRole('link', { name: 'About', exact: true })).toBeVisible();
    await context.close();
  });
});
