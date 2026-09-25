#!/usr/bin/env node
/**
 * task879-header-chrome-probe.mjs — Task 879 §13.2 rendered evidence.
 *
 * Serves `storybook-static/` over `node:http` (same shape as `scripts/task787-header-evidence.mjs`),
 * drives Playwright Chromium, and writes one JSON with raw computed values and rects for every cell.
 * Exits 1 if any assertion fails, 2 on infrastructure failure (missing build, story not rendered,
 * selector absent — fail closed).
 *
 * Cells (§13.2):
 *   - mantine-primitives-headerview--default, locale en, widths 320/375/389/390/480/640/768/1024/
 *     1440/1920, plus uk at 320 and 1440: AC2 (position/zIndex), AC3 (height), AC4 (background,
 *     divider line, nav-link typography from 768, wordmark). The first `header.site-header` in the
 *     story is the guest fixture (HeaderView.stories.tsx renders guest first, authed second).
 *   - mantine-primitives-mobilenavdrawer--default at 320, loggedIn true and false: AC5 (44px rows).
 *   - patterns-mantine-authsheet--login at 390 and 1440: AC6 links + "or" rule.
 *   - patterns-mantine-authsheet--register-agent-add-company-logo at 390: AC6 tile.
 *
 * Usage:
 *   node scripts/task879-header-chrome-probe.mjs --label <before|after> --out <path> [--dir <storybook-static-dir>]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function argVal(flag, fallback = null) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

const LABEL = argVal('--label');
if (LABEL !== 'before' && LABEL !== 'after') {
  console.error('FAIL  task879-header-chrome-probe — --label before|after is required.');
  process.exit(2);
}
const OUT_PATH = argVal('--out', join(ROOT, `docs/sessions/evidence/task879/${LABEL === 'before' ? '03-probe-before' : '20-probe-after'}.json`));
const STORYBOOK_STATIC_DIR = argVal('--dir') ? resolve(process.cwd(), argVal('--dir')) : join(ROOT, 'storybook-static');

const messagesEn = JSON.parse(readFileSync(join(ROOT, 'messages/en.json'), 'utf8'));
const T = {
  home: messagesEn.nav.home,
  listings: messagesEn.nav.listings,
  forgotPassword: messagesEn.auth.forgot_password,
  register: messagesEn.auth.register,
  or: messagesEn.auth.or,
  chooseFile: messagesEn.common.choose_file,
};

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

function startStaticServer(staticDir) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(staticDir, urlPath);
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(staticDir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolvePromise(server));
  });
}

async function gotoStory(page, baseUrl, storyId, { locale, args: storyArgs } = {}) {
  let globals = locale ? `&globals=locale:${locale}` : '';
  let argsQs = '';
  if (storyArgs) {
    argsQs = '&args=' + Object.entries(storyArgs).map(([k, v]) => `${k}:${v}`).join(';');
  }
  const url = `${baseUrl}/iframe.html?id=${storyId}&viewMode=story${globals}${argsQs}`;
  // 'load' (not 'networkidle'): the register-agent-add-company* stories mount the real
  // CaptchaWidget, whose Turnstile widget retries indefinitely in this offline environment
  // ("No available adapters" / 400s) — networkidle never resolves for them. Readiness below plus
  // each cell's own explicit wait covers the rest.
  const response = await page.goto(url, { waitUntil: 'load', timeout: 30000 }).catch(() => null);
  // Poll for the Storybook root to actually render non-zero content — 'load' fires before React
  // hydrates/mounts the story (and before Storybook's own preview bootstrap finishes), so an
  // immediate single check races a genuinely-rendering page.
  const checkReady = () => page.evaluate(() => {
    const root = document.getElementById('storybook-root') ?? document.querySelector('#root');
    if (!root) return { ok: false, reason: 'expected Storybook root is absent' };
    const rect = root.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) return { ok: false, reason: `root has zero rect (${rect.width}x${rect.height})` };
    return { ok: true };
  }).catch((e) => ({ ok: false, reason: String(e) }));
  let readiness = await checkReady();
  const deadline = Date.now() + 10000;
  while (!readiness.ok && Date.now() < deadline) {
    await page.waitForTimeout(200);
    readiness = await checkReady();
  }
  return { ok: !!response?.ok() && readiness.ok, httpStatus: response ? response.status() : null, readiness };
}

async function main() {
  await mkdir(dirname(OUT_PATH), { recursive: true });

  if (!existsSync(join(STORYBOOK_STATIC_DIR, 'index.json'))) {
    console.error(`FAIL  missing ${join(STORYBOOK_STATIC_DIR, 'index.json')} — run "npm run build-storybook" first.`);
    process.exit(2);
  }

  const server = await startStaticServer(STORYBOOK_STATIC_DIR);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });

  const results = { label: LABEL, capturedAt: new Date().toISOString(), storybookStaticDir: STORYBOOK_STATIC_DIR, checks: [] };
  let hardFail = false;
  let infraFail = false;

  const record = (name, ac, data) => {
    results.checks.push({ name, ac, ...data });
    if (data.pass === false) hardFail = true;
    console.log(`${data.pass === false ? 'FAIL' : 'PASS'} [${ac}] ${name}: ${JSON.stringify(data).slice(0, 400)}`);
  };

  try {
    // ── HeaderView cells — AC2/AC3/AC4 ──────────────────────────────────────────────────────────
    const headerWidths = [320, 375, 389, 390, 480, 640, 768, 1024, 1440, 1920];
    const headerLocaleWidths = [
      ...headerWidths.map((w) => ({ locale: 'en', width: w })),
      { locale: 'uk', width: 320 },
      { locale: 'uk', width: 1440 },
    ];
    for (const { locale, width } of headerLocaleWidths) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'mantine-primitives-headerview--default', { locale });
      const name = `header-${locale}-${width}`;
      if (!nav.ok) {
        record(name, 'infra', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
        infraFail = true;
        await context.close();
        continue;
      }
      await page.waitForTimeout(150);
      const measured = await page.evaluate(({ homeLabel, listingsLabel }) => {
        const headers = Array.from(document.querySelectorAll('header.site-header'));
        const header = headers[0]; // guest fixture (HeaderView.stories.tsx renders guest first)
        if (!header) return { error: 'guest header.site-header not found' };
        const cs = window.getComputedStyle(header);
        const rect = header.getBoundingClientRect();
        const anchors = Array.from(header.querySelectorAll('a'));
        const wordmark = anchors.find((a) => (a.textContent || '').includes('Lero'));
        const wordmarkCs = wordmark ? window.getComputedStyle(wordmark) : null;
        const homeLink = anchors.find((a) => (a.textContent || '').trim() === homeLabel);
        const listingsLink = anchors.find((a) => (a.textContent || '').trim() === listingsLabel);
        const navLinkCs = (el) => {
          if (!el) return null;
          const s = window.getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return { fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color, height: r.height, visible: r.width > 0 && r.height > 0 };
        };
        // Divider (no label) — direct child of the header, after the Flex bar (role="separator").
        // Mantine's own Divider.css: a no-label divider carries `border-top` on its OWN root
        // (`.m_3eebeb36:where([data-orientation='horizontal'])`), never a pseudo-element — only the
        // WITH-LABEL variant (the AuthSheet "or" rule, probed separately below) moves the line onto
        // the label's own `::before`/`::after` (`border:0` on that root instead, same stylesheet).
        const divider = header.querySelector('[role="separator"]');
        const dividerCs = divider ? window.getComputedStyle(divider) : null;
        return {
          position: cs.position,
          zIndex: cs.zIndex,
          backgroundColor: cs.backgroundColor,
          backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter || 'none',
          height: rect.height,
          wordmark: wordmarkCs ? { fontSize: wordmarkCs.fontSize, fontWeight: wordmarkCs.fontWeight, lineHeight: wordmarkCs.lineHeight } : null,
          homeLink: navLinkCs(homeLink),
          listingsLink: navLinkCs(listingsLink),
          dividerBorderTopWidth: dividerCs ? dividerCs.borderTopWidth : null,
          dividerBorderTopColor: dividerCs ? dividerCs.borderTopColor : null,
        };
      }, { homeLabel: T.home, listingsLabel: T.listings });

      if (measured.error) {
        record(name, 'infra', { pass: false, width, locale, failReason: measured.error });
        infraFail = true;
        await context.close();
        continue;
      }

      // AC2 — position sticky, zIndex 30 (every width/locale).
      const ac2Pass = measured.position === 'sticky' && String(measured.zIndex) === '30';
      record(`${name}-ac2-stacking`, 'AC2', { pass: ac2Pass, width, locale, position: measured.position, zIndex: measured.zIndex });

      // AC3 — height 97px <390, 65px >=390, tolerance +/-0.5px.
      const expectedHeight = width < 390 ? 97 : 65;
      const ac3Pass = Math.abs(measured.height - expectedHeight) <= 0.5;
      record(`${name}-ac3-height`, 'AC3', { pass: ac3Pass, width, locale, expectedHeight, measuredHeight: measured.height });

      // AC4 — background/backdrop/divider/wordmark at 1440 only (per §13.2, spot-checked at every
      // width for the background/backdrop/divider since they are width-independent, but graded
      // strictly only at 1440 to match the exact AC4 wording).
      if (width === 1440 && locale === 'en') {
        const bgPass = measured.backgroundColor === 'rgb(255, 255, 255)';
        const backdropPass = measured.backdropFilter === 'none';
        const dividerPass = measured.dividerBorderTopWidth === '1px' && measured.dividerBorderTopColor === 'rgb(228, 231, 236)';
        const wordmarkPass = !!measured.wordmark && measured.wordmark.fontSize === '20px' && measured.wordmark.fontWeight === '700' && measured.wordmark.lineHeight === '28px';
        record(`${name}-ac4-chrome`, 'AC4', {
          pass: bgPass && backdropPass && dividerPass && wordmarkPass,
          width, locale, bgPass, backdropPass, dividerPass, wordmarkPass,
          backgroundColor: measured.backgroundColor, backdropFilter: measured.backdropFilter,
          dividerBorderTopWidth: measured.dividerBorderTopWidth, dividerBorderTopColor: measured.dividerBorderTopColor,
          wordmark: measured.wordmark,
        });
      }

      // AC4 nav-link typography/height — from 768 (desktop nav visibleFrom="md").
      if (width >= 768 && locale === 'en') {
        const linkPass = (l) => !!l && l.visible && l.fontSize === '14px' && l.fontWeight === '500' && l.color === 'rgb(52, 64, 84)' && l.height >= 43.5;
        const pass = linkPass(measured.homeLink) && linkPass(measured.listingsLink);
        record(`${name}-ac4-navlinks`, 'AC4', { pass, width, locale, homeLink: measured.homeLink, listingsLink: measured.listingsLink });
      }

      await context.close();
    }

    // ── MobileNavDrawer cell — AC5 (44px rows) ──────────────────────────────────────────────────
    for (const loggedIn of [true, false]) {
      const context = await browser.newContext({ viewport: { width: 320, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'mantine-primitives-mobilenavdrawer--default', {
        locale: 'en', args: { loggedIn },
      });
      const name = `mobilenavdrawer-loggedIn-${loggedIn}`;
      if (!nav.ok) {
        record(name, 'infra', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
        infraFail = true;
        await context.close();
        continue;
      }
      await page.waitForTimeout(150);
      const measured = await page.evaluate(() => {
        // MantineDrawer portals to document.body; Stack component="nav" renders a real <nav>.
        const navEl = document.querySelector('nav');
        if (!navEl) return { error: 'nav element not found in portaled drawer' };
        const links = Array.from(navEl.querySelectorAll('a')).map((a) => {
          const r = a.getBoundingClientRect();
          return { text: (a.textContent || '').trim(), height: r.height, visible: r.width > 0 && r.height > 0 };
        });
        return { links };
      });
      if (measured.error) {
        record(name, 'infra', { pass: false, failReason: measured.error });
        infraFail = true;
        await context.close();
        continue;
      }
      const visibleLinks = measured.links.filter((l) => l.visible);
      const pass = visibleLinks.length > 0 && visibleLinks.every((l) => l.height >= 43.5);
      record(`${name}-ac5`, 'AC5', { pass, loggedIn, links: measured.links });
      await context.close();
    }

    // ── AuthSheet login cell — AC6 links + "or" rule ────────────────────────────────────────────
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-authsheet--login', { locale: 'en' });
      const name = `authsheet-login-${width}`;
      if (!nav.ok) {
        record(name, 'infra', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)}` });
        infraFail = true;
        await context.close();
        continue;
      }
      await page.waitForTimeout(150);
      const measured = await page.evaluate(({ forgotLabel, registerLabel, orLabel }) => {
        const root = document.body;
        const buttons = Array.from(root.querySelectorAll('button'));
        const linkStyle = (el) => {
          if (!el) return null;
          const s = window.getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return { fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color, textDecorationLine: s.textDecorationLine, visible: r.width > 0 };
        };
        const forgotLink = buttons.find((b) => (b.textContent || '').trim() === forgotLabel);
        const registerLink = buttons.find((b) => (b.textContent || '').trim() === registerLabel);
        const divider = Array.from(root.querySelectorAll('[role="separator"]')).find((d) => (d.textContent || '').trim().toLowerCase() === orLabel.toLowerCase());
        // Mantine's WITH-LABEL divider draws its line via `::before`/`::after` on the LABEL wrapper
        // itself (`[data-position]`, `border:0` on the divider root — see Divider.css), not on the
        // divider root. The wrapper's own text styling belongs to the nested Text span we pass as
        // `label` (size="sm" c="gray.4" tt="uppercase"), the INNERMOST span, not the wrapper span.
        const labelWrap = divider ? divider.querySelector('[data-position]') : null;
        const labelBefore = labelWrap ? window.getComputedStyle(labelWrap, '::before') : null;
        const spans = labelWrap ? Array.from(labelWrap.querySelectorAll('span')) : [];
        const labelTextSpan = spans[spans.length - 1] ?? null;
        const labelCs = labelTextSpan ? window.getComputedStyle(labelTextSpan) : null;
        return {
          forgotLink: linkStyle(forgotLink),
          registerLink: linkStyle(registerLink),
          dividerBorderTopWidth: labelBefore ? labelBefore.borderTopWidth : null,
          dividerBorderTopColor: labelBefore ? labelBefore.borderTopColor : null,
          orLabel: labelCs ? { fontSize: labelCs.fontSize, color: labelCs.color, textTransform: labelCs.textTransform, text: labelTextSpan.textContent } : null,
        };
      }, { forgotLabel: T.forgotPassword, registerLabel: T.register, orLabel: T.or });

      const linkPass = (l) => !!l && l.visible && l.fontSize === '14px' && l.fontWeight === '400' && l.color === 'rgb(236, 84, 71)' && l.textDecorationLine === 'none';
      const dividerPass = measured.dividerBorderTopWidth === '1px' && measured.dividerBorderTopColor === 'rgb(228, 231, 236)';
      const orLabelPass = !!measured.orLabel && measured.orLabel.fontSize === '14px' && measured.orLabel.color === 'rgb(152, 162, 179)' && measured.orLabel.textTransform === 'uppercase';
      const pass = linkPass(measured.forgotLink) && linkPass(measured.registerLink) && dividerPass && orLabelPass;
      record(`${name}-ac6`, 'AC6', { pass, width, measured, linkPassForgot: linkPass(measured.forgotLink), linkPassRegister: linkPass(measured.registerLink), dividerPass, orLabelPass });
      await context.close();
    }

    // ── AuthSheet register-agent-add-company-logo cell at 390 — AC6 tile ────────────────────────
    {
      const width = 390;
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-authsheet--register-agent-add-company-logo', { locale: 'en' });
      const name = 'authsheet-register-agent-add-company-logo-390';
      if (!nav.ok) {
        record(name, 'infra', { pass: false, failReason: `navigation failed: ${JSON.stringify(nav)} (story may not exist on this tree)` });
        infraFail = true;
        await context.close();
      } else {
        // Wait for the play function's async upload to resolve into the preview <img>.
        const found = await page.waitForSelector('img[alt="logo preview"]', { timeout: 8000 }).catch(() => null);
        const measured = await page.evaluate(() => {
          const img = document.querySelector('img[alt="logo preview"]');
          if (!img) return { error: 'img[alt="logo preview"] not found after play' };
          const tile = img.closest('[class*="Paper"]') || img.parentElement;
          const tileRect = tile.getBoundingClientRect();
          const s = window.getComputedStyle(tile);
          return {
            tileWidth: tileRect.width,
            tileHeight: tileRect.height,
            borderWidth: s.borderWidth,
            hasImg: true,
          };
        });
        if (!found || measured.error) {
          record(name, 'AC6', { pass: false, width, failReason: measured?.error ?? 'img[alt="logo preview"] did not appear within timeout' });
        } else {
          const pass = Math.abs(measured.tileWidth - 36) <= 1 && Math.abs(measured.tileHeight - 36) <= 1 && parseFloat(measured.borderWidth) > 0;
          record(name, 'AC6', { pass, width, measured });
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  await writeFile(OUT_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nWrote ${OUT_PATH}`);

  if (infraFail) {
    console.error(`\nFAIL  task879-header-chrome-probe (${LABEL}) — infrastructure failure (see above).`);
    process.exit(2);
  }
  if (hardFail) {
    console.error(`\nFAIL  task879-header-chrome-probe (${LABEL}) — one or more assertions failed (see above).`);
    process.exit(1);
  }
  console.log(`\nPASS  task879-header-chrome-probe (${LABEL}) — all checks passed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
