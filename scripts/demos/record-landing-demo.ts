import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function recordLandingDemo() {
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

  console.log(`Navigating to ${baseURL}...`);
  await page.goto(baseURL);
  await showCaption('Veldra — Smart Document Verification Platform', 3500);

  // Step 1: Scroll to See It In Action interactive demo section
  await page.evaluate(() => {
    const el = document.querySelector('section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
  await showCaption('Automated cross-referencing across student visa documents', 3500);

  // Step 2: Open login modal / navigate to Cases
  const signInBtn = page.getByRole('button', { name: /sign in/i }).first();
  if (await signInBtn.isVisible()) {
    await signInBtn.click();
    await showCaption('Secure authentication & role-based verification workspace', 3000);
  }

  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();
  console.log('Recording session finished. Video saved to demos/videos/');
}

recordLandingDemo().catch((err) => {
  console.error('Demo recording error:', err);
  process.exit(1);
});
