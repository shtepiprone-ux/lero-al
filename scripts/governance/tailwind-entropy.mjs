/**
 * Tailwind Utility Entropy Detector — Phase 3 of Future Maintenance Direction Epic
 *
 * Detects 7 categories of Tailwind entropy:
 *   1. Duplicated utility chains
 *   2. Arbitrary value usage
 *   3. Responsive utility drift
 *   4. Local style fragment clones
 *   5. Overflow / truncation risks
 *   6. Huge desktop risks
 *   7. Icon / control density risks
 *
 * Usage:
 *   node scripts/governance/tailwind-entropy.mjs             — scan + console
 *   node scripts/governance/tailwind-entropy.mjs --report    — scan + JSON + Markdown
 *   node scripts/governance/tailwind-entropy.mjs --json      — JSON output only
 */

import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const REPORTS_DIR = join(ROOT, 'docs', 'governance-reports', 'monthly');
const JSON_REPORTS_DIR = join(__dirname, 'reports');

const ARG_REPORT = process.argv.includes('--report');
const ARG_JSON = process.argv.includes('--json');

// ── Load allowlist ─────────────────────────────────────────────────────────────
const ALLOWLIST_PATH = join(__dirname, 'tailwind-entropy.allowlist.json');
const allowlist = existsSync(ALLOWLIST_PATH) ? JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf-8')) : { entries: [] };
const allowedKeys = new Set(allowlist.entries.map(e => `${e.file}:${e.pattern}`));

function isAllowed(file, pattern) {
  return allowedKeys.has(`${file}:${pattern}`);
}

// ── File walker ────────────────────────────────────────────────────────────────
function* walkFiles(dir, exts = ['.tsx', '.ts']) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.next', 'out', 'build'].includes(entry.name)) {
      yield* walkFiles(full, exts);
    } else if (entry.isFile() && exts.some(e => entry.name.endsWith(e))) {
      yield full;
    }
  }
}

