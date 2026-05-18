/**
 * Governance scan: Tailwind utility entropy
 * Detects arbitrary values, non-canonical spacing, forbidden typography, utility density.
 * Phase 3 enhancement: integrates tailwind-entropy.mjs findings (HIGH/CRITICAL only, de-duped from primitives scan).
 */
import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SRC = join(ROOT, 'src');

function* walkTsx(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.next', 'out'].includes(entry.name)) {
      yield* walkTsx(full);
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      yield full;
    }
  }
}

// Canonical spacing scale values (canonical py-* values allowed)
const CANONICAL_PY = new Set(['py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-5', 'py-6', 'py-8', 'py-12', 'py-16', 'py-20', 'py-24']);
// Non-canonical values that should never appear as section spacing
const FORBIDDEN_SECTION_PY = new Set(['py-7', 'py-9', 'py-10', 'py-11', 'py-13', 'py-14', 'py-15']);

const findings = [];
let arbitraryCount = 0;

function finding(severity, file, line, message, pattern) {
  findings.push({ severity, file: relative(ROOT, file), line, message, pattern });
}

for (const file of walkTsx(SRC)) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const relPath = relative(ROOT, file);

  // Skip shadcn UI internals and test files
  if (/src[/\\]components[/\\]ui[/\\]|\.test\.(ts|tsx)$/.test(relPath)) continue;

  lines.forEach((line, i) => {
    const lineNum = i + 1;

    // ── Rule T1: Forbidden section padding values ────────────────────────────
    for (const val of FORBIDDEN_SECTION_PY) {
      // Match as standalone class (not inside an arbitrary value)
      const pattern = new RegExp(`\\b${val}\\b`);
      if (pattern.test(line) && !/\[/.test(line.match(pattern)?.[0] ?? '')) {
        finding(
          'MEDIUM',
          file, lineNum,
          `Non-canonical section padding ${val}. Use py-8/md:py-12, py-12/md:py-16, or py-16/md:py-24.`,
          `non-canonical ${val}`
        );
      }
    }

    // ── Rule T2: Arbitrary values counter ────────────────────────────────────
    const arbitraryMatches = line.match(/\w+-\[[\w\d.%#,\s]+\]/g);
    if (arbitraryMatches) {
      arbitraryCount += arbitraryMatches.length;
    }

    // ── Rule T3: Hardcoded text colors (non-semantic) ─────────────────────────
    if (/text-\[#[0-9a-fA-F]{3,6}\]/.test(line)) {
      finding(
        'MEDIUM',
        file, lineNum,
        'Hardcoded hex color in text class. Use semantic color tokens (text-foreground, text-muted-foreground, etc.).',
        'hardcoded hex color'
      );
    }

    // ── Rule T4: Hardcoded bg colors ─────────────────────────────────────────
    if (/bg-\[#[0-9a-fA-F]{3,6}\]|bg-white\b|bg-black\b/.test(line)) {
      finding(
        'MEDIUM',
        file, lineNum,
        'Hardcoded background color. Use semantic tokens: bg-card, bg-background, bg-muted.',
        'hardcoded bg color'
      );
    }

    // ── Rule T5: Non-canonical font size ─────────────────────────────────────
    // text-[Npx] or text-[Nrem] — arbitrary font sizes
    if (/text-\[\d+(px|rem)\]/.test(line)) {
      finding(
        'LOW',
        file, lineNum,
        'Arbitrary font size detected. Use canonical type scale: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl.',
        'arbitrary text size'
      );
    }
  });
}

// ── Phase 3: integrate tailwind-entropy HIGH/CRITICAL findings ───────────────
// Imports deep entropy findings. Excludes FRAGMENT_CLONE (dialog-clone) which are
// already tracked in scan-primitives to avoid double-counting in baseline.
try {
  const entropyMod = await import('./tailwind-entropy.mjs');
  const entropyFindings = (entropyMod.allFindings ?? []).filter(f =>
    ['HIGH', 'CRITICAL'].includes(f.severity) &&
    f.category !== 'FRAGMENT_CLONE' // already in primitives scan
  );
  for (const ef of entropyFindings) {
    findings.push({
      severity: ef.severity,
      file: ef.file ?? '(multiple files)',
      line: ef.line ?? 0,
      message: ef.description ?? ef.pattern ?? ef.subcategory,
      pattern: `entropy:${ef.category}`,
    });
  }
} catch {
  // tailwind-entropy.mjs not available — skip integration
}

export { findings };

const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
findings.forEach(f => counts[f.severity]++);

console.log('\n=== TAILWIND ENTROPY GOVERNANCE SCAN ===');
console.log(`CRITICAL: ${counts.CRITICAL}  HIGH: ${counts.HIGH}  MEDIUM: ${counts.MEDIUM}  LOW: ${counts.LOW}`);
console.log(`Total arbitrary values detected in codebase: ${arbitraryCount}`);

if (findings.length === 0) {
  console.log('✅ No Tailwind entropy violations found.');
} else {
  findings.forEach(f => {
    const icon = f.severity === 'CRITICAL' ? '🔴' : f.severity === 'HIGH' ? '🟠' : f.severity === 'MEDIUM' ? '🟡' : '⚪';
    console.log(`${icon} [${f.severity}] ${f.file}:${f.line} — ${f.message}`);
  });
}

export { counts, arbitraryCount };
