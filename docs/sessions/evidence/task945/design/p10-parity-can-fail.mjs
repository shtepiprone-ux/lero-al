// Task 945 design: the locale parity gate reads the folder above its own file, so a copy in a temporary root proves it can fail. Nothing in the project changes.
// Run from the project root: node docs/sessions/evidence/task945/design/p10-parity-can-fail.mjs
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const fx = mkdtempSync(join(tmpdir(), 'lero-945-parity-'));
mkdirSync(join(fx, 'scripts'));
mkdirSync(join(fx, 'src'));
cpSync('scripts/check-i18n-parity.mjs', join(fx, 'scripts/check-i18n-parity.mjs'));
cpSync('messages', join(fx, 'messages'), { recursive: true });
const run = () => spawnSync(process.execPath, ['scripts/check-i18n-parity.mjs'], { cwd: fx, encoding: 'utf8' });
const last = out => `${out.stdout}\n${out.stderr}`.split('\n').map(line => line.trim()).filter(Boolean).at(-1)?.slice(0, 120);
const before = run();
console.log(`copy of the messages unchanged: exit ${before.status}; ${last(before)}`);
const en = JSON.parse(readFileSync(join(fx, 'messages/en.json'), 'utf8'));
const top = Object.keys(en)[0];
delete en[top];
writeFileSync(join(fx, 'messages/en.json'), JSON.stringify(en));
const after = run();
console.log(`one top-level group removed from en.json: exit ${after.status}; ${last(after)}`);
rmSync(fx, { recursive: true, force: true });
