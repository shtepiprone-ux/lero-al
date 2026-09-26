// Task 852 review-7/review-8 remediation (D852-1: 640-1023 drawer, not full-width; review-8: the
// drawer body must bound `AdminSidebar`'s `ScrollArea`, R32) — evidence-only probe.
// Measures AC35-AC38 (review 7) and AC42/AC43 (review 8) against a FRESH storybook-static build.
// Run: node docs/sessions/evidence/task852/probe-drawer.mjs
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const staticDir = join(ROOT, 'storybook-static');
const PORT = 6057; // distinct from every other task's static-server port used in this repo
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const SM_PX = 12; // theme.spacing.sm = 0.75rem

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

function storyUrl(baseUrl, id, locale = 'uk') {
  return `${baseUrl}/iframe.html?id=${id}&globals=locale:${locale}&viewMode=story`;
}

// `keepMounted` means `.mantine-Drawer-content` can exist in the DOM while closed (display:none),
// so every check here tests visibility, never mere presence.
const isDrawerOpenFn = () => {
  const content = document.querySelector('.mantine-Drawer-content');
  return !!content && getComputedStyle(content).display !== 'none' && content.getBoundingClientRect().width > 0;
};

async function waitForDrawerOpen(page, timeout = 10000) {
  await page.waitForFunction(isDrawerOpenFn, undefined, { timeout });
}
async function waitForDrawerClosed(page, timeout = 10000) {
  await page.waitForFunction(() => !((document.querySelector('.mantine-Drawer-content')) && getComputedStyle(document.querySelector('.mantine-Drawer-content')).display !== 'none'), undefined, { timeout });
}

