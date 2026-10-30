// Revision 16 (R80): the checks of scripts/check-ui-contract.mjs `validateRegistry`, applied to the WORKING TREE for one registry row, because the gate itself reads both manifests
// from commits (`--base` / `--head`) and the tree is not committed yet (the executor runs no mutating Git command). Same rules, same helper modules; nothing is skipped.
//   node docs/sessions/evidence/task923/r17-25-ui-contract-row.mjs <registry-row-id>
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { isCanonicalMantineTitle } from '../../../../scripts/lib/mantine-story-scope.mjs';
import { extractImportSpecifiers, resolveImportSpecifier } from '../../../../scripts/lib/import-resolver.mjs';

const ROOT = resolve(new URL('../../../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const id = process.argv[2];
const manifest = new Set(JSON.parse(readFileSync(join(ROOT, 'scripts/mantine-migration-scope.json'), 'utf8')));
const registry = JSON.parse(readFileSync(join(ROOT, 'scripts/ui-contract-registry.json'), 'utf8'));
const entry = registry.components.find((c) => c.id === id);
const failures = [];
if (!entry) failures.push(`no registry row ${id}`);
else {
  if (!manifest.has(entry.component)) failures.push('component is not an enrolled path of the manifest');
  for (const field of ['stories', 'tokenOwners', 'parity']) if (!Array.isArray(entry[field]) || !entry[field].length) failures.push(`${field} must be a non-empty array`);
  for (const story of entry.stories) {
    const storyPath = join(ROOT, story);
    if (!existsSync(storyPath)) { failures.push(`story missing: ${story}`); continue; }
    const text = readFileSync(storyPath, 'utf8');
    const source = ts.createSourceFile(storyPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const titleMatch = /title:\s*'([^']+)'/.exec(text);
    if (source.parseDiagnostics.length || !isCanonicalMantineTitle(titleMatch?.[1] ?? '')) failures.push(`Story is not a parseable canonical Mantine Story: ${story}`);
    const imports = extractImportSpecifiers(source).map((s) => resolveImportSpecifier(ROOT, storyPath, s));
    if (!imports.includes(entry.component)) failures.push(`the direct Story does not import its component: ${story}`);
    for (const parity of entry.parity) for (const name of parity.storyExports) if (!new RegExp(`export const ${name}\\b`).test(text)) failures.push(`Story export missing: ${name}`);
  }
  for (const owner of entry.tokenOwners) if (!existsSync(join(ROOT, owner))) failures.push(`token owner path does not exist: ${owner}`);
  for (const parity of entry.parity) if (typeof parity.element !== 'string' || !parity.element.trim() || !parity.storyExports.length) failures.push('a parity entry needs element and storyExports');
}
console.log(failures.length ? `FAIL ${id}\n  ${failures.join('\n  ')}` : `PASS ${id}: enrolled in the manifest, ${entry.stories.length} Story, ${entry.tokenOwners.length} token owners, ${entry.parity.length} parity entries, every named Story export exists`);
process.exitCode = failures.length ? 1 : 0;
