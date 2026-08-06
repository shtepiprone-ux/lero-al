/**
 * Governance scan: SSR / Hydration safety violations
 * Detects suppressHydrationWarning, typeof window in render, viewport-driven rendering.
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

/**
 * React does not execute the function passed to useEffect/useCallback while it
 * renders on the server. Those callbacks may safely read browser geometry when
 * they run after mount (for example, to place a portalled popup). Keep this
 * scope separate from render-time code, where window.innerWidth is a genuine
 * hydration risk.
 */
export function getPostRenderHookBodyLineNumbers(lines) {
  const lineNumbers = new Set();
  let hookBodyBraceDepth = 0;
  let waitingForHookBody = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;

    if (hookBodyBraceDepth > 0) {
      lineNumbers.add(lineNumber);
      hookBodyBraceDepth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
      if (hookBodyBraceDepth <= 0) hookBodyBraceDepth = 0;
      continue;
    }

    if (/\b(?:useEffect|useCallback)\s*\(/.test(line)) {
      waitingForHookBody = true;
    }

    if (!waitingForHookBody || !/=>\s*\{/.test(line)) continue;

    lineNumbers.add(lineNumber);
    hookBodyBraceDepth = (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
    waitingForHookBody = false;
  }

  return lineNumbers;
}

export function isViewportReadInRenderPath(line, postRenderHookBodyLines, lineNumber) {
  return (
    /window\.(innerWidth|outerWidth)/.test(line) &&
    !/\/\//.test(line) &&
    !postRenderHookBodyLines.has(lineNumber)
  );
}

for (const file of walkTsx(SRC)) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const relPath = relative(ROOT, file);
  const postRenderHookBodyLines = getPostRenderHookBodyLineNumbers(lines);

  // ── Scoping: typeof window / viewport checks ──────────────────────────────
  // Only flag React component files (not pure utility/lib files).
  // Performance utilities, analytics, and browser detection libs MUST use window — they're client-only.
  const isReactComponent = /src[/\\](app|components|modules)[/\\]/.test(relPath) && /\.tsx$/.test(relPath);
  const isLibUtility = /src[/\\]lib[/\\]/.test(relPath);

  // Known exceptions for suppressHydrationWarning
  // next-themes requires it on the root html element to prevent flash of unstyled content
  const isRootLayout = /app[/\\]layout\.tsx$/.test(relPath);

  lines.forEach((line, i) => {
    const lineNum = i + 1;

    // ── Rule S1: suppressHydrationWarning ────────────────────────────────────
    // Exception: app/layout.tsx (required by next-themes for dark mode)
    if (/suppressHydrationWarning/.test(line) && !isRootLayout) {
      finding(
        'CRITICAL',
        file, lineNum,
        'suppressHydrationWarning detected. Fix the hydration mismatch at root cause. Exception: app/layout.tsx (next-themes).',
        'suppressHydrationWarning'
      );
    }

    // ── Rule S2: typeof window in React component render paths ────────────────
    // Only flag in .tsx component files (not lib utilities).
    // Allow: inside useEffect/useLayoutEffect, event handlers, comments.
    if (
      isReactComponent &&
      !isLibUtility &&
      /typeof\s+window/.test(line) &&
      !/useEffect|useLayoutEffect|addEventListener|\/\/|function\s+\w+\s*\(/.test(line)
    ) {
      finding(
        'HIGH',
        file, lineNum,
        'typeof window in React component render path. Causes hydration mismatch. Use CSS-only responsive logic.',
        'typeof window in component'
      );
    }

    // ── Rule S3: window.innerWidth in React component render paths ────────────
    if (
      isReactComponent &&
      !isLibUtility &&
      isViewportReadInRenderPath(line, postRenderHookBodyLines, lineNum)
    ) {
      finding(
        'HIGH',
        file, lineNum,
        'Viewport dimension read in component. Use CSS breakpoints instead of JS viewport checks.',
        'window.innerWidth in component'
      );
    }

    // ── Rule S4: dynamic ssr:false without documented justification ───────────
    if (/dynamic\(/.test(line) && /ssr:\s*false/.test(line)) {
      if (!/\/\/|\/\*|\*/.test(line)) {
        finding(
          'MEDIUM',
          file, lineNum,
          'dynamic(import, { ssr: false }) without inline justification comment.',
          'ssr:false undocumented'
        );
      }
    }

    // ── Rule S5: useLayoutEffect in React components (SSR-unsafe) ────────────
    if (isReactComponent && /\buseLayoutEffect\b/.test(line) && !/\/\//.test(line)) {
      finding(
        'HIGH',
        file, lineNum,
        'useLayoutEffect is SSR-unsafe. Use useEffect instead.',
        'useLayoutEffect'
      );
    }
  });
}

export { findings };

const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
findings.forEach(f => counts[f.severity]++);

console.log('\n=== SSR / HYDRATION GOVERNANCE SCAN ===');
console.log(`CRITICAL: ${counts.CRITICAL}  HIGH: ${counts.HIGH}  MEDIUM: ${counts.MEDIUM}  LOW: ${counts.LOW}`);

if (findings.length === 0) {
  console.log('✅ No SSR/hydration violations found.');
} else {
  findings.forEach(f => {
    const icon = f.severity === 'CRITICAL' ? '🔴' : f.severity === 'HIGH' ? '🟠' : f.severity === 'MEDIUM' ? '🟡' : '⚪';
    console.log(`${icon} [${f.severity}] ${f.file}:${f.line} — ${f.message}`);
  });
}

export { counts };
