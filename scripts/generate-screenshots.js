#!/usr/bin/env node
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', '..', 'screenshots');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const DEVICES = [
  { name: 'iphone', width: 430, height: 932, scale: 3 },
  { name: 'ipad', width: 1024, height: 1366, scale: 2 },
];

const SCREENS = [
  { name: '01_network', tab: 0, waitMs: 2000 },
  { name: '02_insights', tab: 1, waitMs: 2000 },
  { name: '03_history', tab: 2, waitMs: 1500 },
  { name: '04_signals', tab: 3, waitMs: 1500 },
];

async function main() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const device of DEVICES) {
    for (const screen of SCREENS) {
      const page = await browser.newPage();
      await page.setViewport({
        width: device.width,
        height: device.height,
        deviceScaleFactor: device.scale,
      });

      try {
        await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 30000 });
        await wait(2000);

        // Handle onboarding
        try {
          const getStarted = await page.$('[aria-label="get started"]');
          if (getStarted) {
            await getStarted.click();
            await wait(500);
            const focusBtn = await page.$('[aria-label*="focus"]');
            if (focusBtn) await focusBtn.click();
            await wait(500);
            const nextBtn = await page.$('[aria-label="next"]');
            if (nextBtn) await nextBtn.click();
            await wait(500);
            const startBtn = await page.$('[aria-label="start tracking"]');
            if (startBtn) await startBtn.click();
            await wait(1000);
          }
        } catch (e) { /* already past onboarding */ }

        // Navigate to tab
        if (screen.tab > 0) {
          const tabs = await page.$$('[role="tab"]');
          if (tabs[screen.tab]) {
            await tabs[screen.tab].click();
            await wait(screen.waitMs);
          }
        }

        await wait(screen.waitMs);

        const filename = `${device.name}_${screen.name}.png`;
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, filename),
          fullPage: false,
        });
        console.log(`✅ ${filename}`);
      } catch (e) {
        console.error(`❌ ${device.name}_${screen.name}: ${e.message}`);
      }
      await page.close();
    }
  }

  await browser.close();
  console.log('\nDone! Screenshots at:', SCREENSHOTS_DIR);
}

main().catch(console.error);
