#!/usr/bin/env node
/**
 * check-rendered-state-census.mjs — the rendered state census gate (Task 923).
 *
 * Executable form of `.claude/rules/shared/rendered-state-census.md` (owner decision 2026-10-10): every interaction
 * state that opens a portal is registered in `scripts/rendered-interaction-states.json`, opened on the BUILT
 * Storybook through its registered action (never by editing a Story), and measured with the app root and each
 * `[data-portal="true"]` root as separate targets. Evidence is one JSONL row per Story x state x root x locale x
 * viewport, plus a summary.
 *
 *   node scripts/check-rendered-state-census.mjs [--out <dir>] [--stories <id,id>] [--widths 320,390]
 *                                                [--locales en,uk] [--jobs <n>] [--no-closed]
 *       Open every registered state (or the narrowed set), measure, write rows.jsonl + summary.*. Exit 1 on any
 *       violation, open failure, unregistered portal or render error.
 *   node scripts/check-rendered-state-census.mjs --discover
 *       Registry completeness against the build: (a) Stories showing a portal on mount with no `mount` row,
 *       (b) Stories importing an overlay component with no row, (c) every candidate trigger of every in-scope Story,
 *       clicked at 390, 1440 and each `widths` bound of the Story's rows, that opens a portal and is not the trigger
 *       of an in-range row. Exit 1 unless all three lists are empty.
 *   node scripts/check-rendered-state-census.mjs --verify-gate
 *       Self-test on fixture pages (no Storybook build): clean pages and benign twins pass, every planted violation fails,
 *       a transient open failure passes with its retry recorded.
 *
 * A `widths` state is measured at its in-range bound; at the first width outside its range and at every requested width
 * outside it, the same-named trigger must not open a portal (`widths-mismatch`). `--widths` narrows a run to the given
 * widths (the in-range bound and first out-of-range width cells are added only to a run without `--widths`).
 *
 * A job whose page fails to load with a navigation error, whose render does not finish in time, or whose open action times
 * out, is run once more on a fresh page and its rows carry `retry` (R16, R20); a second failure is the violation, a render
 * that ends errored is never retried, and a measured rule is never retried.
 *
 * Build first: `npm run build-storybook`. No baseline, allowlist or inline suppression exists: a Story x state
 * that must differ needs a dated owner decision named in its registry row (`ownerDecision`).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appliesAtWidth, rangeEdges, validateRegistry } from './rendered-state-census/registry.mjs';
import {
  CLOSED_LOCALE, CLOSED_WIDTH, DEFAULT_LOCALES, DEFAULT_WIDTHS, RULE_KEYS,
  formatSummary, newMeasuringPage, runClosedJob, runPool, runRangeJob, runStateJob, startStaticServer, storybookContext, summarize,
} from './rendered-state-census/runner.mjs';
import { loadBreakpoints } from './rendered-state-census/theme-breakpoints.mjs';
import { discover, inScopeStories } from './rendered-state-census/discover.mjs';
import { verifyGate } from './rendered-state-census/verify.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY_PATH = join(ROOT, 'scripts', 'rendered-interaction-states.json');
const PATTERNS_PATH = join(ROOT, 'scripts', 'mobile-adaptation-patterns.json');
const FIXTURE_DIR = join(ROOT, 'scripts', '__fixtures__', 'rendered-state-census');
const STATIC_DIR = join(ROOT, 'storybook-static');

function parseArgs(argv) {
  const opts = { mode: 'run', closed: true, stories: null, widths: DEFAULT_WIDTHS, widthsGiven: false, locales: DEFAULT_LOCALES, out: null, jobs: null, port: Number(process.env.CENSUS_PORT ?? 6043) };
  const value = (i, flag) => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new Error(`${flag} needs a value`);
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--discover') opts.mode = 'discover';
    else if (a === '--verify-gate') opts.mode = 'verify';
    else if (a === '--no-closed') opts.closed = false;
    else if (a === '--stories') { opts.stories = value(i, a).split(',').map((s) => s.trim()).filter(Boolean); i++; }
    else if (a === '--widths') { opts.widths = value(i, a).split(',').map(Number); opts.widthsGiven = true; i++; }
    else if (a === '--locales') { opts.locales = value(i, a).split(',').map((s) => s.trim()); i++; }
    else if (a === '--out') { opts.out = resolve(value(i, a)); i++; }
    else if (a === '--jobs') { opts.jobs = Number(value(i, a)); i++; }
    else if (a === '--port') { opts.port = Number(value(i, a)); i++; }
    else throw new Error(`unknown argument "${a}"`);
  }
  if (opts.widths.some((w) => !Number.isInteger(w) || w < 200)) throw new Error('--widths must be integers >= 200');
  if (opts.locales.some((l) => !/^[a-z]{2}$/.test(l))) throw new Error('--locales must be two-letter codes');
  return opts;
}

function loadIndex() {
  if (!existsSync(STATIC_DIR) || !existsSync(join(STATIC_DIR, 'index.json'))) {
    console.error(`storybook-static/index.json not found at ${STATIC_DIR}. Build first: npm run build-storybook`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(join(STATIC_DIR, 'index.json'), 'utf8'));
}

function loadRegistry(index) {
  let registry;
  try {
    registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  } catch (e) {
    console.error(`cannot read ${REGISTRY_PATH}: ${e.message}`);
    process.exit(1);
  }
  const check = validateRegistry(registry, { index: index?.entries, breakpoints: loadBreakpoints(ROOT).list });
  if (!check.ok) {
    console.error(`scripts/rendered-interaction-states.json is invalid (${check.errors.length}):`);
    for (const e of check.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  return registry;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { chromium } = await import('playwright');
  const log = (m) => console.log(m);

  if (opts.mode === 'verify') {
    const server = await startStaticServer(FIXTURE_DIR, opts.port);
    const browser = await chromium.launch();
    try {
      const ok = await verifyGate({ fixtureDir: FIXTURE_DIR, baseUrl: `http://127.0.0.1:${opts.port}`, newPage: () => newMeasuringPage(browser), breakpoints: loadBreakpoints(ROOT).list, log });
      process.exitCode = ok ? 0 : 1;
    } finally {
      await browser.close();
      await new Promise((r) => server.close(r));
    }
    return;
  }

  const index = loadIndex();
  const registry = loadRegistry(index);
  const server = await startStaticServer(STATIC_DIR, opts.port);
  const browser = await chromium.launch();
  const ctx = storybookContext(`http://127.0.0.1:${opts.port}`);
  const started = Date.now();
  try {
    if (opts.mode === 'discover') {
      const patternRegistry = JSON.parse(readFileSync(PATTERNS_PATH, 'utf8'));
      const r = await discover({ root: ROOT, index, registry, patternRegistry, ctx, browser, concurrency: opts.jobs ?? Math.max(2, Math.min(6, cpus().length - 1)), log });
      process.exitCode = r.unregisteredMount.length || r.unregisteredImport.length || r.unregisteredTriggers.length ? 1 : 0; // a Story that fails to render is the full run's error-screen violation
      log(`discovery runtime ${Math.round((Date.now() - started) / 1000)}s`);
      if (opts.out) {
        mkdirSync(opts.out, { recursive: true });
        writeFileSync(join(opts.out, 'discover.json'), JSON.stringify({ unregisteredMount: r.unregisteredMount, unregisteredImport: r.unregisteredImport, unregisteredTriggers: r.unregisteredTriggers, importOpensNothing: r.importOpensNothing, failed: r.failed, misses: r.missDetails, candidates: { found: r.found, clicked: r.clicks, notOperable: r.notOperable.length }, notOperable: r.notOperable }, null, 2) + '\n');
      }
      return;
    }

    const wanted = opts.stories ? new Set(opts.stories) : null;
    if (wanted) {
      const known = new Set(Object.keys(index.entries));
      const unknown = [...wanted].filter((id) => !known.has(id));
      if (unknown.length) throw new Error(`--stories names a Story absent from the build: ${unknown.join(', ')}`);
    }
    const states = registry.states.filter((s) => !wanted || wanted.has(s.story));
    const jobs = [];
    let stateJobCount = 0;
    let rangeJobCount = 0;
    let boundCells = 0;
    if (opts.closed) {
      const stories = inScopeStories(index).filter((s) => !wanted || wanted.has(s.id));
      for (const s of stories) {
        const hasMountRow = registry.states.some((st) => st.story === s.id && st.open.kind === 'mount');
        jobs.push({ target: { story: s.id, state: 'closed', locale: CLOSED_LOCALE, width: CLOSED_WIDTH }, run: (page) => runClosedJob(page, ctx, s.id, hasMountRow) });
      }
    }
    for (const state of states) {
      // the requested widths, plus (full run only) the in-range bound and the first width outside the range
      const edges = rangeEdges(state);
      const widths = new Set(opts.widths);
      if (!opts.widthsGiven) {
        for (const w of [...edges.inRange, ...edges.outside]) {
          if (!widths.has(w)) boundCells += opts.locales.length;
          widths.add(w);
        }
      }
      const siblings = registry.states.filter((o) => o.story === state.story && o.id !== state.id);
      const inRangeWidth = state.widths ? (state.widths.min ?? state.widths.max) : null;
      for (const locale of opts.locales) {
        for (const width of [...widths].sort((a, b) => a - b)) {
          const target = { story: state.story, state: state.id, locale, width };
          if (appliesAtWidth(state, width)) {
            stateJobCount++;
            jobs.push({ target, run: (page) => runStateJob(page, ctx, state, locale, width) });
          } else {
            rangeJobCount++;
            jobs.push({ target, run: (page) => runRangeJob(page, ctx, state, locale, width, { inRangeWidth, siblings }) });
          }
        }
      }
    }
    const outDir = opts.out ?? join(tmpdir(), 'rendered-state-census');
    mkdirSync(outDir, { recursive: true });
    const concurrency = opts.jobs ?? Math.max(2, Math.min(6, cpus().length - 1));
    const closedJobCount = jobs.length - stateJobCount - rangeJobCount;
    log(`rendered state census: ${states.length} registered state(s), ${stateJobCount} state job(s) + ${rangeJobCount} out-of-range widths job(s) (no cell is skipped; ${boundCells} cell(s) are the added in-range bound / first out-of-range widths) + ${closedJobCount} closed job(s); ${concurrency} worker(s); out ${outDir}`);

    const rows = [];
    let done = 0;
    await runPool(browser, jobs, concurrency, (r) => {
      rows.push(...r);
      if (++done % 100 === 0) log(`  ${done}/${jobs.length} jobs, ${rows.length} rows, ${rows.filter((x) => !x.pass).length} failing`);
    });
    rows.sort((a, b) => `${a.story}|${a.state}|${a.root}|${a.locale}|${String(a.width).padStart(5, '0')}`.localeCompare(`${b.story}|${b.state}|${b.root}|${b.locale}|${String(b.width).padStart(5, '0')}`));
    const seconds = Math.round((Date.now() - started) / 1000);
    const portalRows = rows.filter((r) => r.root !== 'app').length;
    const summary = summarize(rows, {
      statesRun: states.length, locales: opts.locales, widths: opts.widths, boundCells, stateJobs: stateJobCount, rangeJobs: rangeJobCount,
      closedJobs: closedJobCount, appRows: rows.length - portalRows, portalRows, runtimeSeconds: seconds,
      ruleKeys: RULE_KEYS.length,
    }, states);
    writeFileSync(join(outDir, 'rows.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
    writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
    const text = formatSummary(summary);
    writeFileSync(join(outDir, 'summary.txt'), text + '\n');
    log('\n' + text);
    log(`\nrows ${rows.length} = ${summary.meta.appRows} app-root rows + ${portalRows} portal-root rows; ${summary.meta.stateJobs} state jobs + ${summary.meta.rangeJobs} out-of-range widths jobs + ${summary.meta.closedJobs} closed jobs; ${summary.retries.length} retried job(s); runtime ${seconds}s`);
    process.exitCode = rows.length === 0 || summary.failing > 0 ? 1 : 0;
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
