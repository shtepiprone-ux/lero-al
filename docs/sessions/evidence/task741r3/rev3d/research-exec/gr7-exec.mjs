// Task 741 R3d — GR-7 live check (moment: execution, role: Sonnet) of the reference pages this review relies on:
// property/listing cards with status badges, and any grid/list view toggle (owner D46-3) at 1440 and 390.
// Compares page identity with the shared library (docs/research/references/2026-10-04/) and measures badges on cards.
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const LIB = join(DIR, '../../../../../research/references/2026-10-04');
const PAGES = [
  ['lahomes', 'https://techzaa.in/lahomes/admin/property-grid.html'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/property-list.html'],
  ['omah', 'https://omah.dexignzone.com/xhtml/property-list.html'],
  ['kamr', 'https://kamr-vite.vercel.app/room'],
  ['tailadmin', 'https://demo.tailadmin.com/cards'],
  ['tailadmin', 'https://demo.tailadmin.com/badge'],
];
const lib = Object.fromEntries(['tailadmin', 'lahomes', 'kamr', 'omah'].map(r => [r, JSON.parse(readFileSync(join(LIB, `audit-${r}.json`), 'utf8'))]));

const probe = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  // badges that sit on an image (absolute inside a box that contains an <img>) vs elsewhere
  const badges = [...document.querySelectorAll('.badge, [class*="badge" i], span[class*="rounded-full"]')]
    .filter(b => vis(b) && (b.innerText || '').trim() && b.getBoundingClientRect().height < 40 && b.getBoundingClientRect().width < 220)
    .slice(0, 40)
    .map(b => {
      const s = getComputedStyle(b); const r = b.getBoundingClientRect();
      const onImage = s.position === 'absolute' && !!b.parentElement?.closest('*')?.querySelector('img');
      return { text: b.innerText.trim().slice(0, 24), onImage, w: Math.round(r.width), h: Math.round(r.height), fontSize: s.fontSize, fontWeight: s.fontWeight, padding: s.padding, radius: s.borderRadius, bg: s.backgroundColor, color: s.color };
    });
  const toggles = [...document.querySelectorAll('a, button')].filter(vis)
    .filter(b => /grid|list|view/i.test((b.getAttribute('title') || '') + (b.getAttribute('aria-label') || '') + (b.innerText || '') + (b.getAttribute('href') || '') + (b.querySelector('i,svg,iconify-icon')?.getAttribute('class') || '') + (b.querySelector('iconify-icon')?.getAttribute('icon') || '')))
    .slice(0, 6).map(b => ({ text: (b.innerText || '').trim().slice(0, 20), href: b.getAttribute('href'), icon: b.querySelector('iconify-icon')?.getAttribute('icon') || b.querySelector('i')?.className || '' }));
  return { title: document.title, h: document.querySelector('h1,h2,h3,h4')?.innerText?.trim().slice(0, 60), badges, toggles, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 };
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
let kamrSignedIn = false;
const results = [];
let i = 0;
for (const [ref, url] of PAGES) {
  const row = { ref, url };
  for (const w of [1440, 390]) {
    await page.setViewportSize({ width: w, height: w === 390 ? 844 : 900 });
    await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(() => null);
    if (ref === 'kamr' && !kamrSignedIn) {
      kamrSignedIn = true; // demo@example.com / 123456 (owner, 2026-10-04), prefilled in the form
      await page.waitForTimeout(2000);
      await page.locator('input[type=email]').first().fill('demo@example.com').catch(() => null);
      await page.locator('input[type=password]').first().fill('123456').catch(() => null);
      await page.locator('button[type=submit]').first().click().catch(() => null);
      await page.waitForURL(u => !/login/.test(String(u)), { timeout: 20000 }).catch(() => null);
      await page.goto(url, { waitUntil: 'load' }).catch(() => null);
    }
    await page.waitForTimeout(1500);
    row[w] = await page.evaluate(probe);
    const shot = `exec-${String(i++).padStart(2, '0')}-${ref}-${w}.png`;
    await page.screenshot({ path: join(DIR, shot), fullPage: true });
    row[w].screenshot = shot;
  }
  const libRow = lib[ref].rows.find(r => (r.finalUrl || r.url) === url);
  row.libraryRow = libRow ? libRow.id : 'missing';
  row.unchanged = libRow ? libRow.title === row[1440].title : null;
  results.push(row);
  console.log(ref, url, 'lib', row.libraryRow, 'unchanged', row.unchanged, 'badges', row[1440].badges.length, 'toggles', row[1440].toggles.length, '/', row[390].toggles.length);
}
writeFileSync(join(DIR, 'gr7-exec.json'), JSON.stringify({ checkedAt: new Date().toISOString(), library: 'docs/research/references/2026-10-04', results }, null, 1));
await browser.close();
