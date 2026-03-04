const { chromium } = require('playwright');
const path = require('path');

const FRONTEND_URL = 'https://storage.googleapis.com/muse-frontend-project-b5adb824-a03c-48da-935/index.html?v2';

(async () => {
  const videoDir = path.join(__dirname, '../demo-video');
  require('fs').mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized', '--no-sandbox'],
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: videoDir,
      size: { width: 1920, height: 1080 },
    },
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  console.log('Navigating to MUSE...');
  await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Show connected state
  console.log('Waiting for connection...');
  await page.waitForSelector('text=Connected', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Screenshot of initial MUSE greeting
  console.log('Capturing initial state...');
  await page.waitForTimeout(4000);

  // Click Visual mode
  console.log('Switching to Visual mode...');
  await page.getByRole('button', { name: /Visual/i }).click();
  await page.waitForTimeout(2000);

  // Click Audio mode
  console.log('Switching to Audio mode...');
  await page.getByRole('button', { name: /Audio/i }).click();
  await page.waitForTimeout(2000);

  // Click Environment mode
  console.log('Switching to Environment mode...');
  await page.getByRole('button', { name: /Environ/i }).click();
  await page.waitForTimeout(2000);

  // Click Sketch mode
  console.log('Switching to Sketch mode...');
  await page.getByRole('button', { name: /Sketch/i }).click();
  await page.waitForTimeout(2000);

  // Back to Visual
  await page.getByRole('button', { name: /Visual/i }).click();
  await page.waitForTimeout(2000);

  // Click Gallery tab
  console.log('Showing Gallery tab...');
  await page.getByRole('button', { name: /gallery/i }).click();
  await page.waitForTimeout(3000);

  // Click Transcript tab
  await page.getByRole('button', { name: /transcript/i }).click();
  await page.waitForTimeout(2000);

  console.log('Done recording. Closing...');
  await context.close();
  await browser.close();

  console.log('Video saved to:', videoDir);
})();
