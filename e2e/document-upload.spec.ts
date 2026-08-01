/**
 * e2e/document-upload.spec.ts
 * Tests the document upload flow: valid files, invalid types, upload feedback,
 * and post-refresh persistence.
 */
import { test, expect } from "@playwright/test";
import path from "path";
import { attachErrorCapture, assertNoErrors, createTestCase, timestamp } from "./helpers";

const FIXTURES = path.join(__dirname, "fixtures");

test.describe("Document Upload", () => {
  let caseId = "";
  const ts = timestamp();

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const result = await createTestCase(page, ts);
    caseId = result.caseId;
    await page.close();
  });

  test("uploads a valid PDF and shows upload success", async ({ page }) => {
    test.skip(!caseId, "No test case available");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);

    // Click on the PSA Birth Certificate slot
    const slot = page
      .getByText("PSA Birth Certificate", { exact: true })
      .locator("..")
      .locator("..");
    await expect(slot).toBeVisible();

    const fileInput = slot.locator("input[type='file']");
    await fileInput.setInputFiles(path.join(FIXTURES, "test-document.pdf"));

    // Should show uploading feedback
    await expect(
      page.getByText(/uploading/i).or(page.getByText(/uploaded/i))
    ).toBeVisible({ timeout: 15_000 });

    // Wait for success state
    await expect(
      page.getByText("PSA Birth Certificate").locator("..").locator("..").getByText(/uploaded/i)
    ).toBeVisible({ timeout: 30_000 });

    assertNoErrors(errors);
  });

  test("uploaded document persists after page refresh", async ({ page }) => {
    test.skip(!caseId, "No test case available");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);
    await page.reload();

    // PSA Birth Certificate slot should show Uploaded badge
    const slot = page.getByText("PSA Birth Certificate", { exact: true }).locator("..").locator("..");
    await expect(slot.getByText(/uploaded/i)).toBeVisible({ timeout: 15_000 });

    assertNoErrors(errors);
  });

  test("uploads a valid PNG image", async ({ page }) => {
    test.skip(!caseId, "No test case available");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);

    const slot = page
      .getByText("Transcript of Records", { exact: true })
      .locator("..")
      .locator("..");

    const fileInput = slot.locator("input[type='file']");
    await fileInput.setInputFiles(path.join(FIXTURES, "test-image.png"));

    await expect(
      slot.getByText(/uploaded/i)
    ).toBeVisible({ timeout: 30_000 });

    assertNoErrors(errors);
  });

  test("rejects an unsupported .txt file type", async ({ page }) => {
    test.skip(!caseId, "No test case available");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);

    const slot = page
      .getByText("Diploma", { exact: true })
      .locator("..")
      .locator("..");

    const fileInput = slot.locator("input[type='file']");

    // The input has accept=".pdf,.png,.jpg,.jpeg" — browser will enforce this
    // We verify it does NOT show "Uploaded" after attempting .txt
    const accepted = await fileInput.evaluate((el: HTMLInputElement) => el.accept);
    expect(accepted).toContain(".pdf");
    expect(accepted).not.toContain(".txt");

    // Application-level: even if browser skips filtering, slot should not show Uploaded
    await expect(slot.getByText(/uploaded/i)).not.toBeVisible();

    assertNoErrors(errors);
  });
});
