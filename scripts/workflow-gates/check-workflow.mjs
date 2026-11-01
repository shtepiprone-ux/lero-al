#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateWorkflow(workflow, policy) {
  const errors = [];
  const pins = JSON.parse(readFileSync(new URL('./actions.json', import.meta.url), 'utf8')).pins;
  const check = (ok, reason) => { if (!ok) errors.push(reason); };
  const coreJobs = ['governance', 'unit', 'contracts', 'hooks', 'storybook-build', 'homepage-grid', 'locale-leak', 'click-shield'];
  check(Array.isArray(policy.requiredJobs) && new Set(policy.requiredJobs).size === policy.requiredJobs.length
    && coreJobs.every(id => policy.requiredJobs.includes(id)), 'Required-job registry must retain every core job without duplicates');
  check(workflow.permissions?.contents === 'read' && Object.keys(workflow.permissions).length === 1, 'Workflow permissions must be contents:read only');
  for (const event of ['pull_request', 'push', 'merge_group', 'workflow_dispatch']) check(workflow.on?.[event], `Missing ${event} trigger`);
  check(!workflow.on?.pull_request_target, 'Untrusted PR code must not execute on pull_request_target');
  // The diff base is github.event.before: a cancelled or replaced push run would leave that commit's range unchecked.
  check(workflow.concurrency?.group === "governance-${{ github.event_name }}-${{ github.event_name == 'pull_request' && github.ref || github.sha }}"
    && workflow.concurrency?.['cancel-in-progress'] === "${{ github.event_name == 'pull_request' }}", 'Push concurrency must be per commit; only superseded PR runs may be cancelled');
  for (const event of Object.values(workflow.on || {})) check(!event?.paths && !event?.['paths-ignore'], 'Required workflow must not have path-filter blind spots');
  const required = workflow.jobs?.['governance-required'];
  check(required?.name === 'Governance Required', 'Stable Governance Required check is missing');
  check(required?.if === '${{ always() }}', 'Required summary must run even after failed/skipped/cancelled dependencies');
  check(Array.isArray(required?.needs) && JSON.stringify([...required.needs].sort()) === JSON.stringify([...policy.requiredJobs].sort()), 'Required summary must depend on every registered job');
  check(required?.steps?.some(s => s.run === 'node scripts/workflow-gates/cli.mjs required' && s.env?.GATES_NEEDS_JSON === '${{ toJSON(needs) }}'), 'Required summary must inspect actual needs results');
  for (const id of policy.requiredJobs) {
    check(workflow.jobs?.[id], `Missing mandatory job ${id}`);
    check(workflow.jobs?.[id]?.if === undefined, `Mandatory job ${id} cannot be disabled by a condition`);
  }
  for (const job of Object.values(workflow.jobs || {})) for (const step of job.steps || []) {
    if (step.run && step.if !== undefined) check(step.run === 'node scripts/workflow-gates/run.mjs static'
      && step.if === "${{ !cancelled() && steps.install.outcome == 'success' }}", 'Mandatory executable step cannot be disabled by a conditional');
  }
  check(workflow.jobs?.contracts?.steps?.some(s => s.run === 'node scripts/workflow-gates/cli.mjs diff --phase release'), 'Product CI requires independent reviewed evidence, not just executor completion');
  check(workflow.jobs?.contracts?.environment === 'security-ci', 'Mapped real-boundary tests require the reviewed security-ci environment');
  for (const id of ['contracts', 'click-shield']) {
    const job = workflow.jobs?.[id];
    check(!job?.env?.SUPABASE_SERVICE_ROLE_KEY && !job?.env?.DATABASE_URL, 'Privileged credentials must not be inherited by checkout/install steps');
    check(job?.steps?.some(s => s.env?.SUPABASE_SERVICE_ROLE_KEY === '${{ secrets.SECURITY_CI_SUPABASE_SERVICE_ROLE_KEY }}'), 'Privileged tests must not fall back to repository-level application credentials');
    check(!job?.steps?.some(s => /npm ci|npm run build$/.test(s.run || '') && (s.env?.SUPABASE_SERVICE_ROLE_KEY || s.env?.DATABASE_URL)), 'Dependency installation and builds must not receive private database credentials');
  }
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    check(!Object.hasOwn(value, 'continue-on-error'), 'Required checks cannot use continue-on-error');
    if (value.uses) {
      const [action, revision] = value.uses.split('@');
      check(pins[action] === revision && /^[a-f0-9]{40}$/.test(revision || ''), 'Action must use its verified full commit SHA');
    }
    if (value.uses?.startsWith('actions/checkout@')) check(value.with?.['persist-credentials'] === false, 'Checkout must not leave Git credentials for repository code');
    if (value.uses?.startsWith('actions/setup-node@')) check(value.with?.['node-version'] === policy.ciNodeVersion, 'Use the tested LTS CI Node version');
    Object.values(value).forEach(visit);
  };
  visit(workflow.jobs);
  check(workflow.jobs?.['locale-leak']?.strategy?.['fail-fast'] === false, 'All locale shards must finish independently');
  check(JSON.stringify(workflow.jobs?.['locale-leak']?.strategy?.matrix?.shard) === JSON.stringify([1, 2, 3, 4, 5, 6]), 'Locale shards must cover the complete six-way partition');
  check(workflow.jobs?.['locale-leak']?.steps?.some(s => s.run === 'node scripts/check-locale-leak.mjs --mantine-only --report-only-leaks --shard=${{ matrix.shard }}/6'), 'Locale command must preserve the owner migration exception and scan the complete partition without fast mode');
  check(workflow.jobs?.unit?.steps?.some(s => s.run === 'npm test -- --allowOnly=false --passWithNoTests=false --retry=0 --reporter=default --reporter=json --outputFile=test-results/unit.json'), 'Unit job must execute the complete blocking test suite');
  check(workflow.jobs?.unit?.steps?.some(s => s.run === 'node scripts/workflow-gates/cli.mjs unit-report'), 'Unit job must validate the actual nonempty result artifact');
  check(workflow.jobs?.governance?.steps?.some(s => s.run === 'node scripts/workflow-gates/run.mjs static'), 'Governance job must execute the registered static gates');
  for (const id of ['governance', 'hooks']) check(workflow.jobs?.[id]?.steps?.some(s => s.run === 'node scripts/workflow-gates/selftests.mjs'), `${id}: complete gate self-test discovery is required on both platforms`);
  check(workflow.jobs?.['click-shield']?.environment === 'security-ci', 'Privileged service configuration requires the security-ci environment');
  const release = workflow.jobs?.['release-security-required'];
  check(release?.name === 'Release Security Required' && release.needs?.includes('governance-required'), 'Release must depend on the required governance verdict');
  check(release?.steps?.some(s => s.run === 'node scripts/workflow-gates/cli.mjs release'), 'Release must check unresolved security findings');
  return errors;
}
export function validateSettings(root, settings) {
  const errors = [];
  if (settings.disableAllHooks !== false) errors.push('Shared workflow hooks may not be disabled or inherit an unspecified disabled state');
  const expectedExcludes = ['create', 'execute', 'review', 'shared'].map(dir => `**/.claude/rules/${dir}/**`);
  if (JSON.stringify([...(settings.claudeMdExcludes || [])].sort()) !== JSON.stringify(expectedExcludes.sort())) errors.push('Only explicit phase/detail auto-loading exclusions are allowed; keep entry instructions active');
  for (const [event, groups] of Object.entries(settings.hooks || {})) for (const group of groups) for (const hook of group.hooks || []) {
    if (hook.type !== 'command') { errors.push(`${event}: only inspectable command hooks allowed`); continue; }
    if (hook.onFailure !== 'block') errors.push(`${event}: hook runtime failures must block`);
    if (hook.async || hook.asyncRewake) errors.push(`${event}: mandatory hook cannot run in the background`);
    const gitGuard = hook.args?.some(arg => arg.endsWith('/block-mutating-git.ps1'));
    const expectedMatcher = event === 'PreToolUse' ? (gitGuard ? 'Bash|PowerShell' : 'Edit|Write|Bash|PowerShell') : '';
    if ((group.matcher || '') !== expectedMatcher) errors.push(`${event}: mandatory hook matcher is narrowed or changed`);
    if (!Array.isArray(hook.args) || !hook.args.length) errors.push(`${event}: explicit executable argument vector required`);
    for (const arg of hook.args || []) if (arg.includes('${CLAUDE_PROJECT_DIR}/')) {
      const file = arg.replace('${CLAUDE_PROJECT_DIR}/', '');
      if (!existsSync(join(root, file))) errors.push(`${event}: hook target missing: ${file}`);
    }
  }
  for (const event of ['PreToolUse', 'Stop']) {
    if (!settings.hooks?.[event]?.some(g => g.hooks?.some(h => h.args?.includes('${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/security-hook.mjs')))) errors.push(`${event}: security contract hook is not registered`);
  }
  for (const event of ['SessionStart', 'PostModelSwitch']) {
    if (!settings.hooks?.[event]?.some(g => g.hooks?.some(h => h.args?.includes('${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/session-role.mjs')))) errors.push(`${event}: supported role metadata is not captured`);
  }
  const required = { PreToolUse: ['phase-write-gate', 'block-mutating-git'], Stop: ['orchestrator-response-gate'],
    SessionStart: ['sonnet-executor-bootstrap'], UserPromptSubmit: ['orchestrator-router'] };
  for (const [event, scripts] of Object.entries(required)) for (const script of scripts) {
    if (!settings.hooks?.[event]?.some(g => g.hooks?.some(h => h.args?.includes(`\${CLAUDE_PROJECT_DIR}/.claude/hooks/${script}.ps1`)))) errors.push(`${event}: missing mandatory ${script}`);
  }
  if (!settings.hooks?.Stop?.some(g => g.hooks?.some(h => h.args?.includes('${CLAUDE_PROJECT_DIR}/scripts/workflow-gates/push-safety.mjs')))) errors.push('Stop: role-independent push-evidence guard is not registered');
  return errors;
}

