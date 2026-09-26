// Task 852 review-4 remediation (GR-3b) — evidence-only probe (never imported by any gate).
// Measures AC22-AC25 against a FRESH storybook-static build (built after the R20-R23 story edits).
// Run: node docs/sessions/evidence/task852/probe-stories.mjs
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const staticDir = join(ROOT, 'storybook-static');
const PORT = 6053; // distinct from every other task's static-server port used in this repo
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

function startStaticServer(dir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(dir, decodeURIComponent(urlPath));
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(dir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

const WIDTHS = [320, 390, 1024, 1440];
const SM_PX = 12; // theme.spacing.sm = 0.75rem

function storyUrl(baseUrl, id, locale = 'en') {
  return `${baseUrl}/iframe.html?id=${id}&globals=locale:${locale}&viewMode=story`;
}

async function main() {
  console.log('probe-stories.mjs — Task 852 review-4 remediation (AC22-AC25, GR-3b)');
  console.log(`platform: ${process.platform}`);
  console.log(`node: ${process.version}`);
  console.log('command: node docs/sessions/evidence/task852/probe-stories.mjs\n');

  const server = await startStaticServer(staticDir, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const failures = [];
  const results = { ac22: [], ac23: [], ac24: [], ac25: {} };

  // ---- AC22: AdminSidebar --default ----
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminsidebar--default'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000 });
    const m = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="admin-sidebar"]');
      return {
        sidebarWidth: el ? el.getBoundingClientRect().width : null,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    console.log(`[AC22] adminsidebar--default ${width}px -> sidebarWidth=${m.sidebarWidth} scrollWidth=${m.scrollWidth} innerWidth=${m.innerWidth}`);
    results.ac22.push({ width, ...m });
    const expected = width < 1024 ? width : 240;
    const tolerance = width < 1024 ? 20 : 1; // mobile: allow for scrollbar gutter
    if (Math.abs(m.sidebarWidth - expected) > tolerance) {
      failures.push(`AC22 ${width}px: sidebar width ${m.sidebarWidth} !== expected ~${expected}`);
    }
    if (m.scrollWidth > m.innerWidth) failures.push(`AC22 ${width}px: horizontal overflow (scrollWidth ${m.scrollWidth} > innerWidth ${m.innerWidth})`);
    await page.close();
  }

  // ---- AC23: AdminLocaleSwitcher --idle ----
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminlocaleswitcher--idle'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-locale-switcher"]', { timeout: 15000 });
    const m = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="admin-locale-switcher"]');
      const button = root ? root.querySelector('button') : null;
      return {
        buttonWidth: button ? button.getBoundingClientRect().width : null,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    const boxWidth = width < 1024 ? width : 240;
    const expected = boxWidth - 2 * SM_PX;
    console.log(`[AC23] adminlocaleswitcher--idle ${width}px -> buttonWidth=${m.buttonWidth} expected=${expected} scrollWidth=${m.scrollWidth} innerWidth=${m.innerWidth}`);
    results.ac23.push({ width, expected, ...m });
    if (Math.abs(m.buttonWidth - expected) > 1) failures.push(`AC23 ${width}px: trigger width ${m.buttonWidth} !== expected ${expected} (±1)`);
    if (m.scrollWidth > m.innerWidth) failures.push(`AC23 ${width}px: horizontal overflow (scrollWidth ${m.scrollWidth} > innerWidth ${m.innerWidth})`);
    await page.close();
  }

  // ---- AC24: Mantine/Primitives/LocaleSwitcher fullWidth block ----
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'mantine-primitives-localeswitcher--default'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const captions = Array.from(document.querySelectorAll('p, span, div')).filter((el) => /fullWidth/.test(el.textContent || '') && el.children.length === 0);
      const caption = captions[0] ?? null;
      // The fullWidth block's caption Text is immediately followed by the wrapper Stack (siblings
      // inside the same `<Stack gap="xs">` block).
      const wrapperStack = caption ? caption.nextElementSibling : null;
      const button = wrapperStack ? wrapperStack.querySelector('button') : null;
      return {
        captionText: caption ? caption.textContent : null,
        buttonWidth: button ? button.getBoundingClientRect().width : null,
        stackWidth: wrapperStack ? wrapperStack.getBoundingClientRect().width : null,
      };
    });
    console.log(`[AC24] mantine-primitives-localeswitcher--default ${width}px -> buttonWidth=${m.buttonWidth} stackWidth=${m.stackWidth} caption="${m.captionText}"`);
    results.ac24.push({ width, ...m });
    if (m.buttonWidth === null || m.stackWidth === null) {
      failures.push(`AC24 ${width}px: could not locate the fullWidth block (caption/button not found)`);
    } else if (Math.abs(m.buttonWidth - m.stackWidth) > 1) {
      failures.push(`AC24 ${width}px: fullWidth trigger width ${m.buttonWidth} !== parent Stack width ${m.stackWidth} (±1)`);
    }
    if (m.captionText && m.captionText.includes('Task')) {
      failures.push(`AC24 ${width}px: caption still contains "Task" — "${m.captionText}"`);
    }
    await page.close();
  }

  // ---- GR-3b receipt data (not gated by any AC — AdminShell/AdminHeader are the full-width shell
  // and top bar, structurally always 100% viewport, not a capped component) ----
  results.gr3b_shell = { adminshell: [], adminheader: [] };
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminshell--default'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.mantine-AppShell-header', { timeout: 15000 });
    const m = await page.evaluate(() => {
      const root = document.querySelector('.mantine-AppShell-root') ?? document.body.firstElementChild;
      const header = document.querySelector('.mantine-AppShell-header');
      return {
        rootWidth: root ? root.getBoundingClientRect().width : null,
        headerWidth: header ? header.getBoundingClientRect().width : null,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    console.log(`[GR-3b] adminshell--default ${width}px -> rootWidth=${m.rootWidth} headerWidth=${m.headerWidth} scrollWidth=${m.scrollWidth}`);
    results.gr3b_shell.adminshell.push({ width, ...m });
    await page.close();
  }
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminheader--default'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-header"]', { timeout: 15000 });
    const m = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="admin-header"]');
      return {
        headerWidth: el ? el.getBoundingClientRect().width : null,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });
    console.log(`[GR-3b] adminheader--default ${width}px -> headerWidth=${m.headerWidth} scrollWidth=${m.scrollWidth}`);
    results.gr3b_shell.adminheader.push({ width, ...m });
    await page.close();
  }

  // ---- AC25: AppShellFoundation header slot vertical centring ----
  for (const storyId of ['patterns-mantine-appshellfoundation--with-slots', 'patterns-mantine-appshellfoundation--default']) {
    results.ac25[storyId] = {};
    for (const width of [390, 1440]) {
      const page = await browser.newPage();
      await page.setViewportSize({ width, height: 900 });
      await page.goto(storyUrl(baseUrl, storyId), { waitUntil: 'load', timeout: 30000 });
      await page.waitForSelector('.mantine-AppShell-header', { timeout: 15000 });
      const m = await page.evaluate(() => {
        const header = document.querySelector('.mantine-AppShell-header');
        // The slot text is the first text-bearing leaf element inside the header.
        const candidates = header ? Array.from(header.querySelectorAll('*')).filter((el) => el.children.length === 0 && (el.textContent || '').trim().length > 0) : [];
        const textEl = candidates[0] ?? null;
        if (!header || !textEl) return { headerCenterY: null, textCenterY: null };
        const h = header.getBoundingClientRect();
        const t = textEl.getBoundingClientRect();
        return {
          headerCenterY: h.top + h.height / 2,
          textCenterY: t.top + t.height / 2,
        };
      });
      const delta = m.headerCenterY !== null && m.textCenterY !== null ? Math.abs(m.headerCenterY - m.textCenterY) : null;
      console.log(`[AC25] ${storyId} ${width}px -> headerCenterY=${m.headerCenterY} textCenterY=${m.textCenterY} delta=${delta}`);
      results.ac25[storyId][width] = { ...m, delta };
      if (delta === null) failures.push(`AC25 ${storyId} ${width}px: could not locate header/slot text`);
      else if (delta > 1) failures.push(`AC25 ${storyId} ${width}px: slot text not vertically centred (delta=${delta}px)`);
      await page.close();
    }
  }

  // ---- AC30 (review 5): adminlocaleswitcher--idle, fullWidthTrigger fix ----
  results.ac30_adminlocaleswitcher = [];
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminlocaleswitcher--idle', 'uk'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-locale-switcher"]', { timeout: 15000 });
    const before = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="admin-locale-switcher"]');
      const button = root ? root.querySelector('button') : null;
      return { buttonWidth: button ? button.getBoundingClientRect().width : null };
    });
    await page.click('[data-testid="admin-locale-switcher"] button');
    await page.waitForTimeout(200);
    const opened = await page.evaluate((w) => {
      if (w >= 640) return !!document.querySelector('.mantine-Menu-dropdown');
      return !!document.querySelector('[role="dialog"]') || !!document.querySelector('.mantine-Modal-content') || !!document.querySelector('.mantine-Drawer-content');
    }, width);
    const boxWidth = width < 1024 ? width : 240;
    const expected = boxWidth - 2 * SM_PX;
    console.log(`[AC30] adminlocaleswitcher--idle ${width}px -> buttonWidth=${before.buttonWidth} expected=${expected} opened(${width >= 640 ? 'menu' : 'sheet'})=${opened}`);
    results.ac30_adminlocaleswitcher.push({ width, expected, buttonWidth: before.buttonWidth, opened });
    if (Math.abs(before.buttonWidth - expected) > 1) failures.push(`AC30 adminlocaleswitcher ${width}px: trigger width ${before.buttonWidth} !== expected ${expected} (±1)`);
    if (!opened) failures.push(`AC30 adminlocaleswitcher ${width}px: clicking the trigger did not open the ${width >= 640 ? 'anchored Menu' : 'bottom sheet'}`);
    await page.close();
  }

  results.ac30_primitives = [];
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'mantine-primitives-localeswitcher--default', 'uk'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const captions = Array.from(document.querySelectorAll('p, span, div')).filter((el) => /fullWidth/.test(el.textContent || '') && el.children.length === 0);
      const caption = captions[0] ?? null;
      const wrapperStack = caption ? caption.nextElementSibling : null;
      const button = wrapperStack ? wrapperStack.querySelector('button') : null;
      return {
        buttonWidth: button ? button.getBoundingClientRect().width : null,
        stackWidth: wrapperStack ? wrapperStack.getBoundingClientRect().width : null,
      };
    });
    console.log(`[AC30] primitives-localeswitcher fullWidth ${width}px -> buttonWidth=${m.buttonWidth} stackWidth=${m.stackWidth}`);
    results.ac30_primitives.push({ width, ...m });
    if (m.buttonWidth === null || m.stackWidth === null) failures.push(`AC30 primitives ${width}px: could not locate the fullWidth block`);
    else if (Math.abs(m.buttonWidth - m.stackWidth) > 1) failures.push(`AC30 primitives ${width}px: trigger width ${m.buttonWidth} !== parent Stack width ${m.stackWidth} (±1)`);
    await page.close();
  }

  // ---- AC31 (review 5): default-branch trigger width unchanged (no regression) ----
  results.ac31_after = {};
  const AC31_TARGETS = [
    { id: 'mantine-primitives-dropdownmenu--default', label: 'first trigger text Дії' },
    { id: 'mantine-primitives-usermenu--default', label: 'first trigger text "AKAlba Krasniqi"' },
    { id: 'mantine-primitives-usermenu--signing-out', label: 'first trigger text "AKAlba Krasniqi"' },
  ];
  const beforeJson = JSON.parse(await readFile(join(__dirname, 'ac31-before.json'), 'utf8'));
  for (const { id, label } of AC31_TARGETS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(storyUrl(baseUrl, id, 'uk'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(500);
    const width = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button')).filter((b) => b.getBoundingClientRect().width > 0);
      return btns.length ? btns[0].getBoundingClientRect().width : null;
    });
    const beforeWidth = beforeJson[id].widthPx;
    console.log(`[AC31] ${id} @1440 (${label}) -> before=${beforeWidth} after=${width}`);
    results.ac31_after[id] = { before: beforeWidth, after: width };
    if (Math.abs(width - beforeWidth) > 0.01) failures.push(`AC31 ${id}: width changed (before=${beforeWidth}, after=${width}) — default-branch regression`);
    await page.close();
  }

  // ---- AC32 (review 5): the new DropdownMenu fullWidthTrigger state fills its fluid parent ----
  results.ac32 = [];
  for (const width of [390, 1440]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'mantine-primitives-dropdownmenu--default', 'uk'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const captions = Array.from(document.querySelectorAll('p, span, div')).filter((el) => /fullWidthTrigger/.test(el.textContent || '') && el.children.length === 0);
      const caption = captions[0] ?? null;
      const wrapperStack = caption ? caption.nextElementSibling : null;
      const button = wrapperStack ? wrapperStack.querySelector('button') : null;
      return {
        buttonWidth: button ? button.getBoundingClientRect().width : null,
        stackWidth: wrapperStack ? wrapperStack.getBoundingClientRect().width : null,
      };
    });
    console.log(`[AC32] dropdownmenu fullWidthTrigger state ${width}px -> buttonWidth=${m.buttonWidth} stackWidth=${m.stackWidth}`);
    results.ac32.push({ width, ...m });
    if (m.buttonWidth === null || m.stackWidth === null) failures.push(`AC32 ${width}px: could not locate the fullWidthTrigger state block`);
    else if (Math.abs(m.buttonWidth - m.stackWidth) > 1) failures.push(`AC32 ${width}px: trigger width ${m.buttonWidth} !== parent Stack width ${m.stackWidth} (±1)`);
    await page.close();
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  await writeFile(join(__dirname, 'probe-stories.json'), JSON.stringify(results, null, 2));

  if (failures.length > 0) {
    console.error('\nFATAL — probe-stories.mjs failures:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('\nAll probe-stories.mjs assertions passed (AC22/AC23/AC24/AC25).');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
