// @vitest-environment node
/**
 * Task 952 (AC3): Next 16 changed `revalidateTag(tag)` to `revalidateTag(tag, profile)`; a Server Action that must show its change at once calls `updateTag(tag)`.
 * Behaviour kept: a tag expires immediately after the change (before this task `revalidateTag(tag)` expired it at once). The per-action tests assert the observed
 * calls; this file guards the rule over the whole product code, so a new one-argument `revalidateTag(` call cannot slip in, and the Vitest stub of `next/cache`
 * keeps the same two functions as the real module.
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
const product = walk(join(ROOT, 'src')).filter((f) => /\.tsx?$/.test(f) && !/\.(test|spec|stories)\.tsx?$/.test(f) && !rel(f).startsWith('src/tests/'))

interface Call { file: string; line: number; callee: string; args: number; firstArg: string; secondArg: string | null }
function cacheCalls(): Call[] {
  const out: Call[] = []
  for (const f of product) {
    const text = readFileSync(f, 'utf8')
    if (!/revalidateTag|updateTag/.test(text)) continue
    const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    const visit = (n: ts.Node) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && (n.expression.text === 'revalidateTag' || n.expression.text === 'updateTag')) {
        const second = n.arguments[1]
        out.push({ file: rel(f), line: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, callee: n.expression.text, args: n.arguments.length, firstArg: n.arguments[0]?.getText(sf) ?? '', secondArg: second && ts.isStringLiteralLike(second) ? second.text : null })
      }
      ts.forEachChild(n, visit)
    }
    visit(sf)
  }
  return out
}

const isUseServer = (file: string) => /^\s*['"]use server['"]/m.test(readFileSync(join(ROOT, file), 'utf8'))

describe('cache tags expire as before (Next 16)', () => {
  it('[SEC-T3-SRV-TAG-PROFILE] no revalidateTag call omits the cache profile, and a revalidateTag profile is the documented "max"', () => {
    const calls = cacheCalls().filter((c) => c.callee === 'revalidateTag')
    const bad = calls.filter((c) => c.args !== 2 || c.secondArg !== 'max').map((c) => `${c.file}:${c.line}`)
    expect(bad).toEqual([])
  })

  it('[SEC-T3-SRV-TAG-UPDATE] the twelve former revalidateTag(tag) calls of the Server Actions are updateTag(tag) with exactly the tag', () => {
    // Task 964 R1-2 added calls with the public-listings constant, one per change of the public listings (guarded by publicListingsTag.test.ts); the twelve are the others
    const calls = cacheCalls().filter((c) => c.callee === 'updateTag' && c.firstArg !== 'PUBLIC_LISTINGS_CACHE_TAG')
    expect(calls.length).toBe(12)
    expect(cacheCalls().filter((c) => c.callee === 'updateTag' && c.firstArg === 'PUBLIC_LISTINGS_CACHE_TAG').every((c) => c.args === 1)).toBe(true)
    expect(calls.filter((c) => c.args !== 1).map((c) => `${c.file}:${c.line}`)).toEqual([])
  })

  it('updateTag is called only in a Server Action file, or in the status gateway whose importers are all Server Action files', () => {
    // `updateTag` throws outside a Server Action.
    const gateway = 'src/modules/listings/actions/applyListingTransition.ts'
    const files = [...new Set(cacheCalls().filter((c) => c.callee === 'updateTag').map((c) => c.file))]
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      if (file === gateway) continue
      expect(isUseServer(file), `${file} is a 'use server' file`).toBe(true)
    }
    const importers = product.filter((f) => /applyListingTransition['"]/.test(readFileSync(f, 'utf8')) && rel(f) !== gateway).map(rel)
    expect(importers.length).toBeGreaterThan(0)
    for (const file of importers) expect(isUseServer(file), `${file} imports the gateway and is a 'use server' file`).toBe(true)
  })

  it('the Vitest stub of next/cache exports both revalidateTag and updateTag', async () => {
    const stub = await import('@/tests/next-cache-stub')
    expect(typeof stub.revalidateTag).toBe('function')
    expect(typeof (stub as Record<string, unknown>).updateTag).toBe('function')
    expect(() => (stub as unknown as { updateTag: (t: string) => void }).updateTag('x')).not.toThrow()
    expect(() => stub.revalidateTag('x', 'max')).not.toThrow()
  })
})
