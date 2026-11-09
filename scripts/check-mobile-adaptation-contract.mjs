#!/usr/bin/env node
/**
 * Fail-closed GR-3j mobile-adaptation gate.
 *
 * It has two deliberately narrow, mechanical jobs:
 *  - reject a newly added textual clipping primitive in a visible UI source; and
 *  - require a structured mobile-adaptation record in every active kickoff (every kickoff outside tasks/Archive/,
 *    read from disk, so a local run and CI give the same answer; until 2026-11-06 only changed kickoffs were read,
 *    and 377 of 380 active kickoffs had no record).
 *
 * It does not pretend a static scan can prove rendered reflow.  The contract separately requires the built-Storybook
 * probe across the project's actual compact range and at the 640px transition. There is intentionally no baseline,
 * suppression, or "temporary" exception route.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY_PATH = 'scripts/mobile-adaptation-patterns.json'
const MANTINE_PATTERN_ROOT = 'src/design-system/mantine/patterns'
const UI_PATH = /^(?:src\/(?:(?:stories|components)\/.*\.stories\.(?:ts|tsx)|design-system\/(?:mantine|media)\/.*\.(?:ts|tsx|css)|components\/.*\.(?:ts|tsx|css)|modules\/[^/]+\/components\/.*\.(?:ts|tsx|css)|app\/(?:\[locale\]|admin)\/.*\.(?:ts|tsx|css)))$/i
const TEST_PATH = /(?:(?:^|\/)(?:__tests__|tests)\/|\.(?:test|spec)\.(?:ts|tsx)$)/i
const ACTIVE_KICKOFF = /^tasks\/(?!Archive\/).*kickoff.*\.md$/i
const FORBIDDEN_TEXT_CLIPPING = [
  { id: 'truncate', re: /\btruncate\b/ },
  { id: 'line-clamp', re: /\blineClamp\b|\bline-clamp-\d+\b|-webkit-line-clamp\b/i },
  { id: 'ellipsis', re: /\btextOverflow\s*:\s*['"]ellipsis['"]|text-overflow\s*:\s*ellipsis|\btext-ellipsis\b/i },
  { id: 'nowrap', re: /\bwhiteSpace\s*:\s*['"]nowrap['"]|white-space\s*:\s*nowrap|\bwhitespace-nowrap\b/i },
]

function git(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (error) {
    const detail = error?.stderr?.toString().trim()
    throw new Error(`git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`)
  }
}

function normalize(path) { return path.replace(/\\/g, '/') }
function isUiPath(path) { return UI_PATH.test(path) && !TEST_PATH.test(path) }
function arg(name) {
  const i = process.argv.indexOf(name)
  return i >= 0 ? process.argv[i + 1] ?? null : null
}
function assertCommit(revision, label) {
  if (!revision) throw new Error(`${label} is required`)
  git(['rev-parse', '--verify', `${revision}^{commit}`])
}
function changedFiles(base, head) {
  return git(['diff', '--name-only', '--diff-filter=ACMR', base, head, '--'])
    .split(/\r?\n/).filter(Boolean).map(normalize)
}
function addedLines(base, head, rel) {
  const diff = git(['diff', '--no-ext-diff', '--unified=0', base, head, '--', rel])
  return diff.split(/\r?\n/).filter((line) => line.startsWith('+') && !line.startsWith('+++')).map((line) => line.slice(1))
}

function currentPatternComponents(directory = join(ROOT, MANTINE_PATTERN_ROOT)) {
  const result = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '__tests__') continue
    const absolute = join(directory, entry.name)
    if (entry.isDirectory()) result.push(...currentPatternComponents(absolute))
    else if (entry.isFile() && entry.name.endsWith('.tsx')) result.push(normalize(relative(ROOT, absolute)))
  }
  return result.sort()
}

export function componentMappingProblems(componentPaths, memberToFamily) {
  return componentPaths
    .filter((path) => !memberToFamily.has(path))
    .map((rel) => ({ rel, rule: 'unmapped-mantine-pattern', message: `canonical Mantine pattern is absent from ${REGISTRY_PATH}` }))
}

function readRegistry() {
  let registry
  try { registry = JSON.parse(readFileSync(join(ROOT, REGISTRY_PATH), 'utf8')) } catch (error) {
    throw new Error(`${REGISTRY_PATH} is unreadable JSON: ${error.message}`)
  }
  if (registry?.version !== 3 || registry?.mobileGate?.compactRange !== '<640px' || registry.mobileGate?.transition !== '640px' || registry?.mantine?.package !== '@mantine/core' || registry?.mantine?.versionRange !== '^8.3.18' || typeof registry.mantine?.projectAuthority?.source !== 'string' || typeof registry.mantine?.projectAuthority?.rule !== 'string' || !Array.isArray(registry.mantine?.mechanisms) || registry.mantine.mechanisms.length === 0 || !Array.isArray(registry.standards) || registry.standards.length < 3 || !Array.isArray(registry.patterns) || registry.patterns.length === 0 || !Array.isArray(registry.componentFamilies) || registry.componentFamilies.length === 0) {
    throw new Error(`${REGISTRY_PATH} must contain version: 3, the project mobile gate, Mantine authority/mechanisms, standards, patterns, and component families`)
  }
  const mechanismIds = new Set()
  for (const mechanism of registry.mantine.mechanisms) {
    if (typeof mechanism?.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(mechanism.id) || typeof mechanism?.title !== 'string' || typeof mechanism?.url !== 'string' || !/^https:\/\//.test(mechanism.url) || mechanismIds.has(mechanism.id)) {
      throw new Error(`${REGISTRY_PATH} has an invalid or duplicate Mantine responsive mechanism`)
    }
    mechanismIds.add(mechanism.id)
  }
  const ids = new Set()
  for (const standard of registry.standards) {
    if (typeof standard?.id !== 'string' || typeof standard?.title !== 'string' || typeof standard?.url !== 'string' || !/^https:\/\//.test(standard.url) || ids.has(standard.id)) {
      throw new Error(`${REGISTRY_PATH} has an invalid or duplicate standard`)
    }
    ids.add(standard.id)
  }
  const patterns = new Map()
  for (const pattern of registry.patterns) {
    if (typeof pattern?.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(pattern.id) || patterns.has(pattern.id) || !Array.isArray(pattern.sourceIds) || pattern.sourceIds.length === 0 || pattern.sourceIds.some((sourceId) => !ids.has(sourceId))) {
      throw new Error(`${REGISTRY_PATH} has an invalid/duplicate pattern or an unknown pattern source`)
    }
    patterns.set(pattern.id, pattern)
  }
  const families = new Map()
  const memberToFamily = new Map()
  for (const family of registry.componentFamilies) {
    if (typeof family?.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(family.id) || families.has(family.id) || !Array.isArray(family.patternIds) || family.patternIds.length === 0 || family.patternIds.some((patternId) => !patterns.has(patternId)) || !Array.isArray(family.mantineMechanismIds) || family.mantineMechanismIds.length === 0 || family.mantineMechanismIds.some((mechanismId) => !mechanismIds.has(mechanismId)) || !Array.isArray(family.members) || family.members.length === 0) {
      throw new Error(`${REGISTRY_PATH} has an invalid/duplicate component family`)
    }
    for (const member of family.members) {
      if (typeof member !== 'string' || !member.startsWith(`${MANTINE_PATTERN_ROOT}/`) || !member.endsWith('.tsx') || memberToFamily.has(member)) {
        throw new Error(`${REGISTRY_PATH} has an invalid or duplicate canonical Mantine component path`)
      }
      memberToFamily.set(member, family.id)
    }
    families.set(family.id, family)
  }
  const mappingProblems = componentMappingProblems(currentPatternComponents(), memberToFamily)
  const current = new Set(currentPatternComponents())
  const stale = [...memberToFamily.keys()].filter((member) => !current.has(member))
  if (mappingProblems.length || stale.length) {
    const details = [...mappingProblems.map((problem) => problem.rel), ...stale.map((member) => `stale:${member}`)].join(', ')
    throw new Error(`${REGISTRY_PATH} component map is incomplete or stale: ${details}`)
  }
  return { registry, standardIds: ids, mechanismIds, patterns, families, memberToFamily }
}

export function clippingProblems(rel, lines) {
  const problems = []
  lines.forEach((line, index) => {
    // A rule comment can explain a forbidden primitive; only executable/style content is a violation.
    const code = line.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '')
    for (const rule of FORBIDDEN_TEXT_CLIPPING) {
      if (rule.re.test(code)) problems.push({ rel, line: index + 1, rule: rule.id, text: line.trim() })
    }
  })
  return problems
}

function field(text, name) {
  const match = text.match(new RegExp(`^\\s*-\\s*${name}:\\s*(.+?)\\s*$`, 'im'))
  return match?.[1]?.trim() ?? null
}
function commaList(text, name) {
  return (field(text, name) ?? '').split(',').map((part) => part.trim()).filter(Boolean)
}

export function kickoffProblems(rel, text, registry) {
  const heading = /^##\s+Mobile adaptation record\s*$/im
  if (!heading.test(text)) return [{ rel, rule: 'missing-record', message: 'active kickoff has no `## Mobile adaptation record`' }]
  const scope = field(text, 'Scope')
  if (!scope) return [{ rel, rule: 'missing-scope', message: 'mobile adaptation record has no `Scope` field' }]
  if (/^none$/i.test(scope)) return []
  if (!/^visible$/i.test(scope)) return [{ rel, rule: 'invalid-scope', message: 'Scope must be `visible` or `none`' }]
  const required = ['Surfaces', 'Component families', 'Pattern IDs', 'Standards', 'Mantine mechanism', 'Mantine owner', 'Mobile range and switches', 'Mobile order', 'Required-content treatment', 'Story and verification']
  const problems = []
  for (const name of required) if (!field(text, name)) problems.push({ rel, rule: 'missing-field', message: `visible mobile adaptation record has no ${name} field` })
  const familyIds = commaList(text, 'Component families')
  if (familyIds.length === 0 || familyIds.some((id) => !registry.families.has(id))) problems.push({ rel, rule: 'unknown-component-family', message: `Component families must use ${REGISTRY_PATH}` })
  const patternIds = commaList(text, 'Pattern IDs')
  if (patternIds.length === 0 || patternIds.some((id) => !registry.patterns.has(id))) problems.push({ rel, rule: 'unknown-pattern', message: `Pattern IDs must use ${REGISTRY_PATH}` })
  const allowedPatternIds = new Set(familyIds.flatMap((familyId) => registry.families.get(familyId)?.patternIds ?? []))
  if (patternIds.some((patternId) => !allowedPatternIds.has(patternId))) problems.push({ rel, rule: 'family-pattern-mismatch', message: 'Pattern IDs must be allowed by each selected component family' })
  const standardIds = commaList(text, 'Standards')
  const requiredStandardIds = new Set(patternIds.flatMap((patternId) => registry.patterns.get(patternId)?.sourceIds ?? []))
  if (standardIds.length === 0 || standardIds.some((id) => !registry.standardIds.has(id)) || [...requiredStandardIds].some((id) => !standardIds.includes(id))) {
    problems.push({ rel, rule: 'incomplete-pattern-sources', message: 'Standards must list every source ID required by the selected Pattern IDs' })
  }
  const mechanismIds = commaList(text, 'Mantine mechanism')
  const allowedMechanismIds = new Set(familyIds.flatMap((familyId) => registry.families.get(familyId)?.mantineMechanismIds ?? []))
  if (mechanismIds.length === 0 || mechanismIds.some((id) => !registry.mechanismIds.has(id)) || mechanismIds.some((id) => !allowedMechanismIds.has(id))) {
    problems.push({ rel, rule: 'family-mantine-mechanism-mismatch', message: 'Mantine mechanism must be a registry mechanism allowed by a selected component family' })
  }
  const owners = commaList(text, 'Mantine owner')
  const allowedOwners = new Set(familyIds.flatMap((familyId) => registry.families.get(familyId)?.members ?? []))
  if (owners.length === 0 || owners.some((owner) => !allowedOwners.has(owner))) {
    problems.push({ rel, rule: 'invalid-mantine-owner', message: 'Mantine owner must be a canonical pattern path in a selected component family' })
  }
  const mobileRange = field(text, 'Mobile range and switches') ?? ''
  if (!/(?:<\s*640\s*px|below\s+(?:sm|640\s*px))/i.test(mobileRange) || !/640\s*px|\bsm\b/i.test(mobileRange)) {
    problems.push({ rel, rule: 'invalid-mobile-range', message: 'Mobile range and switches must record the project compact range (<640px / below sm) and its 640px transition' })
  }
  if (!/(?:wrap|canonical.*(?:reveal|disclosure)|no\s+semantic\s+loss)/i.test(field(text, 'Required-content treatment') ?? '')) {
    problems.push({ rel, rule: 'invalid-content-treatment', message: 'Required-content treatment must state wrapping or a canonical directly reachable disclosure; clipping is not a treatment' })
  }
  return problems
}

/** Every kickoff of an open task: under tasks/ and not in tasks/Archive/, tracked or untracked-not-ignored. */
export function activeKickoffs(listed) {
  return listed.map(normalize).filter((rel) => ACTIVE_KICKOFF.test(rel))
}

