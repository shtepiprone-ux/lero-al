// Task 931 revision 3 self-audit (Opus, read-only, 2026-11-02): for every reviewed contract on disk, is the review digest
// current or carried by a valid rebase chain, and does its report scope hash validate? Usage: node <this file>
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
import { scopeDigest, scopeHashErrors, rebaseChain } from '../../../../../scripts/workflow-gates/contract.mjs';
import { readJson } from '../../../../../scripts/workflow-gates/cli.mjs';

const ROOT = resolve(fileURLToPath(new URL('../../../../..', import.meta.url)));
for (const dir of ['tasks/Sprints', 'tasks/Archive']) for (const f of readdirSync(resolve(ROOT, dir))) {
  if (!f.endsWith('.security.json')) continue;
  let c; try { c = readJson(ROOT, `${dir}/${f}`); } catch { continue; }
  if (!Array.isArray(c.scope) || c.stage !== 'reviewed') continue;
  const current = scopeDigest(ROOT, c);
  const review = scopeHashErrors(ROOT, c, c.review?.scopeSha256, 'review scope hash is stale');
  let report = ['(no report)'];
  try { if (c.report) report = scopeHashErrors(ROOT, c, readJson(ROOT, c.report).scopeSha256, 'report scope hash is stale'); } catch (e) { report = [`report unreadable: ${e.message}`]; }
  console.log(`${dir}/${f} [${c.kind}] rebases ${rebaseChain(c).entries.length}; review current ${c.review?.scopeSha256 === current}; review errors ${JSON.stringify(review)}; report errors ${JSON.stringify(report)}`);
}
