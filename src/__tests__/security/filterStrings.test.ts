// @vitest-environment node
/**
 * No person's text inside a PostgREST filter string (Task 923 Revision 7, finding S8).
 *
 * `.or(...)`, `.ilike(...)`, `.filter(...)` and `.not(...)` take text the database parses. A template literal that interpolates anything a visitor or an admin typed
 * changes the query when the text holds `,` `(` `)`. Every interpolation in those calls must be one of the SAFE forms below (a server-made timestamp, numbers, ids that
 * came from the database or passed a UUID check) or go through `ilikeContains` / `orContains` / `quoteFilterValue`. A new unsafe one fails here.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name === 'node_modules' || name === '__tests__') continue; walk(p, acc) } else acc.push(p)
  }
  return acc
}
const files = walk(join(ROOT, 'src')).filter((f) => /\.tsx?$/.test(f) && !/\.(test|stories)\./.test(f)).map((f) => ({ file: relative(ROOT, f).split('\\').join('/'), text: readFileSync(f, 'utf8') }))

/** an interpolated expression that is safe in a filter string, and why */
const SAFE: [RegExp, string][] = [
  [/^(now|nowTs|throttleTime|twelveMonthsAgo|threeMonthsAgo|sixMonthsAgo|cutoff\w*)$/, 'a timestamp made on the server'],
  [/^(exact|ownerIds|emailIds|ids)\.join\(','\)$/, 'numbers or ids that came from the database'],
  [/^qTrimmed$/, 'only inside an id.eq clause guarded by a full-UUID regex'],
  [/^(orContains|ilikeContains|quoteFilterValue)\(.*\)$/, 'the escaping helpers'],
  [/^wordConds$/, 'built from ilikeContains'],
  [/^(from|to|col|column)$/, 'a column name chosen in code'],
]
const isSafe = (expr: string) => SAFE.some(([re]) => re.test(expr.trim()))

type Hit = { file: string; line: number; call: string; expr: string }
function hits(): Hit[] {
  const out: Hit[] = []
  for (const f of files) {
    f.text.split('\n').forEach((line, i) => {
      // `.filter(Boolean)` on an array is JavaScript, not a PostgREST filter: only a string / template first argument is one
      if (!/\.(or|ilike|like|not)\(|\.filter\(['"`]/.test(line)) return
      for (const m of line.matchAll(/`[^`]*`/g)) {
        for (const e of m[0].matchAll(/\$\{([^}]+)\}/g)) out.push({ file: f.file, line: i + 1, call: line.trim().slice(0, 100), expr: e[1] })
      }
    })
  }
  return out
}

describe('filter strings', () => {
  const all = hits()

  it('the scanner sees the filter strings of the project', () => {
    expect(all.length).toBeGreaterThan(5)
  })

  it('every interpolated value is a safe form', () => {
    const bad = all.filter((h) => !isSafe(h.expr)).map((h) => `${h.file}:${h.line} \${${h.expr}}  <- ${h.call}`)
    expect(bad, `unsafe interpolation in a PostgREST filter string:\n${bad.join('\n')}`).toEqual([])
  })

  it('the admin search sites use the escaping helpers', () => {
    for (const f of ['src/app/admin/listings/page.tsx', 'src/app/admin/users/page.tsx', 'src/modules/admin/actions/index.ts']) {
      const text = files.find((x) => x.file === f)!.text
      expect(text, f).toMatch(/orContains|ilikeContains/)
      expect(text, f).not.toMatch(/ilike\.%\$\{/)
    }
  })

  it('classifies a planted unsafe interpolation as unsafe and a planted safe one as safe', () => {
    expect(isSafe('q')).toBe(false)
    expect(isSafe('searchParams.get("q")')).toBe(false)
    expect(isSafe('qTrimmed')).toBe(true)
    expect(isSafe('now')).toBe(true)
    expect(isSafe("exact.join(',')")).toBe(true)
  })
})
