// Task 945 review, read-only: which reviewed contracts does the whole commit 0c1e09eb1 stale, per changed file, measured by scopeDigest
// with each changed file read from the base revision instead (overrides), so that the measure is of this commit and not of the scope list.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve('.');
const { scopeDigest, workflowRuleInputs } = await import(`file:///${ROOT.replaceAll('\\', '/')}/scripts/workflow-gates/contract.mjs`);
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
const BASE = '929558a66', HEAD = '0c1e09eb1';
const changed = git('diff', '--name-only', BASE, HEAD).split(/\r?\n/).filter(Boolean);
const contracts = [];
for (const folder of ['tasks/Archive', 'tasks/Sprints']) for (const name of readdirSync(join(ROOT, folder)).filter(f => f.endsWith('.security.json'))) {
  const path = `${folder}/${name}`;
  let contract; try { contract = JSON.parse(readFileSync(join(ROOT, path), 'utf8')); } catch { continue; }
  if (contract.stage !== 'reviewed' || !contract.review) continue;
  contracts.push({ path, contract, task: /Task_(\d+)/.exec(name)?.[1] });
}
console.log(`${contracts.length} reviewed contracts; ${changed.length} files in the commit`);
const roleInputs = {};
const results = {};
for (const { path, contract, task } of contracts) {
  // Direct scope hits.
  const scope = new Set(contract.scope || []);
  const hits = changed.filter(file => scope.has(file));
  // Rule inputs: the files the rules digest reads.
  let inputs = [];
  try { inputs = workflowRuleInputs(ROOT, contract.rules || []).map(entry => (typeof entry === 'string' ? entry : entry.path || entry.file)); } catch (error) { inputs = [`ERROR ${error.message}`]; }
  const ruleHits = changed.filter(file => inputs.includes(file));
  // Declared last digest in the chain vs now.
  let now = null; try { now = scopeDigest(ROOT, contract); } catch (error) { now = `ERROR ${error.message}`; }
  const rebases = contract.review.rebases || [];
  const last = rebases.length ? rebases[rebases.length - 1].rebasedScopeSha256 : contract.review.rulesRebase?.rebasedScopeSha256 || contract.review.scopeSha256;
  results[task || path] = { kind: contract.kind || 'legacy', stale: now !== last, scopeHits: hits, ruleHits, rebases: rebases.map(r => r.kind), hasLegacy: Boolean(contract.review.rulesRebase) };
}
for (const [task, r] of Object.entries(results).sort()) if (r.stale || r.scopeHits.length || r.ruleHits.length) console.log(task, JSON.stringify(r));
console.log('not stale and untouched:', Object.entries(results).filter(([, r]) => !r.stale && !r.scopeHits.length && !r.ruleHits.length).map(([t]) => t).join(' '));
