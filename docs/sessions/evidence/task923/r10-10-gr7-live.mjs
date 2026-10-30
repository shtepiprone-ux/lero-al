// Task 923 Revision 10 - GR-7 live check, moment: execution (Sonnet), run BEFORE the first Revision 10 write.
//   node docs/sessions/evidence/task923/r10-10-gr7-live.mjs docs/sessions/evidence/task923/r10-10-gr7
// Subjects the Revision 10 requirements touch:
//   R48  the filter panel's compact-only close icon and Apply button, and Tab containment inside a drawer / offcanvas
//        (Mantine's focus trap counts a CSS-hidden control as tabbable, kickoff C385).
//   R49  a table whose columns carry no percentage shares (kickoff C402, C405): how the reference tables size their columns.
// Read-only on every reference: nothing is submitted except Kamr's documented demo sign-in.
// Primary sources fetched for their literal text: WAI-ARIA APG Dialog (Modal) pattern, WCAG 2.2 SC 1.4.10 Reflow.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const L = 'https://techzaa.in/lahomes/admin/';
const O = 'https://omah.dexignzone.com/xhtml/';
const T = 'https://demo.tailadmin.com/';
const K = 'https://kamr-vite.vercel.app/';

async function literal(url, patterns) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const text = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    return {
      source: url,
      status: res.status,
      literals: patterns.map((p) => {
        const i = text.search(p);
        return { pattern: String(p), literal: i >= 0 ? text.slice(Math.max(0, i - 80), i + 260) : 'NOT FOUND' };
      }),
    };
  } catch (e) {
    return { source: url, error: String(e.message).split('\n')[0] };
  }
}

/** in the page: every table, its wrapper and whether any column carries a percentage width */
const inspectTables = () => {
  const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  return [...document.querySelectorAll('table')].filter(visible).slice(0, 6).map((table) => {
    const wrapper = table.closest('.table-responsive, .overflow-x-auto, [class*="overflow-x"], [class*="scroll"]') || table.parentElement;
    const cols = [...table.querySelectorAll('col, th, td')];
    const pct = cols.filter((c) => /%/.test(c.getAttribute('style') || '') && /width/.test(c.getAttribute('style') || '') || /%/.test(c.getAttribute('width') || ''));
    return {
      columns: table.querySelectorAll('thead th').length,
      tableLayout: getComputedStyle(table).tableLayout,
      tableWidth: Math.round(table.getBoundingClientRect().width),
      wrapperClient: wrapper.clientWidth,
      wrapperScroll: wrapper.scrollWidth,
      scrolls: wrapper.scrollWidth > wrapper.clientWidth + 1,
      percentageWidthColumns: pct.length,
    };
  });
};

/** in the page: filter / offcanvas controls and what an opened panel holds */
const inspectFilters = () => {
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const txt = (el) => (el.textContent || '').trim().replace(/\s+/g, ' ');
  const triggers = [...document.querySelectorAll('button, a.btn, a[data-bs-toggle], [data-bs-toggle="offcanvas"]')].filter(visible)
    .map(txt).filter((t) => /filter|offcanvas|search|toggle/i.test(t)).slice(0, 12);
  const applies = [...document.querySelectorAll('button, a.btn, input[type="submit"]')].filter(visible)
    .map((b) => txt(b) || b.value || '').filter((t) => /apply|search|filter|reset|clear/i.test(t)).slice(0, 12);
  return { triggers, applies, offcanvasCount: document.querySelectorAll('.offcanvas').length };
};

/** open the offcanvas triggers one by one; record the panel anatomy and whether Tab stays inside it */
async function operateOffcanvas(page, url, width, row) {
  row.panels = [];
  const handles = await page.$$('[data-bs-toggle="offcanvas"]');
  const n = Math.min(handles.length, 6);
  for (let i = 0; i < n; i += 1) {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(600);
    const btn = (await page.$$('[data-bs-toggle="offcanvas"]'))[i];
    if (!btn || !(await btn.isVisible())) { row.panels.push({ index: i, error: 'trigger not visible' }); continue; }
    const label = ((await btn.textContent()) || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    try { await btn.click({ timeout: 5000 }); } catch { row.panels.push({ index: i, label, error: 'not clickable' }); continue; }
    await page.waitForTimeout(900);
    const panel = await page.evaluate(() => {
      const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      const p = [...document.querySelectorAll('.offcanvas.show, .offcanvas.showing')].find(visible);
      if (!p) return null;
      const r = p.getBoundingClientRect();
      return {
        placement: p.className.match(/offcanvas-(start|end|top|bottom)/)?.[1] || null,
        box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        closeControls: [...p.querySelectorAll('[data-bs-dismiss="offcanvas"], .btn-close')].filter(visible).length,
        buttons: [...p.querySelectorAll('button, a.btn')].filter(visible).map((b) => (b.textContent || '').trim().replace(/\s+/g, ' ')).slice(0, 8),
      };
    });
    const trap = [];
    if (panel) {
      for (let k = 0; k < 12; k += 1) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(80);
        trap.push(await page.evaluate(() => {
          const p = document.querySelector('.offcanvas.show, .offcanvas.showing');
          return !!(p && document.activeElement && p.contains(document.activeElement));
        }));
      }
    }
    row.panels.push({ index: i, label, panel, tabStaysInside: panel ? trap.every(Boolean) : null, tabPresses: trap.length });
  }
}

