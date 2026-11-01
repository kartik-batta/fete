/**
 * Records a captioned product demo of Fête with Playwright.
 * Usage: npm run build && PORT=3888 NODE_ENV=production npx tsx server.ts &
 *        node scripts/record-demo.cjs [baseUrl] [outDir]
 */
const { chromium } = require('playwright');
const path = require('path');

const BASE = process.argv[2] || 'http://localhost:3888';
const OUT = path.resolve(process.argv[3] || 'demo');
const SIZE = { width: 1280, height: 720 };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function caption(page, text, ms = 2600) {
  await page.evaluate((t) => {
    let el = document.getElementById('__demo_caption');
    if (!el) {
      el = document.createElement('div');
      el.id = '__demo_caption';
      el.setAttribute('aria-hidden', 'true');
      Object.assign(el.style, {
        position: 'fixed', left: '50%', bottom: '28px', transform: 'translateX(-50%)',
        zIndex: '2147483647', maxWidth: '84%', padding: '12px 22px', borderRadius: '999px',
        background: 'rgba(28,25,23,0.88)', color: '#fff', font: '600 18px "Plus Jakarta Sans",system-ui,sans-serif',
        boxShadow: '0 10px 30px rgba(0,0,0,.25)', textAlign: 'center', transition: 'opacity .3s', pointerEvents: 'none',
      });
      document.body.appendChild(el);
    }
    el.textContent = t;
    el.style.opacity = '1';
  }, text);
  await wait(ms);
}

async function tryClick(locator, label) {
  try {
    await locator.first().scrollIntoViewIfNeeded({ timeout: 3000 });
    await locator.first().click({ timeout: 3000 });
    return true;
  } catch {
    console.warn(`skip: ${label}`);
    return false;
  }
}

async function smoothScroll(page, px, steps = 12) {
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, px / steps);
    await wait(60);
  }
}

async function tab(page, key) {
  await page.click(`#tab-${key}`);
  await page.waitForSelector(`#panel-${key}`);
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await wait(500);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: SIZE,
    recordVideo: { dir: OUT, size: SIZE },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  page.on('dialog', (d) => d.dismiss());
  // Stop print dialogs / mailto navigation from interrupting the recording.
  await page.addInitScript(() => { window.print = () => {}; });

  await page.goto(BASE);
  await page.waitForSelector('[role=tablist]');
  await wait(800);

  await caption(page, '✨ Fête — an AI-powered celebration & event planner', 3200);
  await caption(page, 'Every event at a glance: countdown, RSVPs, budget and progress');
  await smoothScroll(page, 650);
  await caption(page, '"Needs attention" flags overdue tasks, pending RSVPs and budget risks', 3000);

  await tab(page, 'guests');
  await caption(page, 'Guest list: RSVPs, plus-ones, dietary needs — searchable & filterable');
  await tryClick(page.getByRole('button', { name: /attending/i }), 'guest filter');
  await wait(900);
  await caption(page, 'Safe CSV export for caterers and seating plans', 2200);

  await tab(page, 'budget');
  await caption(page, 'Budget tracking: estimated vs committed vs paid, with overage alerts');
  await smoothScroll(page, 500);
  await wait(800);

  await tab(page, 'vendors');
  await caption(page, 'Vendor management — booked quotes flow straight into the budget');

  await tab(page, 'tasks');
  await caption(page, 'Tasks sorted by due date, with overdue indicators');

  await tab(page, 'timeline');
  await caption(page, 'Day-of timeline, always in time order');
  await tryClick(page.getByRole('button', { name: /Live Mode/ }), 'live mode');
  await caption(page, 'Live "run of show" mode highlights what is happening now', 3000);

  await tab(page, 'ai-concierge');
  await caption(page, 'AI Studio, powered by Gemini (with safe fallbacks offline)');
  await tryClick(page.getByRole('button', { name: /Generate 3 Theme Concepts/ }), 'themes');
  await wait(1800);
  await smoothScroll(page, 700);
  await caption(page, 'Three bespoke theme concepts — palette, décor, music & attire', 3000);

  const tools = page.locator('[role=tablist]').last().getByRole('tab');
  await tryClick(tools.nth(1), 'invitation tool');
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await caption(page, 'Custom invitations: pick a tone and card style, edit in place');
  await tryClick(page.getByRole('radio').filter({ hasText: /Midnight/i }), 'card style');
  await wait(800);
  await smoothScroll(page, 500);
  await caption(page, 'Personalise per guest, print to PDF, or email everyone in one click', 3200);

  await tryClick(tools.nth(2), 'timeline tool');
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await caption(page, 'Generate a day-of schedule that fits your exact start and end times');
  await tryClick(page.getByRole('button', { name: /Generate Day-of Run of Show/ }), 'gen timeline');
  await wait(1800);
  await smoothScroll(page, 600);
  await wait(1000);

  await tryClick(tools.nth(3), 'ideas tool');
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await tryClick(page.getByRole('button', { name: /Generate Recommendations/ }), 'ideas');
  await wait(1500);
  await smoothScroll(page, 600);
  await caption(page, 'Menu, décor and activity ideas — one click turns them into tasks', 3000);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await tab(page, 'overview');
  await caption(page, 'Secure, accessible, fast — and tested. Celebrate more, stress less. 🎉', 3500);

  await context.close();
  await browser.close();
  console.log('video saved in', OUT);
})();
