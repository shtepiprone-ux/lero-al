// Task 859 review 2 — GR-7 (owner rule 2026-10-04) deep audit: every page of one reference, in depth.
// Usage: node.exe gr7-deep.mjs <outDir> <lahomes|kamr|omah|tailadmin> [limit]
// Per page: full-page screenshot (1440); every visible table's anatomy (checkbox column, actions column, computed
// styles); select-all operated (checked rows, selected-row background, buttons that appear = bulk action); first-row
// action controls operated (what opens); every modal trigger operated (dialog anatomy: title, close, footer buttons,
// sizes, Esc); every dropdown toggle operated (menu items). Pages with a table or a dialog also get a 390 screenshot.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
const REF = process.argv[3];
const LIMIT = Number(process.argv[4] || 600);
const SHOTS = join(OUT, `shots-${REF}`);
mkdirSync(SHOTS, { recursive: true });
const LOG = join(OUT, `crawl-${REF}.log`);
if (!(await import('node:fs')).existsSync(LOG)) writeFileSync(LOG, '');
const log = (s) => { appendFileSync(LOG, s + '\n'); console.log(s); };

const ENTRY = {
  lahomes: 'https://techzaa.in/lahomes/admin/index.html',
  kamr: 'https://kamr-vite.vercel.app/dashboard',
  omah: 'https://omah.dexignzone.com/xhtml/index.html',
  tailadmin: 'https://demo.tailadmin.com/',
}[REF];
const SCOPE = {
  lahomes: 'https://techzaa.in/lahomes/admin/',
  kamr: 'https://kamr-vite.vercel.app/',
  omah: 'https://omah.dexignzone.com/xhtml/',
  tailadmin: 'https://demo.tailadmin.com/',
}[REF];
const SKIP = /logout|log-out|sign-?out|\.(png|jpe?g|gif|svg|webp|pdf|zip|css|js|ico|mp4|xlsx?|csv)$/i;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('dialog', d => d.dismiss().catch(() => null)); // native alert/confirm: record nothing, never block

// Kamr: the owner's credentials (admin / 123456) first. The email field is type="email", so "admin" may be refused by
// the browser's own validation; then the form's prefilled demo values are submitted unchanged. Which one worked is logged.
let loginNote = null;
async function submitLogin() {
  await page.locator('button[type="submit"], button:has-text("Sign")').first().click().catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
  await page.waitForTimeout(800);
}
async function login() {
  if (REF !== 'kamr') return;
  if ((await page.locator('input[type="password"]').count()) === 0) return;
  await page.locator('input[type="email"], input[type="text"]').first().fill('admin').catch(() => null);
  await page.locator('input[type="password"]').first().fill('123456').catch(() => null);
  await submitLogin();
  if ((await page.locator('input[type="password"]').count()) === 0) { loginNote ??= 'owner credentials admin/123456 accepted'; return; }
  await page.reload({ waitUntil: 'networkidle' }).catch(() => null);
  await submitLogin();
  if ((await page.locator('input[type="password"]').count()) === 0) { loginNote ??= 'admin/123456 refused by the type=email field; prefilled demo@example.com/123456 accepted'; return; }
  loginNote = 'login failed with both credential sets';
}

async function load(url) {
  // Resume-friendly speed: 'load' plus a fixed settle wait (networkidle never settles on some demos and cost 30s per reload).
  const resp = await page.goto(url, { waitUntil: 'load', timeout: 25000 }).catch(() => null);
  await page.waitForTimeout(REF === 'kamr' ? 1500 : 900);
  await login();
  if (REF === 'kamr' && !page.url().startsWith(url.split('?')[0]) && /login|sign/i.test(page.url())) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
  }
  return resp ? resp.status() : null;
}

function norm(href, base) {
  try {
    const u = new URL(href, base);
    u.hash = '';
    if (!u.href.startsWith(SCOPE) || SKIP.test(u.pathname)) return null;
    return u.href;
  } catch { return null; }
}

