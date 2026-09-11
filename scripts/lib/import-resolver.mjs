/**
 * import-resolver.mjs — shared local-import resolution (Task 812).
 *
 * Extracted verbatim from scripts/check-story-coverage.mjs so check:story-coverage and
 * check:rendered-scope share one resolver instead of two independently-maintained copies.
 * Behavior is byte-for-byte identical to the pre-extraction functions — do not change resolution
 * semantics here without re-verifying check:story-coverage's output stays unchanged (Task 812 R9).
 */

import { existsSync, statSync } from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
import ts from 'typescript';

/** Every `import ... from '<spec>'` module specifier in the file (AST, not regex). */
export function extractImportSpecifiers(sourceFile) {
  const specs = [];
  for (const stmt of sourceFile.statements) {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier)) {
      specs.push(stmt.moduleSpecifier.text);
    }
  }
  return specs;
}

/**
 * Resolves an `@/*` or relative import specifier to a repo-relative file path, or null (external).
 * `root` is the repo root (the caller's ROOT constant); `fromFile` is the absolute path of the
 * file containing the import.
 */
export function resolveImportSpecifier(root, fromFile, spec) {
  let candidate;
  if (spec.startsWith('@/')) {
    candidate = join(root, 'src', spec.slice(2));
  } else if (spec.startsWith('.')) {
    candidate = resolve(dirname(fromFile), spec);
  } else {
    return null; // external package — not a local component
  }
  for (const ext of ['', '.tsx', '.ts', '/index.tsx', '/index.ts']) {
    const p = candidate + ext;
    try {
      if (existsSync(p) && statSync(p).isFile()) {
        return relative(root, p).replace(/\\/g, '/');
      }
    } catch { /* candidate not a file — keep trying extensions */ }
  }
  return null;
}
