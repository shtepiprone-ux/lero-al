/**
 * Governance runner — executes all governance scans and produces a unified report.
 *
 * Usage:
 *   node scripts/governance/governance.mjs           — run all scans
 *   node scripts/governance/governance.mjs primitives — run only primitive scan
 *   node scripts/governance/governance.mjs ssr        — run only SSR scan
 *   node scripts/governance/governance.mjs responsive — run only responsive scan
 *   node scripts/governance/governance.mjs tailwind   — run only Tailwind scan
 *   node scripts/governance/governance.mjs l10n       — run only localization scan
 *
 * Exit codes:
 *   0 — No HIGH/CRITICAL finding outside the per-finding baseline, and no stale baseline entry
 *   1 — New HIGH/CRITICAL finding, or paid-down debt not yet recorded (blocks CI)
 *   2 — baseline.json is not a version 2 per-finding baseline
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// ── Baseline: REMOVE-ONLY per-finding debt ledger (version 2, 2026-10-07) ─────
// One entry per `"<scan> :: <file> :: <rule pattern>"` key with the HIGH/CRITICAL occurrence count
// in that file. A key absent from the baseline, or a count above it, is a NEW finding and fails the
// gate. A key whose count is now lower or gone is STALE (paid-down debt) and also fails until it is
// recorded with `--update-baseline`, which refuses to write while any new finding exists — so the
// baseline can only shrink. Same convention as scripts/enrolled-tailwind-baseline.json.
//
// Why not per-scan counts (version 1): a count lets a fix in one file pay for a new violation in
// another, and leaves silent headroom (primitives sat 21 below its count, localization 15). See
// docs/governance-enforcement.md §9 "Baseline Policy".
const BASELINE_PATH = join(__dirname, 'baseline.json');
const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) : null;
if (baseline && baseline.version !== 2) {
  console.error(`❌ ${BASELINE_PATH} is not a version 2 per-finding baseline. Count baselines are retired.`);
  process.exit(2);
}
const baselineEntries = baseline?.entries ?? {};

const scanArg = process.argv[2] ?? 'all';
const generateReport = process.argv.includes('--report');
const updateBaseline = process.argv.includes('--update-baseline');

const BLOCKING = new Set(['CRITICAL', 'HIGH']);
const toPosix = p => String(p).replace(/\\/g, '/');
const findingKey = (scanKey, f) => `${scanKey} :: ${toPosix(f.file)} :: ${f.pattern ?? f.message}`;

// ── Import scan modules ────────────────────────────────────────────────────────
const allFindings = [];
let hasCritical = false;
let hasHigh = false;

// Track per-scan counts and per-finding ledgers for baseline comparison
const scanCounts = {};
const currentEntries = {};
const newFindings = [];
const staleEntries = [];

async function runScan(name, modulePath, scanKey) {
  process.stdout.write(`\nRunning ${name} scan...`);
  const mod = await import(modulePath);
  const findings = mod.findings ?? [];
  allFindings.push(...findings.map(f => ({ ...f, scan: name })));

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  findings.forEach(f => counts[f.severity]++);
  scanCounts[scanKey] = counts;

  // Per-finding ledger of this scan's blocking findings
  const ledger = {};
  for (const f of findings.filter(f => BLOCKING.has(f.severity))) {
    const key = findingKey(scanKey, f);
    ledger[key] ??= { count: 0, severity: f.severity, examples: [] };
    ledger[key].count++;
    if (f.severity === 'CRITICAL') ledger[key].severity = 'CRITICAL';
    ledger[key].examples.push(`${toPosix(f.file)}:${f.line}`);
  }
  Object.assign(currentEntries, ledger);

  let scanNew = 0;
  for (const [key, cur] of Object.entries(ledger)) {
    const allowed = baselineEntries[key]?.count ?? 0;
    if (cur.count > allowed) {
      scanNew += cur.count - allowed;
      newFindings.push({ key, ...cur, allowed });
      if (cur.severity === 'CRITICAL') hasCritical = true;
      else hasHigh = true;
    }
  }
  let scanStale = 0;
  for (const [key, base] of Object.entries(baselineEntries)) {
    if (!key.startsWith(`${scanKey} :: `)) continue;
    const now = ledger[key]?.count ?? 0;
    if (now < base.count) {
      scanStale++;
      staleEntries.push({ key, was: base.count, now });
    }
  }

  const status = scanNew > 0
    ? `🟠 REGRESSION (+${scanNew} new HIGH/CRITICAL not in baseline)`
    : scanStale > 0
      ? `🟡 STALE BASELINE (${scanStale} paid-down entr${scanStale === 1 ? 'y' : 'ies'} — run governance:update-baseline)`
      : `✅ PASS (${counts.CRITICAL}C ${counts.HIGH}H ${counts.MEDIUM}M)`;
  console.log(` ${status}`);
}

const scans = {
  primitives: ['Primitive', new URL('./scan-primitives.mjs', import.meta.url).pathname, 'primitives'],
  ssr:        ['SSR/Hydration', new URL('./scan-ssr.mjs', import.meta.url).pathname, 'ssr'],
  responsive: ['Responsive', new URL('./scan-responsive.mjs', import.meta.url).pathname, 'responsive'],
  tailwind:   ['Tailwind Entropy', new URL('./scan-tailwind.mjs', import.meta.url).pathname, 'tailwind'],
  l10n:       ['Localization', new URL('./scan-localization.mjs', import.meta.url).pathname, 'localization'],
};

console.log('╔══════════════════════════════════════════════╗');
console.log('║        LERO.AL GOVERNANCE SCAN               ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`Scan scope: ${scanArg}`);

if (scanArg === 'all') {
  for (const [key, [name, path, scanKey]] of Object.entries(scans)) {
    await runScan(name, path, scanKey);
  }
} else if (scans[scanArg]) {
  const [name, path, scanKey] = scans[scanArg];
  await runScan(name, path, scanKey);
} else {
  console.error(`Unknown scan: ${scanArg}. Valid: all, primitives, ssr, responsive, tailwind, l10n`);
  process.exit(1);
}

// ── Summary ────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════');
console.log('GOVERNANCE SCAN SUMMARY');
console.log('══════════════════════════════════════════════');

const bySeverity = { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [] };
allFindings.forEach(f => bySeverity[f.severity]?.push(f));

console.log(`🔴 CRITICAL: ${bySeverity.CRITICAL.length}`);
console.log(`🟠 HIGH:     ${bySeverity.HIGH.length}`);
console.log(`🟡 MEDIUM:   ${bySeverity.MEDIUM.length}`);
console.log(`⚪ LOW:      ${bySeverity.LOW.length}`);
console.log(`   TOTAL:    ${allFindings.length}`);

if (bySeverity.CRITICAL.length > 0) {
  console.log('\n🔴 CRITICAL VIOLATIONS (must fix immediately):');
  bySeverity.CRITICAL.forEach(f => console.log(`  ${f.file}:${f.line} — ${f.message}`));
}

if (bySeverity.HIGH.length > 0) {
  console.log('\n🟠 HIGH VIOLATIONS (must fix before next release):');
  bySeverity.HIGH.forEach(f => console.log(`  ${f.file}:${f.line} — ${f.message}`));
}

// ── Generate markdown report ───────────────────────────────────────────────────
if (generateReport) {
  const today = new Date().toISOString().split('T')[0];
  const reportDir = join(ROOT, 'docs', 'governance-reports', 'weekly');
  if (!existsSync(reportDir)) mkdirSync(reportDir, { recursive: true });

  const reportPath = join(reportDir, `weekly-${today}.md`);
  const lines = [
    `# Weekly Governance Report — ${today}`,
    '',
    '## Summary',
    `| Severity | Count |`,
    `|---|---|`,
    `| CRITICAL | ${bySeverity.CRITICAL.length} |`,
    `| HIGH | ${bySeverity.HIGH.length} |`,
    `| MEDIUM | ${bySeverity.MEDIUM.length} |`,
    `| LOW | ${bySeverity.LOW.length} |`,
    `| **TOTAL** | **${allFindings.length}** |`,
    '',
  ];

  for (const [severity, items] of Object.entries(bySeverity)) {
    if (items.length > 0) {
      lines.push(`## ${severity} Findings`);
      lines.push('');
      items.forEach(f => lines.push(`- **[${f.scan}]** \`${f.file}:${f.line}\` — ${f.message}`));
      lines.push('');
    }
  }

  if (newFindings.length > 0) {
    lines.push('## New HIGH/CRITICAL findings not in baseline (blocking)');
    lines.push('');
    newFindings.forEach(n => lines.push(`- \`${n.key}\` — ${n.count} now, ${n.allowed} in baseline (${n.examples.join(', ')})`));
    lines.push('');
  }
  if (staleEntries.length > 0) {
    lines.push('## Stale baseline entries (paid-down debt — run `npm run governance:update-baseline`)');
    lines.push('');
    staleEntries.forEach(s => lines.push(`- \`${s.key}\` — ${s.now} now, ${s.was} in baseline`));
    lines.push('');
  }

  lines.push('## Governance Status');
  lines.push(hasCritical ? '❌ **FAIL** — new CRITICAL findings not in baseline.' : hasHigh ? '❌ **FAIL** — new HIGH findings not in baseline.' : staleEntries.length > 0 ? '⚠️ **STALE BASELINE** — paid-down debt must be recorded.' : '✅ **PASS** — No new blocking findings.');
  lines.push('');
  lines.push('*Generated by `npm run governance -- --report`*');

  writeFileSync(reportPath, lines.join('\n'));
  console.log(`\n📄 Report written to: ${reportPath}`);
}

// ── Baseline comparison summary ───────────────────────────────────────────────
console.log('\nBaseline comparison (per finding, remove-only):');
for (const [key, counts] of Object.entries(scanCounts)) {
  const added = newFindings.filter(n => n.key.startsWith(`${key} :: `)).reduce((s, n) => s + n.count - n.allowed, 0);
  const stale = staleEntries.filter(s => s.key.startsWith(`${key} :: `)).length;
  const debt = Object.entries(baselineEntries).filter(([k]) => k.startsWith(`${key} :: `)).reduce((s, [, e]) => s + e.count, 0);
  const status = added > 0 ? `❌ +${added} NEW` : stale > 0 ? `🟡 ${stale} STALE` : '✅ OK';
  console.log(`  ${key.padEnd(12)} ${status} | current: C${counts.CRITICAL}/H${counts.HIGH}/M${counts.MEDIUM} | baselined debt: ${debt}`);
}
if (newFindings.length > 0) {
  console.log('\nNew HIGH/CRITICAL findings not in baseline:');
  newFindings.forEach(n => console.log(`  ${n.key} — ${n.count} now, ${n.allowed} in baseline (${n.examples.join(', ')})`));
}
if (staleEntries.length > 0) {
  console.log('\nStale baseline entries (paid-down debt):');
  staleEntries.forEach(s => console.log(`  ${s.key} — ${s.now} now, ${s.was} in baseline`));
}

// ── Update baseline mode (remove-only) ────────────────────────────────────────
if (updateBaseline) {
  if (scanArg !== 'all') {
    console.error('\n❌ --update-baseline requires the full scan (`all`), so no scan\'s entries are dropped by omission.');
    process.exit(1);
  }
  if (newFindings.length > 0) {
    console.error('\n❌ Baseline NOT updated — it is remove-only and new findings exist. Fix them; never baseline them.');
    process.exit(1);
  }
  const entries = {};
  for (const key of Object.keys(currentEntries).sort()) {
    entries[key] = { count: currentEntries[key].count, severity: currentEntries[key].severity };
  }
  writeFileSync(BASELINE_PATH, JSON.stringify({
    version: 2,
    _comment: baseline?._comment ?? 'Governance baseline. Remove-only per-finding debt ledger.',
    _docs: baseline?._docs ?? 'See docs/governance-enforcement.md §9 "Baseline Policy".',
    entries,
  }, null, 2) + '\n');
  console.log(`\n📄 Baseline updated (remove-only): ${staleEntries.length} paid-down entr${staleEntries.length === 1 ? 'y' : 'ies'} recorded.`);
  process.exit(0);
}

// ── Exit code ─────────────────────────────────────────────────────────────────
if (hasCritical || hasHigh) {
  console.log('\n❌ Governance check FAILED — new HIGH/CRITICAL findings not in the baseline.');
  console.log('   Fix them before pushing. A scanner false positive is a scanner defect: fix the scanner,');
  console.log('   never the baseline. See docs/governance-enforcement.md §3.');
  process.exit(1);
} else if (staleEntries.length > 0) {
  console.log('\n❌ Governance check FAILED — stale baseline: debt was paid down but not recorded.');
  console.log('   Run `npm run governance:update-baseline` and commit scripts/governance/baseline.json.');
  process.exit(1);
} else {
  console.log('\n✅ Governance check PASSED — no new findings, baseline current.');
  process.exit(0);
}