const TARGETS = [
  { ref: 'lahomes', name: 'ui-offcanvas', url: `${L}ui-offcanvas.html`, offcanvas: true, widths: [390, 1440] },
  { ref: 'lahomes', name: 'property-grid', url: `${L}property-grid.html`, filters: true, widths: [390, 1440] },
  { ref: 'lahomes', name: 'property-list', url: `${L}property-list.html`, filters: true, tables: true, widths: [768, 390] },
  { ref: 'omah', name: 'property-list', url: `${O}property-list.html`, filters: true, widths: [390, 1440] },
  { ref: 'tailadmin', name: 'basic-tables', url: `${T}basic-tables`, tables: true, widths: [768, 390] },
  { ref: 'kamr', name: 'table-filtering', url: `${K}table-filtering`, kamr: true, filters: true, tables: true, widths: [768, 390] },
];

const out = { takenAt: new Date().toISOString(), primary: [], pages: [] };
out.primary.push(await literal('https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/', [/Tab\s*:?\s*Moves focus to the next tabbable element inside the dialog/i, /Shift \+ Tab/i]));
out.primary.push(await literal('https://www.w3.org/WAI/WCAG21/Understanding/reflow', [/without loss of information or functionality/i]));

const browser = await chromium.launch();
let kamrState = null;
for (const target of TARGETS) {
  for (const width of target.widths) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, storageState: target.kamr ? kamrState ?? undefined : undefined });
    const page = await ctx.newPage();
    const row = { ref: target.ref, name: target.name, url: target.url, width };
    try {
      if (target.kamr && !kamrState) {
        await page.goto(`${K}login`, { waitUntil: 'networkidle', timeout: 45000 });
        await page.fill('input[type="email"], input[name="email"]', 'demo@example.com');
        await page.fill('input[type="password"]', '123456');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(4000);
        kamrState = await ctx.storageState();
        row.kamrLogin = page.url();
      }
      const res = await page.goto(target.url, { waitUntil: 'networkidle', timeout: 45000 });
      row.status = res ? res.status() : null;
      row.finalUrl = page.url();
      await page.waitForTimeout(1500);
      if (target.tables) row.tables = await page.evaluate(inspectTables);
      if (target.filters) row.filters = await page.evaluate(inspectFilters);
      if (target.offcanvas) await operateOffcanvas(page, target.url, width, row);
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.screenshot({ path: join(OUT, `${target.ref}-${target.name}-${width}.png`), fullPage: false });
    } catch (e) { row.error = String(e.message || e).slice(0, 300); }
    out.pages.push(row);
    await ctx.close();
  }
}
await browser.close();
writeFileSync(join(OUT, 'gr7-live.json'), JSON.stringify(out, null, 2) + '\n');

console.log(`platform ${process.platform} node ${process.version}`);
for (const p of out.primary) console.log(`primary ${p.source} status ${p.status ?? 'ERROR ' + p.error}`, ...(p.literals ?? []).map((l) => `\n   [${l.pattern}] ${l.literal.slice(0, 200)}`));
for (const r of out.pages) {
  if (r.error) { console.log(`${r.ref} ${r.name} @${r.width}: ERROR ${r.error}`); continue; }
  const bits = [`status ${r.status}`];
  if (r.tables) bits.push(`tables ${r.tables.length}: ` + r.tables.map((t) => `${t.columns}c ${t.tableLayout} w${t.tableWidth} wrap ${t.wrapperClient}/${t.wrapperScroll}${t.scrolls ? ' SCROLLS' : ''} pct-cols ${t.percentageWidthColumns}`).join(' | '));
  if (r.filters) bits.push(`filter triggers [${r.filters.triggers.join(' | ')}] apply-like [${r.filters.applies.join(' | ')}] offcanvas ${r.filters.offcanvasCount}`);
  if (r.panels) bits.push(`panels ${r.panels.length}: ` + r.panels.map((p) => p.error ? `${p.label ?? p.index}:${p.error}` : `${p.label} ${p.panel ? `${p.panel.placement ?? '?'} ${p.panel.box.w}x${p.panel.box.h} close ${p.panel.closeControls} buttons [${p.panel.buttons.join(',')}] tab-inside ${p.tabStaysInside}` : 'no panel'}`).join(' ; '));
  console.log(`${r.ref} ${r.name} @${r.width}: ${bits.join('; ')}`);
}
