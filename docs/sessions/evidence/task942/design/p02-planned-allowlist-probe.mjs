// Task 942 design probe: does the planned allowlist change make the real listing-visibility gate pass on the current tree,
// and do the planned self-test cases hold? Builds a temporary copy of the committed (HEAD) gate with exactly the planned
// allowlist edits (contact-event fingerprint -> ".eq('status', 'active')", stale detail-page entry removed) and ROOT pointed
// at this repository, then runs it in strict and --verify-gate modes. Writes only in the system temp directory.
// Usage (repo root): node docs/sessions/evidence/task942/design/p02-planned-allowlist-probe.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const head = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
const original = execFileSync('git', ['show', 'HEAD:scripts/check-listing-visibility.mjs'], { encoding: 'utf8' });
const lines = original.split('\n');
const OLD_CONTACT = ".in('status', ['active', 'sold', 'rented', 'archived'])\", reason: 'single-row WhatsApp contact-event lookup";
const contactIdx = lines.findIndex(l => l.includes("src/modules/listings/actions/contactEvents.ts") && l.includes(OLD_CONTACT));
const pageIdx = lines.findIndex(l => l.includes("path: 'src/app/[locale]/listings/[slug]/page.tsx'"));
const rootIdx = lines.findIndex(l => l.startsWith('const ROOT = '));
console.log(`HEAD ${head}; contact entry line ${contactIdx + 1}, detail-page entry line ${pageIdx + 1}, ROOT line ${rootIdx + 1}`);
if (contactIdx < 0 || pageIdx < 0 || rootIdx < 0) { console.log('PLANNED ALLOWLIST PROBE FAILED (anchor lines not found)'); process.exit(1); }

const planned = [...lines];
planned[contactIdx] = "  { path: 'src/modules/listings/actions/contactEvents.ts', fingerprint: \".eq('status', 'active')\", reason: 'single-row WhatsApp contact-event lookup by id (service role, Task 850): only an active listing of a live owner has a contact card (Task 923 R66 (f), owner F2), the same status-only rule as the detail page, which applies no expiry filter; not a public list read' },";
planned[rootIdx] = `const ROOT = ${JSON.stringify(root)};`;
planned.splice(pageIdx, 1);

const dir = mkdtempSync(join(tmpdir(), 't942-'));
const copy = join(dir, 'check-listing-visibility.planned.mjs');
let ok = true;
try {
  writeFileSync(copy, planned.join('\n'));
  const strict = spawnSync(process.execPath, [copy], { cwd: root, encoding: 'utf8' });
  const strictOut = (strict.stdout + strict.stderr).trim().split('\n').filter(l => !l.startsWith('ℹ️'));
  console.log(`strict run exit ${strict.status}:`); for (const l of strictOut) console.log(`   ${l}`);
  ok = ok && strict.status === 0 && strictOut.some(l => l.includes('Allowlist: 8 entries, 0 stale.'));

  const verify = spawnSync(process.execPath, [copy, '--verify-gate'], { cwd: root, encoding: 'utf8' });
  const verifyTail = (verify.stdout + verify.stderr).trim().split('\n').slice(-2);
  console.log(`--verify-gate exit ${verify.status}: ${verifyTail.join(' | ')}`);
  ok = ok && verify.status === 0;

  // The planned path-pinning case: the allowed literal in another file is still reported by the exported detector.
  // Importing the copy runs its scan (the module has no main guard yet), so read the detector in a child process.
  const literal = "const { data } = await db\n  .from('listings')\n  .select('id')\n  .eq('id', id)\n  .eq('status', 'active')\n  .maybeSingle()\n";
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', `
    process.exit = () => {}; console.log = () => {}; console.error = () => {};
    const m = await import(${JSON.stringify(pathToFileURL(copy).href)});
    const allowed = m.detectVisibilityViolations(${JSON.stringify(literal)}, 'src/modules/listings/actions/contactEvents.ts');
    const other = m.detectVisibilityViolations(${JSON.stringify(literal)}, 'src/modules/listings/actions/otherAction.ts');
    process.stdout.write(JSON.stringify({ allowed: allowed.length, other: other.map(v => v.line + ' ' + v.text) }));
  `], { cwd: root, encoding: 'utf8' });
  console.log(`detector on the literal: ${child.stdout.trim() || child.stderr.trim()}`);
  const parsed = JSON.parse(child.stdout || '{}');
  ok = ok && parsed.allowed === 0 && Array.isArray(parsed.other) && parsed.other.length === 1;
} finally { rmSync(dir, { recursive: true, force: true }); }
console.log(ok ? 'PLANNED ALLOWLIST PROBE PASSED' : 'PLANNED ALLOWLIST PROBE FAILED');
process.exitCode = ok ? 0 : 1;
