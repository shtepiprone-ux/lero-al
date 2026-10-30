// @vitest-environment node
/**
 * The helpers of the admin pages screen (Task 923 Revision 7). Pages exist in two shapes: the old single-language shape (`{ body }`) and the four-language one;
 * a helper that mixes them up would show the wrong text in the editor, and saving would then overwrite the right one.
 */
import { describe, expect, it } from 'vitest'
import { PAGE_LOCALES, getDisplayTitle, getLocaleContent, isLegacyContent, isMigrationPending, toSlug } from '../adminPagesContent'
import type { Page } from '@/types/database'

const page = (over: Record<string, unknown>) => ({ id: 1, slug: 'terms', title: 'Kushtet', content: { sq: { title: 'Kushtet SQ', body: '<p>sq</p>' }, en: { title: 'Terms', body: '<p>en</p>' } }, is_published: true, ...over }) as unknown as Page
const legacy = (over: Record<string, unknown> = {}) => page({ content: { body: '<p>old</p>' }, ...over })

describe('toSlug', () => {
  it.each([['About Us', 'about-us'], ['  Terms  &  Conditions ', 'terms-conditions'], ['Përditësime', 'prditsime'], ['--a--', 'a'], ['a - b', 'a-b'], ['-', ''], ['A/B', 'ab'], ['', ''], ['123', '123']])('%j gives %j', (input, slug) => {
    expect(toSlug(input)).toBe(slug)
  })
})

describe('isLegacyContent', () => {
  it('the old single-language shape is legacy; the four-language one is not', () => {
    expect(isLegacyContent({ body: 'x' })).toBe(true)
    expect(isLegacyContent({ sq: {}, en: {} })).toBe(false)
  })
  it.each([[null], [undefined], ['text'], [5], [true]])('%j is not legacy content (it is no content)', (v) => expect(isLegacyContent(v)).toBe(false))
})

describe('getLocaleContent', () => {
  it('a page that does not exist is empty', () => {
    expect(getLocaleContent(undefined, 'sq')).toEqual({ title: '', body: '' })
  })

  it('a four-language page gives each language its own text, and an empty one for a language it lacks', () => {
    expect(getLocaleContent(page({}), 'en')).toEqual({ title: 'Terms', body: '<p>en</p>' })
    expect(getLocaleContent(page({}), 'uk')).toEqual({ title: '', body: '' })
  })

  it('a legacy page puts its text in Albanian only, with the page title', () => {
    expect(getLocaleContent(legacy(), 'sq')).toEqual({ title: 'Kushtet', body: '<p>old</p>' })
    expect(getLocaleContent(legacy(), 'en')).toEqual({ title: '', body: '' })
    expect(getLocaleContent(legacy({ title: null, content: {} }), 'sq')).toEqual({ title: '', body: '' })
  })

  it('every one of the four languages is offered', () => {
    expect(PAGE_LOCALES).toEqual(['sq', 'en', 'uk', 'it'])
  })
})

describe('isMigrationPending', () => {
  it('is true as soon as one page is still in the old shape', () => {
    expect(isMigrationPending([page({}), page({})])).toBe(false)
    expect(isMigrationPending([page({}), legacy()])).toBe(true)
    expect(isMigrationPending([])).toBe(false)
  })
})

describe('getDisplayTitle', () => {
  it('prefers the Albanian title, then the page title, then the slug', () => {
    expect(getDisplayTitle(page({}))).toBe('Kushtet SQ')
    expect(getDisplayTitle(page({ content: { sq: { title: '', body: '' } } }))).toBe('Kushtet')
    expect(getDisplayTitle(page({ content: { sq: { title: '', body: '' } }, title: '' }))).toBe('terms')
    expect(getDisplayTitle(page({ content: { en: { title: 'T', body: '' } } }))).toBe('Kushtet')
  })

  it('a legacy page shows its title, or its slug', () => {
    expect(getDisplayTitle(legacy())).toBe('Kushtet')
    expect(getDisplayTitle(legacy({ title: '' }))).toBe('terms')
  })
})
