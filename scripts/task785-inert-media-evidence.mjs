#!/usr/bin/env node
/**
 * task785-inert-media-evidence.mjs — Task 785 §7/AC2/AC3 real-browser evidence.
 *
 * Proves each of the twelve `styles={{root:{'@media...'}}}` sites this task converted to native
 * Mantine responsive props (`Flex` `direction`/`align`/`w`, `Button` `w`) actually emits a real
 * `@media (min-width: 40em)` rule and flips the measured computed property at the gate — the exact
 * defect docs/sessions/evidence/task784/d69-19-browser/styles-prop-media-query-defect-proof.md
 * proved the old shape never did.
 *
 * The gate width is read from the ACTUAL `src/design-system/mantine/theme.ts` source at run time
 * (never hardcoded here) — `theme.breakpoints.sm`, confirmed byte-identical to `theme.other.mobileGate`.
 *
 * Same static-file-server + Playwright shape as scripts/task784-d69-19-browser-evidence.mjs.
 *
 * Usage: node scripts/task785-inert-media-evidence.mjs [--dir <storybook-static-dir>]
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task785');
const THEME_PATH = join(ROOT, 'src/design-system/mantine/theme.ts');

const args = process.argv.slice(2);
const dirFlagIdx = args.indexOf('--dir');
const storybookStaticDir = dirFlagIdx !== -1 && args[dirFlagIdx + 1]
  ? resolve(process.cwd(), args[dirFlagIdx + 1])
  : join(ROOT, 'storybook-static');

// ── Read the gate width from the ACTUAL theme.ts source (never hardcoded here) ─────────────────
const themeSrc = readFileSync(THEME_PATH, 'utf8');

function readThemeValue(pattern, label) {
  const m = themeSrc.match(pattern);
  if (!m) throw new Error(`task785-inert-media-evidence: could not find ${label} in theme.ts`);
  return m[1];
}

const breakpointSmEm = readThemeValue(/sm:\s*'([\d.]+em)',\s*\/\/\s*640px/, 'breakpoints.sm');
const mobileGateEm = readThemeValue(/mobileGate:\s*'([\d.]+em)',/, 'other.mobileGate');
if (breakpointSmEm !== mobileGateEm) {
  throw new Error(`task785-inert-media-evidence: theme.breakpoints.sm (${breakpointSmEm}) !== theme.other.mobileGate (${mobileGateEm}) — kickoff's byte-identical claim no longer holds`);
}
const remToPx = (remStr) => Math.round(parseFloat(remStr) * 16);
const gatePx = remToPx(breakpointSmEm); // 640

const BELOW_GATE = gatePx - 1; // 639 — must still be column/full-width
const AT_GATE = gatePx; // 640 — must be row/auto

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

async function gotoStory(page, baseUrl, storyId, { locale } = {}) {
  const globals = locale ? `&globals=locale:${locale}` : '';
  const url = `${baseUrl}/iframe.html?id=${storyId}&viewMode=story${globals}`;
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  const readiness = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') ?? document.querySelector('#root');
    if (!root) return { ok: false, reason: 'expected Storybook root is absent' };
    const rect = root.getBoundingClientRect();
    if (!(rect.width > 0 && rect.height > 0)) return { ok: false, reason: `root has zero rect (${rect.width}x${rect.height})` };
    return { ok: true };
  });
  return { ok: !!response?.ok() && readiness.ok, httpStatus: response ? response.status() : null, readiness };
}

// One row per site from the kickoff's §3.1 inventory (11) + the 12th/13th sites discovered via
// AC1's directory-wide grep (MantineResponsiveActionFooter.tsx, out of the kickoff's enumerated
// inventory but inside R1's literal `src/design-system/mantine/**` scope).
const CHECKS = [
  {
    name: 'admin-surface-toolbar-direction',
    storyId: 'patterns-mantine-adminsurfacepattern--default',
    sites: [1],
    kind: 'flex-direction',
    selector: '.mantine-Flex-root',
    index: 0,
  },
  {
    name: 'admin-surface-add-button-width',
    storyId: 'patterns-mantine-adminsurfacepattern--default',
    sites: [2],
    kind: 'button-width',
    selector: '.mantine-Flex-root button',
    index: -1, // last button in the toolbar Flex is the Add button
  },
  {
    name: 'form-section-stack-actions-direction',
    storyId: 'patterns-mantine-formsectionstack--default',
    sites: [3],
    kind: 'flex-direction',
    selector: '.mantine-Flex-root',
    index: 0,
  },
  {
    name: 'form-section-stack-cancel-width',
    storyId: 'patterns-mantine-formsectionstack--default',
    sites: [4],
    kind: 'button-width',
    selector: '.mantine-Flex-root button',
    index: 0,
  },
  {
    name: 'form-section-stack-submit-width',
    storyId: 'patterns-mantine-formsectionstack--default',
    sites: [5],
    kind: 'button-width',
    selector: '.mantine-Flex-root button',
    index: 1,
  },
  {
    name: 'two-column-form-actions-direction',
    storyId: 'patterns-mantine-twocolumnform--default',
    sites: [6],
    kind: 'flex-direction',
    selector: '.mantine-Flex-root',
    index: 0,
  },
  {
    name: 'two-column-form-cancel-width',
    storyId: 'patterns-mantine-twocolumnform--default',
    sites: [7],
    kind: 'button-width',
    selector: '.mantine-Flex-root button',
    index: 0,
  },
  {
    name: 'two-column-form-submit-width',
    storyId: 'patterns-mantine-twocolumnform--default',
    sites: [8],
    kind: 'button-width',
    selector: '.mantine-Flex-root button',
    index: 1,
  },
  {
    name: 'page-header-actions-direction',
    storyId: 'patterns-mantine-pageheaderwithactions--default',
    sites: [9],
    kind: 'flex-direction',
    selector: '.mantine-Flex-root',
    index: 0,
  },
  {
    // Story order: empty state (Search) renders first, error state (Submit) second — loading
    // state has no button. `.mantine-Button-root` excludes the story-frame's own hidden
    // (0x0 rect) action buttons, which a plain `button` selector also matches.
    name: 'empty-state-action-width',
    storyId: 'patterns-mantine-emptyloadingerrorstate--default',
    sites: [11],
    kind: 'button-width-absolute',
    selector: '.mantine-Button-root',
    index: 0,
  },
  {
    name: 'error-state-action-width',
    storyId: 'patterns-mantine-emptyloadingerrorstate--default',
    sites: [10],
    kind: 'button-width-absolute',
    selector: '.mantine-Button-root',
    index: 1,
  },
  {
    name: 'response-action-footer-direction',
    storyId: 'patterns-mantine-responsiveactionfooter--default',
    sites: ['discovered-1'],
    kind: 'flex-direction',
    selector: '.mantine-Flex-root',
    index: 0,
  },
  {
    name: 'response-action-footer-button-width',
    storyId: 'patterns-mantine-responsiveactionfooter--default',
    sites: ['discovered-2'],
    kind: 'button-width',
    selector: '.mantine-Flex-root button',
    index: 0,
  },
  // R7 (owner return, 2026-09-04): the restored dead rule never declared `justify`, so both rows
  // sat at the Flex default (`flex-start`) at desktop instead of the end-aligned row an action row
  // conventionally reads as. `justify` is now explicit — unchanged below `sm`, `flex-end` at `sm`+.
  {
    name: 'form-section-stack-actions-justify',
    storyId: 'patterns-mantine-formsectionstack--default',
    sites: ['R7-form-section-stack'],
    kind: 'justify-content',
    selector: '.mantine-Flex-root',
    index: 0,
  },
  {
    name: 'two-column-form-actions-justify',
    storyId: 'patterns-mantine-twocolumnform--default',
    sites: ['R7-two-column-form'],
    kind: 'justify-content',
    selector: '.mantine-Flex-root',
    index: 0,
  },
];

async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true });

  if (!existsSync(join(storybookStaticDir, 'index.json'))) {
    console.error(`❌ missing ${join(storybookStaticDir, 'index.json')} — run "npm run build-storybook" first.`);
    process.exit(1);
  }

  const server = await startStaticServer(storybookStaticDir);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });

  const results = { capturedAt: new Date().toISOString(), storybookStaticDir, gateEm: breakpointSmEm, gatePx, checks: [] };
  let hardFail = false;

  const record = (name, data) => {
    results.checks.push({ name, ...data });
    if (data.pass === false) hardFail = true;
    console.log(`${data.pass === false ? '❌' : '✅'} ${name}: ${JSON.stringify(data)}`);
  };

  try {
    for (const check of CHECKS) {
      for (const width of [BELOW_GATE, AT_GATE]) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        const nav = await gotoStory(page, baseUrl, check.storyId);
        const name = `${check.name}-${width}`;
        if (!nav.ok) {
          record(name, { pass: false, sites: check.sites, failReason: `navigation failed: ${JSON.stringify(nav)}` });
          await context.close();
          continue;
        }
        await page.waitForTimeout(150);

        if (check.kind === 'flex-direction') {
          const measured = await page.evaluate(({ selector, index }) => {
            const els = Array.from(document.querySelectorAll(selector));
            const el = els[index];
            if (!el) return null;
            return { flexDirection: getComputedStyle(el).flexDirection };
          }, { selector: check.selector, index: check.index });
          const expected = width < gatePx ? 'column' : 'row';
          const pass = !!measured && measured.flexDirection === expected;
          await page.screenshot({ path: join(EVIDENCE_DIR, `${name}.png`), fullPage: false }).catch(() => {});
          record(name, { pass, sites: check.sites, measured, expected, width, gatePx });
        } else if (check.kind === 'button-width') {
          const measured = await page.evaluate(({ selector, index }) => {
            const els = Array.from(document.querySelectorAll(selector));
            const el = index === -1 ? els[els.length - 1] : els[index];
            if (!el) return null;
            const container = el.closest('.mantine-Flex-root, .mantine-Group-root');
            const containerWidth = container ? container.getBoundingClientRect().width : null;
            const btnWidth = el.getBoundingClientRect().width;
            return { btnWidth, containerWidth };
          }, { selector: check.selector, index: check.index });
          // Below gate: button spans (near enough) the full container width (allowing for the
          // container's own internal gap on multi-child rows). At/above gate: button is
          // auto-width, meaningfully narrower than the container.
          let pass = false;
          if (measured && measured.containerWidth) {
            const ratio = measured.btnWidth / measured.containerWidth;
            pass = width < gatePx ? ratio > 0.55 : ratio < 0.55;
          }
          await page.screenshot({ path: join(EVIDENCE_DIR, `${name}.png`), fullPage: false }).catch(() => {});
          record(name, { pass, sites: check.sites, measured, width, gatePx });
        } else if (check.kind === 'button-width-absolute') {
          // These two Buttons are not wrapped in a Flex/Group (they sit directly in a Stack) — the
          // empty-state Stack additionally caps its own width via `maw={theme.other.boxSize.emptyState}`,
          // so "100%" is 100% of that capped Stack, never the raw viewport. Compute the ratio against
          // the nearest `.mantine-Stack-root` ancestor, not the viewport.
          const measured = await page.evaluate(({ selector, index }) => {
            const els = Array.from(document.querySelectorAll(selector));
            const el = els[index];
            if (!el) return null;
            const container = el.closest('.mantine-Stack-root');
            const containerWidth = container ? container.getBoundingClientRect().width : null;
            return { btnWidth: el.getBoundingClientRect().width, containerWidth };
          }, { selector: check.selector, index: check.index });
          let pass = false;
          if (measured && measured.containerWidth) {
            const ratio = measured.btnWidth / measured.containerWidth;
            pass = width < gatePx ? ratio > 0.85 : ratio < 0.55;
          }
          await page.screenshot({ path: join(EVIDENCE_DIR, `${name}.png`), fullPage: false }).catch(() => {});
          record(name, { pass, sites: check.sites, measured, width, gatePx });
        } else if (check.kind === 'justify-content') {
          const measured = await page.evaluate(({ selector, index }) => {
            const els = Array.from(document.querySelectorAll(selector));
            const el = els[index];
            if (!el) return null;
            return { justifyContent: getComputedStyle(el).justifyContent };
          }, { selector: check.selector, index: check.index });
          const expected = width < gatePx ? 'flex-start' : 'flex-end';
          const pass = !!measured && measured.justifyContent === expected;
          await page.screenshot({ path: join(EVIDENCE_DIR, `${name}.png`), fullPage: false }).catch(() => {});
          record(name, { pass, sites: check.sites, measured, expected, width, gatePx });
        }
        await context.close();
      }
    }

    // ── R8: FormSectionStack — actions row inset matches the sections' Paper p="md" content edge ──
    {
      const width = 375;
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const nav = await gotoStory(page, baseUrl, 'patterns-mantine-formsectionstack--default');
      const name = `form-section-stack-inset-${width}`;
      if (!nav.ok) {
        record(name, { pass: false, sites: ['R8'], failReason: `navigation failed: ${JSON.stringify(nav)}` });
      } else {
        await page.waitForTimeout(150);
        const measured = await page.evaluate(() => {
          const paper = document.querySelector('.mantine-Paper-root');
          const flex = document.querySelector('.mantine-Flex-root');
          if (!paper || !flex) return null;
          const paperRect = paper.getBoundingClientRect();
          const paperStyle = getComputedStyle(paper);
          const paperContentLeft = paperRect.left + parseFloat(paperStyle.paddingLeft);
          const paperContentRight = paperRect.right - parseFloat(paperStyle.paddingRight);
          const flexRect = flex.getBoundingClientRect();
          const flexStyle = getComputedStyle(flex);
          const flexContentLeft = flexRect.left + parseFloat(flexStyle.paddingLeft);
          const flexContentRight = flexRect.right - parseFloat(flexStyle.paddingRight);
          return { paperContentLeft, paperContentRight, flexContentLeft, flexContentRight };
        });
        const pass = !!measured
          && Math.abs(measured.flexContentLeft - measured.paperContentLeft) <= 2
          && Math.abs(measured.flexContentRight - measured.paperContentRight) <= 2;
        await page.screenshot({ path: join(EVIDENCE_DIR, `${name}.png`), fullPage: false }).catch(() => {});
        record(name, { pass, sites: ['R8'], measured, width });
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  const outPath = join(EVIDENCE_DIR, 'results.json');
  await writeFile(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nWrote ${outPath}`);

  if (hardFail) {
    console.error('\n❌ task785-inert-media-evidence: one or more checks failed (see above).');
    process.exit(1);
  }
  console.log('\n✅ task785-inert-media-evidence: all checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
