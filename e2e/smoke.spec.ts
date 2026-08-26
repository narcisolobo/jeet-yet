import { test, expect } from '@playwright/test';

test('landing page links through to the sign-in card', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Jeet Yet?')).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Sign in to begin.' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Sign in to begin.' }).click();

  await expect(page).toHaveURL(/\/auth\/sign-in/);
  await expect(page.getByText('Sign In', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Sign in with Google' }),
  ).toBeVisible();
});
