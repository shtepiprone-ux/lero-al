#!/usr/bin/env node
/**
 * task809-favorites-regression-sweep.mjs — Task 809 Revision 3/4 (owner's own regression-gate
 * specification, kickoff §51/§63) — the sweep the owner required in place of a three-screenshot
 * proof: "rg, Mantine imports, or mantine-Button-root are not evidence of completion."
 *
 * Extends `scripts/task810-rail-controls-probe.mjs`'s conventions (playwright chromium,
 * execFileSync with no shell for hashes, one immutable run directory per invocation via
 * writeFile(..., { flag: 'wx' }), exit 1 on hard fail, 2 on usage error, every assertion carries a
 * diagnosable message).
 *
 * PRECONDITION: `npm run build-storybook` has produced a current `storybook-static/`, served at
 * SB_URL (default http://localhost:6789 — start your own static server, e.g.
 * `python -m http.server 6789` from `storybook-static/`, or `npx http-server storybook-static -p 6789`).
 * This sweep runs against Storybook, not a live authenticated `/favorites` route — no seeded
 * signed-in Supabase session with real favorites/collections data was available in this session.
 * That substitution is stated here, not hidden: every assertion below is real and runs against the
 * real production components (the Stories statically import them, clause 16c), but a route-level
 * regression outside what a Story fixture reproduces (e.g. server-rendered data shape) is out of
 * this sweep's reach.
 *
 * Task 809 Revision 5 (R39) — locale is now a parameter, not the `&globals=locale:en` literal every
 * retained rev4 finding carried. `SWEEP_LOCALES` (comma-separated, default `en`) selects which
 * locales run; `SWEEP_WIDTHS` (`all` default | `boundary` | `dense`) selects the width set — a
 * multi-locale run defaults callers to `boundary` explicitly (21 widths) rather than the full
 * dense+extra sweep, per AC37's own "at least the 21-width boundary matrix" wording: 4 locales × the
 * full 80-width set would multiply this sweep's already-long single-locale runtime 4x for a
 * dimension (locale) that does not interact with the dense-sweep's own justification (catching a
 * one-breakpoint-wide layout break), which is unaffected by locale.
 *
 * Usage:
 *   SB_URL=http://localhost:6789 SWEEP_LOCALES=en,sq,uk,it SWEEP_WIDTHS=boundary \
 *     node scripts/task809-favorites-regression-sweep.mjs <runId>
 * Output:
 *   docs/sessions/evidence/task809/rev4-sweep/<runId>/sweep-result.json
 *   docs/sessions/evidence/task809/rev4-sweep/<runId>/sweep-summary.txt
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EVIDENCE_DIR = join(ROOT, 'docs/sessions/evidence/task809/rev4-sweep');
const SB_URL = process.env.SB_URL ?? 'http://localhost:6789';

// Owner's named breakpoints (§51.1) — boundary matrix at -1/exact/+1.
const NAMED_BREAKPOINTS = [320, 480, 640, 768, 1024, 1280, 1440];
const BOUNDARY_WIDTHS = NAMED_BREAKPOINTS.flatMap((w) => [w - 1, w, w + 1]);

// Dense sweep (§51.2) — 320 to 1920. Step chosen at 40px: half the narrowest gap between two
// adjacent named breakpoints that is NOT already covered by the boundary matrix (640->768 is the
// tightest non-trivial gap at 128px; 40px gives >3 samples inside every such gap, dense enough to
// catch a one-breakpoint-wide layout break without literally testing all ~1600 individual pixels,
// which would multiply this sweep's runtime by ~40x for no additional real coverage — CSS layout
// at this scale changes at discrete breakpoints, not per-pixel, so a sub-breakpoint-gap sample
// density is the actual dense-enough criterion, not the raw pixel count). 2560 is a discrete extra
// check (post-xxl fluid range), not part of the arithmetic sweep.
const DENSE_STEP = 40;
const DENSE_WIDTHS = [];
for (let w = 320; w <= 1920; w += DENSE_STEP) DENSE_WIDTHS.push(w);
const EXTRA_WIDTHS = [2560];

const WIDTHS_MODE = process.env.SWEEP_WIDTHS ?? 'all';
const ALL_WIDTHS =
  WIDTHS_MODE === 'boundary'
    ? [...new Set(BOUNDARY_WIDTHS)].sort((a, b) => a - b)
    : WIDTHS_MODE === 'dense'
      ? [...new Set(DENSE_WIDTHS)].sort((a, b) => a - b)
      : [...new Set([...BOUNDARY_WIDTHS, ...DENSE_WIDTHS, ...EXTRA_WIDTHS])].sort((a, b) => a - b);

const LOCALES = (process.env.SWEEP_LOCALES ?? 'en')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// The four Favorites states + the pattern's own canonical Story (label-centring assertion also
// required there per R35/AC32 — re-run here as part of the full sweep, not only the isolated Story).
// `hrefPath` (not a full href) — R39: the expected href is locale-prefixed per sweep run, not the
// `/en/...` literal baked into rev4.
const CTA_STATES = [
  {
    id: 'mantine-primitives-favoritesshell--error',
    name: 'error',
    expectedVariant: 'outline',
    hrefPath: 'favorites',
  },
  {
    id: 'mantine-primitives-favoritesshell--empty',
    name: 'true-empty',
    expectedVariant: 'filled',
    hrefPath: 'listings',
  },
  {
    id: 'mantine-primitives-favoritesshell--type-filter-no-matches',
    name: 'filtered-empty',
    expectedVariant: 'outline',
    hrefPath: 'favorites',
  },
];
const POPULATED_STATE = { id: 'mantine-primitives-favoritesshell--populated', name: 'populated' };

const [, , runId] = process.argv;
if (!runId || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(runId)) {
  console.error('Usage: SB_URL=<server> node scripts/task809-favorites-regression-sweep.mjs <runId>');
  process.exit(2);
}

function computeHash(path) {
  return execFileSync('git', ['hash-object', path], { cwd: ROOT, encoding: 'utf8' }).trim();
}

function computeGitCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'UNKNOWN';
  }
}

async function assertCentredLabels(page, findings, ctx) {
  const rects = await page.evaluate(() => {
    const roots = [...document.querySelectorAll('.mantine-Button-root')];
    return roots.map((root) => {
      const label = root.querySelector('.mantine-Button-label');
      const r = root.getBoundingClientRect();
      const l = label ? label.getBoundingClientRect() : null;
      return {
        text: root.textContent?.trim().slice(0, 40) ?? '',
        rootTop: r.top, rootBottom: r.bottom, rootHeight: r.height, rootWidth: r.width, rootLeft: r.left,
        labelTop: l?.top ?? null, labelBottom: l?.bottom ?? null,
        href: root.tagName === 'A' ? root.getAttribute('href') : null,
      };
    });
  });
  for (const r of rects) {
    if (r.rootHeight < 44) {
      findings.push({ ...ctx, kind: 'min-height', ok: false, detail: `${r.text}: height=${r.rootHeight} < 44` });
    } else {
      findings.push({ ...ctx, kind: 'min-height', ok: true, detail: `${r.text}: height=${r.rootHeight}` });
    }
    if (r.labelTop !== null) {
      const rootCentre = (r.rootTop + r.rootBottom) / 2;
      const labelCentre = (r.labelTop + r.labelBottom) / 2;
      const delta = Math.abs(rootCentre - labelCentre);
      if (delta > 1) {
        findings.push({ ...ctx, kind: 'label-centring', ok: false, detail: `${r.text}: delta=${delta.toFixed(2)}px rootCentre=${rootCentre} labelCentre=${labelCentre}` });
      } else {
        findings.push({ ...ctx, kind: 'label-centring', ok: true, detail: `${r.text}: delta=${delta.toFixed(2)}px` });
      }
    }
  }
  return rects;
}

async function assertNoOverflow(page, findings, ctx) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  const ok = overflow.scrollWidth <= overflow.clientWidth + 1; // +1px rounding tolerance
  findings.push({ ...ctx, kind: 'no-overflow', ok, detail: `scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}` });
}

// Width-policy and href apply to the ONE named CTA `<a href>` for this state (R32's table), not to
// every Button on the page (e.g. CollectionsSection's "New collection" — a sibling control in the
// filtered-empty state's DOM tree — is never full-width and carries no href; asserting the policy
// against it is a false positive, not a product defect).
async function findCta(page, expectedHref) {
  return page.evaluate((href) => {
    const anchors = [...document.querySelectorAll('a.mantine-Button-root')];
    const match = anchors.find((a) => a.getAttribute('href') === href);
    if (!match) return null;
    const r = match.getBoundingClientRect();
    const parent = match.parentElement?.getBoundingClientRect();
    const cs = getComputedStyle(match);
    return {
      text: match.textContent?.trim().slice(0, 30) ?? '',
      w: r.width, parentW: parent?.width ?? null, href: match.getAttribute('href'),
      backgroundColor: cs.backgroundColor, borderRadius: cs.borderRadius,
    };
  }, expectedHref);
}

async function assertCtaWidthPolicyAndHref(page, findings, ctx, width, expectedHref, expectedVariant) {
  const cta = await findCta(page, expectedHref);
  if (!cta) {
    findings.push({ ...ctx, kind: 'href', ok: false, detail: `no <a href="${expectedHref}"> found among Button roots` });
    return;
  }
  findings.push({ ...ctx, kind: 'href', ok: true, detail: `href=${cta.href}` });
  // 'filled' -> a real background color; 'outline' -> transparent background (rgba(0,0,0,0)).
  const isFilled = cta.backgroundColor !== 'rgba(0, 0, 0, 0)';
  const variantOk = expectedVariant === 'filled' ? isFilled : !isFilled;
  findings.push({ ...ctx, kind: 'variant', ok: variantOk, detail: `${cta.text}: bg=${cta.backgroundColor} radius=${cta.borderRadius} expected=${expectedVariant}` });
  if (width < 640) {
    const ok = cta.parentW !== null && Math.abs(cta.w - cta.parentW) <= 2;
    findings.push({ ...ctx, kind: 'width-policy', ok, detail: `${cta.text} @<640: width=${cta.w} parentWidth=${cta.parentW}` });
  }
}

async function assertBadgeIconNoOverlap(page, findings, ctx) {
  const cards = await page.evaluate(() => {
    const results = [];
    const badges = [...document.querySelectorAll('.mantine-Badge-label')];
    for (const badge of badges) {
      const card = badge.closest('a, [class*="card"]');
      if (!card) continue;
      const icon = card.querySelector('button[aria-label]');
      if (!icon) continue;
      const b = badge.getBoundingClientRect();
      const i = icon.getBoundingClientRect();
      results.push({ badge: { top: b.top, left: b.left, right: b.right, bottom: b.bottom }, icon: { top: i.top, left: i.left, right: i.right, bottom: i.bottom } });
    }
    return results;
  });
  for (const c of cards) {
    const intersects = !(c.badge.right <= c.icon.left || c.badge.left >= c.icon.right || c.badge.bottom <= c.icon.top || c.badge.top >= c.icon.bottom);
    findings.push({ ...ctx, kind: 'badge-icon-overlap', ok: !intersects, detail: JSON.stringify(c) });
  }
}

async function run() {
  const runDir = join(EVIDENCE_DIR, runId);
  await mkdir(runDir, { recursive: true });

  const browser = await chromium.launch();
  const findings = [];
  let hardFail = false;

  for (const locale of LOCALES) {
    for (const width of ALL_WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.on('pageerror', (e) => findings.push({ locale, width, story: 'ALL', kind: 'page-error', ok: false, detail: e.message }));

      for (const state of CTA_STATES) {
        const ctx = { locale, width, story: state.name };
        const url = `${SB_URL}/iframe.html?id=${state.id}&viewMode=story&globals=locale:${locale}`;
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForTimeout(300);
        } catch (e) {
          findings.push({ ...ctx, kind: 'navigation', ok: false, detail: String(e) });
          continue;
        }
        await assertCentredLabels(page, findings, ctx);
        await assertNoOverflow(page, findings, ctx);
        await assertCtaWidthPolicyAndHref(page, findings, ctx, width, `/${locale}/${state.hrefPath}`, state.expectedVariant);
      }

      // Populated state — badge/icon overlap + no-overflow only (no single CTA button here).
      {
        const ctx = { locale, width, story: POPULATED_STATE.name };
        const url = `${SB_URL}/iframe.html?id=${POPULATED_STATE.id}&viewMode=story&globals=locale:${locale}`;
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForTimeout(300);
          // Reveal imageActions via hover on the first card thumbnail.
          const thumb = await page.$('img');
          if (thumb) {
            const box = await thumb.boundingBox();
            if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 3);
            await page.waitForTimeout(200);
          }
          await assertNoOverflow(page, findings, ctx);
          await assertBadgeIconNoOverlap(page, findings, ctx);
        } catch (e) {
          findings.push({ ...ctx, kind: 'navigation', ok: false, detail: String(e) });
        }
      }

      await page.close();
    }
  }

  await browser.close();

  const failing = findings.filter((f) => !f.ok);
  if (failing.length > 0) hardFail = true;

  const failingByLocale = Object.fromEntries(
    LOCALES.map((locale) => [locale, failing.filter((f) => f.locale === locale).length]),
  );

  const result = {
    runId,
    probeHash: computeHash('scripts/task809-favorites-regression-sweep.mjs'),
    gitCommit: computeGitCommit(),
    timestamp: new Date().toISOString(),
    locales: LOCALES,
    widthsMode: WIDTHS_MODE,
    widthsSampled: ALL_WIDTHS.length,
    denseStep: DENSE_STEP,
    totalFindings: findings.length,
    failingCount: failing.length,
    failingByLocale,
    failing,
    findings,
  };

  await writeFile(join(runDir, 'sweep-result.json'), JSON.stringify(result, null, 2), { flag: 'wx' });

  const summaryLines = [
    `Task 809 regression sweep — run ${runId}`,
    `Locales: ${LOCALES.join(', ')}`,
    `Widths sampled: ${ALL_WIDTHS.length} (mode=${WIDTHS_MODE}; boundary: ${BOUNDARY_WIDTHS.length}, dense step ${DENSE_STEP}px: ${DENSE_WIDTHS.length}, extra: ${EXTRA_WIDTHS.join(',')})`,
    `Total assertions: ${findings.length}`,
    `Failing: ${failing.length}`,
    `Failing by locale: ${LOCALES.map((l) => `${l}=${failingByLocale[l]}`).join(', ')}`,
    '',
    ...failing.map((f) => `FAIL  locale=${f.locale} width=${f.width} story=${f.story} kind=${f.kind}: ${f.detail}`),
  ];
  await writeFile(join(runDir, 'sweep-summary.txt'), summaryLines.join('\n') + '\n', { flag: 'wx' });

  console.log(summaryLines.join('\n'));
  process.exit(hardFail ? 1 : 0);
}

run().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
