/**
 * r10-61-compare-full.mjs - R52 / AC55: the comparison of AC36's final full run `r8-full` with `r7-full-b`. A copy of r8-61-narrowed-compare.mjs (the comparator of AC36, itself a copy of
 * r7-61) with the one class R52 adds, and nothing else changed in how the first three classes decide:
 *   4  a PRODUCT CHANGE: the row's Story renders a file that changed after `r7-full-b` was taken. The row is listed with that file and is accepted ONLY when its row in the new run
 *      passes (`pass: true`); a differing row of such a Story whose new row fails stays NOT ALLOWED (handled under R33 as AC36 says).
 * "Renders a file" is the static import closure of the Story's `importPath` (storybook-static/index.json) over `src/`: `@/` and relative imports, dynamic `import()` included; a barrel
 * (`index.ts` with re-exports) is followed only for the names its importer asks for, so a Story that imports one component from `patterns/index.ts` does not "render" every pattern.
 * It is a superset of what a Story paints (an imported but unused file counts), which makes class 4 wider, never narrower. "Changed after r7-full-b was taken" = written after the run
 * STARTED (rows.jsonl write time minus summary.json runtimeSeconds), by the working-tree write time or by a commit made since (`git log --since`).
 *
 * Output besides the DIFF lines, for the reviewer (informational, they do not change a verdict):
 *   - rows only in one run (a state or width added or removed since r7-full-b);
 *   - of the NOT ALLOWED rows, those whose whole difference is a rule `r7-full-b` could not measure (`svg-text-clipped`, `text-overlap` were added to the gate after it).
 *
 *   node docs/sessions/evidence/task923/r10-61-compare-full.mjs <new run dir, r8-full> <base run dir, r7-full-b>
 * Exit 1 when any difference is NOT ALLOWED.
 */
import { readFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';

const dirs = process.argv.slice(2);
if (dirs.length !== 2) throw new Error('give the new run directory, then the base run directory');
const [dirNew, dirBase] = dirs;
const ROOT = resolve('.');
const SRC = resolve('src');

/** Classes added by an R33 outcome (ii). Empty: Story 059's candidate was fixed in the product instead (see r8-61-narrowed-compare.mjs). */
const EXTRA_CLASSES = [];
const NEW_RULES = new Set(['svg-text-clipped', 'text-overlap']);

const key = (r) => [r.story, r.state, r.root, r.locale, String(r.width).padStart(5, '0')].join(' | ');
const load = (d) => new Map(readFileSync(`${d}/rows.jsonl`, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)).map((r) => [key(r), r]));
const rulesOf = (r) => (r ? Object.entries(r.rules).filter(([, v]) => v.length).map(([k]) => k).sort() : null);
const label = (r) => (r ? rulesOf(r).join('+') || 'green' : '(missing)');

// ---- when r7-full-b was taken, and what changed since --------------------------------------------------------------------------------------------------------------------
const baseSummary = JSON.parse(readFileSync(`${dirBase}/summary.json`, 'utf8'));
const baseRuntimeSeconds = baseSummary.meta?.runtimeSeconds ?? baseSummary.runtimeSeconds ?? 0;
const baseStart = statSync(`${dirBase}/rows.jsonl`).mtimeMs - baseRuntimeSeconds * 1000;
const committed = new Set(execFileSync('git', ['log', `--since=${new Date(baseStart).toISOString()}`, '--name-only', '--pretty=format:'], { encoding: 'utf8', maxBuffer: 1 << 28 }).split('\n').filter(Boolean));
const changedAfter = (file) => {
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  if (committed.has(rel)) return true;
  try { return statSync(file).mtimeMs > baseStart; } catch { return false; }
};

