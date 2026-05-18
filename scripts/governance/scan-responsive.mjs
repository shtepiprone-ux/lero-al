/**
 * Governance scan: Responsive governance violations
 * Detects missing 2xl: steps, viewport JS, arbitrary breakpoints, forbidden responsive hacks.
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

const findings = [];

function finding(severity, file, line, message, pattern) {
  findings.push({ severity, file: relative(ROOT, file), line, message, pattern });
}

for (const file of walkTsx(SRC)) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const relPath = relative(ROOT, file);

  // Skip shadcn UI internals
  if (/src[/\\]components[/\\]ui[/\\]/.test(relPath)) continue;

  lines.forEach((line, i) => {
    const lineNum = i + 1;

    // ── Rule R1: useWindowSize hook ───────────────────────────────────────────
    if (/useWindowSize|useViewportSize|useMediaQuery/.test(line) && !/\/\//.test(line)) {
      finding(
        'HIGH',
        file, lineNum,
        'Viewport-size hook detected. Use CSS Tailwind breakpoints instead of JS viewport detection.',
        'useWindowSize/useMediaQuery'
      );
    }

    // ── Rule R2: Arbitrary inline breakpoint min/max-width ────────────────────
    if (/min-\[|max-\[/.test(line) && /\d+px/.test(line)) {
      finding(
        'MEDIUM',
        file, lineNum,
        'Arbitrary inline breakpoint value detected. Use canonical Tailwind breakpoints (sm:/md:/lg:/xl:/2xl:).',
        'arbitrary breakpoint'
      );
    }

    // ── Rule R3: Emergency z-index overrides ──────────────────────────────────
    if (/z-\[9{2,}|z-\[999/.test(line)) {
      finding(
        'MEDIUM',
        file, lineNum,
        'Emergency z-index override detected. Use canonical z-index scale.',
        'z-[999+]'
      );
    }

    // ── Rule R4: xl:grid-cols without 2xl: step ───────────────────────────────
    if (/xl:grid-cols-\d/.test(line) && !/2xl:grid-cols/.test(line)) {
      finding(
        'MEDIUM',
        file, lineNum,
        'xl:grid-cols-N without 2xl: step. Add 2xl:grid-cols-4 for listing grids or appropriate 2xl: value.',
        'missing 2xl:grid-cols'
      );
    }

    // ── Rule R5: overflow-hidden masking layout bugs ──────────────────────────
    // overflow-hidden is legitimate for rounded corners; flag only on parent containers
    if (/overflow-hidden/.test(line) && /container|wrapper|layout|shell/i.test(relPath)) {
      finding(
        'LOW',
        file, lineNum,
        'overflow-hidden on container component. Verify this is intentional (rounded corners OK; layout masking forbidden).',
        'overflow-hidden on container'
      );
    }

    // ── Rule R6: Inline max-width for public page containers ──────────────────
    if (/max-w-\[/.test(line) && /\d+(rem|px)/.test(line)) {
      finding(
        'MEDIUM',
        file, lineNum,
        'Arbitrary max-w value detected. Use canonical container tokens: .container-wide, max-w-5xl, max-w-6xl.',
        'arbitrary max-w value'
      );
    }
  });
}

export { findings };

const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
findings.forEach(f => counts[f.severity]++);

console.log('\n=== RESPONSIVE GOVERNANCE SCAN ===');
console.log(`CRITICAL: ${counts.CRITICAL}  HIGH: ${counts.HIGH}  MEDIUM: ${counts.MEDIUM}  LOW: ${counts.LOW}`);

if (findings.length === 0) {
  console.log('✅ No responsive violations found.');
} else {
  findings.forEach(f => {
    const icon = f.severity === 'CRITICAL' ? '🔴' : f.severity === 'HIGH' ? '🟠' : f.severity === 'MEDIUM' ? '🟡' : '⚪';
    console.log(`${icon} [${f.severity}] ${f.file}:${f.line} — ${f.message}`);
  });
}

export { counts };
