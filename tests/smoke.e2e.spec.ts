import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true })
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true })

import { test, expect } from '@playwright/test';
import { createTestUser, deleteUserByEmail } from './helpers/db-utils';
import { loginAs } from './helpers/auth-utils';

const TEST_EMAIL = 'test-smoke-admin@veldra.local';
const TEST_PASSWORD = 'SmokeTestPassword123!';

test.describe('E2E Smoke Test', () => {
  test.beforeAll(async () => {
    // Seed the test user with Admin role
    await createTestUser(TEST_EMAIL, TEST_PASSWORD, 'Admin');
  });

  test.afterAll(async () => {
    // Clean up test user
    await deleteUserByEmail(TEST_EMAIL);
  });

  test('should log in programmatically and render the dashboard page', async ({ page, context, baseURL }) => {
    // Authenticate the browser context
    await loginAs(context, TEST_EMAIL, TEST_PASSWORD, baseURL);

    // Navigate to dashboard
    await page.goto('/');

    // Wait for the main page to load
    await expect(page.getByRole('main')).toBeVisible();

    // Verify dashboard heading is visible
    const heading = page.locator('h1', { hasText: 'Dashboard' });
    await expect(heading).toBeVisible();

    // Verify stats cards and sections are visible
    await expect(page.getByText('Active Cases')).toBeVisible();
    await expect(page.getByText('Pending Review')).toBeVisible();
    await expect(page.getByText('High-Priority Cases')).toBeVisible();
  });
});