// ---- in-page probes (serialised functions) ----
const tableProbe = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const cs = (el, keys) => { if (!el) return null; const s = getComputedStyle(el); const r = el.getBoundingClientRect(); const o = { w: Math.round(r.width), h: Math.round(r.height) }; for (const k of keys) o[k] = s[k]; return o; };
  const ctlDesc = el => ({
    tag: el.tagName.toLowerCase(), text: (el.innerText || '').trim().slice(0, 40), title: el.getAttribute('title') || el.getAttribute('aria-label') || el.getAttribute('data-bs-original-title') || '',
    icon: (el.querySelector('i, svg, iconify-icon, span[class*="icon"]')?.getAttribute('class') || el.querySelector('iconify-icon')?.getAttribute('icon') || '').toString().slice(0, 60),
    cls: String(el.className || '').slice(0, 90),
    style: cs(el, ['backgroundColor', 'color', 'borderRadius', 'borderTopWidth', 'borderTopColor', 'paddingLeft', 'fontSize']),
  });
  return [...document.querySelectorAll('table')].filter(vis).map((t, ti) => {
    const headRow = t.querySelector('thead tr') || t.querySelector('tr');
    const heads = headRow ? [...headRow.children].map(c => (c.innerText || '').trim().slice(0, 30) || (c.querySelector('input[type=checkbox]') ? '[checkbox]' : '')) : [];
    const bodyRows = [...t.querySelectorAll('tbody tr')].filter(vis);
    const first = bodyRows[0];
    const cells = first ? [...first.children] : [];
    const firstCellCheckbox = !!(cells[0] && cells[0].querySelector('input[type=checkbox]'));
    const headCheckbox = !!(headRow && headRow.children[0] && headRow.children[0].querySelector('input[type=checkbox]'));
    const last = cells[cells.length - 1];
    let lastEls = last ? [...last.querySelectorAll('a, button, [role=button], [data-bs-toggle], .dropdown-toggle, [class*="action" i] > *, [onclick]')].filter(vis) : [];
    if (last && !lastEls.length) lastEls = [...last.querySelectorAll('*')].filter(e => vis(e) && getComputedStyle(e).cursor === 'pointer' && !e.querySelector('*[style*=cursor]'));
    const lastCtls = lastEls.slice(0, 6).map(ctlDesc);
    const cb = cells[0]?.querySelector('input[type=checkbox]');
    return {
      index: ti, cols: heads.length, heads, rows: bodyRows.length,
      headCheckbox, firstCellCheckbox, checkbox: cb ? cs(cb, ['borderRadius', 'borderTopColor', 'backgroundColor']) : null,
      lastHead: heads[heads.length - 1] || '', lastCellControls: lastCtls,
      actionsElsewhere: cells.slice(0, -1).some(c => c.querySelectorAll('button, a.btn, [role=button]').length > 0),
      table: cs(t, ['borderTopWidth', 'fontSize']), headCell: cs(headRow?.children[1] || null, ['backgroundColor', 'color', 'fontSize', 'fontWeight', 'textTransform', 'paddingLeft']),
      bodyCell: cs(cells[1] || null, ['color', 'fontSize', 'paddingLeft', 'paddingTop', 'borderBottomWidth', 'borderBottomColor']),
      rowBg: first ? getComputedStyle(first).backgroundColor : null,
    };
  });
};

const visibleButtons = () => [...document.querySelectorAll('button, a.btn, [role=button]')]
  .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; })
  .map(el => ((el.innerText || '').trim() || el.getAttribute('title') || el.getAttribute('aria-label') || el.className.toString()).slice(0, 40));

