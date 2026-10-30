// @vitest-environment node
/**
 * Task 923 R44 (owner decisions D26, D27): the caller's role is read in ONE place, `requireViewer()`, so that a guard cannot take a role from an account that has
 * no access. This is a scan of the product source (tests and Stories excluded): an exact `.select('role')` is a role read for a decision, and there is none. The
 * only other read of a role column is the two-column read of the rank rule (`actorMayActOn`), which runs after the guard and needs the target's rank too.
 * The scan reads the same source files the build compiles; a planted sample proves the scanner itself finds a read.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const SKIP = /\.(test|spec|stories)\.[cm]?[jt]sx?$|[\\/]__tests__[\\/]|[\\/]tests[\\/]/
const EXACT_ROLE_READ = /\.select\(\s*(['"`])role\1\s*\)/

export function findRoleReads(text: string): number[] {
  return text.split(/\r?\n/).flatMap((line, i) => (EXACT_ROLE_READ.test(line) ? [i + 1] : []))
}

function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) sources(path, out)
    else if (/\.[cm]?[jt]sx?$/.test(entry.name) && !SKIP.test(path)) out.push(path.split('\\').join('/'))
  }
  return out
}

it('[SEC-D27-SRV-STATIC-DENY] No product code decides by the caller\'s role except through requireViewer', () => {
  // the scanner finds a planted read in every spelling, so an empty result below is not an empty scanner
  expect(findRoleReads("const { data } = await db.from('users').select('role').eq('id', id).single()")).toEqual([1])
  expect(findRoleReads('  .select("role")')).toEqual([1])
  expect(findRoleReads('.select(`role`)')).toEqual([1])
  expect(findRoleReads("const ok = true\n.select( 'role' )")).toEqual([2])
  expect(findRoleReads(".select('role, status, suspended_until, deleted_at')")).toEqual([])

  const found: string[] = []
  for (const file of sources('src')) for (const line of findRoleReads(readFileSync(file, 'utf8'))) found.push(`${file}:${line}`)
  expect(found, `a role read outside requireViewer: ${found.join(', ')}`).toEqual([])

  // requireViewer itself reads the role, together with the status, in one query
  expect(readFileSync('src/lib/auth/requireViewer.ts', 'utf8')).toContain(".select('role, status, suspended_until, deleted_at')")
})
