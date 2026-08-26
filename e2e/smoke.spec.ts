import { test, expect } from '@playwright/test';

test('landing page renders the sign-in card', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Jeet Yet?')).toBeVisible();
  await expect(page.getByText('Sign In', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Sign in with Google' }),
  ).toBeVisible();
});
