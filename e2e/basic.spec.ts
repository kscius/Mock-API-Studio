import { test, expect } from '@playwright/test';

test.describe('Mock API Studio E2E', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Mock API Studio');
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.locator('a:has-text("Register")');
    
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/\/register/);
    }
  });
});

