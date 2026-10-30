// @vitest-environment node
/**
 * Site settings and property-type readers (Task 923 Revision 7). The settings are free text in a table an administrator edits; every reader must fall back to a safe
 * value for a missing, blank or malformed one, because the result decides the site's language and what search engines are told.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeDb } from '@/tests/fakeSupabase'

let db = createFakeDb()
let dbThrows = false
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => { if (dbThrows) throw new Error('db down'); return db.client } }))
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }))
vi.mock('@/modules/listings/constants', () => ({ ARCHIVED_NOINDEX_DAYS: 90 }))

import { getAllSettings, getArchivedNoindexDays, getDefaultSiteLocale, getSetting } from '../settings'
import { getLocalizedName, getLocalizedPropertyTypes, getPropertyTypes, PROPERTY_TYPES_CACHE_TAG } from '../propertyTypes'

const setSetting = (key: string, value: string) => { db.tables.site_settings = [...(db.tables.site_settings ?? []).filter((r) => r.key !== key), { key, value }] }

beforeEach(() => {
  db = createFakeDb({ site_settings: [{ key: 'site_name', value: 'Lero.al' }] })
  dbThrows = false
})

describe('getSetting', () => {
  it('returns the stored value, or the fallback when there is none', async () => {
    expect(await getSetting('site_name', 'x')).toBe('Lero.al')
    expect(await getSetting('missing', 'fallback')).toBe('fallback')
  })

  it('asks for exactly the key it was given', async () => {
    await getSetting('og_image', 'x')
    expect(db.log[0].filters).toEqual([['key', 'eq', 'og_image']])
  })
})

describe('getDefaultSiteLocale', () => {
  it.each(['sq', 'en', 'uk', 'it'])('accepts %s', async (l) => { setSetting('default_locale', l); expect(await getDefaultSiteLocale()).toBe(l) })

  it.each([['xx'], [''], ['EN'], ['sq,en'], ['<script>']])('a stored %j falls back to Albanian', async (value) => {
    setSetting('default_locale', value)
    expect(await getDefaultSiteLocale()).toBe('sq')
  })

  it('no setting, or a database failure, is Albanian', async () => {
    expect(await getDefaultSiteLocale()).toBe('sq')
    dbThrows = true
    expect(await getDefaultSiteLocale()).toBe('sq')
  })
})

describe('getArchivedNoindexDays', () => {
  it('reads a positive whole number', async () => { setSetting('archived_noindex_days', '30'); expect(await getArchivedNoindexDays()).toBe(30) })

  it.each([['abc'], [''], ['0'], ['-5'], ['NaN'], ['Infinity']])('%j falls back to the default of 90', async (value) => {
    setSetting('archived_noindex_days', value)
    expect(await getArchivedNoindexDays()).toBe(90)
  })

  it('no setting is the default', async () => { expect(await getArchivedNoindexDays()).toBe(90) })
})

describe('getAllSettings', () => {
  it('returns a plain key to value map', async () => {
    setSetting('default_locale', 'it')
    expect(await getAllSettings()).toEqual({ site_name: 'Lero.al', default_locale: 'it' })
  })

  it('an empty table is an empty map', async () => {
    db.tables.site_settings = []
    expect(await getAllSettings()).toEqual({})
  })
})

describe('property types', () => {
  const type = (over: Record<string, unknown>) => ({ id: 1, slug: 'flat', name_sq: 'Apartament', name_en: 'Flat', name_uk: 'Квартира', name_it: 'Appartamento', is_active: true, sort_order: 1, created_at: '2026-01-01', ...over })

  it('the cache tag is the one the admin actions refresh', () => {
    expect(PROPERTY_TYPES_CACHE_TAG).toBe('property-types')
  })

  it('reads the types in display order', async () => {
    db.tables.property_types = [type({ id: 1 }), type({ id: 2, slug: 'land' })]
    expect((await getPropertyTypes()).map((t) => t.slug)).toEqual(['flat', 'land'])
  })

  it('an empty table gives an empty list', async () => {
    expect(await getPropertyTypes()).toEqual([])
  })

  it('shows only active types, with the label in the language asked for', async () => {
    db.tables.property_types = [type({}), type({ id: 2, slug: 'land', is_active: false })]
    expect(await getLocalizedPropertyTypes('uk')).toEqual([{ value: 'flat', label: 'Квартира' }])
  })

  it.each([
    ['en', 'Flat'], ['it', 'Appartamento'], ['sq', 'Apartament'], ['xx', 'Apartament'],
  ])('the name in %s is %s', (locale, expected) => {
    expect(getLocalizedName(type({}) as never, locale)).toBe(expected)
  })

  it('a blank or whitespace name falls back to Albanian, then to the slug', () => {
    expect(getLocalizedName(type({ name_en: '   ' }) as never, 'en')).toBe('Apartament')
    expect(getLocalizedName(type({ name_en: '', name_sq: '' }) as never, 'en')).toBe('flat')
  })
})
