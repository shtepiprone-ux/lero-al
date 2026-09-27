/**
 * Repo-wide guard — Task 860, R3. Scans every non-test, non-story `src/**\/*.{ts,tsx}` file for a
 * quoted IANA-shaped time-zone literal and asserts it is accepted by `Intl.DateTimeFormat`. Catches
 * the exact defect class `emailChange.ts:177` shipped (`'Europe/Tirana'`, rejected — the real
 * Albania zone is `Europe/Tirane`) anywhere else it might recur.
 *
 * Blind spot (stated per the kickoff's detector-aware-requirements rule): this sees only quoted
 * IANA-shaped literals in non-test source under `src/`. It does not see an id built at runtime
 * (string concatenation, a variable), an id read from an env value, or an id outside `src/`.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const SRC_ROOT = join(__dirname, '..', '..')

const ZONE_LITERAL_RE =
  /(['"])((?:Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)\/[A-Za-z_\-+/]+)\1/g

function isEligibleFile(path: string): boolean {
  if (!/\.(ts|tsx)$/.test(path)) return false
  if (/\.test\.(ts|tsx)$/.test(path)) return false
  if (/\.stories\.(ts|tsx)$/.test(path)) return false
  if (path.split(/[\\/]/).includes('__tests__')) return false
  return true
}

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      collectFiles(full, out)
    } else if (isEligibleFile(full)) {
      out.push(full)
    }
  }
  return out
}

describe('time-zone literal guard (Task 860, R3)', () => {
  it('every quoted IANA-shaped time-zone literal in non-test src is a valid Intl time zone', () => {
    const files = collectFiles(SRC_ROOT)
    const failures: string[] = []
    let foundCount = 0

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      const matches = content.matchAll(ZONE_LITERAL_RE)
      for (const match of matches) {
        const id = match[2]
        foundCount++
        try {
          new Intl.DateTimeFormat('en-US', { timeZone: id })
        } catch {
          failures.push(`${relative(SRC_ROOT, file)}: invalid time zone '${id}'`)
        }
      }
    }

    expect(foundCount).toBeGreaterThan(0)
    expect(failures).toEqual([])
  })
})