export function validateRuleSizes(root) {
  const paths = ['create', 'review', 'execute'].flatMap(dir => readdirSync(join(root, '.claude/rules', dir))
    .filter(file => file.endsWith('.md')).map(file => `.claude/rules/${dir}/${file}`));
  paths.push(...['create-task', 'review-task', 'execute-task'].map(role => `.claude/skills/${role}/SKILL.md`));
  paths.push(...['workflow-gates', 'workflow-contract', 'workflow-evidence', 'workflow-ci', 'git-publication'].map(name => `.claude/rules/shared/${name}.md`));
  return paths.filter(path => statSync(join(root, path)).size > 8192).map(path => `Operational rule exceeds 8 KiB: ${path}`);
}
export function validateRuleset(ruleset) {
  const errors = [];
  if (ruleset.target !== 'branch' || ruleset.enforcement !== 'active'
    || JSON.stringify(ruleset.conditions?.ref_name) !== JSON.stringify({ include: ['refs/heads/main'], exclude: [] })) errors.push('Ruleset must enforce main only');
  if (!Array.isArray(ruleset.bypass_actors) || ruleset.bypass_actors.length) errors.push('Ruleset must have no bypass actors');
  // Owner decision 2026-11-01: main accepts changes only through a PR whose two stable summaries passed in Actions.
  for (const type of ['deletion', 'non_fast_forward', 'pull_request', 'required_status_checks']) if (!ruleset.rules?.some(r => r.type === type)) errors.push(`Ruleset missing ${type}`);
  const checks = ruleset.rules?.find(r => r.type === 'required_status_checks')?.parameters;
  if (checks && (checks.strict_required_status_checks_policy !== true || JSON.stringify(checks.required_status_checks)
    !== JSON.stringify(['Governance Required', 'Release Security Required'].map(context => ({ context, integration_id: 15368 }))))) errors.push('Ruleset must require both stable summaries from GitHub Actions on an up-to-date branch');
  return errors;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
    // JSON is a YAML subset. Keeping this workflow in JSON form permits strict parsing without an extra dependency.
    const workflow = JSON.parse(readFileSync(join(root, '.github/workflows/governance-pr.yml'), 'utf8'));
    const policy = JSON.parse(readFileSync(join(root, 'scripts/workflow-gates/pipeline.json'), 'utf8'));
    const settings = JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8'));
    const ruleset = JSON.parse(readFileSync(join(root, 'scripts/workflow-gates/main.ruleset.json'), 'utf8'));
    const errors = [...validateWorkflow(workflow, policy), ...validateSettings(root, settings), ...validateRuleset(ruleset), ...validateRuleSizes(root)];
    for (const role of ['executor', 'orchestrator']) {
      if (!/^tools:.*\bPowerShell\b/m.test(readFileSync(join(root, `.claude/agents/${role}.md`), 'utf8'))) errors.push(`${role}: required PowerShell receipt tool unavailable`);
    }
    if (!existsSync(join(root, '.claude/hooks/session-role.ps1'))) errors.push('PowerShell session role reader is missing');
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    for (const command of Object.values(policy.groups).flat()) {
      if (command[0] === 'npm' && !pkg.scripts[command[2]]) errors.push(`Unregistered npm gate: ${command[2]}`);
      if (command[0] === 'node' && !existsSync(join(root, command[1]))) errors.push(`Missing gate executable: ${command[1]}`);
    }
    if (errors.length) { errors.forEach(e => console.error(`BLOCKED: ${e}`)); process.exitCode = 1; }
    else console.log('Workflow structure and hook registration passed. Remote branch/environment protections require separate verification.');
  } catch (error) { console.error(`BLOCKED: ${error.message}`); process.exitCode = 1; }
}
