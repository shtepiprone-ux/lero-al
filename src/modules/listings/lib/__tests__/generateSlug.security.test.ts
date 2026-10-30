// @vitest-environment node
/**
 * Security (Task 923 R82 (d), hardening v7.1): the database refuses a session INSERT whose slug is not a plain slug, so the generator must make one for every title.
 *  - SEC-X-SRV-SLUG-PLAIN (critical): whatever the title holds, the slug matches ^[a-z0-9]+(-[a-z0-9]+)*$ and is at most 120 characters.
 * `generateSlug` is the real module; the clock is fixed. The rule is the INSERT guard's own text (guard_listings_protected_columns() of proposed-hardening.sql), written here
 * as the contract states it, never taken from the implementation. The other tests are the controls: ordinary titles keep their words, an empty base becomes `listing`,
 * the module is not a Server Action and createListing uses it.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateSlug } from '../generateSlug'

const RULE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const MAX_LENGTH = 120
// 2026-10-21T10:00:00Z in milliseconds, in base 36
const STAMP = 'mvhxxz40'

const REALISTIC = [
  'Apartament 2+1 në Tiranë', 'Shitet apartament - 2+1', 'Apartment for sale — Tirana', 'Villa me pamje nga deti', 'Продається квартира в центрі', 'Квартира 2+1', '   ', '---', 'A - B', 'ë ç',
  'Apartament 3+1, 120 m2, kati 5/9 (ri)', 'X'.repeat(200), `${'ab '.repeat(30)}-end`, 'Apartment_with_underscores', 'Zyrë me qira - qendër',
]
// shapes that broke the rule before: a hyphen cut at the 80th character, hyphens and spaces in every order, other scripts, emoji, control and no-break spaces, combining marks alone
const SHAPES = [
  `${'a'.repeat(79)} - b`, `${'a'.repeat(80)}-b`, `${'a'.repeat(78)}--b`, `-${'a'.repeat(120)}`, '- - -', '_ _ _', '--a--b--', ' - a - ', '日本語のタイトル', '🏠🏠🏠', 'tab\tand\nnewline', 'no break space',
  '́́́', 'İstanbul', 'ǅǈǋ', 'ﬁnal', '', '1', 'a', '-', '_',
]
// a plain linear congruential generator, so that the sample is the same on every run
function sample(count: number): string[] {
  let seed = 20261021
  const next = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 }
  const alphabet = ['a', 'b', 'e', 'k', 'z', 'Z', '1', '2', '9', '+', ' ', ' ', ' ', '-', '-', '--', ' - ', ',', '.', '/', '(', ')', 'ë', 'ç', 'é', 'я', 'ї', 'и', 'ж', '_', '&', '\t', ' ', '́', '😀', '日']
  const titles: string[] = []
  for (let i = 0; i < count; i++) {
    const length = Math.floor(next() * 200)
    let title = ''
    for (let j = 0; j < length; j++) title += alphabet[Math.floor(next() * alphabet.length)]
    titles.push(title)
  }
  return titles
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-21T10:00:00Z'))
})
afterEach(() => vi.useRealTimers())

describe('generateSlug', () => {
  it('[SEC-X-SRV-SLUG-PLAIN] every title gives a plain slug', () => {
    const titles = [...REALISTIC, ...SHAPES, ...sample(20000)]
    const refused = titles
      .map((title) => ({ title: title.length > 60 ? `${title.slice(0, 60)}...` : title, slug: generateSlug(title) }))
      .filter(({ slug }) => !RULE.test(slug) || slug.length > MAX_LENGTH)
    // the first counterexamples are printed by the assertion
    expect(refused.slice(0, 5)).toEqual([])
    expect(refused).toHaveLength(0)
    expect(titles.length).toBeGreaterThan(20000)
  })

  it('an ordinary title keeps its words, hyphens collapse, and the slug ends with the creation time in base 36 (the control)', () => {
    expect(generateSlug('Apartament 2+1 në Tiranë')).toBe(`apartament-21-ne-tirane-${STAMP}`)
    expect(generateSlug('Shitet apartament - 2+1')).toBe(`shitet-apartament-21-${STAMP}`)
    expect(generateSlug('Apartment for sale — Tirana')).toBe(`apartment-for-sale-tirana-${STAMP}`)
    expect(generateSlug('Zyrë me qira - qendër')).toBe(`zyre-me-qira-qender-${STAMP}`)
    expect(generateSlug('Apartment_with_underscores')).toBe(`apartment-with-underscores-${STAMP}`)
    expect(generateSlug('A - B')).toBe(`a-b-${STAMP}`)
    expect(generateSlug('Квартира 2+1')).toBe(`21-${STAMP}`)
  })

  it('a title with no Latin letter or digit gets the base listing', () => {
    for (const title of ['Продається квартира в центрі', '   ', '---', '_ _ _', '日本語のタイトル', '🏠🏠🏠', '']) {
      expect(generateSlug(title)).toBe(`listing-${STAMP}`)
    }
  })

  it('the base is cut at 80 characters and the hyphens the cut leaves are trimmed', () => {
    expect(generateSlug('X'.repeat(200))).toBe(`${'x'.repeat(80)}-${STAMP}`)
    expect(generateSlug(`${'a'.repeat(79)} - b`)).toBe(`${'a'.repeat(79)}-${STAMP}`)
    expect(generateSlug(`${'a'.repeat(80)}-b`)).toBe(`${'a'.repeat(80)}-${STAMP}`)
  })

  it('is a plain module, not a Server Action, and createListing uses it instead of a local copy', () => {
    const own = readFileSync(fileURLToPath(new URL('../generateSlug.ts', import.meta.url)), 'utf8')
    const consumer = readFileSync(fileURLToPath(new URL('../../actions/createListing.ts', import.meta.url)), 'utf8')
    expect(own).not.toMatch(/^\s*['"]use server['"]/m)
    expect(consumer).toMatch(/import \{ generateSlug \} from '@\/modules\/listings\/lib\/generateSlug'/)
    expect(consumer).not.toMatch(/function generateSlug/)
  })
})
