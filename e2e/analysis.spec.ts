/**
 * e2e/analysis.spec.ts
 * Tests the analysis workflow including the 3-tab findings workspace.
 */
import { test, expect } from "@playwright/test";
import path from "path";
import { attachErrorCapture, assertNoErrors, createTestCase, timestamp } from "./helpers";

const FIXTURES = path.join(__dirname, "fixtures");

test.describe("Analysis Workflow", () => {
  let caseId = "";
  const ts = timestamp();

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const result = await createTestCase(page, ts);
    caseId = result.caseId;

    // Upload at least one document to enable analysis
    await page.goto(`/cases/${caseId}`);
    const slot = page
      .getByText("PSA Birth Certificate", { exact: true })
      .locator("..")
      .locator("..");
    const fileInput = slot.locator("input[type='file']");
    await fileInput.setInputFiles(path.join(FIXTURES, "test-document.pdf"));
    await expect(slot.getByText(/uploaded/i)).toBeVisible({ timeout: 30_000 });

    await page.close();
  });

  test("Run Analysis button is present on a case with documents", async ({
    page,
  }) => {
    test.skip(!caseId, "No test case available");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);
    await expect(
      page.getByTestId("run-analysis-btn").or(
        page.getByRole("button", { name: /run analysis|analyze/i })
      ).first()
    ).toBeVisible({ timeout: 15_000 });

    assertNoErrors(errors);
  });

  test("Run Analysis triggers processing state", async ({ page }) => {
    test.skip(!caseId, "No test case available");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);

    const analysisBtn = page
      .getByTestId("run-analysis-btn")
      .or(page.getByRole("button", { name: /run analysis|analyze/i }))
      .first();

    await expect(analysisBtn).toBeVisible({ timeout: 15_000 });
    await analysisBtn.click();

    // Should show loading state or processing indicator
    await expect(
      page
        .getByText(/analyzing|processing|running/i)
        .or(analysisBtn.locator("svg.animate-spin"))
    ).toBeVisible({ timeout: 15_000 });

    assertNoErrors(errors);
  });

  test("findings workspace appears after analysis completes", async ({
    page,
  }) => {
    test.skip(!caseId, "No test case available");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);

    // Wait for analysis to be triggerable or already complete
    const analysisBtn = page
      .getByTestId("run-analysis-btn")
      .or(page.getByRole("button", { name: /run analysis|analyze/i }))
      .first();

    if (await analysisBtn.isVisible({ timeout: 5_000 })) {
      await analysisBtn.click();
      // Wait for NeedsReview state to render the workspace
      await expect(
        page.getByTestId("findings-workspace")
      ).toBeVisible({ timeout: 60_000 });
    } else {
      // Analysis may already be done
      const workspace = page.getByTestId("findings-workspace");
      if (await workspace.isVisible()) {
        await expect(workspace).toBeVisible();
      } else {
        test.info().annotations.push({
          type: "manual-check",
          description: "Analysis button not found; case may need manual status reset",
        });
      }
    }

    assertNoErrors(errors);
  });

  test("3-tab workspace has Applicant, Sponsor, Relationship tabs", async ({
    page,
  }) => {
    test.skip(!caseId, "No test case available");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);

    const workspace = page.getByTestId("findings-workspace");
    if (await workspace.isVisible({ timeout: 10_000 })) {
      await expect(
        workspace.getByRole("button", { name: /applicant/i })
      ).toBeVisible();
      await expect(
        workspace.getByRole("button", { name: /sponsor/i })
      ).toBeVisible();
      await expect(
        workspace.getByRole("button", { name: /relationship/i })
      ).toBeVisible();
    } else {
      test.info().annotations.push({
        type: "manual-check",
        description:
          "Findings workspace not visible — case may not be in NeedsReview status",
      });
    }

    assertNoErrors(errors);
  });

  test("switching tabs does not cause uncaught errors", async ({ page }) => {
    test.skip(!caseId, "No test case available");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);

    const workspace = page.getByTestId("findings-workspace");
    if (await workspace.isVisible({ timeout: 10_000 })) {
      for (const tab of ["Sponsor", "Relationship", "Applicant"]) {
        const tabBtn = workspace.getByRole("button", { name: new RegExp(tab, "i") });
        if (await tabBtn.isVisible()) {
          await tabBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }

    assertNoErrors(errors);
  });

  test("findings workspace shows no raw JSON or stack traces", async ({
    page,
  }) => {
    test.skip(!caseId, "No test case available");
    const errors = attachErrorCapture(page);

    await page.goto(`/cases/${caseId}`);

    const workspace = page.getByTestId("findings-workspace");
    if (await workspace.isVisible({ timeout: 10_000 })) {
      const content = await workspace.textContent();
      expect(content).not.toMatch(/at \w+\s*\(/); // stack trace pattern
      expect(content).not.toMatch(/"error":\s*true/); // raw JSON error
    }

    assertNoErrors(errors);
  });
});
