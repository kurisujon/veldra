import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

import { test, expect } from '@playwright/test';
import { createTestUser, deleteUserByEmail } from './helpers/db-utils';
import { loginAs } from './helpers/auth-utils';

const TEST_EMAIL = 'test-dashboard-admin@veldra.local';
const TEST_PASSWORD = 'DashboardAdminPassword123!';

test.describe('Dashboard E2E Tests', () => {
  test.beforeAll(async () => {
    // Setup test user with Admin role
    await createTestUser(TEST_EMAIL, TEST_PASSWORD, 'Admin');
  });

  test.afterAll(async () => {
    // Clean up test user
    await deleteUserByEmail(TEST_EMAIL);
  });

  test('should log in and render dashboard components correctly', async ({ page, context, baseURL }) => {
    // Log in programmatically
    await loginAs(context, TEST_EMAIL, TEST_PASSWORD, baseURL);

    // Navigate to dashboard
    await page.goto('/');

    // Wait for the main content to render
    await expect(page.getByRole('main')).toBeVisible();

    // Assert the header title "Dashboard" is visible
    const heading = page.locator('h1', { hasText: 'Dashboard' });
    await expect(heading).toBeVisible();

    // Assert that the four mock stats cards are visible
    await expect(page.getByText('Active Cases')).toBeVisible();
    await expect(page.getByText('Pending Review')).toBeVisible();
    await expect(page.getByText('Resolved Today')).toBeVisible();
    await expect(page.getByText('Avg. Processing Time')).toBeVisible();

    // Assert that the "High-Priority Cases" card/section is visible and displays cases
    const highPrioritySection = page.locator('h2', { hasText: 'High-Priority Cases' });
    await expect(highPrioritySection).toBeVisible();
    
    // Check that there is at least one case card shown (either mock or real case)
    const caseElement = page.locator('text=Case ID:').first();
    await expect(caseElement).toBeVisible();

    // Assert that the "Recent Activity" card/section is visible and displays recent system events
    const recentActivitySection = page.locator('h2', { hasText: 'Recent Activity' });
    await expect(recentActivitySection).toBeVisible();
    
    // Check that recent system activities are rendered (e.g., matching mock content or any activity log)
    const activityElement = page.getByText('TOR Uploaded').first();
    await expect(activityElement).toBeVisible();
  });
});
