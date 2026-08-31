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
 *   node scripts/task775-listings-frame-route-probe.mjs <label>
 * <label> is 'pre-edit' or 'post-edit'; output is written per-label (never overwritten) to
 * docs/sessions/evidence/task775/route-probe.<label>.json (+ one PNG per locale/width cell).
 *
 * Contract (kickoff §10.10):
 *   - Reads BASE_URL from the environment, defaulting to http://127.0.0.1:3000.
 *   - For /en/listings and /uk/listings, at every Q3 canonical width (320/375/390/480/560/680/
 *     768/810/960/1024/1200/1440/1920/2560), records:
 *       - documentElement.scrollWidth vs clientWidth (overflow check)
 *       - computed max-width/padding-left/padding-right of the breadcrumb gutter and the content
 *         gutter
 *       - computed background-color of the page and of the breadcrumb band, and the band's
 *         border-bottom
 *       - the breadcrumb row's computed font-size, color (link + current), and gap (separator
 *         margin-inline)
 *       - the <nav> accessible name (aria-label) and its item texts
 *   - At 1440 only, additionally records the header and footer `.container-wide` computed
 *     padding-left/right for the §3.3b alignment finding (content 3rem vs chrome 2rem, AC3).
 *   - Fails closed: non-OK response, missing selector, or a <nextjs-portal> element (a `next dev`
 *     server was used by mistake) writes what it measured and exits non-zero.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task775');
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';

const Q3_WIDTHS = [320, 375, 390, 480, 560, 680, 768, 810, 960, 1024, 1200, 1440, 1920, 2560];
const LOCALES = ['en', 'uk'];

const label = process.argv[2];
if (!label) {
  console.error('Usage: node scripts/task775-listings-frame-route-probe.mjs <label>');
  process.exit(2);
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
    const separator = spans.find((s) => s !== current);
    if (separator) {
      breadcrumbGap = getComputedStyle(separator).marginInline || getComputedStyle(separator).marginLeft;
    }
  }

  return {
    devServerDetected,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
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
    breadcrumbGap,
    headerGutterPadding: headerGutter ? rectPad(headerGutter) : null,
    footerGutterPadding: footerGutter ? rectPad(footerGutter) : null,
    mainFound: !!main,
    navFound: !!nav,
  };
}

async function main() {
  await mkdir(EVIDENCE_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const result = {
    label,
    baseUrl: BASE_URL,
    capturedAt: new Date().toISOString(),
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
          if (measured.devServerDetected) {
            cell.failReason = 'nextjs-portal present — next dev server detected, refusing to treat as production evidence';
            hardFail = true;
          } else if (!measured.navFound) {
            cell.failReason = 'nav[aria-label] not found';
            hardFail = true;
          }
          if (width === 1440) {
            const shot = join(EVIDENCE_DIR, `route-probe.${label}.${locale}.${width}.png`);
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

  await browser.close();

  const outPath = join(EVIDENCE_DIR, `route-probe.${label}.json`);
  await writeFile(outPath, JSON.stringify(result, null, 2), 'utf8');
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
