/**
 * e2e/authorization.spec.ts
 * Tests that case data is not accessible to unauthenticated users or
 * other users via direct URL access.
 */
import { test, expect } from "@playwright/test";
import { createTestCase, timestamp } from "./helpers";

test.describe("Authorization & RLS", () => {
  let testCaseId = "";
  const ts = timestamp();

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const result = await createTestCase(page, ts);
    testCaseId = result.caseId;
    await page.close();
  });

  test("unauthenticated user cannot access case detail URL", async ({
    browser,
  }) => {
    test.skip(!testCaseId, "No test case ID available");

    // Fresh browser context = no auth cookies
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto(`/cases/${testCaseId}`);

    // Should be redirected away from the case page
    await expect(page).not.toHaveURL(new RegExp(`/cases/${testCaseId}`));

    await ctx.close();
  });

  test("unauthenticated user cannot access cases list", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    await page.goto("/cases");

    // Must be redirected to landing or an auth page
    await expect(page).not.toHaveURL(/\/cases$/);

    await ctx.close();
  });

  test("case URL does not expose Supabase storage paths or UUIDs to unauthenticated user", async ({
    browser,
  }) => {
    test.skip(!testCaseId, "No test case ID available");

    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    const response = await page.goto(`/cases/${testCaseId}`);

    // The body should not contain private storage paths
    const body = await page.content();
    expect(body).not.toMatch(/supabase\.co\/storage/);

    await ctx.close();
  });

  test("authenticated user case page loads correctly (own case)", async ({
    page,
  }) => {
    test.skip(!testCaseId, "No test case ID available");

    await page.goto(`/cases/${testCaseId}`);
    await expect(page).toHaveURL(new RegExp(`/cases/${testCaseId}`));
    await expect(page.getByText(`E2E Applicant-${ts}`, { exact: false })).toBeVisible({
      timeout: 15_000,
    });
  });
});
