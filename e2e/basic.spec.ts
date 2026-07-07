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

  test('should load register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1')).toContainText('Mock API Studio');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Inicia sesión' })).toBeVisible();
  });
});

