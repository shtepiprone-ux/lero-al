// Task 923 Revision 8 design (Opus, 2026-10-18): every place in product code that reads a person's role from public.users to decide what they
// may do, and whether the same file also checks that the account still has access (owner 2026-10-18: deleted or blocked applies to every user).
// Read-only. Run from the repository root:
//   node docs/sessions/evidence/task923/design-r8/role-guard-inventory.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'docs/sessions/evidence/task923/design-r8/role-guard-inventory.json';
const SKIP = /\.(test|spec|stories)\.[cm]?[jt]sx?$|[\\/]__tests__[\\/]/;
const ROLE_READ = /\.select\(\s*['"]role['"]\s*\)/;
const ACCESS = /requireViewer|getBlockedError|accountHasAccess|deleted_at/;

const files = [];
const walk = dir => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.[cm]?[jt]sx?$/.test(e.name) && !SKIP.test(p)) files.push(p.split('\\').join('/'));
  }
};
walk('src');
files.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

const rows = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const text = lines.join('\n');
  lines.forEach((line, i) => {
    if (!ROLE_READ.test(line)) return;
    // the role read is a multi-line chain when `.select('role')` stands alone: look back to the client the chain starts from
    const window = lines.slice(Math.max(0, i - 4), i + 1).join('\n');
    const client = /createAdminClient\(\)|\bdb\b|\badmin\b/.test(window) ? 'service role (bypasses RLS)' : 'session (RLS applies)';
    rows.push({ file, line: i + 1, client, sameFileAccessCheck: ACCESS.test(text), text: line.trim() });
  });
}
// every server entry point: a file with a 'use server' directive line (module or function level), and every App Router route handler
const entries = files
  .filter(f => /^\s*['"]use server['"]/m.test(readFileSync(f, 'utf8')) || /^src\/app\/.*\/route\.[jt]s$/.test(f))
  .map(file => {
    const text = readFileSync(file, 'utf8');
    const has = re => re.test(text);
    return {
      file,
      accountCheck: has(/requireViewer|getBlockedError/) ? 'requireViewer/getBlockedError' : has(/accountHasAccess|deleted_at/) ? 'partial (own status or deleted_at read)' : 'none',
      roleOnlyGuard: has(ROLE_READ) || has(/getStaffRole|hasPermission|assertPermission/),
      serviceRole: has(/createAdminClient/),
      noPerson: has(/CRON_SECRET|webhook/i) && !has(/getUser\(/),
    };
  });
writeFileSync(OUT, JSON.stringify({ generated: '2026-10-18', rows, entries }, null, 2) + '\n', 'utf8');
console.log(`entry points: ${entries.length}; without requireViewer/getBlockedError: ${entries.filter(e => e.accountCheck !== 'requireViewer/getBlockedError').length}; of those acting for no person (cron, webhook): ${entries.filter(e => e.accountCheck !== 'requireViewer/getBlockedError' && e.noPerson).length}`);
for (const e of entries) console.log(`${e.file} | account check: ${e.accountCheck} | role guard: ${e.roleOnlyGuard ? 'yes' : 'no'} | service role: ${e.serviceRole ? 'yes' : 'no'}${e.noPerson ? ' | no person' : ''}`);
const sr = rows.filter(r => r.client.startsWith('service'));
console.log(`role reads: ${rows.length} in ${new Set(rows.map(r => r.file)).size} files; service role: ${sr.length}; without an access check in the same file: ${rows.filter(r => !r.sameFileAccessCheck).length}`);
for (const r of rows) console.log(`${r.file}:${r.line} | ${r.client} | access check in file: ${r.sameFileAccessCheck ? 'yes' : 'no'}`);
