#!/usr/bin/env node
/**
 * check-badge-canonical.mjs — blocking gate: one owner of badge meaning (Task 859 Revision 2, R30, owner decision D78-18).
 *
 * `MantineBadge` (src/design-system/mantine/patterns/MantineBadge.tsx) is the only production component that renders a
 * Mantine `Badge`, and `src/design-system/mantine/badgeTones.ts` is the only file that maps a value to a badge colour.
 * This gate fails when a production `.ts` / `.tsx` file under `src/`:
 *   1. imports `Badge` from `@mantine/core` anywhere but `MantineBadge.tsx`; or
 *   2. declares a variable whose name ends in `_COLOR` or `_TONE` and whose value is an object literal or an object
 *      typed `Record<…>`, anywhere but `badgeTones.ts` (a re-export, `export { X } from …`, is not a declaration).
 * Stories, tests and `src/stories/` are excluded.
 *
 * GR-2 scope: it inspects the import declarations and variable declarations of those files. It cannot see a colour
 * chosen another way (a literal `color="red"` on another component, a map named differently, a colour built at run
 * time); the review and the Stories cover those.
 *
 * Usage: node scripts/check-badge-canonical.mjs [--verify-gate]
 * Exit: 0 clean / self-test passed, 1 violations / self-test failed.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BADGE_COMPONENT = 'src/design-system/mantine/patterns/MantineBadge.tsx'
const TONES_FILE = 'src/design-system/mantine/badgeTones.ts'

function isExcluded(rel) {
  return /\.(stories|test)\.tsx?$/.test(rel) || rel.includes('/__tests__/') || rel.startsWith('src/stories/')
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next') continue
      walk(full, out)
    } else if (/\.tsx?$/.test(name) && !name.endsWith('.d.ts')) {
      out.push(full)
    }
  }
  return out
}

/** Violations of one source text, given its repo-relative path. */
export function scanSource(rel, text) {
  const found = []
  const coreNamespaces = new Set()
  const source = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, rel.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const at = node => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
  for (const stmt of source.statements) {
    if (ts.isImportDeclaration(stmt) && ts.isStringLiteral(stmt.moduleSpecifier) && stmt.moduleSpecifier.text === '@mantine/core') {
      const named = stmt.importClause?.namedBindings
      if (named && ts.isNamespaceImport(named)) coreNamespaces.add(named.name.text)
      if (named && ts.isNamedImports(named) && rel !== BADGE_COMPONENT) {
        for (const el of named.elements) {
          const imported = (el.propertyName ?? el.name).text
          if (imported === 'Badge') found.push({ rel, line: at(el), rule: 'badge-import', message: "imports `Badge` from '@mantine/core' (use MantineBadge)" })
        }
      }
    }
    if (ts.isVariableStatement(stmt) && rel !== TONES_FILE) {
      for (const decl of stmt.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || !/_(COLOR|TONE)$/.test(decl.name.text)) continue
        const typedRecord = decl.type && ts.isTypeReferenceNode(decl.type) && decl.type.typeName.getText(source) === 'Record'
        let init = decl.initializer
        while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression(init) || ts.isParenthesizedExpression(init))) init = init.expression
        const objectLiteral = init && ts.isObjectLiteralExpression(init)
        if (typedRecord || objectLiteral) {
          found.push({ rel, line: at(decl), rule: 'colour-map', message: `declares \`${decl.name.text}\` (a colour or tone map belongs in badgeTones.ts)` })
        }
      }
    }
  }
  if (rel !== BADGE_COMPONENT && coreNamespaces.size) {
    const visit = node => {
      const namespaceBadge = ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)
        && coreNamespaces.has(node.expression.text) && node.name.text === 'Badge'
      const indexedBadge = ts.isElementAccessExpression(node) && ts.isIdentifier(node.expression)
        && coreNamespaces.has(node.expression.text) && ts.isStringLiteral(node.argumentExpression) && node.argumentExpression.text === 'Badge'
      if (namespaceBadge || indexedBadge) found.push({ rel, line: at(node), rule: 'badge-import', message: 'accesses Badge through an @mantine/core namespace (use MantineBadge)' })
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  return found
}

function scanTree() {
  const files = walk(join(ROOT, 'src')).map(f => relative(ROOT, f).split('\\').join('/')).filter(rel => !isExcluded(rel))
  const violations = files.flatMap(rel => scanSource(rel, readFileSync(join(ROOT, rel), 'utf8')))
  return { files, violations }
}

function verifyGate() {
  const plants = [
    { name: 'plant 1 (Badge import)', rel: 'src/components/x/Plant.tsx', text: "import { Badge } from '@mantine/core'\nexport const A = () => <Badge />\n", rule: 'badge-import' },
    { name: 'plant 2 (colour map)', rel: 'src/components/x/Plant.ts', text: "export const FOO_COLOR: Record<string, string> = { a: 'red' }\n", rule: 'colour-map' },
  ]
  const clean = [
    { rel: BADGE_COMPONENT, text: "import { Badge } from '@mantine/core'\n" },
    { rel: TONES_FILE, text: "export const BADGE_COLOR: Record<string, string> = {}\n" },
    { rel: 'src/a.ts', text: "export { LISTING_STATUS_COLOR } from '@/design-system/mantine/badgeTones'\nimport { Box } from '@mantine/core'\n" },
  ]
  let ok = true
  for (const p of plants) {
    const hit = scanSource(p.rel, p.text).some(v => v.rule === p.rule)
    console.log(`${hit ? 'RED  ' : 'FAIL '} ${p.name}: ${hit ? 'detected' : 'NOT detected'}`)
    ok &&= hit
  }
  for (const c of clean) {
    const hits = scanSource(c.rel, c.text)
    console.log(`${hits.length === 0 ? 'GREEN' : 'FAIL '} clean sample ${c.rel}: ${hits.length} violation(s)`)
    ok &&= hits.length === 0
  }
  console.log(ok ? 'check:badge-canonical self-test PASSED' : 'check:badge-canonical self-test FAILED')
  return ok ? 0 : 1
}

if (process.argv.includes('--verify-gate')) {
  process.exit(verifyGate())
} else if (import.meta.url === `file:///${process.argv[1].split('\\').join('/')}` || process.argv[1]?.endsWith('check-badge-canonical.mjs')) {
  const { files, violations } = scanTree()
  console.log(`check:badge-canonical — scope: ${files.length} production .ts/.tsx files under src/ (stories, tests, src/stories excluded); rules: no Badge import from @mantine/core outside ${BADGE_COMPONENT}; no *_COLOR / *_TONE map outside ${TONES_FILE}.`)
  console.log('GR-2: it reads import and variable declarations; it cannot see a colour chosen another way (a literal color prop, a differently named map).')
  for (const v of violations) console.log(`FAIL  ${v.rel}:${v.line}  [${v.rule}]  ${v.message}`)
  console.log(violations.length === 0 ? 'check:badge-canonical PASSED — 0 violations' : `check:badge-canonical FAILED — ${violations.length} violation(s)`)
  process.exit(violations.length === 0 ? 0 : 1)
}