// ── Class name extractor ───────────────────────────────────────────────────────
function extractClassStrings(content) {
  const results = [];

  // className="..." or className='...'
  const staticRe = /className=["']([^"']+)["']/g;
  let m;
  while ((m = staticRe.exec(content)) !== null) {
    results.push({ value: m[1], type: 'static', dynamic: false });
  }

  // className={`...`} — template literals (mark dynamic parts)
  const templateRe = /className=\{`([^`]+)`\}/g;
  while ((m = templateRe.exec(content)) !== null) {
    const hasDynamic = /\$\{/.test(m[1]);
    results.push({ value: m[1].replace(/\$\{[^}]*\}/g, '__DYNAMIC__'), type: 'template', dynamic: hasDynamic });
  }

  // cn(...), clsx(...) — first string arg only (static part)
  const cnRe = /(?:cn|clsx)\(["']([^"']+)["']/g;
  while ((m = cnRe.exec(content)) !== null) {
    results.push({ value: m[1], type: 'cn', dynamic: false });
  }

  // cva("...") base
  const cvaRe = /cva\(["']([^"']+)["']/g;
  while ((m = cvaRe.exec(content)) !== null) {
    results.push({ value: m[1], type: 'cva', dynamic: false });
  }

  return results;
}

// Tokenise a class string into individual Tailwind utilities
function tokenize(classStr) {
  return classStr
    .replace(/__DYNAMIC__/g, '')
    .split(/\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('//'));
}

// ── Category 1: Duplicated utility chains ─────────────────────────────────────
const KNOWN_DUPLICATE_PATTERNS = [
  {
    id: 'card-pattern-2xl',
    pattern: 'bg-card rounded-2xl border shadow-sm',
    desc: 'Admin/content card wrapper',
    severity: 'MEDIUM',
    canonical: 'Extract to <Card> component or css utility `.card-content` (migration complexity: LOW)',
  },
  {
    id: 'card-pattern-xl',
    pattern: 'bg-card rounded-xl border',
    desc: 'Listing card wrapper',
    severity: 'MEDIUM',
    canonical: 'ListingCard internal — acceptable if consistent',
  },
  {
    id: 'section-standard-padding',
    pattern: 'py-12 md:py-16',
    desc: 'Standard section spacing',
    severity: 'LOW',
    canonical: 'Acceptable canonical pattern — consider CSS utility class `.section-standard`',
  },
  {
    id: 'group-label',
    pattern: 'text-xs font-semibold uppercase tracking-widest text-muted-foreground',
    desc: 'Sidebar/filter group label',
    severity: 'LOW',
    canonical: 'Consider `.group-label` utility in globals.css',
  },
  {
    id: 'container-public',
    pattern: 'container mx-auto px-4',
    desc: 'Standard container on public pages',
    severity: 'MEDIUM',
    canonical: 'Replace with .container-wide on public pages (docs/ui-rules.md §6)',
  },
  {
    id: 'flex-toolbar',
    pattern: 'flex items-center gap-2',
    desc: 'Standard toolbar/header row',
    severity: 'LOW',
    canonical: 'Common pattern — acceptable at this frequency',
  },
  {
    id: 'flex-toolbar-between',
    pattern: 'flex items-center justify-between',
    desc: 'Spaced toolbar row',
    severity: 'LOW',
    canonical: 'Common pattern — acceptable at this frequency',
  },
];

function detectDuplicateChains(allFileData) {
  const findings = [];
  for (const pat of KNOWN_DUPLICATE_PATTERNS) {
    const matches = [];
    for (const { file, classStrings } of allFileData) {
      for (const cs of classStrings) {
        if (cs.value.includes(pat.pattern)) {
          matches.push(file);
        }
      }
    }
    const uniqueFiles = [...new Set(matches)];
    if (uniqueFiles.length >= 2) {
      findings.push({
        category: 'DUPLICATE_CHAIN',
        id: pat.id,
        pattern: pat.pattern,
        description: pat.desc,
        occurrences: matches.length,
        files: uniqueFiles,
        severity: uniqueFiles.length >= 5 ? (pat.severity === 'LOW' ? 'MEDIUM' : pat.severity) : pat.severity,
        canonical: pat.canonical,
      });
    }
  }
  return findings;
}

// ── Category 2: Arbitrary value usage ────────────────────────────────────────
// Filter out legitimate shadcn/base-ui data-attribute patterns
const ARBITRARY_IGNORE_RE = /^(group-data|data|has-data|in-data|has-\[|group-data-\[|in-data-\[)/;
// Filter out canonical allowed values
const CANONICAL_ARBITRARY = new Set(['min-h-[44px]', 'max-h-[90vh]', 'text-[10px]']);

function detectArbitraryValues(allFileData) {
  const findings = [];
  const arbitraryRe = /(\S+)-\[([^\]]+)\]/g;

  for (const { file, content, lines } of allFileData) {
    lines.forEach((line, i) => {
      const lineNum = i + 1;
      let m;
      const re = new RegExp(arbitraryRe.source, 'g');
      while ((m = re.exec(line)) !== null) {
        const fullToken = m[0];
        const prop = m[1];
        const val = m[2];

        // Skip data-attribute patterns (shadcn internals)
        if (ARBITRARY_IGNORE_RE.test(fullToken)) continue;
        // Skip canonical allowed values
        if (CANONICAL_ARBITRARY.has(fullToken)) continue;
        // Skip color variables (CSS custom properties)
        if (/^var\(--/.test(val) || /^--/.test(val)) continue;
        // Skip percentage values (flex-basis, widths — common legitimate use)
        if (/^\d+%$/.test(val)) continue;
        // Skip allowed in allowlist
        if (isAllowed(relative(ROOT, file), fullToken)) continue;

        // Classify severity
        let severity = 'LOW';
        let category = 'arbitrary-spacing';

        if (/^(w|min-w|max-w)-/.test(prop)) {
          severity = 'MEDIUM';
          category = 'arbitrary-width';
          // Fixed widths with px are HIGH if in locale-sensitive contexts
          if (/\d+px/.test(val) && /nav|header|footer|button|modal|dialog|toolbar/i.test(file)) {
            severity = 'HIGH';
            category = 'arbitrary-width-locale-risk';
          }
        } else if (/^(h|min-h|max-h)-/.test(prop) && /\d+px/.test(val)) {
          severity = 'MEDIUM';
          category = 'arbitrary-height';
        } else if (/^text-/.test(prop) && /\d+(px|rem)/.test(val) && !CANONICAL_ARBITRARY.has(fullToken)) {
          severity = 'LOW';
          category = 'arbitrary-font-size';
        } else if (/^z-/.test(prop) && parseInt(val) >= 50) {
          severity = 'MEDIUM';
          category = 'arbitrary-z-index';
        }

        findings.push({
          category: 'ARBITRARY_VALUE',
          subcategory: category,
          file: relative(ROOT, file),
          line: lineNum,
          token: fullToken,
          prop,
          value: val,
          severity,
          justification: CANONICAL_ARBITRARY.has(fullToken) ? 'canonical' : 'none',
        });
      }
    });
  }
  return findings;
}

// ── Category 3: Responsive utility drift ──────────────────────────────────────
function detectResponsiveDrift(allFileData) {
  const findings = [];
  const BREAKPOINTS = ['sm', 'md', 'lg', 'xl', '2xl'];

  for (const { file, lines } of allFileData) {
    // Skip shadcn ui internals
    if (/components[\\/]ui[\\/]/.test(file)) continue;

    lines.forEach((line, i) => {
      const lineNum = i + 1;
      const relFile = relative(ROOT, file);

      // xl:grid-cols without 2xl: (already in scan-primitives but add context here)
      if (/xl:grid-cols-\d/.test(line) && !/2xl:grid-cols/.test(line)) {
        findings.push({
          category: 'RESPONSIVE_DRIFT',
          subcategory: 'missing-2xl-grid',
          file: relFile,
          line: lineNum,
          pattern: 'xl:grid-cols-N without 2xl: step',
          breakpointRisk: '2xl',
          severity: 'MEDIUM',
          recommendedAction: 'Add 2xl:grid-cols-4 for listing grids',
        });
      }

      // Hidden visibility conflicts (hidden X:block then Y:hidden)
      const visClasses = line.match(/(?:hidden|block|flex|grid|inline)(?:\s+(?:sm|md|lg|xl|2xl):(?:hidden|block|flex|grid|inline))+/g);
      if (visClasses) {
        findings.push({
          category: 'RESPONSIVE_DRIFT',
          subcategory: 'visibility-chain',
          file: relFile,
          line: lineNum,
          pattern: visClasses[0],
          breakpointRisk: 'multi',
          severity: 'LOW',
          recommendedAction: 'Review visibility chain for conflicts',
        });
      }

      // Inline style max-width as responsive hack
      if (/style=.*maxWidth.*px/.test(line) || /style=.*minWidth.*px/.test(line)) {
        findings.push({
          category: 'RESPONSIVE_DRIFT',
          subcategory: 'inline-style-responsive',
          file: relFile,
          line: lineNum,
          pattern: 'Inline style width (responsive hack)',
          breakpointRisk: 'all',
          severity: 'HIGH',
          recommendedAction: 'Use Tailwind breakpoint classes instead of inline style',
        });
      }
    });
  }
  return findings;
}

// ── Category 4: Local style fragment clones ────────────────────────────────────
const CLONE_PATTERNS = [
  {
    id: 'button-clone',
    re: /px-[34]\s+py-[12]\s+rounded.*font-medium|font-medium\s+px-[34]\s+py-[12]\s+rounded/,
    desc: 'Button-like styling outside canonical Button',
    severity: 'HIGH',
  },
  {
    id: 'input-clone',
    re: /border\s+rounded.*px-3\s+py-2\s+text-sm|h-9\s+w-full\s+rounded.*border/,
    desc: 'Input-like styling outside canonical Input',
    severity: 'HIGH',
  },
  {
    id: 'dialog-clone',
    re: /fixed\s+inset-0.*bg-black\/[0-9]|bg-black\/[0-9].*fixed\s+inset-0/,
    desc: 'Dialog overlay clone (custom fixed inset-0 backdrop)',
    severity: 'CRITICAL',
  },
];

function detectFragmentClones(allFileData) {
  const findings = [];
  for (const { file, lines } of allFileData) {
    if (/components[\\/]ui[\\/]/.test(file)) continue;
    const relFile = relative(ROOT, file);

    lines.forEach((line, i) => {
      const lineNum = i + 1;
      for (const pat of CLONE_PATTERNS) {
        if (pat.re.test(line) && !isAllowed(relFile, pat.id)) {
          findings.push({
            category: 'FRAGMENT_CLONE',
            id: pat.id,
            file: relFile,
            line: lineNum,
            description: pat.desc,
            severity: pat.severity,
            recommendedAction: `Migrate to canonical primitive. See docs/component-governance.md §1.`,
          });
        }
      }
    });
  }
  return findings;
}

// ── Category 5: Overflow / truncation risks ────────────────────────────────────
function detectOverflowRisks(allFileData) {
  const findings = [];
  for (const { file, lines } of allFileData) {
    if (/components[\\/]ui[\\/]/.test(file)) continue;
    const relFile = relative(ROOT, file);

    lines.forEach((line, i) => {
      const lineNum = i + 1;

      // whitespace-nowrap without overflow-hidden + truncate
      if (/whitespace-nowrap/.test(line) && !/overflow-hidden|truncate/.test(line)) {
        findings.push({
          category: 'OVERFLOW_RISK',
          subcategory: 'nowrap-unsafe',
          file: relFile,
          line: lineNum,
          pattern: 'whitespace-nowrap without truncate',
          affectedLocales: ['sq', 'en', 'uk', 'it'],
          severity: 'MEDIUM',
          recommendedAction: 'Add overflow-hidden and truncate, or allow wrapping',
        });
      }

      // overflow-hidden on components that might contain translated text
      if (/overflow-hidden/.test(line) && /w-\[\d+px\]|min-w-\[\d+px\]/.test(line)) {
        findings.push({
          category: 'OVERFLOW_RISK',
          subcategory: 'overflow-hidden-fixed-width',
          file: relFile,
          line: lineNum,
          pattern: 'overflow-hidden + fixed px width (locale risk)',
          affectedLocales: ['uk', 'it'],
          severity: 'HIGH',
          recommendedAction: 'Replace fixed px width with relative or min-w-0',
        });
      }

      // truncate on elements that look like action/button labels
      if (/truncate/.test(line) && /<[Bb]utton|variant=|size=/.test(line)) {
        findings.push({
          category: 'OVERFLOW_RISK',
          subcategory: 'truncate-button',
          file: relFile,
          line: lineNum,
          pattern: 'truncate on button label',
          affectedLocales: ['uk'],
          severity: 'LOW',
          recommendedAction: 'Review if button label can wrap or shorten translation',
        });
      }
    });
  }
  return findings;
}

// ── Category 6: Huge desktop risks ────────────────────────────────────────────
function detectHugeDesktopRisks(allFileData) {
  const findings = [];
  for (const { file, content, lines } of allFileData) {
    if (/components[\\/]ui[\\/]/.test(file)) continue;
    const relFile = relative(ROOT, file);
    const isPublicPage = /app[\\/]\[locale\]/.test(file);
    const isAdminPage = /app[\\/]admin/.test(file);

    lines.forEach((line, i) => {
      const lineNum = i + 1;

      // Public pages without container-wide or max-width
      if (isPublicPage && /min-h-screen/.test(line) && !/container-wide|max-w-/.test(line)) {
        findings.push({
          category: 'HUGE_DESKTOP_RISK',
          subcategory: 'unbounded-section',
          file: relFile,
          line: lineNum,
          pattern: 'min-h-screen without max-width container',
          risk2560: 'HIGH — content stretches full viewport width',
          severity: 'MEDIUM',
          recommendedAction: 'Wrap content in .container-wide or max-w-* container',
        });
      }

      // Admin pages stretching without max-width
      if (isAdminPage && /flex.*min-h-screen/.test(line) && !/max-w-/.test(content)) {
        findings.push({
          category: 'HUGE_DESKTOP_RISK',
          subcategory: 'admin-unbounded',
          file: relFile,
          line: lineNum,
          pattern: 'Admin layout without max-width constraint',
          risk2560: 'MEDIUM — admin content spreads at 2560px',
          severity: 'LOW',
          recommendedAction: 'Add max-w-[1800px] or max-w-screen-2xl to admin main content',
        });
      }
    });
  }
  return findings;
}

// ── Category 7: Icon / control density risks ──────────────────────────────────
function detectIconRisks(allFileData) {
  const findings = [];
  const CANONICAL_ICON_SIZES = new Set(['h-3', 'h-3.5', 'h-4', 'h-5', 'h-6', 'h-12', 'w-3', 'w-3.5', 'w-4', 'w-5', 'w-6', 'w-12', 'size-4', 'size-5', 'size-6']);
  const ICON_SIZE_RE = /\b(h|w)-(\d+(?:\.\d+)?)\b/g;

  for (const { file, lines } of allFileData) {
    if (/components[\\/]ui[\\/]/.test(file)) continue;
    const relFile = relative(ROOT, file);

    lines.forEach((line, i) => {
      const lineNum = i + 1;
      // Look for svg/icon size patterns
      if (/<[A-Z][a-zA-Z]*Icon|lucide|svg/.test(line)) {
        let m;
        const re = new RegExp(ICON_SIZE_RE.source, 'g');
        while ((m = re.exec(line)) !== null) {
          const sizeClass = `${m[1]}-${m[2]}`;
          if (!CANONICAL_ICON_SIZES.has(sizeClass) && parseFloat(m[2]) > 6 && parseFloat(m[2]) < 12) {
            findings.push({
              category: 'ICON_DENSITY_RISK',
              subcategory: 'non-canonical-icon-size',
              file: relFile,
              line: lineNum,
              pattern: `Non-canonical icon size: ${sizeClass}`,
              severity: 'LOW',
              recommendedAction: `Use canonical icon size. See docs/ui-rules.md §5`,
            });
          }
        }
      }

      // Dynamic class flags
      if (/className=\{.*\?.*:/.test(line) && !/\/\//.test(line)) {
        findings.push({
          category: 'MANUAL_REVIEW',
          subcategory: 'dynamic-ternary',
          file: relFile,
          line: lineNum,
          pattern: 'Dynamic ternary className — static analysis incomplete',
          severity: 'INFO',
          recommendedAction: 'Manually verify this dynamic class composition follows governance',
        });
      }
    });
  }
  return findings;
}

// ── Main scanner ───────────────────────────────────────────────────────────────
const SCAN_DIRS = [
  join(SRC, 'app'),
  join(SRC, 'components'),
  join(SRC, 'modules'),
];

const allFileData = [];
let totalFiles = 0;
let classFiles = 0;

for (const dir of SCAN_DIRS) {
  if (!existsSync(dir)) continue;
  for (const file of walkFiles(dir)) {
    totalFiles++;
    const content = readFileSync(file, 'utf-8');
    if (!content.includes('className')) continue;
    classFiles++;
    const lines = content.split('\n');
    const classStrings = extractClassStrings(content);
    allFileData.push({ file, content, lines, classStrings });
  }
}

// Also scan hooks and lib for class composition utilities
for (const dir of [join(SRC, 'hooks'), join(SRC, 'lib')]) {
  if (!existsSync(dir)) continue;
  for (const file of walkFiles(dir, ['.ts', '.tsx'])) {
    const content = readFileSync(file, 'utf-8');
    if (!content.includes('className') && !content.includes('cn(') && !content.includes('clsx(')) continue;
    totalFiles++;
    classFiles++;
    const lines = content.split('\n');
    const classStrings = extractClassStrings(content);
    allFileData.push({ file, content, lines, classStrings });
  }
}

// Run all detectors
const dupFindings = detectDuplicateChains(allFileData);
const arbFindings = detectArbitraryValues(allFileData);
const respFindings = detectResponsiveDrift(allFileData);
const cloneFindings = detectFragmentClones(allFileData);
const overflowFindings = detectOverflowRisks(allFileData);
const hdFindings = detectHugeDesktopRisks(allFileData);
const iconFindings = detectIconRisks(allFileData);

const allFindings = [
  ...dupFindings,
  ...arbFindings,
  ...respFindings,
  ...cloneFindings,
  ...overflowFindings,
  ...hdFindings,
  ...iconFindings,
];

// Count by severity (excluding INFO/MANUAL_REVIEW from blocking)
const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
allFindings.forEach(f => { if (counts[f.severity] !== undefined) counts[f.severity]++; });

// Unique arbitrary values
const uniqueArb = new Set(arbFindings.map(f => f.token)).size;

// ── Console output ─────────────────────────────────────────────────────────────
console.log('\n╔═════════════════════════════════════════════════╗');
console.log('║     TAILWIND UTILITY ENTROPY ANALYSIS           ║');
console.log('╚═════════════════════════════════════════════════╝');
console.log(`\nFiles scanned: ${totalFiles} total, ${classFiles} with className`);
console.log(`\nSeverity summary:`);
console.log(`  🔴 CRITICAL: ${counts.CRITICAL}`);
console.log(`  🟠 HIGH:     ${counts.HIGH}`);
console.log(`  🟡 MEDIUM:   ${counts.MEDIUM}`);
console.log(`  ⚪ LOW:      ${counts.LOW}`);
console.log(`  ℹ  INFO:     ${counts.INFO}`);
console.log(`  ─  TOTAL:    ${allFindings.length}`);

console.log(`\nArbitrary values: ${arbFindings.length} occurrences, ${uniqueArb} unique tokens`);
console.log(`Duplicated chains: ${dupFindings.length} patterns detected`);
console.log(`Fragment clones:   ${cloneFindings.length}`);
console.log(`Overflow risks:    ${overflowFindings.length}`);
console.log(`Responsive drift:  ${respFindings.filter(f => f.subcategory !== 'visibility-chain').length}`);
console.log(`Huge desktop:      ${hdFindings.length}`);

if (counts.CRITICAL > 0) {
  console.log('\n🔴 CRITICAL FINDINGS:');
  allFindings.filter(f => f.severity === 'CRITICAL').forEach(f => {
    console.log(`  ${f.file}:${f.line} — ${f.description || f.pattern}`);
  });
}
if (counts.HIGH > 0) {
  console.log('\n🟠 HIGH FINDINGS:');
  allFindings.filter(f => f.severity === 'HIGH').forEach(f => {
    console.log(`  ${f.file}:${f.line || '–'} — ${f.description || f.pattern}`);
  });
}

// ── JSON report ────────────────────────────────────────────────────────────────
const report = {
  generated: new Date().toISOString(),
  summary: {
    totalFiles,
    classFiles,
    uniqueArbitraryTokens: uniqueArb,
    findings: counts,
    totalFindings: allFindings.length,
  },
  findings: allFindings,
};

if (ARG_REPORT || ARG_JSON) {
  mkdirSync(JSON_REPORTS_DIR, { recursive: true });
  const jsonPath = join(JSON_REPORTS_DIR, 'tailwind-entropy.latest.json');
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 JSON report: ${jsonPath}`);
}

