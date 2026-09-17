// Reviewer replay of Task 829 §10.3-§10.6 in an isolated copy. Never writes to the repo.
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const S = process.argv[2];
const REPO = process.argv[3];
const C = 'src/design-system/mantine/patterns/MantineListingContactPattern.tsx';
const D = 'src/design-system/mantine/patterns/MantineListingDetailPattern.tsx';
const BL = join(S, 'scripts', 'enrolled-tailwind-baseline.json');
const sha = (p) => createHash('sha1').update(readFileSync(p)).digest('hex');
const gate = (label, ...flags) => {
  const r = spawnSync(process.execPath, [join(S, 'scripts', 'check-enrolled-tailwind.mjs'), ...flags], { encoding: 'utf8' });
  console.log(`\n===== ${label} (${flags.join(' ') || 'gate'}) EXIT_CODE=${r.status}`);
  const out = (r.stdout + r.stderr).split('\n').filter((l) => /FAIL|PASS|Enrolled files|^\s{4}src\/|^\s{6}src\/|Baseline:/.test(l));
  console.log(out.join('\n'));
  return r.status;
};
const headOf = (p) => execFileSync('git', ['-C', REPO, 'show', `HEAD:${p}`]);

if (existsSync(BL)) rmSync(BL);
// §10.3 pre-migration
writeFileSync(join(S, C), headOf(C));
writeFileSync(join(S, D), headOf(D));
gate('10.3 pre-migration, no baseline');
gate('10.3 seed refused', '--seed-baseline');
console.log('baseline exists after refused seed:', existsSync(BL));
// §10.4 post-migration (worktree versions)
writeFileSync(join(S, C), readFileSync(join(REPO, C)));
writeFileSync(join(S, D), readFileSync(join(REPO, D)));
gate('10.4 post-migration, no baseline');
gate('10.5 seed', '--seed-baseline');
console.log('seeded == repo baseline bytes:', sha(BL) === sha(join(REPO, 'scripts', 'enrolled-tailwind-baseline.json')));
gate('10.5 gate green');
// §10.6 plant on FINAL detail pattern
const before = sha(join(S, D));
const txt = readFileSync(join(S, D), 'utf8');
const planted = txt.replace('<MapPin size={theme.other.iconSize.standard} style=', '<MapPin size={theme.other.iconSize.standard} className="p-2" style=');
console.log('plant applied:', planted !== txt);
writeFileSync(join(S, D), planted, 'utf8');
gate('10.6 plant p-2');
writeFileSync(join(S, D), txt, 'utf8');
console.log('restore hash equal:', sha(join(S, D)) === before);
gate('10.6 restored');
// extra: stale arm on real data (pay down one gallery token without update)
const g = 'src/design-system/mantine/patterns/MantineListingGalleryPattern.tsx';
const gt = readFileSync(join(S, g), 'utf8');
const gp = gt.replace('text-xs', '');
console.log('stale plant applied:', gp !== gt);
writeFileSync(join(S, g), gp, 'utf8');
gate('extra stale');
gate('extra update-baseline', '--update-baseline');
gate('extra gate after update');
writeFileSync(join(S, g), gt, 'utf8');
gate('extra re-add after update (must fail new)');
// extra: R1 missing manifest path
const m = join(S, 'scripts', 'mantine-migration-scope.json');
const mt = readFileSync(m, 'utf8');
writeFileSync(m, JSON.stringify([...JSON.parse(mt), 'src/does/not/Exist.tsx']));
gate('extra R1 missing path');
writeFileSync(m, mt);
// extra: Tailwind token in a template / cn() on a real enrolled file
const dt = readFileSync(join(S, D), 'utf8');
writeFileSync(join(S, D), dt.replace('<Text size="sm" c="dimmed">', '<Text size="sm" c="dimmed" className={`${"x"} mt-1`}>'), 'utf8');
gate('extra template plant');
writeFileSync(join(S, D), dt, 'utf8');
// extra: oracle failure -> exit 2 end to end (unresolvable @import in the scratch globals.css)
const g2 = join(S, 'src', 'app', 'globals.css');
const g2t = readFileSync(g2, 'utf8');
writeFileSync(g2, '@import "task829-review-nonexistent-package";\n' + g2t, 'utf8');
gate('extra oracle failure');
writeFileSync(g2, g2t, 'utf8');
gate('extra oracle restored');
