/**
 * e2e/helpers.ts
 * Shared utilities for the E2E suite.
 * - Console/network error capture
 * - QA case creation and cleanup helpers
 */
import { Page, expect } from "@playwright/test";

// ─── Error capture ──────────────────────────────────────────────────────────

export type CapturedError = { type: string; message: string };

export function attachErrorCapture(page: Page): CapturedError[] {
  const errors: CapturedError[] = [];

  page.on("pageerror", (err) => {
    // Ignore known harmless errors from browser extensions or HMR
    if (
      err.message.includes("ResizeObserver loop") ||
      err.message.includes("Non-Error promise rejection")
    )
      return;
    errors.push({ type: "pageerror", message: err.message });
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Filter harmless asset-cancel noise and HMR
      if (
        text.includes("Failed to load resource") &&
        text.includes("favicon")
      )
        return;
      errors.push({ type: "console.error", message: text });
    }
  });

  page.on("response", (response) => {
    if (response.status() >= 500) {
      errors.push({
        type: "http-500",
        message: `${response.status()} ${response.url()}`,
      });
    }
  });

  return errors;
}

export function assertNoErrors(errors: CapturedError[]) {
  const critical = errors.filter(
    (e) =>
      e.type === "pageerror" ||
      e.type === "http-500" ||
      // Supabase auth failures are critical
      (e.type === "console.error" && e.message.includes("supabase"))
  );
  if (critical.length > 0) {
    throw new Error(
      `Critical browser errors detected:\n${critical
        .map((e) => `  [${e.type}] ${e.message}`)
        .join("\n")}`
    );
  }
}

// ─── Timestamp ──────────────────────────────────────────────────────────────

export function timestamp() {
  return Date.now();
}

// ─── Case creation helper ────────────────────────────────────────────────────

export async function createTestCase(page: Page, ts: number) {
  const firstName = `E2E`;
  const lastName = `Applicant-${ts}`;

  await page.goto("/cases");
  await expect(page.getByRole("heading", { name: /cases/i })).toBeVisible();

  // Open the New Case modal
  await page.getByRole("button", { name: /new case/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByLabel(/first name/i).fill(firstName);
  await page.getByLabel(/last name/i).fill(lastName);

  await page.getByRole("button", { name: /create case/i }).click();

  // Wait for redirect to case detail page
  await page.waitForURL(/\/cases\/[a-f0-9-]{36}/, { timeout: 20_000 });

  const url = page.url();
  const caseId = url.split("/cases/")[1]?.split("?")[0] ?? "";

  return { firstName, lastName, caseId };
}
