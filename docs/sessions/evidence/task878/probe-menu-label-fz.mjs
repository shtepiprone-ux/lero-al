// Task 878 Revision 1, §16.1 AC8 — evidence-only two-armed probe. Measures the computed
// font-size/line-height/font-weight of every item label in the open UserMenu admin dropdown and
// the open LocaleSwitcher dropdown, at 1440 and 390, and asserts the emphasised item's rendering
// target (the innermost `.mantine-Text-root`, i.e. our `<Text span>`) reports the SAME font-size
// and line-height as its sibling items, and the expected font-weight (500 UserMenu / 600
// LocaleSwitcher). Before the `inherit` fix, Mantine's `Text` without `inherit` sets its own
// `font-size: var(--mantine-font-size-md)` (16px) regardless of the 14px `Menu.item`/mobile-Text
// ambient context (node_modules/@mantine/core/styles/Text.css:4-5) — this probe fails non-zero on
// that state and passes 0 once the label reads the ambient size/weight through `inherit`.
//
// Run before the fix: exits non-zero, prints 16px for both emphasised items.
// Run after the fix (rebuild storybook first): exits 0.
//
// Command: node docs/sessions/evidence/task878/probe-menu-label-fz.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');
const staticDir = join(ROOT, 'storybook-static');
const PORT = 6042; // distinct from every other task's static-server port used in this repo
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

// Runs in the browser context via page.evaluate — measures every open item in either the desktop
// Menu ([role="menu"] [role="menuitem"]) or the mobile bottom sheet (.mantine-Drawer-body button).
function measureItems() {
  const menu = document.querySelector('[role="menu"]');
  const containers = menu
    ? Array.from(menu.querySelectorAll('[role="menuitem"]'))
    : Array.from(document.querySelectorAll('.mantine-Drawer-body button'));

  return containers.map((item) => {
    const textRoots = Array.from(item.querySelectorAll('[class*="mantine-Text-root"]'));
    const renderTarget = textRoots.length > 0 ? textRoots[textRoots.length - 1] : item;
    const cs = getComputedStyle(renderTarget);
    // The emphasised item's own <Text span> carries an explicit inline font-weight (from the fw
    // prop); a plain sibling label has no such element at all.
    const lastTextRoot = textRoots.length > 0 ? textRoots[textRoots.length - 1] : null;
    const hasInlineWeight = !!(lastTextRoot && lastTextRoot.style.fontWeight);
    return {
      text: item.textContent.trim(),
      fontSize: cs.fontSize,
      lineHeight: cs.lineHeight,
      fontWeight: cs.fontWeight,
      isEmphasised: hasInlineWeight,
    };
  });
}

async function measureMenu({ browser, baseUrl, storyId, viewport, openMenu, label }) {
  const page = await browser.newPage();
  await page.setViewportSize(viewport);
  const url = `${baseUrl}/iframe.html?id=${storyId}&globals=locale:en&viewMode=story`;
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(500);
  await openMenu(page);
  await page.waitForSelector('[role="menu"] [role="menuitem"], .mantine-Drawer-body button', { timeout: 15000 });
  await page.waitForTimeout(300);
  const items = await page.evaluate(measureItems);
  await page.close();

  console.log(`\n--- ${label} (${viewport.width}x${viewport.height}) ---`);
  for (const it of items) {
    console.log(`  ${it.isEmphasised ? '[EMPHASISED]' : '           '} "${it.text}" fontSize=${it.fontSize} lineHeight=${it.lineHeight} fontWeight=${it.fontWeight}`);
  }
  return items;
}

function evaluateGroup(items, label, expectedWeight) {
  const problems = [];
  const emphasised = items.filter((i) => i.isEmphasised);
  const siblings = items.filter((i) => !i.isEmphasised);
  if (emphasised.length !== 1) {
    problems.push(`expected exactly 1 emphasised item, found ${emphasised.length}`);
    return problems;
  }
  const em = emphasised[0];
  const siblingFontSize = siblings[0]?.fontSize;
  const siblingLineHeight = siblings[0]?.lineHeight;
  for (const s of siblings) {
    if (s.fontSize !== siblingFontSize || s.lineHeight !== siblingLineHeight) {
      problems.push(`sibling items disagree with each other: "${s.text}" ${s.fontSize}/${s.lineHeight} vs "${siblings[0].text}" ${siblingFontSize}/${siblingLineHeight}`);
    }
  }
  if (em.fontSize !== siblingFontSize) {
    problems.push(`emphasised "${em.text}" fontSize=${em.fontSize} != siblings' ${siblingFontSize}`);
  }
  if (em.lineHeight !== siblingLineHeight) {
    problems.push(`emphasised "${em.text}" lineHeight=${em.lineHeight} != siblings' ${siblingLineHeight}`);
  }
  if (parseInt(em.fontWeight, 10) !== expectedWeight) {
    problems.push(`emphasised "${em.text}" fontWeight=${em.fontWeight} != expected ${expectedWeight}`);
  }
  return problems;
}

async function main() {
  console.log('probe-menu-label-fz.mjs — Task 878 Revision 1 §16.1 AC8');
  console.log(`platform: ${process.platform}`);
  console.log(`node: ${process.version}`);

  const server = await startStaticServer(staticDir, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();

  const allProblems = [];

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 900 }]) {
    const userMenuItems = await measureMenu({
      browser,
      baseUrl,
      storyId: 'mantine-primitives-usermenu--default',
      viewport,
      label: 'UserMenu Default (admin fixture)',
      openMenu: async (page) => {
        // >=640: the story's own `play` already opened it. <640: play's own width guard skips
        // the click, so the probe opens it — same trigger the play function itself targets.
        const opened = await page.locator('[role="menu"]').count();
        if (opened === 0) {
          await page.getByRole('button', { name: /Driton Berisha/ }).click();
        }
      },
    });
    const userMenuProblems = evaluateGroup(userMenuItems, 'UserMenu', 500);
    if (userMenuProblems.length > 0) {
      console.log(`  PROBLEMS: ${userMenuProblems.join('; ')}`);
      allProblems.push(...userMenuProblems.map((p) => `UserMenu@${viewport.width}: ${p}`));
    }

    const localeItems = await measureMenu({
      browser,
      baseUrl,
      storyId: 'mantine-primitives-localeswitcher--default',
      viewport,
      label: 'LocaleSwitcher Default (current-locale item)',
      openMenu: async (page) => {
        await page.getByRole('button', { name: 'EN', exact: true }).first().click();
      },
    });
    const localeProblems = evaluateGroup(localeItems, 'LocaleSwitcher', 600);
    if (localeProblems.length > 0) {
      console.log(`  PROBLEMS: ${localeProblems.join('; ')}`);
      allProblems.push(...localeProblems.map((p) => `LocaleSwitcher@${viewport.width}: ${p}`));
    }
  }

  await browser.close();
  await new Promise((r) => server.close(r));

  if (allProblems.length > 0) {
    console.error(`\nFAIL — ${allProblems.length} problem(s):`);
    for (const p of allProblems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log('\nPASS — every emphasised label matches its siblings\' font-size/line-height and carries the expected font-weight.');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
