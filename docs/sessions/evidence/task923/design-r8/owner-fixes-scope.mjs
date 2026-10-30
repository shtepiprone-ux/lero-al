// Task 923 Revision 8 design (Opus) - the write scope of the owner-directed fixes (D14) and the 640px work (D15/D24, R39), derived from
// evidence only: (1) product files named by a closed finding of r8-152-security-findings.md that the working tree changed, (2) product
// files the mutation harness breaks in the security groups sec2-sec26 that the working tree changed, (3) the three product files the
// session log names for the later coverage work, (4) the R39 sites, (5) every test file of those mutations and of the closed findings.
// Read-only. Usage: node docs/sessions/evidence/task923/design-r8/owner-fixes-scope.mjs docs/sessions/evidence/task923/design-r8/owner-fixes-scope.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const status = new Map(execFileSync('git', ['--no-optional-locks', 'status', '--porcelain', '-z', '--untracked-files=all'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\0').filter(Boolean).map(entry => [entry.slice(3).replaceAll('\\', '/'), entry.slice(0, 2)]));
const changed = path => status.has(path);
const mutations = JSON.parse(readFileSync('docs/sessions/evidence/task923/design-r8/s-mutation-inventory.json', 'utf8'));
const findings = JSON.parse(readFileSync('docs/sessions/evidence/task923/design-r8/s-inventory.json', 'utf8')).findings;
const CLOSED = new Set(['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S15','S16','S17','S18','S20','S21','S22','S27','S28','S29','S30','S33','S34','S35','S36','S37','S38','S39','S41','S42','S43','S44','S45','S46','S48','S49','S50','S52','S53','S54','S55','S56','S57','S58']);
const securityGroup = g => /^sec(\d+)$/.test(g) && Number(g.slice(3)) >= 2 && Number(g.slice(3)) <= 26;
const product = new Map();
const add = (path, why) => { if (!path || !existsSync(path) && !changed(path)) return; const row = product.get(path) ?? { path, git: status.get(path) ?? 'clean', why: [] }; row.why.push(why); product.set(path, row); };
for (const f of findings) if (CLOSED.has(f.id)) for (const file of f.files) if (file.path && changed(file.path) && !/\.test\./.test(file.path)) add(file.path, `finding ${f.id}`);
for (const row of mutations.files) if (row.git !== 'clean' && row.groups.some(securityGroup)) add(row.file, `mutations ${row.groups.filter(securityGroup).join(',')}`);
for (const path of ['src/components/layout/Header.tsx', 'src/components/layout/Footer.tsx', 'src/modules/auth/components/ResetPasswordClient.tsx']) add(path, 'session log :856 (coverage work)');
for (const path of ['src/design-system/mantine/belowMobileGate.ts', 'src/design-system/mantine/patterns/MantineDataTableToCards.tsx', 'src/design-system/mantine/patterns/MantineAdminSurfacePattern.tsx',
  'src/design-system/mantine/patterns/responsiveBottomSheet.tsx', 'src/design-system/mantine/patterns/MantineDialogDrawerPattern.tsx', 'src/design-system/mantine/patterns/RangeDatePicker.tsx',
  'src/components/admin/AdminTable.tsx', 'src/components/admin/AdminListingsView.tsx', 'src/components/admin/AdminCurrenciesView.tsx', 'src/components/admin/AdminReportsView.tsx',
  'src/components/admin/AdminPagesView.tsx', 'src/components/admin/AdminExchangeProvidersView.tsx', 'src/modules/listings/components/ListingsFilters.tsx']) add(path, 'R39');
const tests = new Set();
for (const row of mutations.files) if (row.groups.some(securityGroup) || ['src/components/layout/Header.tsx', 'src/components/layout/Footer.tsx', 'src/modules/auth/components/ResetPasswordClient.tsx'].includes(row.file)) row.tests.forEach(t => tests.add(t));
const out = { product: [...product.values()].sort((a, b) => (a.path < b.path ? -1 : 1)), tests: [...tests].sort().map(t => ({ path: t, git: status.get(t) ?? 'clean' })) };
writeFileSync(process.argv[2], JSON.stringify(out, null, 2) + '\n');
console.log(`product ${out.product.length} (changed ${out.product.filter(p => p.git !== 'clean').length}); tests ${out.tests.length}`);
for (const p of out.product) console.log(`${p.git.padEnd(5)} ${p.path} <- ${p.why.join('; ')}`);
