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
 *   0 — No HIGH or CRITICAL findings
 *   1 — HIGH or CRITICAL findings found (blocks CI)
 */

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// Load baseline for regression detection
const BASELINE_PATH = join(__dirname, 'baseline.json');
const baseline = existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) : null;

const scanArg = process.argv[2] ?? 'all';
const generateReport = process.argv.includes('--report');

// ── Import scan modules ────────────────────────────────────────────────────────
const allFindings = [];
let hasCritical = false;
let hasHigh = false;

// Track per-scan counts for baseline comparison
const scanCounts = {};

async function runScan(name, modulePath, scanKey) {
  process.stdout.write(`\nRunning ${name} scan...`);
  const mod = await import(modulePath);
  const findings = mod.findings ?? [];
  allFindings.push(...findings.map(f => ({ ...f, scan: name })));

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  findings.forEach(f => counts[f.severity]++);
  scanCounts[scanKey] = counts;

  // Check against baseline: fail only if count EXCEEDS baseline
  let regressionFound = false;
  if (baseline?.[scanKey]) {
    const base = baseline[scanKey];
    if (counts.CRITICAL > (base.CRITICAL ?? 0)) {
      hasCritical = true;
      regressionFound = true;
    }
    if (counts.HIGH > (base.HIGH ?? 0)) {
      hasHigh = true;
      regressionFound = true;
    }
  } else {
    // No baseline: use absolute counts
    if (counts.CRITICAL > 0) hasCritical = true;
    if (counts.HIGH > 0) hasHigh = true;
    if (counts.CRITICAL > 0 || counts.HIGH > 0) regressionFound = true;
  }

  const status = regressionFound
    ? counts.CRITICAL > (baseline?.[scanKey]?.CRITICAL ?? 0)
      ? `🔴 CRITICAL REGRESSION (+${counts.CRITICAL - (baseline?.[scanKey]?.CRITICAL ?? 0)})`
      : `🟠 HIGH REGRESSION (+${counts.HIGH - (baseline?.[scanKey]?.HIGH ?? 0)})`
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

  lines.push('## Governance Status');
  lines.push(hasCritical ? '❌ **FAIL** — CRITICAL violations found.' : hasHigh ? '⚠️ **ATTENTION** — HIGH violations found.' : '✅ **PASS** — No blocking violations.');
  lines.push('');
  lines.push('*Generated by `npm run governance -- --report`*');

  writeFileSync(reportPath, lines.join('\n'));
  console.log(`\n📄 Report written to: ${reportPath}`);
}

// ── Exit code ─────────────────────────────────────────────────────────────────
// ── Baseline comparison summary ───────────────────────────────────────────────
if (baseline) {
  console.log('\nBaseline comparison:');
  for (const [key, counts] of Object.entries(scanCounts)) {
    const base = baseline[key] ?? { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const critDelta = counts.CRITICAL - (base.CRITICAL ?? 0);
    const highDelta = counts.HIGH - (base.HIGH ?? 0);
    const status = (critDelta > 0 || highDelta > 0)
      ? `❌ REGRESSION (C:${critDelta > 0 ? '+' : ''}${critDelta} H:${highDelta > 0 ? '+' : ''}${highDelta})`
      : `✅ OK`;
    console.log(`  ${key.padEnd(12)} ${status} | current: C${counts.CRITICAL}/H${counts.HIGH}/M${counts.MEDIUM} | baseline: C${base.CRITICAL}/H${base.HIGH}/M${base.MEDIUM}`);
  }
}

// ── Update baseline mode ──────────────────────────────────────────────────────
if (process.argv.includes('--update-baseline')) {
  const newBaseline = {
    _comment: baseline?._comment ?? 'Governance baseline. Update when violations are fixed.',
    _docs: baseline?._docs ?? 'See docs/governance-enforcement.md §9.',
  };
  for (const [key, counts] of Object.entries(scanCounts)) {
    newBaseline[key] = counts;
  }
  writeFileSync(BASELINE_PATH, JSON.stringify(newBaseline, null, 2));
  console.log(`\n📄 Baseline updated: ${BASELINE_PATH}`);
}

// ── Exit code ─────────────────────────────────────────────────────────────────
if (hasCritical || hasHigh) {
  console.log('\n❌ Governance check FAILED — violation count exceeds baseline.');
  console.log('   New HIGH or CRITICAL violations introduced. Fix before merging.');
  console.log('   See docs/governance-enforcement.md §3 for escalation rules.');
  process.exit(1);
} else {
  console.log('\n✅ Governance check PASSED — no regressions above baseline.');
  process.exit(0);
}