function runGate(base, head) {
  assertCommit(base, 'base')
  assertCommit(head, 'head')
  const files = changedFiles(base, head)
  const clipping = []
  for (const rel of files) {
    if (isUiPath(rel)) clipping.push(...clippingProblems(rel, addedLines(base, head, rel)))
  }
  // Every active kickoff, not only the changed ones, and as it is on disk: a record that is missing from an unchanged
  // kickoff, or from work not yet committed, is found by the same run locally and in CI.
  const listed = git(['ls-files', '-co', '--exclude-standard', '--', 'tasks']).split(/\r?\n/).filter(Boolean)
  const records = runFiles(activeKickoffs(listed).filter((rel) => existsSync(join(ROOT, rel))))
  return { files, clipping, records }
}

function runFiles(files) {
  const registry = readRegistry()
  const records = []
  for (const rel of files) {
    if (!ACTIVE_KICKOFF.test(rel)) continue
    const absolute = join(ROOT, rel)
    if (!existsSync(absolute)) records.push({ rel, rule: 'missing-file', message: 'changed kickoff is missing from working tree' })
    else records.push(...kickoffProblems(rel, readFileSync(absolute, 'utf8'), registry))
  }
  return records
}

function printProblems(problems, prefix) {
  for (const problem of problems) console.error(`FAIL  ${prefix}  ${problem.rel}${problem.line ? `:${problem.line}` : ''}  [${problem.rule}]  ${problem.message ?? problem.text}`)
}