// ── Markdown report ────────────────────────────────────────────────────────────
if (ARG_REPORT) {
  const today = new Date().toISOString().split('T')[0];
  const mdPath = join(REPORTS_DIR, `monthly-${today.slice(0, 7)}-tailwind-entropy.md`);
  mkdirSync(REPORTS_DIR, { recursive: true });

  const lines = [
    `# Monthly Tailwind Entropy Report — ${today.slice(0, 7)}`,
    `Generated: ${today}`,
    '',
    '## Summary',
    `| Metric | Value |`,
    `|---|---|`,
    `| Files scanned | ${totalFiles} |`,
    `| Files with className | ${classFiles} |`,
    `| Unique arbitrary tokens | ${uniqueArb} |`,
    `| CRITICAL | ${counts.CRITICAL} |`,
    `| HIGH | ${counts.HIGH} |`,
    `| MEDIUM | ${counts.MEDIUM} |`,
    `| LOW | ${counts.LOW} |`,
    `| Total findings | ${allFindings.length} |`,
    '',
    '## Duplicated Utility Chains',
    '| Pattern | Occurrences | Severity | Canonical |',
    '|---|---|---|---|',
    ...dupFindings.map(f => `| \`${f.pattern}\` | ${f.occurrences} (${f.files.length} files) | ${f.severity} | ${f.canonical} |`),
    '',
    '## HIGH+ Findings',
    '',
    ...allFindings.filter(f => ['CRITICAL', 'HIGH'].includes(f.severity)).map(f =>
      `- **[${f.severity}]** \`${f.file}:${f.line || '–'}\` — ${f.description || f.pattern}`
    ),
    '',
    '## Governance Status',
    counts.CRITICAL > 0 ? '❌ CRITICAL violations found.' : counts.HIGH > 0 ? '⚠️ HIGH violations found.' : '✅ No blocking violations.',
    '',
    '*Generated by `npm run governance:tailwind -- --report`*',
  ];

  writeFileSync(mdPath, lines.join('\n'));
  console.log(`📄 Markdown report: ${mdPath}`);
}

export { report, counts, allFindings };
