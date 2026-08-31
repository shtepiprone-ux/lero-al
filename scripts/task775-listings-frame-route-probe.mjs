#!/usr/bin/env node
/**
 * task775-listings-frame-route-probe.mjs — Task 775 §10.10/§13 rendered evidence.
 *
 * Modelled on `scripts/task766-route-shell-probe.mjs` (BASE_URL env, per-label retained JSON+PNG
 * evidence under `docs/sessions/evidence/task<N>/`, <nextjs-portal> dev-server preflight refusal).
 *
 * EVIDENCE TOOLING, not a gate: no `package.json` script entry, nothing in CI depends on it.
 *
 * Usage:
 *   node scripts/task775-listings-frame-route-probe.mjs current <runId>
 * The probe captures the current locally running tree. Every run writes only to its new, unique
 * docs/sessions/evidence/task775/runs/<runId>/ directory; no existing evidence is overwritten.
 *
 * Contract (kickoff §10.10):
 *   - Reads BASE_URL from the environment, defaulting to http://127.0.0.1:3000.
 *   - Computes top-level `probeHash` and `gitCommit` fields via `git hash-object` / `git rev-parse`
 *     in the current Git checkout (via `child_process`, never a shell). Fails closed — writes
 *     nothing and exits non-zero — if that identity cannot be computed.
 *   - For /en/listings and /uk/listings, at every Q3 canonical width (320/375/390/480/560/680/
 *     768/810/960/1024/1200/1440/1920/2560), records:
 *       - documentElement.scrollWidth vs clientWidth (overflow check); when it overflows,
 *         `overflowCulprit` (§10.10d) — tagName/className/right of the widest offending node
 *         under <main>
 *       - computed max-width/padding-left/padding-right of the breadcrumb gutter and the content
 *         gutter
 *       - computed background-color of the page and of the breadcrumb band, and the band's
 *         border-bottom
 *       - the breadcrumb row's computed font-size, color (link + current + separator, §10.10a),
 *         and gap (separator margin-inline)
 *       - the <nav> accessible name (aria-label) and its item texts
 *   - At 1440 only, additionally records the header and footer `.container-wide` computed
 *     padding-left/right for the §3.3b alignment finding (content 3rem vs chrome 2rem, AC3).
 *   - At the 1200 and 1440 cells, additionally records the resolved `--mantine-spacing-2xl` /
 *     `--mantine-spacing-3xl` CSS variables (§10.10b, AC12), beside that cell's padding.
 *   - At the 1440/en cell, runs a real interaction pass (§10.10c, AC7) against the running
 *     server — filters trigger, sort change and status tab — recording each control's
 *     URL before/after and a `changed` boolean under a top-level `interactions` key.
 *   - Records whether the server is `next dev` or `next start`; production-build correctness is
 *     established independently by `npm run build`.
 *   - Fails closed on a non-OK response, missing selector or failed interaction postcondition.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task775');
const RUNS_DIR = join(EVIDENCE_DIR, 'runs');
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';

const Q3_WIDTHS = [320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560];
const LOCALES = ['en', 'uk'];
const SPACING_VAR_WIDTHS = new Set([1200, 1440]);

const label = process.argv[2];
const runId = process.argv[3];
if (label !== 'current' || !runId || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(runId)) {
  console.error('Usage: node scripts/task775-listings-frame-route-probe.mjs current <runId>');
  process.exit(2);
}

// Computed in the current Git checkout via child_process, so the run records the exact probe
// content and commit without depending on a shell being present.
function computeProbeHash() {
  return execFileSync('git', ['hash-object', 'scripts/task775-listings-frame-route-probe.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
}

function computeGitCommit() {
  return execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
}

function evalCell() {
  const devServerDetected = !!document.querySelector('nextjs-portal');

  // Structure (src/app/[locale]/layout.tsx:51 `<Box component="main">{children}</Box>`, and
  // ListingsPageFrame.tsx): <main> > frameRoot(Box mih=100vh) > [band, contentGutter]. Mantine
  // injects a sibling `<style data-mantine-styles="inline">` next to any Box using a responsive
  // style prop, which shifts naive `firstElementChild`/`children[n]` indexing — so every lookup
  // below is class/attribute-based instead of positional.
  const nav = document.querySelector('nav.mantine-Breadcrumbs-root');
  const gutterDiv = nav ? nav.parentElement : null; // the maw/px breadcrumb gutter box
  const band = gutterDiv ? gutterDiv.parentElement : null; // the background/border-bottom box
  const main = document.querySelector('main');
  const frameRoot = main ? main.firstElementChild : band ? band.parentElement : null;
  const contentGutter = frameRoot
    ? Array.from(frameRoot.children).find((el) => el.tagName !== 'STYLE' && el !== band)
    : null;

  const page = frameRoot; // outer frame Box (page background)

  function rectPad(el) {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      maxWidth: cs.maxWidth,
      paddingLeft: cs.paddingLeft,
      paddingRight: cs.paddingRight,
    };
  }

  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const headerGutter = header ? header.querySelector('.container-wide') : null;
  const footerGutter = footer ? footer.querySelector('.container-wide') : null;

  let navItems = [];
  let navAriaLabel = null;
  let breadcrumbFontSize = null;
  let breadcrumbGap = null;
  let linkColor = null;
  let currentColor = null;
  let separatorColor = null;
  if (nav) {
    navAriaLabel = nav.getAttribute('aria-label');
    navItems = Array.from(nav.children).map((c) => c.textContent?.trim() ?? '');
    const link = nav.querySelector('a');
    const spans = Array.from(nav.children).filter((c) => c.tagName !== 'A');
    const current = spans[spans.length - 1];
    if (link) {
      const lcs = getComputedStyle(link);
      breadcrumbFontSize = lcs.fontSize;
      linkColor = lcs.color;
    }
    if (current) {
      currentColor = getComputedStyle(current).color;
    }
    // §10.10a — the separator is the remaining non-<a>, non-current child.
    const separator = spans.find((s) => s !== current);
    if (separator) {
      breadcrumbGap = getComputedStyle(separator).marginInline || getComputedStyle(separator).marginLeft;
      separatorColor = getComputedStyle(separator).color;
    }
  }

  const scrollWidth = document.documentElement.scrollWidth;
  const clientWidth = document.documentElement.clientWidth;

  // §10.10d — only computed when the cell actually overflows; the widest node whose right edge
  // exceeds clientWidth, walking the subtree of <main>.
  let overflowCulprit = null;
  if (scrollWidth > clientWidth + 2 && main) {
    let worst = null;
    const all = main.querySelectorAll('*');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.right > clientWidth && (!worst || rect.right > worst.right)) {
        worst = {
          tagName: el.tagName,
          className: typeof el.className === 'string' ? el.className : String(el.className),
          right: rect.right,
        };
      }
    }
    overflowCulprit = worst;
  }

  return {
    devServerDetected,
    scrollWidth,
    clientWidth,
    overflowCulprit,
    pageBackgroundColor: page ? getComputedStyle(page).backgroundColor : null,
    bandBackgroundColor: band ? getComputedStyle(band).backgroundColor : null,
    bandBorderBottom: band ? getComputedStyle(band).borderBottom : null,
    breadcrumbGutter: rectPad(gutterDiv),
    contentGutter: rectPad(contentGutter),
    navAriaLabel,
    navItems,
    breadcrumbFontSize,
    linkColor,
    currentColor,
    separatorColor,
    breadcrumbGap,
    headerGutterPadding: headerGutter ? rectPad(headerGutter) : null,
    footerGutterPadding: footerGutter ? rectPad(footerGutter) : null,
    mainFound: !!main,
    navFound: !!nav,
  };
}

// §10.10c — each interaction gets an isolated browser context. This removes any possibility of
// an earlier action's URL, router cache or component state making a later assertion look green.
async function exactlyOne(locator, name) {
  const count = await locator.count();
  if (count !== 1) throw new Error(`${name}: expected exactly one matching element, found ${count}`);
  return locator;
}

function queryFailure(expected, urlAfter) {
  const actual = new URL(urlAfter);
  return `${expected}; actual URL=${actual.toString()}`;
}

async function recordInteraction(browser, { name, startPath, expected, action, assertUrl }) {
  const entry = { control: name, startPath, expected, urlBefore: null, urlAfter: null, changed: false };
  let context;
  let page;

  try {
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await context.newPage();
    const response = await page.goto(`${BASE_URL}${startPath}`, { waitUntil: 'networkidle', timeout: 30000 });
    if (!response?.ok()) throw new Error(`start URL returned non-OK status ${response?.status() ?? 'unknown'}`);
    entry.urlBefore = page.url();
    await action(page);
    entry.urlAfter = page.url();
    entry.changed = entry.urlAfter !== entry.urlBefore;

    // Parse every final URL before evaluating the interaction-specific contract.
    const actual = new URL(entry.urlAfter);
    const failure = assertUrl(actual, entry.urlBefore, entry.urlAfter);
    if (failure) entry.failReason = `${failure}; actual query=${actual.searchParams.toString() || '(empty)'}`;
  } catch (err) {
    entry.urlAfter = entry.urlAfter ?? page?.url() ?? null;
    entry.changed = entry.urlBefore !== null && entry.urlAfter !== entry.urlBefore;
    entry.failReason = err instanceof Error ? err.message : String(err);
  } finally {
    await context?.close();
  }

  return entry;
}

// A `page.goto`-only probe is not acceptable evidence for AC7; every control is exercised and
// its exact route-level postcondition is asserted before the result is retained.
async function runInteractions(browser) {
  const sortExpected = 'sort=price_asc and page is absent or 1';
  const interactions = {
    filters: await recordInteraction(browser, {
      name: 'advanced filters trigger',
      startPath: '/en/listings',
      expected: 'sheet content visible and URL unchanged',
      action: async (page) => {
        const trigger = await exactlyOne(page.getByTestId('task775-advanced-filters'), 'advanced filters trigger');
        await trigger.click();
        await page.locator('[data-slot="sheet-content"]').waitFor({ state: 'visible', timeout: 5000 });
      },
      assertUrl: (_actual, urlBefore, urlAfter) =>
        urlAfter === urlBefore ? null : queryFailure('expected URL unchanged after opening filters', urlAfter),
    }),
    sort: await recordInteraction(browser, {
      name: 'sort trigger -> price_asc option',
      startPath: '/en/listings?page=2',
      expected: sortExpected,
      action: async (page) => {
        const trigger = await exactlyOne(
          page.locator('.listings-sort-bar [data-testid="combobox"] > button'),
          'sort trigger'
        );
        await trigger.click();
        const option = await exactlyOne(page.locator('[role="option"][data-value="price_asc"]'), 'price_asc option');
        await Promise.all([
          page.waitForURL((url) => {
            const params = url.searchParams;
            return params.get('sort') === 'price_asc' && (!params.has('page') || params.get('page') === '1');
          }, { timeout: 5000 }),
          option.click(),
        ]);
      },
      assertUrl: (actual) =>
        actual.searchParams.get('sort') === 'price_asc' &&
        (!actual.searchParams.has('page') || actual.searchParams.get('page') === '1')
          ? null
          : queryFailure(`expected ${sortExpected}`, actual.toString()),
    }),
    statusTab: await recordInteraction(browser, {
      name: 'inactive listings status tab -> closed',
      startPath: '/en/listings',
      expected: 'tab=closed',
      action: async (page) => {
        const tab = await exactlyOne(
          page.locator('.listings-status-tabs [data-slot="tabs-trigger"]:not([data-active])'),
          'inactive listings status tab'
        );
        await Promise.all([
          page.waitForURL((url) => url.searchParams.get('tab') === 'closed', { timeout: 5000 }),
          tab.click(),
        ]);
      },
      assertUrl: (actual) =>
        actual.searchParams.get('tab') === 'closed'
          ? null
          : queryFailure('expected tab=closed', actual.toString()),
    }),
  };

  return interactions;
}

// A failed run must not occupy an immutable run ID. Check that the route responds before creating
// any evidence directory. Development mode is valid current-tree UI evidence; the result records it.
async function preflightRouteServer(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    const response = await page.goto(`${BASE_URL}/en/listings`, { waitUntil: 'networkidle', timeout: 30000 });
    if (!response?.ok()) throw new Error(`preflight returned non-OK status ${response?.status() ?? 'unknown'}`);
    return (await page.locator('nextjs-portal').count()) > 0 ? 'development' : 'production';
  } finally {
    await context.close();
  }
}

async function main() {
  let probeHash;
  let gitCommit;
  try {
    probeHash = computeProbeHash();
    if (!probeHash) throw new Error('empty git hash-object output');
    gitCommit = computeGitCommit();
    if (!/^[0-9a-f]{40}$/i.test(gitCommit)) throw new Error('invalid git rev-parse HEAD output');
  } catch (err) {
    console.error(
      `\n❌ task775-listings-frame-route-probe: unable to identify the current Git tree (${
        err instanceof Error ? err.message : String(err)
      }). Not a Git worktree, or a Git command failed — refusing to write evidence without a reproducible commit (§10.10e).`
    );
    process.exit(1);
    return;
  }

  const browser = await chromium.launch({ headless: true });
  let serverMode;
  try {
    serverMode = await preflightRouteServer(browser);
  } catch (err) {
    await browser.close();
    console.error(
      `\n❌ task775-listings-frame-route-probe: ${err instanceof Error ? err.message : String(err)}. ` +
      'Refusing to create a current-route evidence run.'
    );
    process.exit(1);
    return;
  }

  // The current-tree identity and route preflight are verified before this mutates
  // evidence storage. A duplicate run ID is a hard failure, never an overwrite.
  await mkdir(RUNS_DIR, { recursive: true });
  const runDir = join(RUNS_DIR, runId);
  await mkdir(runDir);

  const result = {
    label,
    runId,
    baseUrl: BASE_URL,
    capturedAt: new Date().toISOString(),
    probeHash,
    gitCommit,
    serverMode,
    cells: [],
  };
  let hardFail = false;

  for (const locale of LOCALES) {
    for (const width of Q3_WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      const cell = { locale, width };

      try {
        const response = await page.goto(`${BASE_URL}/${locale}/listings`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        cell.httpStatus = response ? response.status() : null;
        cell.ok = response ? response.ok() : false;

        if (!cell.ok) {
          cell.failReason = `non-OK response status ${cell.httpStatus}`;
          hardFail = true;
        } else {
          const measured = await page.evaluate(evalCell);
          Object.assign(cell, measured);
          if (!measured.navFound) {
            cell.failReason = 'nav[aria-label] not found';
            hardFail = true;
          }

          if (SPACING_VAR_WIDTHS.has(width)) {
            const spacingVars = await page.evaluate(() => {
              const cs = getComputedStyle(document.documentElement);
              return {
                mantineSpacing2xl: cs.getPropertyValue('--mantine-spacing-2xl').trim(),
                mantineSpacing3xl: cs.getPropertyValue('--mantine-spacing-3xl').trim(),
              };
            });
            Object.assign(cell, spacingVars);
            if (!spacingVars.mantineSpacing2xl || !spacingVars.mantineSpacing3xl) {
              cell.failReason = `${cell.failReason ? `${cell.failReason}; ` : ''}mantine spacing 2xl/3xl variable resolved empty`;
              hardFail = true;
            }
          }

          if (width === 1440) {
            const shot = join(runDir, `route-probe.${label}.${locale}.${width}.png`);
            await page.screenshot({ path: shot, fullPage: false });
            cell.screenshot = shot;
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
  }

  result.interactions = await runInteractions(browser);
  for (const key of Object.keys(result.interactions)) {
    if (result.interactions[key].failReason) hardFail = true;
  }

  await browser.close();

  const outPath = join(runDir, `route-probe.${label}.json`);
  await writeFile(outPath, JSON.stringify(result, null, 2), { encoding: 'utf8', flag: 'wx' });
  console.log(`Wrote ${outPath}`);

  if (hardFail) {
    console.error('\n❌ task775-listings-frame-route-probe: one or more cells failed closed (see failReason above).');
    process.exit(1);
  }
  console.log('\n✅ task775-listings-frame-route-probe: all cells captured cleanly.');
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
