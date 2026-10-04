// Task 859 review 2 — GR-7 live check (moment: review + task revision, role: Opus) of the reference pages this decision
// relies on. Compares each with the shared library (docs/research/references/2026-10-04/) and measures the status
// badges, which the library crawl did not capture. Output: live-check.json + live-<n>.png (cited screenshots).
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const LIB = join(DIR, '../../../../research/references/2026-10-04');
const PAGES = [
  ['tailadmin', 'https://demo.tailadmin.com/support-tickets'],
  ['tailadmin', 'https://demo.tailadmin.com/support-ticket-reply'],
  ['tailadmin', 'https://demo.tailadmin.com/products-list'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/customers-list.html'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/orders.html'],
  ['kamr', 'https://kamr-vite.vercel.app/guest-list'],
  ['kamr', 'https://kamr-vite.vercel.app/ecom-customers'],
  ['omah', 'https://omah.dexignzone.com/xhtml/ecom-customers.html'],
  ['omah', 'https://omah.dexignzone.com/xhtml/ecom-product-order.html'],
];
const lib = Object.fromEntries(['tailadmin', 'lahomes', 'kamr', 'omah'].map(r => [r, JSON.parse(readFileSync(join(LIB, `audit-${r}.json`), 'utf8'))]));

const probe = () => {
  const t = [...document.querySelectorAll('table')].find(x => x.querySelectorAll('tbody tr').length > 1);
  const out = {};
  if (t) {
    const head = t.querySelector('thead tr') || t.querySelector('tr');
    out.heads = [...head.children].map(c => (c.innerText || '').trim() || (c.querySelector('input[type=checkbox]') ? '[checkbox]' : ''));
    const row = t.querySelector('tbody tr');
    out.firstCellCheckbox = !!row.children[0]?.querySelector('input[type=checkbox]');
    out.lastCellHtmlTags = [...row.children[row.children.length - 1].querySelectorAll('a, button')].length;
  }
  const scope = t || document; // badges inside the record table only (the first run picked up sidebar 'NEW' labels)
  const badges = [...scope.querySelectorAll('.badge, [class*="badge" i], span[class*="rounded-full"], span[class*="pill" i], p[class*="rounded-full"]')]
    .filter(b => { const r = b.getBoundingClientRect(); return r.width > 20 && r.width < 200 && r.height > 12 && r.height < 40 && (b.innerText || '').trim(); })
    .slice(0, 8)
    .map(b => { const s = getComputedStyle(b); const r = b.getBoundingClientRect(); return { text: b.innerText.trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height), fontSize: s.fontSize, fontWeight: s.fontWeight, padding: s.padding, radius: s.borderRadius, bg: s.backgroundColor, color: s.color, border: s.borderTopWidth + ' ' + s.borderTopColor }; });
  out.badges = badges;
  return out;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const results = [];
let i = 0;
let kamrSignedIn = false;
for (const [ref, url] of PAGES) {
  await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(() => null);
  if (ref === 'kamr' && !kamrSignedIn) {
    kamrSignedIn = true; // the login form renders after 'load', so a field-count check skipped it; sign in once per context
    // Same route as the library crawler, which reached every Kamr page: sign in from /dashboard with the form's
    // prefilled demo account (the owner's 'admin' is refused by the type=email field), wait, then load the page.
    await page.goto('https://kamr-vite.vercel.app/dashboard', { waitUntil: 'load' }).catch(() => null);
    await page.waitForTimeout(2000); // let the SPA hydrate before submitting
    await page.locator('button[type=submit]').first().click().catch(() => null);
    await page.waitForURL(u => !/login/.test(String(u)), { timeout: 20000 }).catch(() => null);
    await page.waitForTimeout(1500);
    console.log('kamr after sign-in:', page.url());
    await page.goto(url, { waitUntil: 'load' }).catch(() => null);
  }
  await page.waitForTimeout(1500);
  const live = await page.evaluate(probe);
  const shot = `live-${String(i++).padStart(2, '0')}-${ref}.png`;
  await page.screenshot({ path: join(DIR, shot), fullPage: false });
  const libRow = lib[ref].rows.find(r => (r.finalUrl || r.url).replace(/\.html$/, '') === url.replace(/\.html$/, ''));
  const libTable = libRow?.tables?.find(t => t.rows > 1);
  const unchanged = libTable ? JSON.stringify(libTable.heads) === JSON.stringify(live.heads) && libTable.firstCellCheckbox === live.firstCellCheckbox : null;
  results.push({ ref, url, libraryRow: libRow ? libRow.id : 'missing', unchanged, live, screenshot: shot });
  console.log(ref, url, 'library', libRow ? libRow.id : 'MISSING', 'unchanged', unchanged, 'badges', live.badges.length);
}
writeFileSync(join(DIR, 'live-check.json'), JSON.stringify({ checkedAt: new Date().toISOString(), library: 'docs/research/references/2026-10-04', results }, null, 1));
await browser.close();