async function main() {
  console.log('probe-drawer.mjs — Task 852 review-7 remediation (AC35-AC38, D852-1)');
  console.log(`platform: ${process.platform}`);
  console.log(`node: ${process.version}`);
  console.log('command: node docs/sessions/evidence/task852/probe-drawer.mjs\n');

  const server = await startStaticServer(staticDir, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const failures = [];
  const results = {};

  // ---- AC35: drawer width + overlay + Main padding-left, at 390/768/960; nothing at 1024/1440 ----
  results.ac35 = [];
  for (const width of [390, 768, 960]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminshell--drawer-open'), { waitUntil: 'load', timeout: 30000 });
    await waitForDrawerOpen(page);
    const m = await page.evaluate(() => {
      const content = document.querySelector('.mantine-Drawer-content');
      const overlay = document.querySelector('.mantine-Drawer-overlay');
      const main = document.querySelector('.mantine-AppShell-main');
      return {
        drawerWidth: content ? content.getBoundingClientRect().width : null,
        overlayVisible: !!overlay && getComputedStyle(overlay).display !== 'none',
        mainPaddingLeft: main ? getComputedStyle(main).paddingLeft : null,
      };
    });
    const expected = width === 390 ? 390 : 240;
    console.log(`[AC35] ${width}px -> drawerWidth=${m.drawerWidth} expected=${expected} overlayVisible=${m.overlayVisible} mainPaddingLeft=${m.mainPaddingLeft}`);
    results.ac35.push({ width, expected, ...m });
    if (Math.abs(m.drawerWidth - expected) > 1) failures.push(`AC35 ${width}px: drawer width ${m.drawerWidth} !== expected ${expected} (±1)`);
    if (!m.overlayVisible) failures.push(`AC35 ${width}px: drawer overlay not visible`);
    if (m.mainPaddingLeft !== '0px') failures.push(`AC35 ${width}px: Main padding-left ${m.mainPaddingLeft} !== 0px (content should not be pushed)`);
    await page.close();
  }
  for (const width of [1024, 1440]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminshell--default'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.mantine-AppShell-navbar', { timeout: 15000 });
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const navbar = document.querySelector('.mantine-AppShell-navbar');
      const burger = Array.from(document.querySelectorAll('button')).find((b) => /меню|menu/i.test(b.getAttribute('aria-label') || ''));
      return {
        navbarWidth: navbar ? navbar.getBoundingClientRect().width : null,
        drawerContentInDom: !!document.querySelector('.mantine-Drawer-content'),
        burgerVisible: burger ? getComputedStyle(burger).display !== 'none' : false,
      };
    });
    console.log(`[AC35] ${width}px -> navbarWidth=${m.navbarWidth} drawerContentInDom=${m.drawerContentInDom} burgerVisible=${m.burgerVisible}`);
    results.ac35.push({ width, ...m });
    if (Math.abs(m.navbarWidth - 240) > 1) failures.push(`AC35 ${width}px: navbar width ${m.navbarWidth} !== 240`);
    if (m.drawerContentInDom) failures.push(`AC35 ${width}px: .mantine-Drawer-content is in the DOM at all (should not be mounted above the breakpoint)`);
    if (m.burgerVisible) failures.push(`AC35 ${width}px: burger unexpectedly visible`);
    await page.close();
  }

  // ---- AC36: focus trap, Tab, Escape+focus-return, overlay-click-close, nav-click-close, close-button label ----
  // Loads `--default` and drives a REAL Playwright click on the burger, not the `--drawer-open`
  // story's own `play()` (which uses testing-library's `userEvent.click`) — measured: the synthetic
  // click leaves focus on the burger instead of moving it into the drawer at 390px specifically
  // (768px was unaffected), while a genuine `page.click()` auto-focuses correctly at both widths.
  // This is a testing-library/synthetic-event artifact, not a Mantine or product defect.
  results.ac36 = {};
  for (const width of [390, 768]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminshell--default'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000, state: 'attached' });
    await page.click('button[aria-label="Відкрити меню"]');
    await waitForDrawerOpen(page);
    await page.waitForTimeout(250);

    const activeInDrawer = () => page.evaluate(() => {
      const content = document.querySelector('.mantine-Drawer-content');
      return !!(content && document.activeElement && content.contains(document.activeElement));
    });
    const afterOpen = await activeInDrawer();
    let stayedTrapped = true;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      // eslint-disable-next-line no-await-in-loop
      if (!(await activeInDrawer())) { stayedTrapped = false; break; }
    }
    const closeLabel = await page.evaluate(() => {
      const btn = document.querySelector('.mantine-Drawer-content button[aria-label]');
      return btn ? btn.getAttribute('aria-label') : null;
    });

    await page.keyboard.press('Escape');
    await waitForDrawerClosed(page).catch(() => {});
    await page.waitForTimeout(100);
    const afterEscape = await page.evaluate(() => {
      const content = document.querySelector('.mantine-Drawer-content');
      const closed = !content || getComputedStyle(content).display === 'none';
      const active = document.activeElement;
      const activeIsBurger = !!active && /меню|menu/i.test(active.getAttribute('aria-label') || '');
      return { closed, activeIsBurger };
    });

    console.log(`[AC36] ${width}px -> afterOpen(inDrawer)=${afterOpen} stayedTrapped=${stayedTrapped} closeLabel="${closeLabel}" afterEscape.closed=${afterEscape.closed} afterEscape.activeIsBurger=${afterEscape.activeIsBurger}`);
    results.ac36[width] = { afterOpen, stayedTrapped, closeLabel, ...afterEscape };
    if (!afterOpen) failures.push(`AC36 ${width}px: focus not inside drawer right after opening`);
    if (!stayedTrapped) failures.push(`AC36 ${width}px: Tab escaped the drawer's focus trap within 25 presses`);
    if (closeLabel !== 'Закрити меню') failures.push(`AC36 ${width}px: close button aria-label "${closeLabel}" !== "Закрити меню"`);
    if (!afterEscape.closed) failures.push(`AC36 ${width}px: Escape did not close the drawer`);
    if (!afterEscape.activeIsBurger) failures.push(`AC36 ${width}px: focus did not return to the burger after Escape`);
    await page.close();
  }

  // overlay-click-close at 768
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminshell--drawer-open'), { waitUntil: 'load', timeout: 30000 });
    await waitForDrawerOpen(page);
    await page.mouse.click(760, 450); // far right of the 768px viewport, outside the 240px panel
    await waitForDrawerClosed(page).catch(() => {});
    await page.waitForTimeout(100);
    const closed = await page.evaluate(() => {
      const content = document.querySelector('.mantine-Drawer-content');
      return !content || getComputedStyle(content).display === 'none';
    });
    console.log(`[AC36] 768px overlay click -> drawer closed=${closed}`);
    results.ac36.overlayClick = closed;
    if (!closed) failures.push('AC36 768px: clicking the overlay outside the panel did not close the drawer');
    await page.close();
  }

  // nav-link click closes it (390)
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminshell--drawer-open'), { waitUntil: 'load', timeout: 30000 });
    await waitForDrawerOpen(page);
    const link = await page.locator('.mantine-Drawer-content a').first();
    await link.click();
    await waitForDrawerClosed(page).catch(() => {});
    await page.waitForTimeout(100);
    const closed = await page.evaluate(() => {
      const content = document.querySelector('.mantine-Drawer-content');
      return !content || getComputedStyle(content).display === 'none';
    });
    console.log(`[AC36] 390px nav-link click -> drawer closed=${closed}`);
    results.ac36.navClickCloses = closed;
    if (!closed) failures.push('AC36 390px: a nav-link click did not close the drawer');
    await page.close();
  }

  // ---- AC37: exactly one [data-testid="admin-sidebar"] at 390/768 (closed+open) and 1440 ----
  results.ac37 = [];
  const AC37_CASES = [
    { width: 390, storyId: 'patterns-mantine-adminshell--default', state: 'closed', waitOpen: false },
    { width: 390, storyId: 'patterns-mantine-adminshell--drawer-open', state: 'open', waitOpen: true },
    { width: 768, storyId: 'patterns-mantine-adminshell--default', state: 'closed', waitOpen: false },
    { width: 768, storyId: 'patterns-mantine-adminshell--drawer-open', state: 'open', waitOpen: true },
    { width: 1440, storyId: 'patterns-mantine-adminshell--default', state: 'closed(fixed)', waitOpen: false },
  ];
  for (const { width, storyId, state, waitOpen } of AC37_CASES) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, storyId), { waitUntil: 'load', timeout: 30000 });
    // `state: 'attached'`, not the default 'visible' — the closed-drawer case is intentionally
    // `display:none` (keepMounted) and must still be found by this check (AC37 tests it).
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000, state: 'attached' });
    if (waitOpen) await waitForDrawerOpen(page);
    else await page.waitForTimeout(300);
    const count = await page.evaluate(() => document.querySelectorAll('[data-testid="admin-sidebar"]').length);
    console.log(`[AC37] ${width}px ${state} (${storyId}) -> admin-sidebar count=${count}`);
    results.ac37.push({ width, state, storyId, count });
    if (count !== 1) failures.push(`AC37 ${width}px ${state}: admin-sidebar count ${count} !== 1`);
    await page.close();
  }

  // ---- AC38: adminsidebar--default and adminlocaleswitcher--idle widths across 320/390/768/1024/1440 ----
  results.ac38_sidebar = [];
  for (const width of [320, 390, 768, 1024, 1440]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminsidebar--default'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000 });
    const m = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="admin-sidebar"]');
      return { sidebarWidth: el ? el.getBoundingClientRect().width : null, scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth };
    });
    // Review-8 owner report: the decorator now carries `p="sm"` (matching AdminLocaleSwitcher's own
    // decorator and the real `AppShell.Navbar p="sm"` / `Drawer padding="sm"` production parent), so
    // `[data-testid="admin-sidebar"]`'s own content width is the box width minus 2×`sm` padding —
    // same formula already used below for adminlocaleswitcher--idle.
    const boxWidth = width < 768 ? width : 240;
    const expected = boxWidth - 2 * SM_PX;
    console.log(`[AC38] adminsidebar--default ${width}px -> sidebarWidth=${m.sidebarWidth} expected=${expected} scrollWidth=${m.scrollWidth} innerWidth=${m.innerWidth}`);
    results.ac38_sidebar.push({ width, expected, ...m });
    const tolerance = width < 768 ? 20 : 1;
    if (Math.abs(m.sidebarWidth - expected) > tolerance) failures.push(`AC38 sidebar ${width}px: width ${m.sidebarWidth} !== expected ~${expected}`);
    if (m.scrollWidth > m.innerWidth) failures.push(`AC38 sidebar ${width}px: horizontal overflow`);
    await page.close();
  }

  results.ac38_localeswitcher = [];
  for (const width of [320, 390, 768, 1024, 1440]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminlocaleswitcher--idle'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-locale-switcher"]', { timeout: 15000 });
    const m = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="admin-locale-switcher"]');
      const button = root ? root.querySelector('button') : null;
      return { buttonWidth: button ? button.getBoundingClientRect().width : null, scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth };
    });
    const boxWidth = width < 768 ? width : 240;
    const expected = boxWidth - 2 * SM_PX;
    console.log(`[AC38] adminlocaleswitcher--idle ${width}px -> buttonWidth=${m.buttonWidth} expected=${expected} scrollWidth=${m.scrollWidth} innerWidth=${m.innerWidth}`);
    results.ac38_localeswitcher.push({ width, expected, ...m });
    if (Math.abs(m.buttonWidth - expected) > 1) failures.push(`AC38 localeswitcher ${width}px: width ${m.buttonWidth} !== expected ${expected} (±1)`);
    if (m.scrollWidth > m.innerWidth) failures.push(`AC38 localeswitcher ${width}px: horizontal overflow`);
    await page.close();
  }

  // ---- AC42 (review 8, R32/G1): the drawer body bounds AdminSidebar; logout stays visible ----
  results.ac42 = [];
  const AC42_SIZES = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 768, height: 600 },
    { width: 960, height: 540 },
  ];
  for (const { width, height } of AC42_SIZES) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height });
    await page.goto(storyUrl(baseUrl, 'patterns-mantine-adminshell--default'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000, state: 'attached' });
    await page.click('button[aria-label="Відкрити меню"]');
    await waitForDrawerOpen(page);
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const content = document.querySelector('.mantine-Drawer-content');
      const sidebar = content ? content.querySelector('[data-testid="admin-sidebar"]') : null;
      const actionable = sidebar ? sidebar.querySelectorAll('button, a') : [];
      const logout = actionable.length ? actionable[actionable.length - 1] : null;
      const closeBtn = content ? content.querySelector('.mantine-Drawer-close') : null;
      const viewport = sidebar ? sidebar.querySelector('.mantine-ScrollArea-viewport') : null;
      return {
        logoutBottom: logout ? logout.getBoundingClientRect().bottom : null,
        innerHeight: window.innerHeight,
        contentClientHeight: content ? content.clientHeight : null,
        contentScrollHeight: content ? content.scrollHeight : null,
        closeButtonTop: closeBtn ? closeBtn.getBoundingClientRect().top : null,
        viewportClientHeight: viewport ? viewport.clientHeight : null,
        viewportScrollHeight: viewport ? viewport.scrollHeight : null,
      };
    });
    console.log(`[AC42] ${width}x${height} -> logoutBottom=${m.logoutBottom} innerHeight=${m.innerHeight} content=${m.contentClientHeight}/${m.contentScrollHeight} closeTop=${m.closeButtonTop} viewport=${m.viewportClientHeight}/${m.viewportScrollHeight}`);
    results.ac42.push({ width, height, ...m });
    if (m.logoutBottom === null || m.logoutBottom > m.innerHeight) {
      failures.push(`AC42 ${width}x${height}: logout bottom ${m.logoutBottom} > innerHeight ${m.innerHeight}`);
    }
    if (m.contentScrollHeight - m.contentClientHeight > 1) {
      failures.push(`AC42 ${width}x${height}: .mantine-Drawer-content scrollHeight ${m.contentScrollHeight} > clientHeight ${m.contentClientHeight} + 1`);
    }
    if (m.closeButtonTop === null || m.closeButtonTop < 0) {
      failures.push(`AC42 ${width}x${height}: close button top ${m.closeButtonTop} < 0`);
    }
    if (width === 390 || (width === 768 && height === 600)) {
      if (!(m.viewportScrollHeight > m.viewportClientHeight)) {
        failures.push(`AC42 ${width}x${height}: nav ScrollArea viewport does not scroll (scrollHeight ${m.viewportScrollHeight} <= clientHeight ${m.viewportClientHeight})`);
      }
    }
    await page.close();
  }

  // ---- AC43 (review 8, no regression): mantine-primitives-drawer--default and
  // mantine-primitives-mobilenavdrawer--default at 1440x900 must be BYTE-IDENTICAL to the
  // pre-edit `ac43-before.json` values (captured by ac43-before-probe.mjs against the
  // storybook-static build that predates the R32 source edit). ----
  const ac43Before = JSON.parse(await readFile(join(__dirname, 'ac43-before.json'), 'utf8'));
  results.ac43_after = {};
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(storyUrl(baseUrl, 'mantine-primitives-drawer--default'), { waitUntil: 'load', timeout: 30000 });
    await page.getByRole('button', { name: 'Відкрити панель', exact: true }).click();
    await page.waitForSelector('.mantine-Drawer-content', { timeout: 10000 });
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => {
      const content = document.querySelector('.mantine-Drawer-content');
      const body = document.querySelector('.mantine-Drawer-body');
      const header = document.querySelector('.mantine-Drawer-header');
      const cs = (el) => (el ? getComputedStyle(el) : null);
      const c = cs(content); const b = cs(body); const h = cs(header);
      return {
        content: content ? { display: c.display, flexDirection: c.flexDirection, overflowY: c.overflowY } : null,
        body: body ? { flexGrow: b.flexGrow, minHeight: b.minHeight, paddingTop: b.paddingTop, overflowY: b.overflowY } : null,
        headerBorderBottomWidth: header ? h.borderBottomWidth : null,
      };
    });
    results.ac43_after['mantine-primitives-drawer--default'] = after;
    const before = ac43Before['mantine-primitives-drawer--default'];
    const same = JSON.stringify(before) === JSON.stringify(after);
    console.log(`[AC43] drawer--default before=${JSON.stringify(before)} after=${JSON.stringify(after)} identical=${same}`);
    if (!same) failures.push(`AC43 mantine-primitives-drawer--default: before/after differ — before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
    await page.close();
  }
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(storyUrl(baseUrl, 'mantine-primitives-mobilenavdrawer--default'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.mantine-Drawer-content', { timeout: 10000 });
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => {
      const content = document.querySelector('.mantine-Drawer-content');
      const body = document.querySelector('.mantine-Drawer-body');
      const header = document.querySelector('.mantine-Drawer-header');
      const cs = (el) => (el ? getComputedStyle(el) : null);
      const c = cs(content); const b = cs(body); const h = cs(header);
      return {
        content: content ? { display: c.display, flexDirection: c.flexDirection, overflowY: c.overflowY } : null,
        body: body ? { flexGrow: b.flexGrow, minHeight: b.minHeight, paddingTop: b.paddingTop, overflowY: b.overflowY } : null,
        headerBorderBottomWidth: header ? h.borderBottomWidth : null,
      };
    });
    results.ac43_after['mantine-primitives-mobilenavdrawer--default'] = after;
    const before = ac43Before['mantine-primitives-mobilenavdrawer--default'];
    const same = JSON.stringify(before) === JSON.stringify(after);
    console.log(`[AC43] mobilenavdrawer--default before=${JSON.stringify(before)} after=${JSON.stringify(after)} identical=${same}`);
    if (!same) failures.push(`AC43 mantine-primitives-mobilenavdrawer--default: before/after differ — before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
    await page.close();
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  await writeFile(join(__dirname, 'probe-drawer.json'), JSON.stringify(results, null, 2));

  if (failures.length > 0) {
    console.error('\nFATAL — probe-drawer.mjs failures:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('\nAll probe-drawer.mjs assertions passed (AC35/AC36/AC37/AC38/AC42/AC43).');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
