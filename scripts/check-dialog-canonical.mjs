#!/usr/bin/env node
/**
 * check-dialog-canonical.mjs — blocking gate: every dialog is on the canonical anatomy (Task 859 Revision 2, R30,
 * owner decision D78-18; docs/mantine-responsive-design-system.md §23.6/§23.7).
 *
 * It fails when a production `.tsx` file under `src/` renders:
 *   1. `<MantineModal` without the `structured` attribute; or
 *   2. a `Button` (or `MantineButton`) inside a `<MantineModal` — in its children or in any of its props — that is not
 *      inside a `<MantineDialogFooter`.
 * `MantineModal.tsx` itself, Stories, tests and `src/stories/` are excluded.
 *
 * GR-2 scope: it reads the JSX written inside each `<MantineModal …>…</MantineModal>`. It cannot see a button rendered
 * by another component the modal contains (for example `StatusChangeSelect`), nor one built in a variable outside the
 * modal element and passed in; the Stories and the review cover those.
 *
 * Usage: node scripts/check-dialog-canonical.mjs [--verify-gate]
 * Exit: 0 clean / self-test passed, 1 violations / self-test failed.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MODAL_COMPONENT = 'src/design-system/mantine/patterns/MantineModal.tsx'
const BUTTONS = new Set(['Button', 'MantineButton'])

function isExcluded(rel) {
  return rel === MODAL_COMPONENT || /\.(stories|test)\.tsx?$/.test(rel) || rel.includes('/__tests__/') || rel.startsWith('src/stories/')
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue
      walk(full, out)
    } else if (name.endsWith('.tsx') && !name.endsWith('.d.ts')) {
      out.push(full)
    }
  }
  return out
}

const tagName = (opening, source) => opening.tagName.getText(source)

/** Violations of one source text, given its repo-relative path. */
export function scanSource(rel, text) {
  const found = []
  const source = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const at = node => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
  const modals = new Set(['MantineModal']), footers = new Set(['MantineDialogFooter']), buttons = new Set(BUTTONS)
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    const named = statement.importClause?.namedBindings
    if (!named || !ts.isNamedImports(named)) continue
    for (const binding of named.elements) {
      const imported = (binding.propertyName ?? binding.name).text
      if (imported === 'MantineModal') modals.add(binding.name.text)
      if (imported === 'MantineDialogFooter') footers.add(binding.name.text)
      if (BUTTONS.has(imported)) buttons.add(binding.name.text)
    }
  }

  function checkButtons(node, inFooter) {
    let footer = inFooter
    if (ts.isJsxElement(node) && footers.has(tagName(node.openingElement, source))) footer = true
    if (ts.isJsxSelfClosingElement(node) && footers.has(tagName(node, source))) footer = true
    const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null
    if (opening && buttons.has(tagName(opening, source)) && !footer) {
      found.push({ rel, line: at(node), rule: 'button-outside-footer', message: `\`<${tagName(opening, source)}>\` inside a MantineModal but outside MantineDialogFooter` })
    }
    ts.forEachChild(node, child => checkButtons(child, footer))
  }

  function visit(node) {
    const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null
    if (opening && modals.has(tagName(opening, source))) {
      const properties = opening.attributes.properties
      const index = properties.findLastIndex(p => ts.isJsxAttribute(p) && p.name.getText(source) === 'structured')
      const initializer = properties[index]?.initializer
      const literalTrue = index >= 0 && (!initializer || (ts.isJsxExpression(initializer) && initializer.expression?.kind === ts.SyntaxKind.TrueKeyword))
      const overwritten = index >= 0 && properties.slice(index + 1).some(p => ts.isJsxSpreadAttribute(p))
      if (!literalTrue || overwritten) found.push({ rel, line: at(node), rule: 'not-structured', message: '`<MantineModal` requires literal structured=true without a later spread override' })
      ts.forEachChild(node, child => checkButtons(child, false))
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

function scanTree() {
  const files = walk(join(ROOT, 'src')).map(f => relative(ROOT, f).split('\\').join('/')).filter(rel => !isExcluded(rel))
  const violations = files.flatMap(rel => scanSource(rel, readFileSync(join(ROOT, rel), 'utf8')))
  return { files, violations }
}

function verifyGate() {
  const plants = [
    { name: 'plant 1 (no structured)', text: 'export const A = () => <MantineModal opened onClose={f}>x</MantineModal>\n', rule: 'not-structured' },
    { name: 'plant 2 (Button outside the footer)', text: 'export const A = () => <MantineModal structured opened onClose={f}><Button>x</Button></MantineModal>\n', rule: 'button-outside-footer' },
  ]
  const clean = [
    'export const A = () => <MantineModal structured opened onClose={f} footer={<MantineDialogFooter primary={<Button>x</Button>} />}>y</MantineModal>\n',
    'export const A = () => <Button>no modal here</Button>\n',
  ]
  let ok = true
  for (const p of plants) {
    const hit = scanSource('src/components/x/Plant.tsx', p.text).some(v => v.rule === p.rule)
    console.log(`${hit ? 'RED  ' : 'FAIL '} ${p.name}: ${hit ? 'detected' : 'NOT detected'}`)
    ok &&= hit
  }
  clean.forEach((text, i) => {
    const hits = scanSource('src/components/x/Clean.tsx', text)
    console.log(`${hits.length === 0 ? 'GREEN' : 'FAIL '} clean sample ${i + 1}: ${hits.length} violation(s)`)
    ok &&= hits.length === 0
  })
  console.log(ok ? 'check:dialog-canonical self-test PASSED' : 'check:dialog-canonical self-test FAILED')
  return ok ? 0 : 1
}

if (process.argv.includes('--verify-gate')) {
  process.exit(verifyGate())
} else if (process.argv[1]?.endsWith('check-dialog-canonical.mjs')) {
  const { files, violations } = scanTree()
  console.log(`check:dialog-canonical — scope: ${files.length} production .tsx files under src/ (MantineModal.tsx, stories, tests, src/stories excluded); rules: every <MantineModal has \`structured\`; every Button inside it sits in <MantineDialogFooter.`)
  console.log('GR-2: it reads the JSX written inside each MantineModal element; it cannot see a button rendered by a component the modal contains, or built in a variable outside it.')
  for (const v of violations) console.log(`FAIL  ${v.rel}:${v.line}  [${v.rule}]  ${v.message}`)
  console.log(violations.length === 0 ? 'check:dialog-canonical PASSED — 0 violations' : `check:dialog-canonical FAILED — ${violations.length} violation(s)`)
  process.exit(violations.length === 0 ? 0 : 1)
}
