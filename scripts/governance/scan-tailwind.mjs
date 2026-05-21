/**
 * Governance scan: Tailwind utility entropy
 * Detects arbitrary values, non-canonical spacing, forbidden typography, utility density.
 * Phase 3 enhancement: integrates tailwind-entropy.mjs findings (HIGH/CRITICAL only, de-duped from primitives scan).
 *
 * Hardcoded-color enforcement (2026-05-21, Task 121 review follow-up):
 *   The UI Gate forbids hardcoded colors - only semantic design tokens from
 *   globals.css are allowed. Three rules enforce this, all at HIGH severity so
 *   the governance gate BLOCKS them (MEDIUM/LOW never fail the gate):
 *     T3 - arbitrary hex in text-[#...]
 *     T4 - arbitrary hex / bg-white / bg-black backgrounds
 *     T6 - raw Tailwind palette colors (text-green-500, bg-blue-600, ...) [NEW]
 *   Before T6 existed, raw palette utilities silently passed governance - the
 *   exact bypass that let text-green-500 ship. Storybook (.stories) files are
 *   exempt from T6 only: literal swatches are their legitimate purpose.
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

// -- Rule T6: raw Tailwind palette colors --------------------------------------
// Semantic tokens (text-primary, text-muted-foreground, text-status-success,
// bg-card, border-destructive, ...) live in globals.css and are NOT palette
// names, so they never match. Only the literal Tailwind default palette is flagged.
const PALETTE_NAMES =
  'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone';
// Longer props (ring-offset) listed before their prefixes (ring) for correct alternation.
const PALETTE_PROPS =
  'text|bg|border|ring-offset|ring|fill|stroke|from|via|to|divide|outline|decoration|accent|caret|placeholder';
const PALETTE_SHADES = '50|100|200|300|400|500|600|700|800|900|950';
// Lookbehind/ahead anchor to class boundaries so modifiers (hover:, dark:) and
// opacity suffixes (/50) still match, while substrings inside longer tokens don't.
const RAW_PALETTE_RE = new RegExp(
  `(?<![\\w-])(?:${PALETTE_PROPS})-(?:${PALETTE_NAMES})-(?:${PALETTE_SHADES})(?![\\w-])`
);

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

  // Storybook demo files are exempt from the raw-palette rule (T6) only:
  // their literal color swatches illustrate visual concepts, not shipped UI.
  const isStory = /\.stories\.(ts|tsx)$/.test(relPath);

  lines.forEach((line, i) => {
    const lineNum = i + 1;

    // -- Rule T1: Forbidden section padding values ----------------------------
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

    // -- Rule T2: Arbitrary values counter ------------------------------------
    const arbitraryMatches = line.match(/\w+-\[[\w\d.%#,\s]+\]/g);
    if (arbitraryMatches) {
      arbitraryCount += arbitraryMatches.length;
    }

    // -- Rule T3: Hardcoded text colors (non-semantic) ------------------------
    // HIGH (was MEDIUM): hardcoded colors must block the gate, not just warn.
    if (/text-\[#[0-9a-fA-F]{3,6}\]/.test(line)) {
      finding(
        'HIGH',
        file, lineNum,
        'Hardcoded hex color in text class. Use semantic color tokens (text-foreground, text-muted-foreground, etc.).',
        'hardcoded hex color'
      );
    }

    // -- Rule T4: Hardcoded bg colors -----------------------------------------
    // HIGH (was MEDIUM): hardcoded colors must block the gate, not just warn.
    if (/bg-\[#[0-9a-fA-F]{3,6}\]|bg-white\b|bg-black\b/.test(line)) {
      finding(
        'HIGH',
        file, lineNum,
        'Hardcoded background color. Use semantic tokens: bg-card, bg-background, bg-muted.',
        'hardcoded bg color'
      );
    }

    // -- Rule T6: Raw Tailwind palette colors (hardcoded, non-semantic) -------
    // Catches text-green-500, bg-blue-600, border-red-400, ring-amber-500, etc.
    // These are NOT in the project's semantic token library (globals.css) and
    // previously slipped past governance entirely. HIGH so the gate blocks them.
    if (!isStory && RAW_PALETTE_RE.test(line)) {
      const matched = line.match(RAW_PALETTE_RE)?.[0] ?? 'palette color';
      finding(
        'HIGH',
        file, lineNum,
        `Hardcoded Tailwind palette color (${matched}). Use a semantic design token from globals.css (e.g. text-foreground, text-muted-foreground, text-status-success, bg-card, border-destructive).`,
        'raw palette color'
      );
    }

    // -- Rule T5: Non-canonical font size -------------------------------------
    // text-[Npx] or text-[Nrem] - arbitrary font sizes
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

// -- Phase 3: integrate tailwind-entropy HIGH/CRITICAL findings ---------------
// Imports deep entropy findings. Excludes FRAGMENT_CLONE (dialog-clone) which are
// already tracked in scan-primitives to avoid double-counting in baseline.
try {
  const entropyMod = await import('./tailwind-entropy.mjs');
  const entropyFindings = (entropyMod.allFindings ?? []).filter(f =>
    ['HIGH', 'CRITICAL'].includes(f.severity) &&
    f.category !== 'FRAGMENT_CLONE'
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
  // tailwind-entropy.mjs not available - skip integration
}

export { findings };

const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
findings.forEach(f => counts[f.severity]++);

console.log('\n=== TAILWIND ENTROPY GOVERNANCE SCAN ===');
console.log(`CRITICAL: ${counts.CRITICAL}  HIGH: ${counts.HIGH}  MEDIUM: ${counts.MEDIUM}  LOW: ${counts.LOW}`);
console.log(`Total arbitrary values detected in codebase: ${arbitraryCount}`);

if (findings.length === 0) {
  console.log('No Tailwind entropy violations found.');
} else {
  findings.forEach(f => {
    const icon = f.severity === 'CRITICAL' ? '[C]' : f.severity === 'HIGH' ? '[H]' : f.severity === 'MEDIUM' ? '[M]' : '[L]';
    console.log(`${icon} [${f.severity}] ${f.file}:${f.line} - ${f.message}`);
  });
}

export { counts, arbitraryCount };
