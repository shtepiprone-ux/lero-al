// @vitest-environment node
/**
 * Task 952 (T3, regression found by running the Next 16 production server): since Next 16 a Server Component that imports `next/link` gets the real `LinkComponent`
 * function. Passing it as the `component` prop of a Mantine (client) component crosses the server/client boundary with a function and fails the whole page with
 * "Functions cannot be passed directly to Client Components" (HTTP 500 on every page that renders the footer). The fix is `ClientLink`, the same link imported from a
 * `'use client'` module. This test reads the syntax tree of every product file that is NOT a client module and fails when it hands `next/link` to a `component` prop.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const rel = (p: string) => relative(ROOT, p).split('\\').join('/')
function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name === 'node_modules' || name === '__tests__') continue; walk(p, acc) } else acc.push(p)
  }
  return acc
}
const product = walk(join(ROOT, 'src')).filter((f) => /\.tsx$/.test(f) && !/\.(test|spec|stories)\.tsx$/.test(f))

/** `'use client'` read from the syntax tree: a string-literal statement in the directive prologue (comments before it are trivia), with no pattern that can backtrack */
const isClientModule = (text: string): boolean => {
  const sf = ts.createSourceFile('module.tsx', text, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX)
  for (const statement of sf.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) return false
    if (statement.expression.text === 'use client') return true
  }
  return false
}

/** the local names under which a file imports the default export of `next/link` */
function linkNames(sf: ts.SourceFile): Set<string> {
  const names = new Set<string>()
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && st.moduleSpecifier.text === 'next/link' && st.importClause?.name) names.add(st.importClause.name.text)
  }
  return names
}

/** `file:line` of every `component={<next/link>}` attribute in a file */
export function linkAsComponent(file: string, text: string): string[] {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const names = linkNames(sf)
  const hits: string[] = []
  const visit = (n: ts.Node) => {
    if (ts.isJsxAttribute(n) && ts.isIdentifier(n.name) && n.name.text === 'component' && n.initializer && ts.isJsxExpression(n.initializer)
      && n.initializer.expression && ts.isIdentifier(n.initializer.expression) && names.has(n.initializer.expression.text)) {
      hits.push(`${file}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`)
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return hits
}

describe('a Server Component does not pass next/link as a component prop (Next 16)', () => {
  it('[SEC-T3-SRV-LINK-COMPONENT] no non-client product file hands next/link to a `component` prop', () => {
    const bad = product.flatMap((f) => { const text = readFileSync(f, 'utf8'); return isClientModule(text) ? [] : linkAsComponent(rel(f), text) })
    expect(bad).toEqual([])
  })

  it('the scanner finds the pattern (planted) and ignores a client module, a plain <Link> and a string component', () => {
    const planted = `import Link from 'next/link'\nimport { Anchor } from '@mantine/core'\nexport const A = () => <Anchor component={Link} href="/x">x</Anchor>\n`
    expect(linkAsComponent('planted.tsx', planted)).toEqual(['planted.tsx:3'])
    expect(linkAsComponent('renamed.tsx', planted.replaceAll('Link', 'NextLink').replace("'next/NextLink'", "'next/link'"))).toEqual(['renamed.tsx:3'])
    expect(linkAsComponent('plain.tsx', `import Link from 'next/link'\nexport const A = () => <Link href="/x">x</Link>\n`)).toEqual([])
    expect(linkAsComponent('string.tsx', `import Link from 'next/link'\nexport const A = () => <Anchor component="a" href="/x">x</Anchor>\n`)).toEqual([])
    expect(isClientModule(`'use client'\n${planted}`)).toBe(true)
    expect(isClientModule(planted)).toBe(false)
  })

  it('ClientLink is a client module that re-exports next/link', () => {
    const text = readFileSync(join(ROOT, 'src/lib/navigation/ClientLink.tsx'), 'utf8')
    expect(isClientModule(text)).toBe(true)
    expect(text).toMatch(/export const ClientLink = Link\b/)
  })
})