const dialogProbe = () => {
  const cands = [...document.querySelectorAll('[role=dialog], [aria-modal=true], .modal.show .modal-dialog, .modal.show, [class*="modal" i][class*="open" i]')]
    .filter(el => { const r = el.getBoundingClientRect(); return r.width > 80 && r.height > 60 && getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none'; });
  if (!cands.length) return null;
  const d = cands.map(el => el.querySelector('.modal-content') || el).sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height)
    .find(el => el.getBoundingClientRect().width < window.innerWidth - 4) || cands[0];
  const r = d.getBoundingClientRect(); const s = getComputedStyle(d);
  const btns = [...d.querySelectorAll('button, a.btn, [role=button]')].filter(b => b.getBoundingClientRect().width > 0);
  const footer = d.querySelector('.modal-footer, footer, [class*="footer" i]');
  const fbtns = (footer ? [...footer.querySelectorAll('button, a.btn')] : btns.slice(-3)).filter(b => b.getBoundingClientRect().width > 0)
    .map(b => { const bs = getComputedStyle(b); const br = b.getBoundingClientRect(); return { text: (b.innerText || '').trim().slice(0, 30), x: Math.round(br.x), w: Math.round(br.width), h: Math.round(br.height), bg: bs.backgroundColor, color: bs.color, border: bs.borderTopWidth + ' ' + bs.borderTopColor, radius: bs.borderRadius }; });
  const title = d.querySelector('.modal-title, h1, h2, h3, h4, h5, [class*="title" i]');
  const close = d.querySelector('.btn-close, [aria-label*="close" i], button[class*="close" i]');
  return {
    w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), radius: s.borderRadius, padding: s.padding, bg: s.backgroundColor,
    title: title ? { text: (title.innerText || '').trim().slice(0, 60), fontSize: getComputedStyle(title).fontSize, fontWeight: getComputedStyle(title).fontWeight } : null,
    close: close ? { w: Math.round(close.getBoundingClientRect().width), h: Math.round(close.getBoundingClientRect().height), x: Math.round(close.getBoundingClientRect().x - r.x) } : null,
    hasFooter: !!footer, footerButtons: fbtns, inputs: d.querySelectorAll('input, select, textarea').length,
    text: (d.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 160),
  };
};

const menuProbe = () => {
  const m = [...document.querySelectorAll('.dropdown-menu.show, [role=menu], [data-popper-placement]')]
    .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })[0];
  if (!m) return null;
  return { items: [...m.querySelectorAll('a, button, li')].map(i => (i.innerText || '').trim()).filter(Boolean).slice(0, 12), w: Math.round(m.getBoundingClientRect().width) };
};

