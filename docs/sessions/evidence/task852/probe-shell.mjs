// Task 852 review-1 remediation — evidence-only probe (never imported by any gate).
// Measures AC3/AC11/AC12/AC13/AC14 against a FRESH storybook-static build (built after the last
// source edit — see build-storybook.log's mtime vs. the source files' mtimes in the session log).
// Run: node docs/sessions/evidence/task852/probe-shell.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const staticDir = join(ROOT, 'storybook-static');
const PORT = 6052; // distinct from every other task's static-server port used in this repo
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

const STORY_ID = 'patterns-mantine-adminshell--default';
const DRAWER_STORY_ID = 'patterns-mantine-adminshell--drawer-open';
const LOCALES_AC14 = ['sq', 'en', 'uk', 'it'];
const BURGER_LABEL_EN = 'Open menu';

function storyUrl(baseUrl, id, locale) {
  return `${baseUrl}/iframe.html?id=${id}&globals=locale:${locale}&viewMode=story`;
}

async function measureShell(page) {
  return page.evaluate(() => {
    const sidebar = document.querySelector('[data-testid="admin-sidebar"]');
    const navbar = document.querySelector('.mantine-AppShell-navbar');
    const main = document.querySelector('.mantine-AppShell-main');
    const header = document.querySelector('.mantine-AppShell-header');
    const scrollViewport = sidebar ? sidebar.querySelector('.mantine-ScrollArea-viewport') : null;
    const interactive = sidebar ? Array.from(sidebar.querySelectorAll('button, a')) : [];
    const last = interactive[interactive.length - 1] ?? null;
    const mainCs = main ? getComputedStyle(main) : null;
    return {
      navbarWidth: navbar ? navbar.getBoundingClientRect().width : null,
      headerHeight: header ? header.getBoundingClientRect().height : null,
      navbarTransform: navbar ? getComputedStyle(navbar).transform : null,
      navbarScrollHeight: navbar ? navbar.scrollHeight : null,
      navbarClientHeight: navbar ? navbar.clientHeight : null,
      viewportScrollHeight: scrollViewport ? scrollViewport.scrollHeight : null,
      viewportClientHeight: scrollViewport ? scrollViewport.clientHeight : null,
      logoutBottom: last ? last.getBoundingClientRect().bottom : null,
      innerHeight: window.innerHeight,
      mainPaddingLeft: mainCs ? mainCs.paddingLeft : null,
      mainPaddingTop: mainCs ? mainCs.paddingTop : null,
    };
  });
}

