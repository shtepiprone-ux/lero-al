// Task 859 review 3 (Revision 2 outcome) — GR-7 live check, moment: review, role: Opus.
// Re-opens every reference page the Revision 2 decisions rely on (status badge, dialog anatomy, delete confirm, table
// anatomy), compares each with the shared library (docs/research/references/2026-10-04/), measures status badges, and
// OPERATES the modal demo pages (TailAdmin /modals, Kamr /ui-modal, Lahomes ui-modal): opens the first dialog, records
// its anatomy (title, close control, footer buttons, radius) at 1440 and 390, then presses Esc and records whether it
// closed. The executor's own probe could not open the TailAdmin and Kamr dialogs; this run must.
// Output: r3-live-check.json + r3-live-<n>-<ref>[-modal|-390].png.
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const LIB = join(DIR, '../../../../research/references/2026-10-04');
const TABLE_PAGES = [
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
const MODAL_PAGES = [
  ['tailadmin', 'https://demo.tailadmin.com/modals'],
  ['kamr', 'https://kamr-vite.vercel.app/ui-modal'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/ui-modal.html'],
];
const lib = Object.fromEntries(['tailadmin', 'lahomes', 'kamr', 'omah'].map(r => [r, JSON.parse(readFileSync(join(LIB, `audit-${r}.json`), 'utf8'))]));

const tableProbe = () => {
  const t = [...document.querySelectorAll('table')].find(x => x.querySelectorAll('tbody tr').length > 1);
  const out = {};
  if (t) {
    const head = t.querySelector('thead tr') || t.querySelector('tr');
    out.heads = [...head.children].map(c => (c.innerText || '').trim() || (c.querySelector('input[type=checkbox]') ? '[checkbox]' : ''));
    const row = t.querySelector('tbody tr');
    out.firstCellCheckbox = !!row.children[0]?.querySelector('input[type=checkbox]');
  }
  const scope = t || document;
  out.badges = [...scope.querySelectorAll('.badge, [class*="badge" i], span[class*="rounded-full"], p[class*="rounded-full"]')]
    .filter(b => { const r = b.getBoundingClientRect(); return r.width > 20 && r.width < 200 && r.height > 12 && r.height < 40 && (b.innerText || '').trim(); })
    .slice(0, 6)
    .map(b => { const s = getComputedStyle(b); return { text: b.innerText.trim().slice(0, 24), fontSize: s.fontSize, fontWeight: s.fontWeight, padding: s.padding, radius: s.borderRadius, bg: s.backgroundColor, color: s.color }; });
  return out;
};

// A visible overlay: Bootstrap .modal.show, role=dialog, or a fixed-position box (TailAdmin's plain divs) with a button.
const dialogProbe = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 150 && r.height > 80 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.5; };
  let box = [...document.querySelectorAll('.modal.show .modal-content, [role="dialog"], [aria-modal="true"]')].find(vis);
  if (!box) {
    box = [...document.querySelectorAll('div')].filter(d => getComputedStyle(d).position === 'fixed' && vis(d))
      .map(d => [...d.querySelectorAll('div')].find(c => vis(c) && c.querySelector('button') && getComputedStyle(c).backgroundColor !== 'rgba(0, 0, 0, 0)') || null)
      .find(Boolean);
  }
  if (!box) return null;
  const s = getComputedStyle(box);
  const r = box.getBoundingClientRect();
  const heading = box.querySelector('h1,h2,h3,h4,h5,.modal-title');
  const buttons = [...box.querySelectorAll('button, a.btn')].filter(b => b.getBoundingClientRect().width > 0).map(b => {
    const bs = getComputedStyle(b); const br = b.getBoundingClientRect();
    return { text: (b.innerText || b.getAttribute('aria-label') || '').trim().slice(0, 30), w: Math.round(br.width), h: Math.round(br.height), x: Math.round(br.x), y: Math.round(br.y), bg: bs.backgroundColor, color: bs.color, border: bs.borderTopWidth + ' ' + bs.borderTopColor, radius: bs.borderRadius };
  });
  return { w: Math.round(r.width), h: Math.round(r.height), radius: s.borderRadius, bg: s.backgroundColor, title: heading ? { text: heading.innerText.trim().slice(0, 40), fontSize: getComputedStyle(heading).fontSize, fontWeight: getComputedStyle(heading).fontWeight } : null, buttons };
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('dialog', d => d.dismiss().catch(() => null));
const results = [];
let i = 0;
let kamrSignedIn = false;
const shot = async name => { await page.screenshot({ path: join(DIR, name), fullPage: false }).catch(() => null); return name; };
async function open(ref, url) {
  await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(() => null);
  if (ref === 'kamr' && !kamrSignedIn) {
    kamrSignedIn = true;
    await page.goto('https://kamr-vite.vercel.app/dashboard', { waitUntil: 'load' }).catch(() => null);
    await page.waitForTimeout(2000);
    if ((await page.locator('input[type="password"]').count()) > 0) {
      await page.locator('input[type="email"]').first().fill('demo@example.com').catch(() => null);
      await page.locator('input[type="password"]').first().fill('123456').catch(() => null);
      await page.locator('button[type=submit]').first().click().catch(() => null);
      await page.waitForURL(u => !/login/.test(String(u)), { timeout: 20000 }).catch(() => null);
    }
    await page.waitForTimeout(1500);
    await page.goto(url, { waitUntil: 'load' }).catch(() => null);
  }
  await page.waitForTimeout(1500);
}

for (const [ref, url] of TABLE_PAGES) {
  await open(ref, url);
  const live = await page.evaluate(tableProbe);
  const libRow = lib[ref].rows.find(r => (r.finalUrl || r.url).replace(/\.html$/, '') === url.replace(/\.html$/, ''));
  const libTable = libRow?.tables?.find(t => t.rows > 1);
  const unchanged = libTable ? JSON.stringify(libTable.heads) === JSON.stringify(live.heads) && libTable.firstCellCheckbox === live.firstCellCheckbox : (live.heads ? 'library has no multi-row table' : null);
  results.push({ kind: 'table', ref, url, finalUrl: page.url(), libraryRow: libRow ? libRow.id : 'missing', unchanged, live, screenshot: await shot(`r3-live-${String(i++).padStart(2, '0')}-${ref}.png`) });
  console.log('table', ref, url, '->', page.url(), 'lib', libRow ? libRow.id : 'MISSING', 'unchanged', unchanged, 'badges', live.badges.length);
}

for (const [ref, url] of MODAL_PAGES) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await open(ref, url);
    const n = String(i++).padStart(2, '0');
    const before = await shot(`r3-live-${n}-${ref}-${width}.png`);
    // Candidate triggers: Bootstrap data-bs-toggle, then any button whose text opens a modal.
    const triggers = page.locator('[data-bs-toggle="modal"], [data-toggle="modal"], button:has-text("Modal"), button:has-text("modal"), button:has-text("Open")');
    const count = await triggers.count();
    let dialog = null; let triggerText = null;
    for (let k = 0; k < Math.min(count, 8) && !dialog; k++) {
      const tr = triggers.nth(k);
      if (!(await tr.isVisible().catch(() => false))) continue;
      triggerText = ((await tr.innerText().catch(() => '')) || '').trim().slice(0, 40);
      await tr.scrollIntoViewIfNeeded().catch(() => null);
      await tr.click({ timeout: 5000 }).catch(() => null);
      await page.waitForTimeout(900);
      dialog = await page.evaluate(dialogProbe);
    }
    const opened = await shot(`r3-live-${n}-${ref}-${width}-modal.png`);
    let escCloses = null;
    if (dialog) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(700);
      escCloses = (await page.evaluate(dialogProbe)) === null;
    }
    results.push({ kind: 'modal', ref, url, width, finalUrl: page.url(), triggers: count, triggerText, opened: !!dialog, dialog, escCloses, screenshots: [before, opened] });
    console.log('modal', ref, width, 'triggers', count, 'opened', !!dialog, 'esc closes', escCloses, dialog ? JSON.stringify({ r: dialog.radius, title: dialog.title, buttons: dialog.buttons.map(b => b.text) }) : '');
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

writeFileSync(join(DIR, 'r3-live-check.json'), JSON.stringify({ checkedAt: new Date().toISOString(), platform: process.platform, node: process.version, library: 'docs/research/references/2026-10-04', results }, null, 1));
await browser.close();
