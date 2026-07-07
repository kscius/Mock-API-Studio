import { test, expect } from '@playwright/test';

test.describe('Mock API Studio E2E', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Mock API Studio');
  });

  test('should show login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByRole('link', { name: 'Sign up here' });
    await expect(registerLink).toBeVisible();
    await registerLink.click({ noWaitAfter: true });
    await expect(page).toHaveURL(/\/register/);
  });
});

