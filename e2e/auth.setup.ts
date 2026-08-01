/**
 * e2e/auth.setup.ts
 * Authenticates once using QA credentials and saves browser state.
 * All other tests reuse this saved state so auth runs only once.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate as QA user", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing E2E_USER_EMAIL or E2E_USER_PASSWORD. " +
        "Create .env.e2e.local with these values."
    );
  }

  // Navigate to the landing page
  await page.goto("/");
  await expect(page).toHaveTitle(/Veldra/i);

  // Open the login modal — Navbar has a "Sign In" button
  await page.getByRole("button", { name: /sign in/i }).first().click();

  // Fill in credentials
  await page.getByLabel(/email or username/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  // Submit
  await page.getByRole("button", { name: /^sign in$/i }).click();

  // Wait for successful redirect to /dashboard or /admin
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30_000 });

  // Persist authentication state
  await page.context().storageState({ path: AUTH_FILE });
  console.log("✅ Auth state saved to", AUTH_FILE);
});
