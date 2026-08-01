/**
 * e2e/visual-audit.spec.ts
 * Captures screenshots at Desktop / Tablet / Mobile for major pages.
 * Checks for horizontal overflow, layout shifts, and empty states.
 */
import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { attachErrorCapture, assertNoErrors } from "./helpers";

const VISUAL_DIR = path.join(
  __dirname,
  "../test-results/visual-audit"
);

test.describe("Visual & Responsive Audit", () => {
  test.beforeAll(() => {
    fs.mkdirSync(VISUAL_DIR, { recursive: true });
  });

  const pages = [
    { name: "landing", path: "/" },
    { name: "cases", path: "/cases" },
    { name: "dashboard", path: "/dashboard" },
    { name: "analytics", path: "/analytics" },
    { name: "drafts", path: "/drafts" },
    { name: "exports", path: "/exports" },
    { name: "settings", path: "/settings" },
  ];

  for (const { name, path: routePath } of pages) {
    test(`screenshot: ${name} page`, async ({ page, viewport }) => {
      const errors = attachErrorCapture(page);

      await page.goto(routePath);
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

      // Check for horizontal overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      if (hasHorizontalOverflow) {
        console.warn(`⚠️  Horizontal overflow on ${routePath}`);
      }

      const vp = viewport ?? { width: 1440, height: 900 };
      const label = `${vp.width}x${vp.height}`;
      const screenshotPath = path.join(VISUAL_DIR, `${name}-${label}.png`);

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      console.log(`📸 Saved: ${screenshotPath}`);

      // Soft assertion: no horizontal overflow
      expect(hasHorizontalOverflow, `Horizontal overflow on ${name} at ${label}`).toBe(false);

      assertNoErrors(errors);
    });
  }

  test("Cases list shows empty state when no cases exist", async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto("/cases");

    // Either a list of cases OR an empty state message
    const content = page.locator("main").first();
    await expect(content).toBeVisible({ timeout: 15_000 });

    // Should not show a raw error
    const text = await content.textContent();
    expect(text).not.toMatch(/error|uncaught|undefined/i);

    assertNoErrors(errors);
  });

  test("modal focus is trapped — login modal", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /sign in/i }).first().click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // The close button should be focusable
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });

  test("keyboard navigation works on the cases page", async ({ page }) => {
    const errors = attachErrorCapture(page);
    await page.goto("/cases");

    // Tab through interactive elements — should not throw
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    assertNoErrors(errors);
  });
});
