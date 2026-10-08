#!/usr/bin/env node
/**
 * check-ui-contract.mjs — fail-closed GR-12 guard for changed canonical Stories and new UI contracts.
 *
 * This is deliberately a diff gate.  The repository has historical Storybook debt; treating that debt as
 * permission to add more styling would be an allowlist in disguise.  Instead, every added or changed line in a
 * canonical Mantine Story is checked.  A Story may exercise real component data and documented public states, but
 * it may not introduce presentation through `style`, `styles`, `className`, `classNames`, `css`, `sx`, a literal
 * Mantine palette choice, or a numeric visual prop.  Existing debt is not a suppression and becomes subject to the
 * same rule as soon as that expression is edited.
 *
 * The companion registry is intentionally small and semantic, not a duplicate of the migration manifest.  It is
 * mandatory for every component newly enrolled in the migration manifest and records its real component source,
 * canonical Stories, token owner(s), and the cross-Story element(s) that must stay identical.  A missing registry
 * row is a hard failure — it is never inferred from a filename or filled with a scanner allowlist.
 *
 * Usage:
 *   node scripts/check-ui-contract.mjs --base <commit> [--head <commit>]
 *   UI_CONTRACT_BASE_SHA=<commit> UI_CONTRACT_HEAD_SHA=<commit> node scripts/check-ui-contract.mjs
 *   node scripts/check-ui-contract.mjs --verify-gate
 *
 * CI must supply the immutable PR/push base and head.  Failure to resolve either commit, read either manifest, or
 * parse an affected Story fails closed.  The gate has no baseline and no inline suppressions.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { isCanonicalMantineTitle } from './lib/mantine-story-scope.mjs'
import { extractImportSpecifiers, resolveImportSpecifier } from './lib/import-resolver.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST = 'scripts/mantine-migration-scope.json'
const REGISTRY = 'scripts/ui-contract-registry.json'
const STORY_SUFFIX = /\.stories\.(?:tsx|ts)$/
const FORBIDDEN_STORY_ATTRIBUTES = new Set(['style', 'styles', 'className', 'classNames', 'css', 'sx'])
const VISUAL_NUMERIC_PROPERTIES = new Set([
  'w', 'h', 'miw', 'mih', 'maw', 'mah', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl', 'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'gap', 'radius', 'fz', 'size',
  'lineHeight', 'letterSpacing', 'shadow', 'zIndex', 'top', 'right', 'bottom', 'left', 'inset',
])
const STORY_WRAPPER_TAGS = new Set([
  'Box', 'Paper', 'Stack', 'Group', 'Flex', 'Grid', 'SimpleGrid', 'Container', 'Card', 'div', 'section', 'main',
  'article', 'aside', 'header', 'footer', 'Text', 'Title',
])
const STORY_WRAPPER_VISUAL_PROPERTIES = new Set([
  ...VISUAL_NUMERIC_PROPERTIES,
  'c', 'color', 'bg', 'background', 'bd', 'border', 'borderColor', 'fw', 'fontWeight', 'ta', 'textAlign',
  'opacity', 'display', 'position', 'visible', 'hidden',
])
const PALETTE_PROPERTY_NAMES = new Set(['c', 'color', 'bg', 'background', 'borderColor', 'bd'])
const RAW_PALETTE = /^(?:gray|red|pink|grape|violet|indigo|blue|cyan|teal|green|lime|yellow|orange)(?:\.\d)?$/i
const RAW_COLOUR = /^(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla|oklch)\()/i

function normalizePath(value) {
  return value.replace(/\\/g, '/')
}

function relativePath(value) {
  return normalizePath(relative(ROOT, value))
}

function runGit(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (error) {
    if (allowFailure) return null
    const stderr = error?.stderr?.toString().trim()
    throw new Error(`git ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}`)
  }
}

function argValue(name) {
  const at = process.argv.indexOf(name)
  return at >= 0 ? process.argv[at + 1] ?? null : null
}

function parseJson(text, label) {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`)
  }
}

function readRevisionFile(revision, path) {
  return runGit(['show', `${revision}:${path}`])
}

function assertCommit(revision, label) {
  if (!revision) throw new Error(`${label} is required (pass --${label.toLowerCase()} or set the CI environment variable).`)
  runGit(['rev-parse', '--verify', `${revision}^{commit}`])
}

function findObjectTitle(object) {
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    const name = property.name.getText()
    if (name === 'title' && ts.isStringLiteralLike(property.initializer)) return property.initializer.text
  }
  return null
}

function storyTitle(source) {
  const namedObjects = new Map()
  let defaultExport = null
  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) {
          namedObjects.set(declaration.name.text, declaration.initializer)
        }
      }
    }
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) defaultExport = statement.expression
  }
  if (defaultExport && ts.isObjectLiteralExpression(defaultExport)) return findObjectTitle(defaultExport)
  if (defaultExport && ts.isIdentifier(defaultExport)) return findObjectTitle(namedObjects.get(defaultExport.text) ?? { properties: [] })
  for (const object of namedObjects.values()) {
    const title = findObjectTitle(object)
    if (title) return title
  }
  return null
}

function changedLinesFromDiff(diff) {
  const changed = new Set()
  let currentLine = null
  for (const line of diff.split(/\r?\n/)) {
    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/)
    if (hunk) {
      currentLine = Number(hunk[1])
      continue
    }
    if (currentLine === null || line.startsWith('\\')) continue
    if (line.startsWith('+') && !line.startsWith('+++')) {
      changed.add(currentLine)
      currentLine++
    } else if (!line.startsWith('-')) {
      currentLine++
    }
  }
  return changed
}

function nodeTouchesChangedLine(source, node, changedLines) {
  const start = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
  const end = source.getLineAndCharacterOfPosition(node.getEnd()).line + 1
  for (let line = start; line <= end; line++) if (changedLines.has(line)) return true
  return false
}

function attributeName(attribute) {
  return ts.isJsxAttribute(attribute) ? attribute.name.getText() : ''
}

function literalValue(attribute) {
  if (!attribute.initializer) return null
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text
  if (ts.isJsxExpression(attribute.initializer) && attribute.initializer.expression) {
    const expression = attribute.initializer.expression
    if (ts.isStringLiteralLike(expression) || ts.isNumericLiteral(expression)) return expression.text
  }
  return null
}

function lineOf(source, node) {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
}

function jsxAttributeTagName(attribute, source) {
  const opening = attribute.parent?.parent
  return opening && ts.isJsxOpeningLikeElement(opening) ? opening.tagName.getText(source) : null
}

/**
 * Scan one already-classified canonical Story.  Exported for the self-test and deliberately operates on AST ranges,
 * so adding `background: 'red'` to an existing multi-line `style={{...}}` also fails (a line-regex cannot see that).
 */
