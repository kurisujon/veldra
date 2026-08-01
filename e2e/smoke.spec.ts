/**
 * e2e/smoke.spec.ts
 * Basic reachability and page-load checks across all main routes.
 */
import { test, expect } from "@playwright/test";
import { attachErrorCapture, assertNoErrors } from "./helpers";

test.describe("Smoke — Route Reachability", () => {
  test("landing page loads", async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/Veldra/i);
    await expect(page.getByRole("main")).toBeVisible();
    assertNoErrors(errors);
  });

  test("dashboard loads when authenticated", async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/(dashboard|cases)/);
    assertNoErrors(errors);
  });

  test("/cases route loads", async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto("/cases");
    // Should see heading or case list
    await expect(
      page.getByRole("heading", { name: /cases/i }).first()
    ).toBeVisible({ timeout: 15_000 });
    assertNoErrors(errors);
  });

  test("/drafts route loads", async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto("/drafts");
    await expect(page).not.toHaveURL(/login|sign-in/);
    await expect(page.locator("main, [data-testid]").first()).toBeVisible({
      timeout: 15_000,
    });
    assertNoErrors(errors);
  });

  test("/exports route loads", async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto("/exports");
    await expect(page).not.toHaveURL(/login|sign-in/);
    await expect(page.locator("main, [data-testid]").first()).toBeVisible({
      timeout: 15_000,
    });
    assertNoErrors(errors);
  });

  test("/settings route loads", async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto("/settings");
    await expect(page).not.toHaveURL(/login|sign-in/);
    await expect(page.locator("main, [data-testid]").first()).toBeVisible({
      timeout: 15_000,
    });
    assertNoErrors(errors);
  });

  test("/analytics route loads", async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto("/analytics");
    await expect(page).not.toHaveURL(/login|sign-in/);
    await expect(page.locator("main, [data-testid]").first()).toBeVisible({
      timeout: 15_000,
    });
    assertNoErrors(errors);
  });

  test("unauthenticated access to /dashboard is redirected", async ({
    browser,
  }) => {
    // Open a fresh context with no auth state
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard");
    // Should land on a public page (landing or an auth wall), not the dashboard
    await expect(page).not.toHaveURL(/\/dashboard/);
    await ctx.close();
  });

  test("navigation sidebar links work on desktop", async ({ page }) => {
    await page.goto("/cases");
    // Sidebar should be present
    const sidebar = page.locator("nav, aside").first();
    await expect(sidebar).toBeVisible();
  });
});