// ---- the static import closure of a Story --------------------------------------------------------------------------------------------------------------------------------
const storybookIndex = JSON.parse(readFileSync('storybook-static/index.json', 'utf8')).entries;
const textCache = new Map();
const text = (f) => { if (!textCache.has(f)) textCache.set(f, readFileSync(f, 'utf8')); return textCache.get(f); };
const isFile = (f) => { try { return statSync(f).isFile(); } catch { return false; } };
function resolveSpec(from, spec) {
  let base;
  if (spec.startsWith('@/')) base = join(SRC, spec.slice(2));
  else if (spec.startsWith('.')) base = resolve(dirname(from), spec);
  else return null;
  for (const ext of ['', '.ts', '.tsx', '.mjs', '.js', '.css', '.json']) if (isFile(base + ext)) return base + ext;
  for (const idx of ['index.ts', 'index.tsx', 'index.js']) if (isFile(join(base, idx))) return join(base, idx);
  return null;
}
const parsed = new Map();
function parse(file) {
  if (parsed.has(file)) return parsed.get(file);
  const src = text(file);
  const imports = [];
  const re = /\b(import|export)\s+(?:type\s+)?(?:([\w$*{}\s,]+?)\s+from\s+)?['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m[4]) { imports.push({ spec: m[4], names: [], all: true, reexport: false }); continue; }
    const clause = m[2] ?? '';
    const names = [];
    const brace = /\{([^}]*)\}/.exec(clause);
    if (brace) {
      for (const part of brace[1].split(',')) {
        const p = part.trim().replace(/^type\s+/, '');
        const mm = /^([\w$]+)(?:\s+as\s+([\w$]+))?$/.exec(p);
        if (mm) names.push({ imported: mm[1], local: mm[2] ?? mm[1] });
      }
    }
    const rest = clause.replace(/\{[^}]*\}/, '').replace(/\*\s*as\s*[\w$]+/, '').replace(/,/g, ' ').trim();
    if (rest && !rest.startsWith('*')) names.push({ imported: 'default', local: rest });
    imports.push({ spec: m[3], names, all: !clause || /\*/.test(clause), reexport: m[1] === 'export' });
  }
  const result = { imports, isBarrel: /^index\./.test(file.split(/[\\/]/).pop()) && imports.some((i) => i.reexport) };
  parsed.set(file, result);
  return result;
}
const closureCache = new Map();
function closureOf(entry) {
  if (closureCache.has(entry)) return closureCache.get(entry);
  const files = new Set();
  const seen = new Set();
  const visit = (file, wanted) => {
    const tag = `${file}|${wanted ? [...wanted].sort().join(',') : '*'}`;
    if (seen.has(tag)) return;
    seen.add(tag);
    files.add(file);
    const { imports, isBarrel } = parse(file);
    for (const imp of imports) {
      const target = resolveSpec(file, imp.spec);
      if (!target) continue;
      if (isBarrel && imp.reexport) {
        if (wanted && !imp.all && !imp.names.some((n) => wanted.has(n.local))) continue;
        visit(target, null);
      } else {
        visit(target, imp.all || !imp.names.length ? null : new Set(imp.names.map((n) => n.imported)));
      }
    }
  };
  if (entry && isFile(entry)) visit(entry, null);
  closureCache.set(entry, files);
  return files;
}
const changedFilesOfStory = (story) => {
  const entry = storybookIndex[story]?.importPath ? resolve(storybookIndex[story].importPath) : null;
  if (!entry) return [];
  return [...closureOf(entry)].filter(changedAfter).map((f) => relative(ROOT, f).replaceAll('\\', '/')).sort();
};

// ---- the classes ---------------------------------------------------------------------------------------------------------------------------------------------------------
/** Classes 1-3 of AC36, then class 4 of R52, then EXTRA_CLASSES. `only` = the rules in the symmetric difference; rowN / rowB the new and the base row. */
function classify(row, only, rowN, rowB) {
  const both = [rowN, rowB];
  if (both.some((r) => !r)) return null; // a row missing from one run is never a difference to allow
  const hasIt = (rule) => both.filter((r) => r.rules[rule].length);
  if (only.length === 1 && only[0] === 'focus-open' && /^patterns-mantine-adminshell--drawer-open$/.test(row.story)) return { id: '1 focus-open on adminshell--drawer-open (C118)' };
  if (row.root === 'app' && /^patterns-mantine-listingdetailview--/.test(row.story) && only.every((r) => r === 'component-overflow' || r === 'text-hidden')
    && only.every((rule) => hasIt(rule).every((x) => x.rules[rule].every((d) => d.includes('leaflet-popup') || d.includes('listing-map'))))) {
    return { id: '2 Leaflet popup race (C172-C176, C182)' };
  }
  if (row.root === 'portal:0' && /~share-listing$/.test(row.state) && only.length === 1 && only[0] === 'dismiss-escape'
    && hasIt('dismiss-escape').every((x) => x.rules['dismiss-escape'].every((d) => d === 'dismiss-escape: the portal is still visible 5000ms after the dismissal'))) {
    return { id: '3 share tooltip race (C177-C181)' };
  }
  const files = changedFilesOfStory(row.story);
  if (files.length && rowN.pass) return { id: '4 product change (R52), the new row passes', files };
  for (const c of EXTRA_CLASSES) if (c.test(row, only, rowN, rowB)) return { id: `${c.id} (${c.evidence})` };
  return files.length ? { notAllowed: true, files } : null;
}