function verify() {
  let ok = true
  const clip = clippingProblems('src/components/admin/Bad.tsx', ["<Text lineClamp={1}>Name</Text>", "<Text>Good</Text>"])
  const clipPass = clip.some((p) => p.rule === 'line-clamp')
  console.log(`${clipPass ? 'GREEN' : 'FAIL '} planted lineClamp is rejected`)
  ok &&= clipPass
  const commentPass = clippingProblems('src/components/admin/Good.tsx', ['// removed lineClamp from semantic name']).length === 0
  console.log(`${commentPass ? 'GREEN' : 'FAIL '} explanatory source comment is not a clipping violation`)
  ok &&= commentPass
  const testPass = !isUiPath('src/components/admin/__tests__/Mobile.test.tsx')
  console.log(`${testPass ? 'GREEN' : 'FAIL '} component tests are outside the UI source diff scan`)
  ok &&= testPass
  const registry = readRegistry()
  const missing = kickoffProblems('tasks/Sprints/Sprint_90_kickoff_prompt_Task_920.md', '# task', registry)
  const missingPass = missing.some((p) => p.rule === 'missing-record')
  console.log(`${missingPass ? 'GREEN' : 'FAIL '} kickoff without mobile record is rejected`)
  ok &&= missingPass
  const valid = `## Mobile adaptation record\n- Scope: visible\n- Surfaces: src/components/admin/X.tsx — record card\n- Component families: record-list-and-data\n- Pattern IDs: record-card, key-value-stack\n- Standards: w3c-meaningful-sequence, w3c-focus-order, apple-hig-lists-tables, android-common-layouts, w3c-reflow, apple-hig-layout, android-content-structure\n- Mantine mechanism: responsive-props\n- Mantine owner: src/design-system/mantine/patterns/MantineDataTableToCards.tsx\n- Mobile range and switches: <640px (theme.other.mobileGate / sm); 640px transition\n- Mobile order: title → status → metadata\n- Required-content treatment: required semantic content wraps; no clipping\n- Story and verification: X story across the actual component thresholds and 640px transition × all locales`
  const validPass = kickoffProblems('tasks/Sprints/Sprint_90_kickoff_prompt_Task_920.md', valid, registry).length === 0
  console.log(`${validPass ? 'GREEN' : 'FAIL '} complete visible record is accepted`)
  ok &&= validPass
  const mechanismPass = kickoffProblems('tasks/Sprints/Sprint_90_kickoff_prompt_Task_920.md', valid.replace('Mantine mechanism: responsive-props', 'Mantine mechanism: app-shell-responsive'), registry).some((problem) => problem.rule === 'family-mantine-mechanism-mismatch')
  console.log(`${mechanismPass ? 'GREEN' : 'FAIL '} incompatible Mantine mechanism is rejected`)
  ok &&= mechanismPass
  const ownerPass = kickoffProblems('tasks/Sprints/Sprint_90_kickoff_prompt_Task_920.md', valid.replace('MantineDataTableToCards.tsx', 'MantineBadge.tsx'), registry).some((problem) => problem.rule === 'invalid-mantine-owner')
  console.log(`${ownerPass ? 'GREEN' : 'FAIL '} incompatible Mantine owner is rejected`)
  ok &&= ownerPass
  const unmappedPass = componentMappingProblems(['src/design-system/mantine/patterns/Unmapped.tsx'], registry.memberToFamily).some((problem) => problem.rule === 'unmapped-mantine-pattern')
  console.log(`${unmappedPass ? 'GREEN' : 'FAIL '} unmapped canonical Mantine pattern is rejected`)
  ok &&= unmappedPass
  const active = activeKickoffs(['tasks/Sprints/Sprint_93_kickoff_prompt_Task_947_X.md', 'tasks/Archive/Sprint_8_kickoff_prompt_Task_172.md', 'tasks\\Epics\\Epic_A_kickoff_prompt_Task_103.md', 'tasks/Sprints/Sprint_93_Plan.md'])
  const activePass = active.length === 2 && active.includes('tasks/Sprints/Sprint_93_kickoff_prompt_Task_947_X.md') && active.includes('tasks/Epics/Epic_A_kickoff_prompt_Task_103.md')
  console.log(`${activePass ? 'GREEN' : 'FAIL '} every kickoff outside tasks/Archive is checked; archived kickoffs and plans are not`)
  ok &&= activePass
  const nonePass = kickoffProblems('tasks/Sprints/Sprint_93_kickoff_prompt_Task_947_X.md', '## Mobile adaptation record\n- Scope: none\n', registry).length === 0
  console.log(`${nonePass ? 'GREEN' : 'FAIL '} a non-visible task's "Scope: none" record is accepted`)
  ok &&= nonePass
  console.log(ok ? 'check:mobile-adaptation-contract self-test PASSED' : 'check:mobile-adaptation-contract self-test FAILED')
  return ok ? 0 : 1
}

