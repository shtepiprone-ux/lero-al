// @vitest-environment node
/**
 * Regression test for scripts/check-i18n-parity.mjs Part-2 raw-enum scanner (Task 447).
 *
 * Asserts:
 *   - The two real false-positive lines from the live codebase → 0 findings (AC1 + AC2).
 *   - A planted TRUE leak → exactly 1 finding (AC3 — gate is not a no-op).
 *
 * Planted-violation proof (session log):
 *   Removing the AC1 guard makes the attribute false-positive test FAIL.
 *   Removing both guards makes both false-positive tests FAIL.
 *
 * Run: npx vitest run scripts/__tests__/check-i18n-parity.test.ts
 */

import { describe, it, expect } from 'vitest'

// @ts-ignore — .mjs module
import { scanRawEnumLeaks } from '../check-i18n-parity.mjs'

type Finding = { line: number; text: string }

// ── AC1: JSX attribute form (currentStatus={selected.status}) ──────────────────

describe('AC1 — JSX attribute value is NOT reported', () => {
  it('GOOD — currentStatus={selected.status} (attribute, =…{x.status}) → 0 findings', () => {
    const line = '                    currentStatus={selected.status}'
    const findings: Finding[] = scanRawEnumLeaks(line, 'src/components/admin/AdminInquiriesManager.tsx')
    expect(findings).toHaveLength(0)
  })

  it('GOOD — someProp={x.status} attribute form → 0 findings', () => {
    const line = '        <Control someProp={x.status} />'
    const findings: Finding[] = scanRawEnumLeaks(line, 'src/fake.tsx')
    expect(findings).toHaveLength(0)
  })
})

// ── AC2: Translator variant tu() is NOT reported ──────────────────────────────

describe('AC2 — translator variant tu() is NOT reported', () => {
  it('GOOD — tu(`user_status_${user.status}`) template-key interpolation → 0 findings', () => {
    const line = '            <Badge variant={statusVariant} className="text-2xs h-4 px-1">{tu(`user_status_${user.status}` as `user_status_active`)}</Badge>'
    const findings: Finding[] = scanRawEnumLeaks(line, 'src/components/admin/AdminSupportManager.tsx')
    expect(findings).toHaveLength(0)
  })

  it('GOOD — tSort(`status_${x.status}`) translator variant → 0 findings', () => {
    const line = "        <span>{tSort(`status_${x.status}`)}</span>"
    const findings: Finding[] = scanRawEnumLeaks(line, 'src/fake.tsx')
    expect(findings).toHaveLength(0)
  })

  it('GOOD — standard t(`status_${x.role}`) → 0 findings', () => {
    const line = "        <span>{t(`role_${x.role}`)}</span>"
    const findings: Finding[] = scanRawEnumLeaks(line, 'src/fake.tsx')
    expect(findings).toHaveLength(0)
  })
})

// ── AC3: Real leaks ARE caught (planted violations) ───────────────────────────

describe('AC3 — genuine raw-enum renders ARE reported', () => {
  it('BAD — <span>{user.status}</span> → exactly 1 finding', () => {
    const line = '        <span>{user.status}</span>'
    const findings: Finding[] = scanRawEnumLeaks(line, 'src/fake.tsx')
    expect(findings).toHaveLength(1)
    expect(findings[0].text).toContain('{user.status}')
  })

  it('BAD — <td>{entry.new_status}</td> → exactly 1 finding', () => {
    const line = '      <td>{entry.new_status}</td>'
    const findings: Finding[] = scanRawEnumLeaks(line, 'src/fake.tsx')
    expect(findings).toHaveLength(1)
  })

  it('BAD — capitalize class with raw {x.role} → at least 1 finding', () => {
    // Matches both pattern 1 ({x.role}) and pattern 3 (capitalize.*{x.role}) — 2 findings
    const line = '      <span className="capitalize">{x.role}</span>'
    const findings: Finding[] = scanRawEnumLeaks(line, 'src/fake.tsx')
    expect(findings.length).toBeGreaterThanOrEqual(1)
  })

  it('BAD — line number in finding matches the actual source line', () => {
    const content = 'const x = 1\n<span>{user.status}</span>\nconst y = 2'
    const findings: Finding[] = scanRawEnumLeaks(content, 'src/fake.tsx')
    expect(findings).toHaveLength(1)
    expect(findings[0].line).toBe(2)
  })
})

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('empty content → 0 findings, no throw', () => {
    expect(() => scanRawEnumLeaks('', 'src/fake.tsx')).not.toThrow()
    expect(scanRawEnumLeaks('', 'src/fake.tsx')).toHaveLength(0)
  })

  it('comment line with {user.status} → 0 findings (skipped)', () => {
    const line = '  // render {user.status} here'
    expect(scanRawEnumLeaks(line, 'src/fake.tsx')).toHaveLength(0)
  })

  it('comparison {x.status} === … → 0 findings (already guarded)', () => {
    const line = "    if ({x.status} === 'active') {"
    expect(scanRawEnumLeaks(line, 'src/fake.tsx')).toHaveLength(0)
  })
})