export function scanChangedCanonicalStory(rel, text, changedLines) {
  const source = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const diagnostics = source.parseDiagnostics ?? []
  if (diagnostics.length) {
    return [{ rel, line: 1, rule: 'unparseable-story', message: 'cannot inspect an affected Story with TypeScript parse errors' }]
  }
  const title = storyTitle(source)
  if (!title || !isCanonicalMantineTitle(title)) return []

  const violations = []
  const record = (node, rule, message) => violations.push({ rel, line: lineOf(source, node), rule, message })
  const visit = (node) => {
    if (ts.isJsxAttribute(node) && nodeTouchesChangedLine(source, node, changedLines)) {
      const name = attributeName(node)
      if (FORBIDDEN_STORY_ATTRIBUTES.has(name)) {
        record(node, 'story-local-style', `canonical Story writes \`${name}\`; move presentation into the canonical component/token owner`)
      }
      const tag = jsxAttributeTagName(node, source)
      if (tag && STORY_WRAPPER_TAGS.has(tag) && STORY_WRAPPER_VISUAL_PROPERTIES.has(name)) {
        record(node, 'story-wrapper-presentation', `canonical Story styles wrapper \`<${tag}>\` through \`${name}\`; use the production component's public state instead`)
      }
      const value = literalValue(node)
      if (value !== null && PALETTE_PROPERTY_NAMES.has(name) && (RAW_PALETTE.test(value) || RAW_COLOUR.test(value))) {
        record(node, 'raw-palette', `canonical Story selects raw palette/value \`${name}=${JSON.stringify(value)}\`; use a semantic component state/token`)
      }
      if (value !== null && /^\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw)?$/i.test(value) && VISUAL_NUMERIC_PROPERTIES.has(name)) {
        record(node, 'raw-visual-number', `canonical Story passes raw visual value \`${name}=${JSON.stringify(value)}\`; expose a named component state or use a token`)
      }
    }
    if (ts.isJsxElement(node) && nodeTouchesChangedLine(source, node.openingElement, changedLines) && node.openingElement.tagName.getText(source).toLowerCase() === 'style') {
      record(node.openingElement, 'story-style-element', 'canonical Story creates a <style> element')
    }
    if (ts.isCallExpression(node) && nodeTouchesChangedLine(source, node, changedLines)) {
      const callee = node.expression.getText(source)
      const first = node.arguments[0]
      if ((callee === 'document.createElement' || callee.endsWith('.createElement')) && first && ts.isStringLiteralLike(first) && first.text.toLowerCase() === 'style') {
        record(node, 'story-style-element', 'canonical Story creates a style element programmatically')
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return violations
}

function registryFailures(registry, manifest, { requireCoverage = [] } = {}) {
  const failures = []
  if (!registry || registry.version !== 1 || !Array.isArray(registry.components)) {
    return ['registry must be an object with version: 1 and a components array']
  }
  if (!Array.isArray(registry.canonicalTokenSources) || registry.canonicalTokenSources.length === 0) {
    failures.push('registry must name at least one canonicalTokenSources path')
  }
  const manifestSet = new Set(manifest)
  const seen = new Set()
  const covered = new Set()
  for (const entry of registry.components) {
    const id = entry?.id
    const component = entry?.component
    if (typeof id !== 'string' || !id.trim()) failures.push('component entry has no non-empty id')
    else if (seen.has(id)) failures.push(`duplicate component id: ${id}`)
    else seen.add(id)
    if (typeof component !== 'string' || !manifestSet.has(component)) failures.push(`${id ?? '<unknown>'}: component must be an enrolled path in ${MANIFEST}`)
    else covered.add(component)
    for (const field of ['stories', 'tokenOwners', 'parity']) {
      if (!Array.isArray(entry?.[field]) || entry[field].length === 0) failures.push(`${id ?? '<unknown>'}: ${field} must be a non-empty array`)
    }
    for (const story of entry?.stories ?? []) {
      if (typeof story !== 'string' || !STORY_SUFFIX.test(story) || !existsSync(join(ROOT, story))) {
        failures.push(`${id ?? '<unknown>'}: story path is missing or not a Story file: ${String(story)}`)
        continue
      }
      const storyPath = join(ROOT, story)
      const source = ts.createSourceFile(storyPath, readFileSync(storyPath, 'utf8'), ts.ScriptTarget.Latest, true, story.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
      const title = storyTitle(source)
      if (source.parseDiagnostics.length || !isCanonicalMantineTitle(title)) {
        failures.push(`${id ?? '<unknown>'}: Story is not a parseable canonical Mantine Story: ${story}`)
      } else if (typeof component === 'string') {
        const importsComponent = extractImportSpecifiers(source)
          .map((specifier) => resolveImportSpecifier(ROOT, storyPath, specifier))
          .includes(component)
        if (!importsComponent) failures.push(`${id ?? '<unknown>'}: direct Story does not import its declared component: ${story} -> ${component}`)
      }
    }
    for (const owner of entry?.tokenOwners ?? []) {
      if (typeof owner !== 'string' || !existsSync(join(ROOT, owner))) failures.push(`${id ?? '<unknown>'}: token owner path does not exist: ${String(owner)}`)
    }
    for (const parity of entry?.parity ?? []) {
      if (!parity || typeof parity.element !== 'string' || !parity.element.trim() || !Array.isArray(parity.storyExports) || parity.storyExports.length === 0) {
        failures.push(`${id ?? '<unknown>'}: every parity entry needs element and non-empty storyExports`)
      }
    }
  }
  for (const path of requireCoverage) if (!covered.has(path)) failures.push(`newly enrolled component lacks an explicit UI contract: ${path}`)
  return failures
}

function manifestAt(revision) {
  const value = parseJson(readRevisionFile(revision, MANIFEST), `${MANIFEST} at ${revision}`)
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) throw new Error(`${MANIFEST} at ${revision} must be an array of source paths.`)
  return value
}

function registryAt(revision) {
  return parseJson(readRevisionFile(revision, REGISTRY), `${REGISTRY} at ${revision}`)
}

function changedStoryPaths(base, head) {
  const changed = runGit(['diff', '--name-only', '--diff-filter=ACMR', base, head, '--'])
    .split(/\r?\n/)
    .map(normalizePath)
    .filter((path) => STORY_SUFFIX.test(path))
  return [...new Set(changed)].sort()
}

function runGate({ base, head }) {
  assertCommit(base, 'BASE')
  assertCommit(head, 'HEAD')
  const baseManifest = manifestAt(base)
  const headManifest = manifestAt(head)
  const newlyEnrolled = headManifest.filter((path) => !baseManifest.includes(path))
  const registry = registryAt(head)
  const registryProblems = registryFailures(registry, headManifest, { requireCoverage: newlyEnrolled })
  const storyProblems = []
  const stories = changedStoryPaths(base, head)
  for (const story of stories) {
    const text = readRevisionFile(head, story)
    const diff = runGit(['diff', '--no-ext-diff', '--unified=0', base, head, '--', story])
    storyProblems.push(...scanChangedCanonicalStory(story, text, changedLinesFromDiff(diff)))
  }
  return { newlyEnrolled, stories, registryProblems, storyProblems }
}

function printResult(result, { base, head }) {
  console.log('check:ui-contract — GR-12 fail-closed Story ownership and UI-contract registry gate')
  console.log(`    Base: ${base}`)
  console.log(`    Head: ${head}`)
  console.log(`    Changed Story files inspected: ${result.stories.length}`)
  console.log(`    Newly enrolled components requiring a contract: ${result.newlyEnrolled.length}`)
  for (const path of result.newlyEnrolled) console.log(`      ${path}`)
  console.log('    Rule: changed canonical Stories may exercise data/public state only; local visual styling is rejected with no suppression path.')
  if (result.registryProblems.length === 0 && result.storyProblems.length === 0) {
    console.log('PASS  check:ui-contract — no changed canonical Story writes local presentation; every newly enrolled component has a valid semantic UI contract.')
    return 0
  }
  for (const problem of result.registryProblems) console.error(`FAIL  registry  ${problem}`)
  for (const problem of result.storyProblems) console.error(`FAIL  ${problem.rel}:${problem.line}  [${problem.rule}]  ${problem.message}`)
  console.error('Fix: move the visual decision into the existing/new semantic token or canonical component; then update its direct Story and parity contract. Do not add a local style or allowlist entry.')
  return 1
}

function verifyGate() {
  const samples = [
    { name: 'style object (including a changed child property)', text: "export default { title: 'Mantine/Primitives/X' }; export const A = () => <Box style={{ color: 'red' }} />", line: 1, expect: 'story-local-style' },
    { name: 'className wrapper', text: "export default { title: 'Mantine/Primitives/X' }; export const A = () => <div className=\"p-4\" />", line: 1, expect: 'story-local-style' },
    { name: 'raw Mantine palette', text: "export default { title: 'Mantine/Primitives/X' }; export const A = () => <Text c=\"gray.7\" />", line: 1, expect: 'raw-palette' },
    { name: 'wrapper spacing prop', text: "export default { title: 'Mantine/Primitives/X' }; export const A = () => <Stack gap=\"lg\"><MantineBadge tone=\"success\" /></Stack>", line: 1, expect: 'story-wrapper-presentation' },
    { name: 'clean named public state', text: "export default { title: 'Mantine/Primitives/X' }; export const A = () => <MantineBadge tone=\"success\" size=\"sm\" />", line: 1, expect: null },
  ]
  let ok = true
  for (const sample of samples) {
    const hits = scanChangedCanonicalStory('src/stories/mantine/primitives/X.stories.tsx', sample.text, new Set([sample.line]))
    const passed = sample.expect ? hits.some((hit) => hit.rule === sample.expect) : hits.length === 0
    console.log(`${passed ? 'GREEN' : 'FAIL '} ${sample.name}`)
    ok &&= passed
  }
  const badRegistry = registryFailures({ version: 1, canonicalTokenSources: ['src/app/globals.css'], components: [] }, ['src/design-system/mantine/patterns/MantineBadge.tsx'], { requireCoverage: ['src/design-system/mantine/patterns/MantineBadge.tsx'] })
  const registryPass = badRegistry.some((problem) => problem.includes('lacks an explicit UI contract'))
  console.log(`${registryPass ? 'GREEN' : 'FAIL '} newly enrolled component without an explicit contract is rejected`)
  ok &&= registryPass
  const projectRegistry = parseJson(readFileSync(join(ROOT, REGISTRY), 'utf8'), REGISTRY)
  const projectManifest = parseJson(readFileSync(join(ROOT, MANIFEST), 'utf8'), MANIFEST)
  const projectRegistryPass = registryFailures(projectRegistry, projectManifest).length === 0
  console.log(`${projectRegistryPass ? 'GREEN' : 'FAIL '} checked-in UI contract registry is structurally valid and each declared Story imports its component`)
  ok &&= projectRegistryPass
  console.log(ok ? 'check:ui-contract self-test PASSED' : 'check:ui-contract self-test FAILED')
  return ok ? 0 : 1
}

if (process.argv.includes('--verify-gate')) {
  process.exit(verifyGate())
}

try {
  const base = argValue('--base') ?? process.env.UI_CONTRACT_BASE_SHA
  const head = argValue('--head') ?? process.env.UI_CONTRACT_HEAD_SHA ?? 'HEAD'
  const result = runGate({ base, head })
  process.exit(printResult(result, { base, head }))
} catch (error) {
  console.error(`FAIL  check:ui-contract — fail closed: ${error.message}`)
  process.exit(1)
}
