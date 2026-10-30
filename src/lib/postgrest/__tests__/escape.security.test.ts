// @vitest-environment node
/**
 * PostgREST filter text (Task 923 Revision 7, finding S8): a person's search text must stay a VALUE and never become part of the filter.
 */
import { describe, expect, it } from 'vitest'
import { escapeLike, ilikeContains, quoteFilterValue } from '../escape'

const BACKSLASH = String.fromCharCode(92)

/** What PostgREST does with an `or(...)` string, reduced to the rule that matters here: split on commas that are outside double quotes and parentheses. */
function topLevelConditions(or: string): string[] {
  const out: string[] = []
  let depth = 0
  let quoted = false
  let cur = ''
  for (let i = 0; i < or.length; i++) {
    const c = or[i]
    if (quoted && c === BACKSLASH) { cur += c + or[++i]; continue }
    if (c === '"') quoted = !quoted
    if (!quoted && c === '(') depth++
    if (!quoted && c === ')') depth--
    if (!quoted && depth === 0 && c === ',') { out.push(cur); cur = ''; continue }
    cur += c
  }
  out.push(cur)
  return out
}

const HOSTILE = [
  'x,role.eq.admin',
  'a),and(id.neq.0',
  'john",id.neq.0,"',
  'x),or(role.eq.admin',
  '"; drop table users; --',
  `a${BACKSLASH}`,
  'name.eq.x',
  '%',
  '_',
  '100% real_name',
  '',
]

describe('escapeLike', () => {
  it('makes % _ and backslash literal', () => {
    expect(escapeLike('100%')).toBe(`100${BACKSLASH}%`)
    expect(escapeLike('a_b')).toBe(`a${BACKSLASH}_b`)
    expect(escapeLike(`a${BACKSLASH}b`)).toBe(`a${BACKSLASH}${BACKSLASH}b`)
  })

  it('leaves ordinary text untouched', () => {
    expect(escapeLike('Alba Krasniqi')).toBe('Alba Krasniqi')
    expect(escapeLike('Përparim Çela')).toBe('Përparim Çela')
  })
})

describe('quoteFilterValue', () => {
  it('wraps in double quotes and escapes the quote and the backslash', () => {
    expect(quoteFilterValue('a"b')).toBe(`"a${BACKSLASH}"b"`)
    expect(quoteFilterValue(`a${BACKSLASH}b`)).toBe(`"a${BACKSLASH}${BACKSLASH}b"`)
    expect(quoteFilterValue('plain')).toBe('"plain"')
  })
})

describe('a hostile search text stays ONE condition', () => {
  it.each(HOSTILE)('%j', (term) => {
    const cols = ['name', 'last_name', 'phone', 'company_name']
    const or = cols.map((c) => `${c}.ilike.${ilikeContains(term)}`).join(',')
    const conditions = topLevelConditions(or)
    expect(conditions).toHaveLength(4)
    for (const [i, col] of cols.entries()) expect(conditions[i].startsWith(`${col}.ilike.`)).toBe(true)
  })

  it('an unescaped text WOULD have added conditions (the test method sees the attack)', () => {
    const or = 'name.ilike.%x,role.eq.admin%,last_name.ilike.%x,role.eq.admin%'
    expect(topLevelConditions(or).length).toBeGreaterThan(2)
  })

  it('the wildcard characters of the person are literal inside the quoted pattern', () => {
    // two layers: the LIKE escape (backslash before the percent sign) and then the quoting of the backslash itself
    expect(ilikeContains('100%')).toBe(`"%100${BACKSLASH}${BACKSLASH}%%"`)
  })
})

// Task 923 R38 (case SEC-S08-SRV-DENY)
it('[SEC-S08-SRV-DENY] Admin search text cannot change a PostgREST filter', () => {
  for (const text of ['x,role.eq.admin', 'a),and(id.neq.0', 'x),or(role.eq.admin']) {
    const condition = `name.ilike.${quoteFilterValue(ilikeContains(text))}`
    expect(topLevelConditions(condition), text).toHaveLength(1)   // the text stays one value inside one condition
  }
  expect(topLevelConditions(`name.ilike.${quoteFilterValue(ilikeContains('plain'))},email.ilike.${quoteFilterValue(ilikeContains('plain'))}`)).toHaveLength(2)   // the control: two conditions stay two
})
