#!/usr/bin/env node
// Task 945 (owner, 2026-11-05, OWASP Secure Coding with AI sections 1 and 2, NPM Security): an AI suggests package names that do not exist, which
// attackers then register, and versions it does not know are vulnerable. So a package this change adds must exist and be old enough, the lock file
// may fetch only from the one registry, and a known high or critical advisory that was not there before refuses the change. A check that could
// not reach the registry did not pass. Advisories already in the tree are listed in audit-baseline.json, and changing that file stops the agent.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const REGISTRY = 'https://registry.npmjs.org/';
const BASELINE = 'scripts/workflow-gates/audit-baseline.json';
const SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const DAY = 86400000;
const SERIOUS = new Set(['high', 'critical']);
const npm = (args, root) => spawnSync('npm', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, shell: process.platform === 'win32', windowsHide: true, timeout: 60000 });

const manifestAt = (root, base) => {
  const shown = spawnSync('git', ['show', `${base}:package.json`], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26, windowsHide: true });
  if (shown.status !== 0) return {};
  try { return JSON.parse(shown.stdout); } catch { return {}; }
};
const allOf = manifest => Object.assign({}, ...SECTIONS.map(section => manifest[section] || {}));

// When each version of a package was published, or null when the registry has no such package.
function publishedTimes(name, root) {
  const run = npm(['view', name, 'time', '--json'], root);
  if (run.status !== 0) {
    if (/E404|404 Not Found/.test(`${run.stdout}${run.stderr}`)) return null;
    throw new Error(`npm view ${name} could not finish: ${String(run.stderr).trim().split(/\r?\n/)[0] || `exit ${run.status}`}`);
  }
  return JSON.parse(run.stdout);
}
function auditFindings(root) {
  // npm audit exits 1 when it finds anything, so only its output says whether it ran.
  const run = npm(['audit', '--json'], root);
  let report;
  try { report = JSON.parse(run.stdout); } catch { throw new Error(`npm audit could not finish: ${String(run.stderr).trim().split(/\r?\n/)[0] || `exit ${run.status}`}`); }
  if (report.error || !report.vulnerabilities) throw new Error(`npm audit could not finish: ${report.error?.summary || 'no result'}`);
  return advisoriesOf(report);
}
export function advisoriesOf(report) {
  const found = new Map();
  for (const vulnerability of Object.values(report.vulnerabilities)) for (const via of vulnerability.via) {
    if (typeof via === 'object' && SERIOUS.has(via.severity)) found.set(String(via.source), { id: String(via.source), name: via.name, severity: via.severity, title: via.title });
  }
  return [...found.values()].sort((a, b) => a.id.localeCompare(b.id));
}

// Fails: packages that do not exist, are too new, come from elsewhere, or bring a new serious advisory. Notes: what a reader should look at.
export function checkDependencies({ root, base = 'HEAD', limits, times = publishedTimes, audit = auditFindings, now = Date.now() }) {
  const failures = [], notes = [];
  const packagePath = join(root, 'package.json'), lockPath = join(root, 'package-lock.json');
  if (!existsSync(packagePath)) return { failures, notes };
  const manifest = JSON.parse(readFileSync(packagePath, 'utf8'));
  const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : null;
  const before = allOf(manifestAt(root, base)), after = allOf(manifest);
  const lockVersion = name => lock?.packages?.[`node_modules/${name}`]?.version;
  for (const name of Object.keys(after).filter(name => before[name] !== after[name])) {
    const isNew = !(name in before);
    const published = times(name, root);
    if (!published) { failures.push(`package.json: ${name} does not exist on the registry. An AI may have invented this name, and anyone can register it (CWE-1104)`); continue; }
    const age = when => (now - Date.parse(when)) / DAY;
    if (isNew && age(published.created) < limits.minPackageAgeDays) failures.push(`package.json: ${name} is ${Math.floor(age(published.created))} days old, under the ${limits.minPackageAgeDays} days a new package must wait; check who publishes it`);
    const version = lockVersion(name);
    if (version && published[version] && age(published[version]) < limits.minVersionAgeDays) failures.push(`package.json: ${name}@${version} was published ${Math.floor(age(published[version]))} days ago, under the ${limits.minVersionAgeDays} days a version must circulate first`);
    if (version && !published[version]) failures.push(`package-lock.json: ${name}@${version} is not a version the registry has`);
  }
  if (lock) for (const [path, entry] of Object.entries(lock.packages || {})) {
    if (entry.resolved && !entry.link && !entry.resolved.startsWith(REGISTRY)) failures.push(`package-lock.json: ${path} is fetched from ${entry.resolved}, not from ${REGISTRY}`);
    else if (entry.resolved && !entry.link && !entry.integrity) failures.push(`package-lock.json: ${path} has no integrity hash, so a changed package would go unseen`);
  }
  const known = existsSync(join(root, BASELINE)) ? new Set(JSON.parse(readFileSync(join(root, BASELINE), 'utf8')).advisories.map(entry => entry.id)) : new Set();
  const findings = audit(root);
  for (const finding of findings.filter(entry => !known.has(entry.id))) failures.push(`package-lock.json: new ${finding.severity} advisory ${finding.id} in ${finding.name}: ${finding.title}`);
  const open = findings.filter(entry => known.has(entry.id));
  if (open.length) notes.push(`${open.length} known high or critical advisories remain open in ${BASELINE}`);
  return { failures, notes };
}

const pathKey = path => {
  let real = resolve(path);
  try { real = realpathSync.native(real); } catch { /* the resolved path */ }
  return process.platform === 'win32' ? real.toLowerCase() : real;
};
if (process.argv[1] && pathKey(process.argv[1]) === pathKey(fileURLToPath(import.meta.url))) {
  const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  try {
    const { dependencies: limits } = JSON.parse(readFileSync(join(root, 'scripts/workflow-gates/code-check.json'), 'utf8'));
    const { failures, notes } = checkDependencies({ root, limits });
    for (const line of [...failures, ...notes]) process.stdout.write(`${line}\n`);
    process.exit(failures.length ? 1 : 0);
  } catch (error) {
    process.stderr.write(`package.json: the dependency check could not finish: ${error.message}\n`);
    process.exit(1);
  }
}