async function main() {
  console.log('probe-shell.mjs — Task 852 review-1 remediation (AC3/AC11/AC12/AC13/AC14)');
  console.log(`platform: ${process.platform}`);
  console.log(`node: ${process.version}`);
  console.log('command: node docs/sessions/evidence/task852/probe-shell.mjs\n');

  const server = await startStaticServer(staticDir, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const failures = [];
  const results = {};

  // ---- AC3 + AC11 (--default, fixed viewports) ----
  const fixedViewports = [
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1024, height: 768 },
  ];
  results.fixed = [];
  for (const vp of fixedViewports) {
    const page = await browser.newPage();
    await page.setViewportSize(vp);
    await page.goto(storyUrl(baseUrl, STORY_ID, 'en'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000 });
    const m = await measureShell(page);
    results.fixed.push({ ...vp, ...m });
    console.log(`[AC3/AC11] ${vp.width}x${vp.height} -> navbarWidth=${m.navbarWidth} headerHeight=${m.headerHeight} navbarScrollHeight=${m.navbarScrollHeight} navbarClientHeight=${m.navbarClientHeight} logoutBottom=${m.logoutBottom} innerHeight=${m.innerHeight} viewportScrollHeight=${m.viewportScrollHeight} viewportClientHeight=${m.viewportClientHeight}`);

    if (Math.abs(m.navbarWidth - 240) > 0.5) failures.push(`${vp.width}x${vp.height}: navbarWidth ${m.navbarWidth} !== 240`);
    if (Math.abs(m.headerHeight - 72) > 0.5) failures.push(`${vp.width}x${vp.height}: headerHeight ${m.headerHeight} !== 72`);
    if (m.navbarScrollHeight > m.navbarClientHeight + 1) failures.push(`${vp.width}x${vp.height}: navbar scrollHeight ${m.navbarScrollHeight} > clientHeight+1 ${m.navbarClientHeight + 1}`);
    if (m.logoutBottom > m.innerHeight) failures.push(`${vp.width}x${vp.height}: logout bottom ${m.logoutBottom} > innerHeight ${m.innerHeight}`);
    if (vp.width === 1280 && !(m.viewportScrollHeight > m.viewportClientHeight)) {
      failures.push(`${vp.width}x${vp.height}: nav ScrollArea viewport did not scroll (scrollHeight ${m.viewportScrollHeight} <= clientHeight ${m.viewportClientHeight})`);
    }
    await page.close();
  }

  // ---- AC3 + AC11 (390x844, burger opened) ----
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(storyUrl(baseUrl, STORY_ID, 'en'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000 });
    const beforeOpen = await page.evaluate(() => {
      const navbar = document.querySelector('.mantine-AppShell-navbar');
      return { transform: navbar ? getComputedStyle(navbar).transform : null };
    });
    console.log(`[AC3] 390x844 before burger: navbar transform=${beforeOpen.transform}`);
    const burger = await page.getByRole('button', { name: BURGER_LABEL_EN });
    await burger.click();
    await page.waitForTimeout(250); // AppShell transition
    const m = await measureShell(page);
    results.mobileOpen = m;
    console.log(`[AC3/AC11] 390x844 after burger: navbarTransform=${m.navbarTransform} navbarScrollHeight=${m.navbarScrollHeight} navbarClientHeight=${m.navbarClientHeight} logoutBottom=${m.logoutBottom} innerHeight=${m.innerHeight}`);
    if (m.navbarTransform !== 'none') failures.push(`390x844: navbar did not open (transform=${m.navbarTransform})`);
    if (m.navbarScrollHeight > m.navbarClientHeight + 1) failures.push(`390x844: navbar scrollHeight ${m.navbarScrollHeight} > clientHeight+1 ${m.navbarClientHeight + 1}`);
    if (m.logoutBottom > m.innerHeight) failures.push(`390x844: logout bottom ${m.logoutBottom} > innerHeight ${m.innerHeight}`);

    // click a nav item -> drawer should close
    const dashboardLink = await page.getByRole('link', { name: /Dashboard/i }).first();
    await dashboardLink.click();
    await page.waitForTimeout(250);
    const afterNav = await page.evaluate(() => {
      const navbar = document.querySelector('.mantine-AppShell-navbar');
      return { transform: navbar ? getComputedStyle(navbar).transform : null };
    });
    console.log(`[AC3] 390x844 after nav click: navbar transform=${afterNav.transform}`);
    if (afterNav.transform === 'none') failures.push('390x844: navbar did not close after a nav click');
    await page.close();
  }

  // ---- AC12: focus trap + Escape, 390x844 ----
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(storyUrl(baseUrl, STORY_ID, 'en'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000 });
    const burger = await page.getByRole('button', { name: BURGER_LABEL_EN });
    await burger.click();
    await page.waitForTimeout(250);

    const activeInNavbar = () => page.evaluate(() => {
      const navbar = document.querySelector('.mantine-AppShell-navbar');
      return !!(navbar && navbar.contains(document.activeElement));
    });

    let afterOpen = await activeInNavbar();
    console.log(`[AC12] 390x844 after burger open: activeElement inside navbar = ${afterOpen}`);
    if (!afterOpen) failures.push('AC12 390x844: focus not inside navbar right after opening');

    let stayedTrapped = true;
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      // eslint-disable-next-line no-await-in-loop
      if (!(await activeInNavbar())) { stayedTrapped = false; break; }
    }
    console.log(`[AC12] 390x844 after 25 Tabs: stayed trapped = ${stayedTrapped}`);
    if (!stayedTrapped) failures.push('AC12 390x844: Tab escaped the focus trap within 25 presses');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(350); // AppShell's 200ms transform transition + useFocusReturn's 10ms timeout
    const afterEscape = await page.evaluate((burgerLabel) => {
      const navbar = document.querySelector('.mantine-AppShell-navbar');
      const burgerEl = document.querySelector(`button[aria-label="${burgerLabel}"]`);
      return {
        transform: navbar ? getComputedStyle(navbar).transform : null,
        activeIsBurger: document.activeElement === burgerEl,
      };
    }, BURGER_LABEL_EN);
    console.log(`[AC12] 390x844 after Escape: navbar transform=${afterEscape.transform} activeIsBurger=${afterEscape.activeIsBurger}`);
    if (!afterEscape.transform.startsWith('matrix(1, 0, 0, 1, -390')) {
      failures.push(`AC12 390x844: Escape did not close navbar (transform=${afterEscape.transform})`);
    }
    if (!afterEscape.activeIsBurger) failures.push('AC12 390x844: focus did not return to the burger after Escape');
    results.ac12_390 = afterEscape;
    await page.close();
  }

  // ---- AC12: no trap at 1440x900 ----
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(storyUrl(baseUrl, STORY_ID, 'en'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    const navTransform = await page.evaluate(() => {
      const navbar = document.querySelector('.mantine-AppShell-navbar');
      return navbar ? getComputedStyle(navbar).transform : null;
    });
    console.log(`[AC12] 1440x900 after Escape (never opened): navbar transform=${navTransform}`);
    if (navTransform !== 'none') failures.push(`AC12 1440x900: navbar transform unexpectedly not 'none' (${navTransform})`);

    // This story's `Main` content (a static title, no focusable element) never gives Tab anywhere
    // to land beyond the navbar, so the observable proxy for "not trapped" is that Tab eventually
    // moves focus OUT of the navbar entirely (a real FocusTrap never lets that happen — it cycles
    // Tab back to its own first/last focusable child forever).
    let leftNavbar = false;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      // eslint-disable-next-line no-await-in-loop
      const inNavbar = await page.evaluate(() => {
        const navbar = document.querySelector('.mantine-AppShell-navbar');
        return !!(navbar && document.activeElement && document.activeElement !== document.body && navbar.contains(document.activeElement));
      });
      if (!inNavbar) { leftNavbar = true; break; }
    }
    console.log(`[AC12] 1440x900: Tab eventually left the navbar (proxy for "not trapped") = ${leftNavbar}`);
    if (!leftNavbar) failures.push('AC12 1440x900: Tab never left the navbar within 40 presses — cannot confirm the trap is inactive above the breakpoint');
    results.ac12_1440 = { navTransform, leftNavbar };
    await page.close();
  }

  // ---- AC13: AppShellFoundation Default padding still non-zero ----
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/iframe.html?id=patterns-mantine-appshellfoundation--default&globals=locale:en&viewMode=story`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.mantine-AppShell-main', { timeout: 15000 });
    const padding = await page.evaluate(() => {
      const main = document.querySelector('.mantine-AppShell-main');
      return main ? getComputedStyle(main).paddingLeft : null;
    });
    console.log(`[AC13] Patterns/Mantine/AppShellFoundation Default -> AppShell.Main padding-left=${padding}`);
    if (padding === '0px') failures.push('AC13: AppShellFoundation Default lost its non-zero padding');
    results.ac13_foundation_padding = padding;
    await page.close();
  }

  // AC13 for AdminShell itself is already captured in results.fixed[1440] / results.mobileOpen (mainPaddingLeft/mainPaddingTop)
  const p1440 = results.fixed.find((r) => r.width === 1440);
  console.log(`[AC13] AdminShell 1440x900 -> Main padding-left=${p1440.mainPaddingLeft} padding-top=${p1440.mainPaddingTop}`);
  console.log(`[AC13] AdminShell 390x844 (open) -> Main padding-left=${results.mobileOpen.mainPaddingLeft} padding-top=${results.mobileOpen.mainPaddingTop}`);
  if (p1440.mainPaddingLeft !== '240px') failures.push(`AC13: AdminShell 1440 Main padding-left ${p1440.mainPaddingLeft} !== 240px`);
  if (p1440.mainPaddingTop !== '72px') failures.push(`AC13: AdminShell 1440 Main padding-top ${p1440.mainPaddingTop} !== 72px`);
  if (results.mobileOpen.mainPaddingTop !== '72px') failures.push(`AC13: AdminShell 390 Main padding-top ${results.mobileOpen.mainPaddingTop} !== 72px`);

  // ---- AC13 at 390 closed (padding-left should be 0px when navbar is collapsed) ----
  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(storyUrl(baseUrl, STORY_ID, 'en'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000 });
    const padding = await page.evaluate(() => {
      const main = document.querySelector('.mantine-AppShell-main');
      return main ? getComputedStyle(main).paddingLeft : null;
    });
    console.log(`[AC13] AdminShell 390x844 (closed) -> Main padding-left=${padding}`);
    if (padding !== '0px') failures.push(`AC13: AdminShell 390 (closed) Main padding-left ${padding} !== 0px`);
    results.ac13_390_closed_padding_left = padding;
    await page.close();
  }

  // ---- AC14: DrawerOpen play function opens the navbar in all 4 locales ----
  results.ac14 = {};
  for (const locale of LOCALES_AC14) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(storyUrl(baseUrl, DRAWER_STORY_ID, locale), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000 });
    await page.waitForTimeout(500); // let the story's own play() finish
    const transform = await page.evaluate(() => {
      const navbar = document.querySelector('.mantine-AppShell-navbar');
      return navbar ? getComputedStyle(navbar).transform : null;
    });
    console.log(`[AC14] ${DRAWER_STORY_ID} locale=${locale} -> navbar transform=${transform}`);
    results.ac14[locale] = transform;
    if (transform !== 'none') failures.push(`AC14 locale=${locale}: navbar did not open (transform=${transform}) — DrawerOpen play() failed to find the localised burger`);
    await page.close();
  }

  // ---- AC19 (review 3): DrawerOpen at 1440x900 — no viewport pin, burger hidden (hiddenFrom="lg"),
  // play() must no-op via queryByRole instead of throwing when findByRole would have timed out.
  {
    const page = await browser.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err)));
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(storyUrl(baseUrl, DRAWER_STORY_ID, 'en'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('[data-testid="admin-sidebar"]', { timeout: 15000 });
    await page.waitForTimeout(500); // let the story's own play() finish (or no-op)
    const transform1440 = await page.evaluate(() => {
      const navbar = document.querySelector('.mantine-AppShell-navbar');
      return navbar ? getComputedStyle(navbar).transform : null;
    });
    console.log(`[AC19] ${DRAWER_STORY_ID} 1440x900 (no viewport pin) -> navbar transform=${transform1440} pageErrors=${pageErrors.length} consoleErrors=${consoleErrors.length}`);
    if (transform1440 !== 'none') failures.push(`AC19: 1440x900 navbar transform unexpectedly not 'none' (${transform1440})`);
    if (pageErrors.length > 0) failures.push(`AC19: 1440x900 play() threw ${pageErrors.length} page error(s): ${pageErrors.join(' | ')}`);
    if (consoleErrors.length > 0) failures.push(`AC19: 1440x900 produced ${consoleErrors.length} console error(s): ${consoleErrors.join(' | ')}`);
    results.ac19_1440 = { transform: transform1440, pageErrorCount: pageErrors.length, consoleErrorCount: consoleErrors.length };
    await page.close();
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  const { writeFile } = await import('node:fs/promises');
  await writeFile(join(__dirname, 'probe-shell.json'), JSON.stringify(results, null, 2));

  if (failures.length > 0) {
    console.error('\nFATAL — probe-shell.mjs failures:');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('\nAll probe-shell.mjs assertions passed (AC3/AC11/AC12/AC13/AC14/AC19).');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
