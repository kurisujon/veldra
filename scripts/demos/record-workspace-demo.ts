import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function recordWorkspaceDemo() {
  const outputDir = path.join(__dirname, '../../demos/videos');
  fs.mkdirSync(outputDir, { recursive: true });

  console.log('Starting Playwright Chromium instance...');
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  const showCaption = async (text: string, ms: number) => {
    await page.evaluate((caption) => {
      const el = document.createElement('div');
      el.id = '__demo-caption';
      el.textContent = caption;
      Object.assign(el.style, {
        position: 'fixed',
        bottom: '48px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.88)',
        color: '#FAFAF8',
        padding: '14px 24px',
        borderRadius: '8px',
        fontSize: '18px',
        fontWeight: '500',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
        zIndex: '999999',
        border: '1px solid rgba(255,255,255,0.1)',
      });
      document.body.appendChild(el);
    }, text);
    await page.waitForTimeout(ms);
    await page.evaluate(() => document.getElementById('__demo-caption')?.remove());
  };

  const baseURL = process.env.DEMO_BASE_URL || 'http://localhost:3000';

  console.log(`Navigating to ${baseURL}... (Waiting up to 120s for initial compile)`);
  await page.goto(baseURL, { timeout: 120000 });
  await showCaption('Welcome to Veldra', 2000);

  // Step 1: Login
  const signInBtn = page.getByRole('button', { name: /login/i }).first();
  await signInBtn.click();
  await showCaption('Log in to the secure workspace...', 1500);

  // Depending on whether it opens a modal or navigates, wait for the email input
  await page.getByLabel(/email or username/i).waitFor({ state: 'visible', timeout: 10000 });
  await page.getByLabel(/email or username/i).fill('trisha@gmail.com');
  await page.getByLabel(/password/i).fill('trisha123');
  await page.getByRole('button', { name: /^sign in$/i }).click();

  // Step 2: Dashboard
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30000 });
  await showCaption('Review analytics and pending cases on the dashboard...', 3000);

  // Step 3: Go to Cases
  await page.getByRole('link', { name: /cases/i }).first().click();
  await page.waitForURL(/\/cases$/, { timeout: 30000 });
  await showCaption('Manage applicant cases in a centralized queue...', 3000);

  // Step 4: Create a New Case
  await page.getByRole('button', { name: /new case/i }).click();
  await page.getByLabel(/first name/i).fill('Juan');
  await page.getByLabel(/last name/i).fill('Dela Cruz');
  await page.getByRole('button', { name: /create case/i }).click();
  
  await showCaption('Creating a new workspace for an applicant...', 3000);
  
  // Step 5: Wait for Case Page
  await page.waitForURL(/\/cases\/[a-f0-9-]{36}/, { timeout: 30000 });
  await showCaption('Upload and extract data from documents securely...', 3500);

  // Step 6: Go to Findings Tab
  // Check if Findings tab exists (if case is in NeedsReview)
  const findingsTab = page.getByRole('tab', { name: /findings/i });
  if (await findingsTab.count() > 0) {
    await findingsTab.click();
    await showCaption('Veldra\'s 3-stage engine automatically flags discrepancies...', 4000);
  } else {
    // If it's not in NeedsReview, just show the documents view for a bit longer
    await showCaption('Documents are automatically processed and verified...', 4000);
  }

  await page.waitForTimeout(2000);

  await context.close();
  await browser.close();
  console.log('Recording session finished. Video saved to demos/videos/');
}

recordWorkspaceDemo().catch((err) => {
  console.error('Demo recording error:', err);
  process.exit(1);
});
