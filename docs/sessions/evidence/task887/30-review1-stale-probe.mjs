// Task 887 review 1 — adversarial probe (Opus reviewer, 2026-09-30).
// Falsifies the kickoff §11 row "stale entry after a later rewrite of :50" by execution rather than by reading:
// rewrite the fingerprinted literal in contactEvents.ts to a different status set, run the gate, restore.
// Single-file write scope, Node UTF-8 I/O, git hash-object witness before and after (agent-contract 14).
// Run from the project root: node.exe docs/sessions/evidence/task887/30-review1-stale-probe.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';

const TARGET = 'src/modules/listings/actions/contactEvents.ts';
const FP = ".in('status', ['active', 'sold', 'rented', 'archived'])";
const REPLACEMENT = ".in('status', ['active', 'sold'])";
const hash = () => execFileSync('git', ['hash-object', TARGET], { encoding: 'utf8' }).trim();

const before = hash();
const original = readFileSync(TARGET, 'utf8');
if (original.split(FP).length !== 2) throw new Error('fingerprint must occur exactly once');
let gate;
try {
  writeFileSync(TARGET, original.replace(FP, REPLACEMENT));
  console.log(`planted hash: ${hash()}`);
  gate = spawnSync(process.execPath, ['scripts/check-listing-visibility.mjs'], { encoding: 'utf8' });
} finally {
  writeFileSync(TARGET, original);
}
const after = hash();
const out = `${gate.stdout}\n${gate.stderr}`;
const staleNamed = /Stale allowlist entries[\s\S]*src\/modules\/listings\/actions\/contactEvents\.ts/.test(out);
const lineNamed = /contactEvents\.ts:50\s+\.in\('status', \['active', 'sold'\]\)/.test(out);
console.log(out.trim());
console.log(`gate exit=${gate.status}; stale entry named=${staleNamed}; new literal named at :50=${lineNamed}`);
console.log(`hash before=${before} after=${after} restored=${before === after}`);
process.exit(gate.status === 1 && staleNamed && lineNamed && before === after ? 0 : 1);