// Generic overlay detection (added after the first run found 0 TailAdmin dialogs: its modals and menus are plain
// positioned divs with no role/Bootstrap class). Before a click every visible positioned element is tagged; after
// it, the outermost new visible fixed/absolute element is the popup. One that covers most of the viewport is a
// backdrop: the dialog is its largest child panel smaller than the viewport.
const tagPositioned = () => {
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    if ((s.position === 'fixed' || s.position === 'absolute') && el.getBoundingClientRect().width > 0) el.setAttribute('data-gr7-pre', '1');
  }
};
const genericProbe = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 40 && r.height > 30 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.05; };
  const fresh = [...document.querySelectorAll('body *')].filter(el => {
    if (el.hasAttribute('data-gr7-pre')) return false;
    const s = getComputedStyle(el);
    return (s.position === 'fixed' || s.position === 'absolute') && vis(el);
  });
  const outer = fresh.filter(el => !fresh.some(o => o !== el && o.contains(el)));
  if (!outer.length) return null;
  const big = outer.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height)[0];
  const br = big.getBoundingClientRect();
  const isBackdrop = br.width >= window.innerWidth * 0.8 && br.height >= window.innerHeight * 0.8;
  let panel = big;
  if (isBackdrop) {
    const kids = [...big.querySelectorAll('*')].filter(vis).filter(el => { const r = el.getBoundingClientRect(); return r.width < window.innerWidth - 8 && r.height > 80 && (el.querySelector('button') || el.querySelector('h1,h2,h3,h4,h5')); });
    panel = kids.sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height - a.getBoundingClientRect().width * a.getBoundingClientRect().height)[0] || big;
  }
  const r = panel.getBoundingClientRect(); const s = getComputedStyle(panel);
  const btns = [...panel.querySelectorAll('button, a')].filter(b => b.getBoundingClientRect().width > 0);
  const title = panel.querySelector('h1, h2, h3, h4, h5, [class*="title" i]');
  // An icon-only button in the panel's top-right corner counts as the close control (TailAdmin's round close has no label).
  const close = btns.find(b => /close|×|✕/i.test((b.getAttribute('aria-label') || '') + (b.innerText || '') + (b.className || '')) && b.getBoundingClientRect().width < 60)
    || btns.find(b => { const bb = b.getBoundingClientRect(); return !(b.innerText || '').trim() && b.querySelector('svg') && bb.width < 60 && bb.y < r.y + 80 && bb.x > r.x + r.width * 0.7; });
  const lastRowY = btns.length ? Math.max(...btns.map(b => b.getBoundingClientRect().y)) : 0;
  const footer = btns.filter(b => Math.abs(b.getBoundingClientRect().y - lastRowY) < 4 && b !== close)
    .map(b => { const bs = getComputedStyle(b); const bb = b.getBoundingClientRect(); return { text: (b.innerText || '').trim().slice(0, 30), x: Math.round(bb.x), w: Math.round(bb.width), h: Math.round(bb.height), bg: bs.backgroundColor, color: bs.color, border: bs.borderTopWidth + ' ' + bs.borderTopColor, radius: bs.borderRadius }; });
  const kind = isBackdrop || (r.width > 280 && title && footer.length) ? 'dialog' : 'menu';
  if (kind === 'menu') return { kind, menu: { items: [...panel.querySelectorAll('a, button, li')].map(i => (i.innerText || '').trim()).filter(Boolean).slice(0, 12), w: Math.round(r.width) } };
  return { kind, dialog: {
    generic: true, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), radius: s.borderRadius, padding: s.padding, bg: s.backgroundColor, backdrop: isBackdrop,
    title: title ? { text: (title.innerText || '').trim().slice(0, 60), fontSize: getComputedStyle(title).fontSize, fontWeight: getComputedStyle(title).fontWeight } : null,
    close: close ? { w: Math.round(close.getBoundingClientRect().width), h: Math.round(close.getBoundingClientRect().height), x: Math.round(close.getBoundingClientRect().x - r.x) } : null,
    hasFooter: footer.length > 0, footerButtons: footer, inputs: panel.querySelectorAll('input, select, textarea').length,
    text: (panel.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 160),
  } };
};

async function closeOverlays() {
  await page.keyboard.press('Escape').catch(() => null);
  await page.waitForTimeout(250);
  const still = await page.evaluate(dialogProbe).catch(() => null);
  if (still) {
    const c = page.locator('.modal.show .btn-close, [role=dialog] [aria-label*="lose" i], [role=dialog] button:has-text("Close"), .modal.show [data-bs-dismiss="modal"]').first();
    if (await c.count()) await c.click({ timeout: 1500 }).catch(() => null);
    await page.waitForTimeout(300);
  }
  return !!still;
}

