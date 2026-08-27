#!/usr/bin/env node
/**
 * task770-storybook-capture.mjs — Task 770 §13.2 focused 1440 capture (AC8).
 *
 * WHY THIS SCRIPT EXISTS: kickoff §3.9 measured that eight of the ten affected canonical stories
 * have no standing viewport cell above 1024px in the `--mantine-only` rendered matrix
 * (`MANTINE_VIEWPORTS` stops at `desktop-1024`). Six of those eight are the ones this task's
 * migrated CSS declarations actually reach directly with a rendered surface worth an explicit
 * 1440 probe — `FooterView`, `HeaderView`, `HeroSearch`, `HomeSection`, `HomepageListingGrids`,
 * `ListingCard` (`ListingCardPattern` and `CopyIdButton` are covered at 1440 THROUGH `ListingCard`/
 * `HomepageListingGrids`, which render them as real children — kickoff §3.9). This supplements the
 * Mantine-only gate; it never replaces it, and it must not add a width to `MANTINE_VIEWPORTS`.
 *
 * Serves `storybook-static` on an OS-assigned port (same static-file-server shape as
 * `check-stories-rendered.mjs`'s own `startStaticServer`), resolves every requested story id from
 * that directory's own `index.json` (never inferred from a filename), captures each at 1440x900,
 * and writes PNGs plus a JSON index under `docs/sessions/evidence/task770/`.
 *
 * Fails closed: a missing story id in `index.json`, a missing root element in the rendered iframe,
 * or a root that fails strict readiness (expected Storybook root present, non-zero bounding
 * rectangle, at least one visible descendant) writes what it captured so far and exits non-zero
 * WITHOUT writing that cell's screenshot.
 *
 * Usage:
 *   node scripts/task770-storybook-capture.mjs <label> [--dir <storybook-static-dir>]
 * <label> is typically 'pre-edit' or 'post-edit'. Output is written per-label and is never
 * overwritten — every planned output path is checked for existence BEFORE the browser starts, and
 * again immediately before each screenshot write; a collision exits 1 without touching anything
 * to docs/sessions/evidence/task770/task770-1440.<label>.json, plus one PNG per story in the same
 * folder. `--dir` defaults to the repository's own `storybook-static/` — pass an alternate path to
 * capture from a different built copy (e.g. a reconstructed pre-edit tree).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task770');

const args = process.argv.slice(2);
const label = args[0];
const dirFlagIdx = args.indexOf('--dir');
const storybookStaticDir = dirFlagIdx !== -1 && args[dirFlagIdx + 1]
  ? resolve(process.cwd(), args[dirFlagIdx + 1])
  : join(ROOT, 'storybook-static');

if (!label) {
  console.error('Usage: node scripts/task770-storybook-capture.mjs <label> [--dir <storybook-static-dir>]');
  process.exit(2);
}

// Kickoff §13.2/§3.9 — the six stories with no standing cell above 1024px whose rendered surface
// this task's migration directly reaches.
const CANONICAL_TITLES = [
  { name: 'FooterView', storyId: 'mantine-primitives-footerview--default' },
  { name: 'HeaderView', storyId: 'mantine-primitives-headerview--default' },
  { name: 'HeroSearch', storyId: 'mantine-primitives-herosearch--default' },
  { name: 'HomeSection', storyId: 'patterns-mantine-homesection--default' },
  { name: 'HomepageListingGrids', storyId: 'patterns-mantine-homepagelistinggrids--default' },
  { name: 'ListingCard', storyId: 'mantine-primitives-listingcard--default' },
];

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

async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true });

  let indexJson;
  try {
    indexJson = JSON.parse(await readFile(join(storybookStaticDir, 'index.json'), 'utf8'));
  } catch (e) {
    console.error(`❌ task770-storybook-capture: could not read/parse index.json at ${join(storybookStaticDir, 'index.json')}: ${e.message}`);
    process.exit(1);
  }
  const knownIds = new Set(Object.keys(indexJson.entries ?? {}));

  const missing = CANONICAL_TITLES.filter((t) => !knownIds.has(t.storyId));
  if (missing.length > 0) {
    console.error(`❌ task770-storybook-capture: missing story id(s) in ${storybookStaticDir}/index.json: ${missing.map((m) => m.storyId).join(', ')}`);
    process.exit(1);
  }

  // No-clobber (Task 770 remediation, 2026-08-27). The header has always claimed output is
  // "never overwritten", but the writes used writeFile()/page.screenshot() with no existence check,
  // so re-running a label silently replaced retained evidence. Every output path for this label is
  // now checked BEFORE the static server and the browser start, so a colliding run costs nothing
  // and destroys nothing.
  const plannedOutputs = [
    join(EVIDENCE_DIR, `task770-1440.${label}.json`),
    ...CANONICAL_TITLES.map((t) => join(EVIDENCE_DIR, `task770-1440.${label}.${t.name}.png`)),
  ];
  const colliding = plannedOutputs.filter((p) => existsSync(p));
  if (colliding.length > 0) {
    console.error(`❌ task770-storybook-capture: refusing to overwrite ${colliding.length} existing evidence file(s) for label "${label}":`);
    for (const p of colliding) console.error(`    ${p}`);
    console.error('    Choose a different <label>, or move the existing run aside first.');
    process.exit(1);
  }

  const server = await startStaticServer(storybookStaticDir);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ headless: true });
  const result = { label, storybookStaticDir, capturedAt: new Date().toISOString(), viewport: '1440x900', cells: [] };
  let hardFail = false;

  try {
    for (const { name, storyId } of CANONICAL_TITLES) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      const cell = { name, storyId };
      try {
        const url = `${baseUrl}/iframe.html?id=${storyId}&viewMode=story`;
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        cell.httpStatus = response ? response.status() : null;
        cell.ok = response ? response.ok() : false;

        // Strict root readiness (Task 770 remediation, 2026-08-27). The previous
        // `|| document.body.children.length > 0` fallback made this check very nearly vacuous: a
        // Storybook error shell, an empty preview, or a half-mounted iframe all satisfy it, so a
        // broken cell could be screenshotted and retained as evidence. A valid root must now be the
        // EXPECTED Storybook root, exist, have a non-zero bounding rectangle, and contain at least
        // one visible descendant. Anything less fails closed BEFORE a screenshot is written.
        const readiness = await page.evaluate(() => {
          const root = document.getElementById('storybook-root') ?? document.querySelector('#root');
          if (!root) {
            return { ok: false, reason: 'expected Storybook root (#storybook-root / #root) is absent' };
          }
          const rect = root.getBoundingClientRect();
          const rootWidth = Math.round(rect.width);
          const rootHeight = Math.round(rect.height);
          if (!(rect.width > 0 && rect.height > 0)) {
            return { ok: false, reason: `root has a zero bounding rectangle (${rootWidth}x${rootHeight})`, rootWidth, rootHeight };
          }
          const descendants = Array.from(root.querySelectorAll('*'));
          const visibleDescendants = descendants.filter((el) => {
            const r = el.getBoundingClientRect();
            if (!(r.width > 0 && r.height > 0)) return false;
            const cs = getComputedStyle(el);
            return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) !== 0;
          }).length;
          if (visibleDescendants === 0) {
            return { ok: false, reason: 'root has no visible descendant (empty or error shell)', rootWidth, rootHeight, descendants: descendants.length, visibleDescendants };
          }
          return { ok: true, rootId: root.id || '(unnamed)', rootWidth, rootHeight, descendants: descendants.length, visibleDescendants };
        });
        cell.rootReadiness = readiness;

        if (!cell.ok || !readiness.ok) {
          cell.failReason = !cell.ok ? `non-OK response status ${cell.httpStatus}` : `root readiness failed: ${readiness.reason}`;
          hardFail = true;
        } else {
          const pngPath = join(EVIDENCE_DIR, `task770-1440.${label}.${name}.png`);
          if (existsSync(pngPath)) {
            cell.failReason = `refusing to overwrite existing screenshot: ${pngPath}`;
            hardFail = true;
          } else {
            await page.screenshot({ path: pngPath, fullPage: true });
            cell.screenshot = pngPath;
          }
        }
      } catch (err) {
        cell.failReason = `navigation/evaluation error: ${err instanceof Error ? err.message : String(err)}`;
        hardFail = true;
      } finally {
        await context.close();
      }
      result.cells.push(cell);
    }
  } finally {
    await browser.close();
    server.close();
  }

  const outPath = join(EVIDENCE_DIR, `task770-1440.${label}.json`);
  await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(JSON.stringify(result, null, 2));

  if (hardFail) {
    console.error('\n❌ task770-storybook-capture: one or more cells failed closed (see failReason above).');
    process.exit(1);
  }
  console.log('\n✅ task770-storybook-capture: all cells captured cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