const [rowsNew, rowsBase] = [load(dirNew), load(dirBase)];
console.log(`platform ${process.platform} node ${process.version}`);
console.log(`new ${dirNew}: ${rowsNew.size} rows; base ${dirBase}: ${rowsBase.size} rows; the base run started about ${new Date(baseStart).toISOString()} (rows.jsonl write time minus ${baseRuntimeSeconds}s); ${committed.size} paths committed since`);
const keys = [...new Set([...rowsNew.keys(), ...rowsBase.keys()])].sort();
const onlyNew = keys.filter((k) => rowsNew.has(k) && !rowsBase.has(k));
const onlyBase = keys.filter((k) => !rowsNew.has(k) && rowsBase.has(k));
console.log(`rows only in the new run ${onlyNew.length} (states / widths added since the base run); only in the base run ${onlyBase.length}`);
const blocked = [];
const byClass = new Map();
let differing = 0;
for (const k of keys) {
  const [n, b] = [rowsNew.get(k), rowsBase.get(k)];
  if (!n || !b) continue;
  const ra = rulesOf(n);
  const rb = rulesOf(b);
  if (ra.join('+') === rb.join('+')) continue;
  differing++;
  const only = [...new Set([...ra.filter((x) => !rb.includes(x)), ...rb.filter((x) => !ra.includes(x))])];
  const cls = classify(n, only, n, b);
  const retries = [n.retry, b.retry].map((x) => (x ? ` retry ${JSON.stringify(x.slice(0, 80))}` : '')).join('');
  const verdict = cls && !cls.notAllowed ? `allowed by class ${cls.id}` : 'NOT ALLOWED';
  const files = cls?.files ? ` [renders changed: ${cls.files.slice(0, 3).join(', ')}${cls.files.length > 3 ? `, +${cls.files.length - 3}` : ''}]` : '';
  console.log(`DIFF ${k} :: new ${label(n)} || base ${label(b)} :: ${verdict}${files}${retries ? ` ::${retries}` : ''}`);
  if (cls && !cls.notAllowed) byClass.set(cls.id, (byClass.get(cls.id) ?? 0) + 1);
  else blocked.push({ k, only, row: n, files: cls?.files ?? [] });
}
console.log(`\nrows in both runs ${keys.length - onlyNew.length - onlyBase.length}; rows with a difference ${differing}`);
for (const [c, n] of byClass) console.log(`  allowed, class ${c}: ${n}`);
const newRuleOnly = blocked.filter((x) => x.only.length && x.only.every((r) => NEW_RULES.has(r)));
const productFail = blocked.filter((x) => x.files.length && !(x.only.length && x.only.every((r) => NEW_RULES.has(r))));
console.log(`differences NOT allowed (R33: diagnose, then outcome (i) gate defect / (ii) product race / (iii) unresolved): ${blocked.length}`);
console.log(`  of them, informational: only a rule the base run could not measure (${[...NEW_RULES].join(', ')}): ${newRuleOnly.length}; a Story that renders a changed file and whose new row fails: ${productFail.length}; the rest: ${blocked.length - newRuleOnly.length - productFail.length}`);
const byStory = new Map();
for (const x of blocked) byStory.set(x.row.story, (byStory.get(x.row.story) ?? 0) + 1);
console.log(`  NOT ALLOWED rows per Story (${byStory.size} Stories): ${[...byStory].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([s, n]) => `${s} ${n}`).join('; ')}${byStory.size > 40 ? '; …' : ''}`);
process.exitCode = blocked.length === 0 ? 0 : 1;
