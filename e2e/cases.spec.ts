/**
 * e2e/cases.spec.ts
 * Full case-management lifecycle: create → verify → persist → cleanup.
 */
import { test, expect } from "@playwright/test";
import { attachErrorCapture, assertNoErrors, createTestCase, timestamp } from "./helpers";

test.describe("Case Management", () => {
  let caseId = "";
  const ts = timestamp();

  test("creates a new case with unique applicant name", async ({ page }) => {
    const errors = attachErrorCapture(page);

    const { firstName, lastName, caseId: id } = await createTestCase(page, ts);
    caseId = id;

    // Case detail page should be visible
    await expect(page.getByText(firstName, { exact: false })).toBeVisible();
    await expect(page.getByText(lastName, { exact: false })).toBeVisible();

    // URL must contain a valid UUID
    expect(page.url()).toMatch(/\/cases\/[a-f0-9-]{36}/);

    assertNoErrors(errors);
  });

  test("created case appears in the cases list", async ({ page }) => {
    const errors = attachErrorCapture(page);

    await page.goto("/cases");
    await expect(
      page.getByRole("heading", { name: /cases/i }).first()
    ).toBeVisible();

    // The case we created should appear in the list
    await expect(
      page.getByText(`E2E Applicant-${ts}`, { exact: false })
    ).toBeVisible({ timeout: 10_000 });

    assertNoErrors(errors);
  });

  test("case detail page renders applicant info", async ({ page }) => {
    test.skip(!caseId, "Case ID not set — skipping dependent test");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);
    await expect(
      page.getByText(`E2E Applicant-${ts}`, { exact: false })
    ).toBeVisible({ timeout: 15_000 });

    assertNoErrors(errors);
  });

  test("case persists after page refresh", async ({ page }) => {
    test.skip(!caseId, "Case ID not set — skipping dependent test");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);
    await page.reload();
    await expect(
      page.getByText(`E2E Applicant-${ts}`, { exact: false })
    ).toBeVisible({ timeout: 15_000 });

    assertNoErrors(errors);
  });

  test("case URL contains the created case identifier", async ({ page }) => {
    test.skip(!caseId, "Case ID not set — skipping dependent test");
    await page.goto(`/cases/${caseId}`);
    expect(page.url()).toContain(caseId);
  });

  test("modal closes when Cancel is clicked", async ({ page }) => {
    const errors = attachErrorCapture(page);

    await page.goto("/cases");
    await page.getByRole("button", { name: /new case/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    assertNoErrors(errors);
  });

  test("required fields are validated before submission", async ({ page }) => {
    const errors = attachErrorCapture(page);

    await page.goto("/cases");
    await page.getByRole("button", { name: /new case/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Try to submit without filling in required fields
    await page.getByRole("button", { name: /create case/i }).click();

    // Should remain on modal (browser native validation or app error)
    await expect(page.getByRole("dialog")).toBeVisible();

    assertNoErrors(errors);
  });
});
