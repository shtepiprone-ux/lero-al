#!/usr/bin/env node
// The live `main` ruleset matches scripts/quality/main-ruleset.json (Task 945 AC7). OWASP basis: CI/CD Security and
// GitHub Actions Security — branch protection is configuration that drifts silently; it is checked like code.
//
//   node scripts/quality/check-ruleset.mjs [--id 26303244] [--repo shtepiprone-ux/lero-al]
//
// Reads the live ruleset with the GitHub CLI (GH_TOKEN in CI). Exit 1 on drift, 2 when it cannot run.

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEntryPoint } from '../lib/entry-point.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const norm = (v) => (Array.isArray(v) ? v.map(norm).map((x) => JSON.stringify(x)).sort() : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, norm(v[k])])) : v);
const same = (a, b) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));

/** Differences between the expected payload and the live ruleset. Every expected field must match exactly; a live
 *  rule type the payload does not name is also drift (the payload is the whole policy). */
export function compareRuleset(expected, live) {
  const out = [];
  // GitHub returns bypass_actors only to a token that may administer the repository. Its absence is not "no bypass":
  // the check cannot vouch for it and says so, rather than passing.
  if (live && !('bypass_actors' in live)) out.push('bypass_actors: not returned — the token cannot read them (needs Administration: read); nothing is verified about who may bypass');
  for (const key of ['target', 'enforcement', 'bypass_actors', 'conditions']) {
    if (key === 'bypass_actors' && live && !('bypass_actors' in live)) continue;
    if (!same(expected[key], live?.[key])) out.push(`${key}: expected ${JSON.stringify(expected[key])}, live ${JSON.stringify(live?.[key])}`);
  }
  const liveRules = new Map((live?.rules ?? []).map((r) => [r.type, r]));
  for (const rule of expected.rules) {
    const l = liveRules.get(rule.type);
    if (!l) { out.push(`rule ${rule.type}: missing`); continue; }
    for (const [k, v] of Object.entries(rule.parameters ?? {})) {
      if (!same(v, l.parameters?.[k])) out.push(`rule ${rule.type}.${k}: expected ${JSON.stringify(v)}, live ${JSON.stringify(l.parameters?.[k])}`);
    }
  }
  const named = new Set(expected.rules.map((r) => r.type));
  for (const type of liveRules.keys()) if (!named.has(type)) out.push(`rule ${type}: live but not in the payload`);
  return out;
}

function arg(argv, name, fallback) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

if (isEntryPoint(import.meta.url)) {
  const argv = process.argv.slice(2);
  const id = arg(argv, '--id', '26303244');
  const repo = arg(argv, '--repo', 'shtepiprone-ux/lero-al');
  const r = spawnSync('gh', ['api', `repos/${repo}/rulesets/${id}`], { encoding: 'utf8', windowsHide: true });
  if (r.error) {
    console.error(`check-ruleset could not start the GitHub CLI: ${r.error.message}`);
    process.exit(2);
  }
  if (r.status !== 0) {
    console.error(`check-ruleset could not read the live ruleset: ${(r.stderr || r.error || '').toString().trim()}`);
    process.exit(2);
  }
  const expected = JSON.parse(readFileSync(path.join(ROOT, 'scripts/quality/main-ruleset.json'), 'utf8'));
  const diff = compareRuleset(expected, JSON.parse(r.stdout));
  for (const d of diff) console.error(`ruleset drift: ${d}`);
  console.log(diff.length ? `check-ruleset: ${diff.length} difference(s) — apply scripts/quality/main-ruleset.json` : 'check-ruleset: the live ruleset matches scripts/quality/main-ruleset.json');
  process.exit(diff.length ? 1 : 0);
}