// operate one locator; returns what it opened
async function operate(loc, label, pageUrl) {
  const before = page.url();
  await page.evaluate(tagPositioned).catch(() => null);
  try { await loc.scrollIntoViewIfNeeded({ timeout: 1500 }); await loc.click({ timeout: 2500 }); } catch (e) { return { label, result: 'not-clickable' }; }
  await page.waitForTimeout(600);
  const out = { label };
  if (page.url().split('#')[0] !== before.split('#')[0]) {
    out.result = 'navigated'; out.to = page.url();
    await load(pageUrl);
    return out;
  }
  const dlg = await page.evaluate(dialogProbe).catch(() => null);
  if (dlg) {
    out.result = 'dialog'; out.dialog = dlg;
    await page.keyboard.press('Escape').catch(() => null); await page.waitForTimeout(300);
    out.escCloses = !(await page.evaluate(dialogProbe).catch(() => null));
    await closeOverlays();
    return out;
  }
  const menu = await page.evaluate(menuProbe).catch(() => null);
  if (menu) { out.result = 'menu'; out.menu = menu; await closeOverlays(); return out; }
  const gen = await page.evaluate(genericProbe).catch(() => null);
  if (gen) {
    out.result = gen.kind; out.detector = 'generic';
    if (gen.dialog) out.dialog = gen.dialog;
    if (gen.menu) out.menu = gen.menu;
    await page.keyboard.press('Escape').catch(() => null); await page.waitForTimeout(300);
    const still = await page.evaluate(genericProbe).catch(() => null);
    out.escCloses = !still;
    if (still) await load(pageUrl); // leave the page clean for the next control
    return out;
  }
  out.result = 'no-visible-change';
  return out;
}

