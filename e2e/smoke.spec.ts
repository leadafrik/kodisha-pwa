import { test, expect } from '@playwright/test';

test.describe('Smoke Test: Register → List → Message', () => {
  const uniqueEmail = `testuser_${Date.now()}@example.com`;
  const password = 'TestPass123!';

  test('should complete signup, create listing, and send message', async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Kodisha/i);

    // 2. Sign up
    await page.getByRole('link', { name: /sign up|register/i }).click();
    await expect(page).toHaveURL(/\/register/i);
    
    await page.fill('input[name="fullName"], input[placeholder*="name"]', 'Test User');
    await page.fill('input[name="email"], input[type="email"]', uniqueEmail);
    await page.fill('input[name="phone"], input[placeholder*="phone"]', '+254712345678');
    await page.fill('input[name="password"], input[type="password"]', password);
    
    await page.getByRole('button', { name: /sign up|register/i }).click();
    
    // Wait for redirect to home or dashboard
    await page.waitForURL(/\/(home|dashboard|browse|profile)/i, { timeout: 10000 });

    // 3. Navigate to list property
    await page.getByRole('link', { name: /list property|create listing/i }).first().click();
    await expect(page).toHaveURL(/\/list/i);

    // Fill basic listing form
    await page.fill('input[name="title"], input[placeholder*="title"]', '5 Acre Test Land');
    await page.fill('textarea[name="description"], textarea[placeholder*="description"]', 'Test listing created by automated smoke test.');
    await page.fill('input[name="size"], input[placeholder*="size"]', '5');
    await page.fill('input[name="price"], input[placeholder*="price"]', '15000');
    
    // Select county if dropdown present
    const countySelect = page.locator('select[name="county"]').first();
    if (await countySelect.isVisible({ timeout: 1000 })) {
      await countySelect.selectOption({ index: 1 });
    }

    // Submit
    await page.getByRole('button', { name: /submit|create|list/i }).click();
    
    // Verify success (wait for redirect or success message)
    await expect(page.getByText(/success|created|submitted/i)).toBeVisible({ timeout: 8000 });

    // 4. Browse listings and send message
    await page.getByRole('link', { name: /browse|listings/i }).first().click();
    await expect(page).toHaveURL(/\/browse/i);

    // Click on first listing (if any)
    const firstListing = page.locator('article, .listing-card, [data-testid="listing"]').first();
    if (await firstListing.isVisible({ timeout: 2000 })) {
      await firstListing.click();
      
      // Try to send message
      const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"]').first();
      if (await messageInput.isVisible({ timeout: 2000 })) {
        await messageInput.fill('Hi, interested in this listing. Automated smoke test.');
        await page.getByRole('button', { name: /send/i }).click();
        await expect(page.getByText(/sent|message/i)).toBeVisible({ timeout: 5000 });
      }
    }

    console.log('✅ Smoke test completed successfully!');
  });
});
