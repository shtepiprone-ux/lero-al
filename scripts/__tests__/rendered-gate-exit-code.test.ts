// @vitest-environment node
/**
 * Sweep exit-code regression gate (Task 710, R9).
 *
 * Task 709 persisted `EXIT_CODE=0` beside 4 genuine FAILs from `check-stories-rendered.mjs`; 709-R
 * proved unpiped that the sweep really does exit 1 on a failing run — the zero was a piped-capture
 * artifact, not a code defect (see docs/storybook-governance.md's unpiped-capture rule and
 * docs/sessions/2026-08-05-task709R-herosearchview-layer-fix.md §7). This test protects the code
 * path itself: it asserts `check-stories-rendered.mjs`'s `if (failed > 0)` branch still sets
 * `process.exitCode = 1`, and that no later line resets the exit code back to 0 — so a future edit
 * can never silently reintroduce a false-green sweep.
 *
 * `check-stories-rendered.mjs` itself is READ-ONLY here (docs/storybook-governance.md §14.9 / D33
 * — Task 710 makes zero changes to it). The planted-violation proof below mutates a throwaway COPY
 * under a temp directory, never the real file.
 *
 * Run: npx vitest run scripts/__tests__/rendered-gate-exit-code.test.ts
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')
const REAL_PATH = join(ROOT, 'scripts', 'check-stories-rendered.mjs')

const FAILED_BRANCH_MARKER = 'if (failed > 0) {'

/** Bracket-counts from the `if (failed > 0) {` marker to its matching closing brace and returns
 * the branch body — so the exitCode assertion below is scoped to THIS branch, not any of the
 * file's other `process.exitCode = 1` sites (index-unreadable, zero-Mantine-matches, blank-
 * screenshot self-test all also set exitCode=1 for their own, unrelated reasons). */
function extractFailedBranchBody(src: string): string {
  const idx = src.indexOf(FAILED_BRANCH_MARKER)
  if (idx === -1) {
    throw new Error(`could not find "${FAILED_BRANCH_MARKER}" in source — has the sweep's failure branch been renamed or removed?`)
  }
  let depth = 1
  let i = idx + FAILED_BRANCH_MARKER.length
  const start = i
  while (depth > 0 && i < src.length) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') depth--
    i++
  }
  if (depth !== 0) {
    throw new Error('unbalanced braces while scanning the "if (failed > 0)" branch — cannot determine its extent')
  }
  return src.slice(start, i)
}

/** Throws with a specific message when the sweep's failure exit path is missing or has been
 * reset elsewhere in the file — never a silent pass. */
function assertSweepExitsNonZeroOnFailure(sourcePath: string): void {
  const src = readFileSync(sourcePath, 'utf8')
  const branchBody = extractFailedBranchBody(src)

  if (!/process\.exitCode\s*=\s*1\s*;/.test(branchBody)) {
    throw new Error('the "if (failed > 0)" branch no longer sets process.exitCode = 1 — a failing sweep could exit 0')
  }
  if (/process\.exitCode\s*=\s*0/.test(src) || /process\.exit\(\s*0\s*\)/.test(src)) {
    throw new Error('found a process.exitCode = 0 / process.exit(0) elsewhere in the file — this can reset the failure exit code to a false green')
  }
}

describe('check-stories-rendered.mjs never resets its failure exit code (Task 710, R9)', () => {
  it('the real file sets process.exitCode = 1 on the failed>0 path and never resets it to 0', () => {
    expect(() => assertSweepExitsNonZeroOnFailure(REAL_PATH)).not.toThrow()
  })

  it('planted violation A: dropping the exitCode=1 assignment fails the assertion, naming the missing path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'task710-r9-drop-'))
    try {
      const src = readFileSync(REAL_PATH, 'utf8')
      const branchBody = extractFailedBranchBody(src)
      expect(branchBody).toMatch(/process\.exitCode\s*=\s*1\s*;/) // sanity: the real branch has it before we drop it

      // Anchored on the unique "Task 418 REWORK (P1-a)" comment immediately above the failed>0
      // branch's exitCode assignment — check-stories-rendered.mjs has THREE other, unrelated
      // "process.exitCode = 1;\n      return;" sites (self-test, index-unreadable, zero-Mantine-
      // matches); a bare string.replace() on that pattern alone hits the first (wrong) occurrence.
      const anchor = "// Task 418 REWORK (P1-a): set exitCode + return (not process.exit) so the\n      // `finally` below still runs `browser?.close()` / `server?.close()` on FAIL.\n      process.exitCode = 1;\n      return;"
      expect(src).toContain(anchor) // sanity: the anchor still matches the real source verbatim
      const mutated = src.replace(anchor, anchor.replace('process.exitCode = 1;', '/* PLANTED REMOVAL — Task 710 R9 */'))
      expect(mutated).not.toBe(src) // sanity: the plant actually changed the source

      const mutatedPath = join(dir, 'check-stories-rendered.mutated-drop.mjs')
      writeFileSync(mutatedPath, mutated, 'utf8')

      expect(() => assertSweepExitsNonZeroOnFailure(mutatedPath)).toThrow(/no longer sets process\.exitCode = 1/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('planted violation B: appending a later exitCode=0 reset fails the assertion, naming the added path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'task710-r9-reset-'))
    try {
      const src = readFileSync(REAL_PATH, 'utf8')
      const mutated = `${src}\nprocess.exitCode = 0; // PLANTED RESET — Task 710 R9\n`
      expect(mutated).not.toBe(src) // sanity: the plant actually changed the source

      const mutatedPath = join(dir, 'check-stories-rendered.mutated-reset.mjs')
      writeFileSync(mutatedPath, mutated, 'utf8')

      expect(() => assertSweepExitsNonZeroOnFailure(mutatedPath)).toThrow(/found a process\.exitCode = 0/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