// Resume: an existing audit file keeps its rows; the crawl continues from its queue.
const prevFile = join(OUT, `audit-${REF}.json`);
const prev = !process.env.GR7_ONLY && (await import('node:fs')).existsSync(prevFile) ? JSON.parse((await import('node:fs')).readFileSync(prevFile, 'utf8')) : null;
const rows = prev ? prev.rows : [];
const seen = new Set(rows.flatMap(r => [r.url, r.finalUrl].filter(Boolean)));
// GR7_ONLY=url1,url2: audit exactly these pages (no link following, no resume) — used for smoke tests and targeted re-runs.
const ONLY = process.env.GR7_ONLY ? process.env.GR7_ONLY.split(',') : null;
const queue = ONLY ? [...ONLY] : prev ? prev.remainingQueue.filter(u => !seen.has(u)) : [ENTRY];
let n = rows.length;
if (ONLY) { rows.length = 0; seen.clear(); n = 0; }
if (prev) appendFileSync(LOG, `RESUME at ${n} rows, queue ${queue.length}\n`);
while (queue.length && rows.length < LIMIT) {
  const url = queue.shift();
  if (seen.has(url)) continue;
  seen.add(url);
  const id = String(n++).padStart(3, '0');
  const row = { id, url, state: 'inspected' };
  try {
    row.status = await load(url);
    row.finalUrl = page.url();
    if (row.finalUrl !== url) seen.add(row.finalUrl);
    row.title = await page.title();
    row.heading = await page.locator('h1, h2, h3, h4').first().innerText({ timeout: 1200 }).catch(() => null);
    const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')));
    if (!ONLY) for (const l of links) { const u = norm(l, page.url()); if (u && !seen.has(u) && !queue.includes(u)) queue.push(u); }
    row.shot = `shots-${REF}/${id}-1440.jpg`;
    await page.screenshot({ path: join(OUT, row.shot), fullPage: true, type: 'jpeg', quality: 35 }).catch(e => { row.shotError = String(e).slice(0, 120); });

    // tables
    row.tables = await page.evaluate(tableProbe).catch(() => []);
    for (const t of row.tables) {
      const tl = page.locator('table').filter({ visible: true }).nth(t.index);
      // select-all
      if (t.headCheckbox) {
        const btnsBefore = await page.evaluate(visibleButtons);
        const hc = tl.locator('thead tr, tr').first().locator('input[type=checkbox]').first();
        try {
          await hc.check({ timeout: 2000, force: true });
          await page.waitForTimeout(400);
          const res = await tl.evaluate(tb => {
            const rs = [...tb.querySelectorAll('tbody tr')];
            const checked = rs.filter(r => r.querySelector('input[type=checkbox]')?.checked).length;
            return { checked, total: rs.length, selectedRowBg: rs[0] ? getComputedStyle(rs[0]).backgroundColor : null };
          });
          const btnsAfter = await page.evaluate(visibleButtons);
          res.appearedButtons = btnsAfter.filter(b => !btnsBefore.includes(b)).slice(0, 8);
          t.selectAll = res;
          await hc.uncheck({ timeout: 2000, force: true }).catch(() => null);
        } catch (e) { t.selectAll = { error: String(e).slice(0, 100) }; }
      }
      // first-row action controls
      t.actionsOperated = [];
      const lastCell = tl.locator('tbody tr').first().locator('td').last();
      const CTL = 'a, button, [role=button], [data-bs-toggle], .dropdown-toggle, [class*="action" i] > *, [onclick]';
      let ctlCount = await lastCell.locator(CTL).count().catch(() => 0);
      let ctlSel = CTL;
      if (!ctlCount && t.lastCellControls.length) { ctlSel = 'svg, i, span, div'; ctlCount = 1; }
      for (let i = 0; i < Math.min(ctlCount, 4); i++) {
        t.actionsOperated.push(await operate(tl.locator('tbody tr').first().locator('td').last().locator(ctlSel).nth(i), `row-action-${i}`, url));
      }
    }

    // modal triggers + dropdown toggles + likely popup buttons
    row.popups = [];
    const trig = page.locator('[data-bs-toggle="modal"], [data-toggle="modal"], [data-modal-target], [data-hs-overlay]');
    const tc = Math.min(await trig.count(), 30);
    for (let i = 0; i < tc; i++) {
      const lbl = await trig.nth(i).innerText({ timeout: 800 }).catch(() => '') || await trig.nth(i).getAttribute('data-bs-target').catch(() => '');
      row.popups.push(await operate(trig.nth(i), `modal-trigger: ${String(lbl).trim().slice(0, 40)}`, url));
    }
    const named = page.locator('main button, main a.btn, .content-body button, .page-content button, [class*="content" i] button')
      .filter({ hasText: /modal|add|new|create|delete|remove|edit|open|launch|show|view|reply|assign/i });
    const nc = Math.min(await named.count(), 10);
    for (let i = 0; i < nc; i++) {
      const lbl = await named.nth(i).innerText({ timeout: 800 }).catch(() => '');
      if (/log ?out|sign ?out/i.test(lbl)) continue;
      row.popups.push(await operate(named.nth(i), `button: ${lbl.trim().slice(0, 40)}`, url));
    }
    const dd = page.locator('main [data-bs-toggle="dropdown"], .content-body [data-bs-toggle="dropdown"], .page-content [data-bs-toggle="dropdown"]');
    const dc = Math.min(await dd.count(), 6);
    for (let i = 0; i < dc; i++) row.popups.push(await operate(dd.nth(i), `dropdown-${i}`, url));

    const hasDialog = row.popups.some(p => p.result === 'dialog') || row.tables.some(t => t.actionsOperated?.some(a => a.result === 'dialog'));
    if (row.tables.length || hasDialog) {
      await page.setViewportSize({ width: 390, height: 844 });
      await load(url);
      row.shot390 = `shots-${REF}/${id}-390.jpg`;
      await page.screenshot({ path: join(OUT, row.shot390), fullPage: true, type: 'jpeg', quality: 35 }).catch(() => null);
      row.overflow390 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      await page.setViewportSize({ width: 1440, height: 900 });
    }
  } catch (e) {
    row.state = 'blocked'; row.error = String(e).slice(0, 200);
  }
  rows.push(row);
  log(`${id}\t${row.state}\t${row.status}\ttables=${row.tables?.length ?? 0}\tpopups=${row.popups?.length ?? 0}\t${row.finalUrl || url}`);
  writeFileSync(join(OUT, `audit-${REF}.json`), JSON.stringify({ ref: REF, entry: ENTRY, scope: SCOPE, loginNote, updatedAt: new Date().toISOString(), remainingQueue: queue, rows }, null, 1));
}
log(`DONE ${REF}: ${rows.length} pages, ${rows.filter(r => r.state === 'blocked').length} blocked, queue left ${queue.length}`);
await browser.close();