if (process.argv.includes('--verify-gate')) process.exit(verify())

try {
  const requestedFiles = process.argv.indexOf('--files')
  if (requestedFiles >= 0) {
    const files = process.argv.slice(requestedFiles + 1).map(normalize)
    if (files.length === 0) throw new Error('--files requires one or more paths')
    const records = runFiles(files)
    printProblems(records, 'kickoff')
    if (records.length) process.exit(1)
    console.log('PASS  check:mobile-adaptation-contract — changed kickoff records are valid')
    process.exit(0)
  }
  const base = arg('--base') ?? process.env.MOBILE_ADAPTATION_BASE_SHA
  const head = arg('--head') ?? process.env.MOBILE_ADAPTATION_HEAD_SHA ?? 'HEAD'
  const result = runGate(base, head)
  console.log('check:mobile-adaptation-contract — GR-3j fail-closed mobile adaptation gate')
  console.log(`    Base: ${base}`)
  console.log(`    Head: ${head}`)
  console.log(`    Changed files inspected: ${result.files.length}`)
  printProblems(result.clipping, 'source')
  printProblems(result.records, 'kickoff')
  if (result.clipping.length || result.records.length) {
    console.error('Fix the semantic layout: reflow/stack/wrap full content or use a canonical presentation. Do not add a truncation, suppression, or local Story workaround.')
    process.exit(1)
  }
  console.log('PASS  check:mobile-adaptation-contract — no newly added text clipping primitive; every active kickoff record is complete.')
} catch (error) {
  console.error(`FAIL  check:mobile-adaptation-contract — fail closed: ${error.message}`)
  process.exit(1)
}
