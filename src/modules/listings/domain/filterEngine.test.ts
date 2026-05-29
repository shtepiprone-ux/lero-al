import { describe, it, expect } from 'vitest'
import { parseSearchParams, countActiveFilters, countActiveFilterValues } from './filterEngine'
import type { FilterValues } from './filterEngine'

// Verifies that parseSearchParams coerces unknown enum values to '' (drop),
// preventing them from reaching Postgres and causing 22P02 errors.

describe('parseSearchParams — enum coerce-or-drop', () => {
  // ── property_type ────────────────────────────────────────────────────────────

  it('passes all known property_type values through', () => {
    const known = ['apartment', 'house', 'room', 'land', 'commercial', 'office', 'garage', 'parking', 'warehouse', 'other']
    for (const pt of known) {
      expect(parseSearchParams(new URLSearchParams(`property_type=${pt}`)).propertyType).toBe(pt)
    }
  })

  it('drops unknown property_type (prevents 22P02)', () => {
    expect(parseSearchParams(new URLSearchParams('property_type=building')).propertyType).toBe('')
    expect(parseSearchParams(new URLSearchParams('property_type=skyscraper')).propertyType).toBe('')
    expect(parseSearchParams(new URLSearchParams('property_type=1%27%3BSELECT')).propertyType).toBe('')
  })

  // ── listing_type ─────────────────────────────────────────────────────────────

  it('passes known listing_type values', () => {
    expect(parseSearchParams(new URLSearchParams('type=sale')).listingType).toBe('sale')
    expect(parseSearchParams(new URLSearchParams('type=rent')).listingType).toBe('rent')
  })

  it('drops unknown listing_type', () => {
    expect(parseSearchParams(new URLSearchParams('type=lease')).listingType).toBe('')
  })

  // ── conditions (multi-select, was: condition) ────────────────────────────────

  it('passes known condition values as array (new multi-select)', () => {
    expect(parseSearchParams(new URLSearchParams('condition=new_build')).conditions).toEqual(['new_build'])
    expect(parseSearchParams(new URLSearchParams('condition=good')).conditions).toEqual(['good'])
  })

  it('parses multiple conditions comma-separated', () => {
    const r = parseSearchParams(new URLSearchParams('condition=new_build,good'))
    expect(r.conditions).toEqual(['new_build', 'good'])
  })

  it('drops unknown condition values from multi-select', () => {
    const r = parseSearchParams(new URLSearchParams('condition=good,perfect'))
    expect(r.conditions).toEqual(['good'])
  })

  it('back-compat: old single-value ?condition=good parses to conditions: [good]', () => {
    expect(parseSearchParams(new URLSearchParams('condition=good')).conditions).toEqual(['good'])
  })

  it('empty condition → conditions: []', () => {
    expect(parseSearchParams(new URLSearchParams('')).conditions).toEqual([])
  })

  // ── heatingTypes (multi-select, was: heating) ─────────────────────────────────

  it('passes known heating values as array', () => {
    expect(parseSearchParams(new URLSearchParams('heating=gas')).heatingTypes).toEqual(['gas'])
  })

  it('parses multiple heating types', () => {
    const r = parseSearchParams(new URLSearchParams('heating=gas,electric'))
    expect(r.heatingTypes).toEqual(['gas', 'electric'])
  })

  it('drops unknown heating values', () => {
    expect(parseSearchParams(new URLSearchParams('heating=solar')).heatingTypes).toEqual([])
  })

  // ── wallTypes (multi-select, was: wall_type) ──────────────────────────────────

  it('drops unknown wall_type values', () => {
    expect(parseSearchParams(new URLSearchParams('wall_type=glass')).wallTypes).toEqual([])
  })

  it('parses multiple wall types', () => {
    const r = parseSearchParams(new URLSearchParams('wall_type=brick,concrete'))
    expect(r.wallTypes).toEqual(expect.arrayContaining(['brick', 'concrete']))
  })

  // ── offerTypes (multi-select, was: offer_type) ───────────────────────────────

  it('passes known offer_type values as array', () => {
    expect(parseSearchParams(new URLSearchParams('offer_type=owner')).offerTypes).toEqual(['owner'])
  })

  it('parses multiple offer types', () => {
    const r = parseSearchParams(new URLSearchParams('offer_type=owner,agency'))
    expect(r.offerTypes).toEqual(expect.arrayContaining(['owner', 'agency']))
  })

  it('drops unknown offer_type values', () => {
    expect(parseSearchParams(new URLSearchParams('offer_type=broker')).offerTypes).toEqual([])
  })

  // ── purchase_conditions (multi) ──────────────────────────────────────────────

  it('passes known purchase_conditions values', () => {
    const r = parseSearchParams(new URLSearchParams('purchase_conditions=installment,mortgage'))
    expect(r.purchaseConditions).toEqual(['installment', 'mortgage'])
  })

  it('filters out unknown purchase_conditions values', () => {
    const r = parseSearchParams(new URLSearchParams('purchase_conditions=installment,barter'))
    expect(r.purchaseConditions).toEqual(['installment'])
  })

  // ── layout_features (multi) ──────────────────────────────────────────────────

  it('filters out unknown layout_features values', () => {
    const r = parseSearchParams(new URLSearchParams('layout_features=studio,penthouse,rooftop'))
    expect(r.layoutFeatures).toEqual(['studio', 'penthouse'])
  })

  // ── already-validated fields remain unchanged ────────────────────────────────

  it('currency defaults to ALL for unknown values', () => {
    expect(parseSearchParams(new URLSearchParams('currency=USD')).currency).toBe('ALL')
    expect(parseSearchParams(new URLSearchParams('currency=EUR')).currency).toBe('EUR')
  })

  it('sort defaults to newest for unknown values', () => {
    expect(parseSearchParams(new URLSearchParams('sort=random')).sort).toBe('newest')
    expect(parseSearchParams(new URLSearchParams('sort=price_asc')).sort).toBe('price_asc')
  })
})

// ── countActiveFilters — canonical per-value counting ─────────────────────────

describe('countActiveFilters — per-value counting', () => {
  function base() {
    return parseSearchParams(new URLSearchParams(''))
  }

  it('empty params → 0', () => {
    expect(countActiveFilters(base())).toBe(0)
  })

  it('3 conditions selected → count = 3 (not 1)', () => {
    const f = parseSearchParams(new URLSearchParams('condition=new_build,good,needs_repair'))
    expect(f.conditions).toHaveLength(3)
    expect(countActiveFilters(f)).toBe(3)
  })

  it('2 conditions + 2 heatingTypes → count = 4', () => {
    const f = parseSearchParams(new URLSearchParams('condition=new_build,good&heating=gas,electric'))
    expect(countActiveFilters(f)).toBe(4)
  })

  it('rooms multi-select: 3 rooms selected → count += 3', () => {
    const f = parseSearchParams(new URLSearchParams('rooms=1,2,3'))
    expect(f.rooms).toHaveLength(3)
    expect(countActiveFilters(f)).toBe(3)
  })

  it('range: only price_min filled → count = 1', () => {
    const f = parseSearchParams(new URLSearchParams('price_min=50000'))
    expect(countActiveFilters(f)).toBe(1)
  })

  it('range: both price bounds filled → count = 2', () => {
    const f = parseSearchParams(new URLSearchParams('price_min=50000&price_max=150000'))
    expect(countActiveFilters(f)).toBe(2)
  })

  it('isPremium=true → count += 1', () => {
    const f = parseSearchParams(new URLSearchParams('premium=true'))
    expect(f.isPremium).toBe(true)
    expect(countActiveFilters(f)).toBe(1)
  })

  it('currency excluded from count', () => {
    const f = parseSearchParams(new URLSearchParams('currency=EUR'))
    expect(countActiveFilters(f)).toBe(0)
  })

  it('2 conditions + 3 purchaseConditions + price_min → count = 6', () => {
    const f = parseSearchParams(new URLSearchParams('condition=new_build,good&purchase_conditions=installment,mortgage,assignment&price_min=50000'))
    expect(countActiveFilters(f)).toBe(6)
  })

  it('marketType (scalar) counts as 1 regardless', () => {
    const f = parseSearchParams(new URLSearchParams('market_type=secondary'))
    expect(f.marketType).toBe('secondary')
    expect(countActiveFilters(f)).toBe(1)
  })
})

// ── countActiveFilterValues — same rules on local FilterValues ────────────────

describe('countActiveFilterValues — local draft state', () => {
  it('empty FilterValues → 0', () => {
    const fv: FilterValues = {}
    expect(countActiveFilterValues(fv)).toBe(0)
  })

  it('currency excluded from count', () => {
    const fv: FilterValues = { currency: 'EUR' }
    expect(countActiveFilterValues(fv)).toBe(0)
  })

  it('conditions array: 2 items → count = 2', () => {
    const fv: FilterValues = { conditions: ['new_build', 'good'] }
    expect(countActiveFilterValues(fv)).toBe(2)
  })

  it('heating_types + wall_types count per value', () => {
    const fv: FilterValues = { heating_types: ['gas', 'electric'], wall_types: ['brick'] }
    expect(countActiveFilterValues(fv)).toBe(3)
  })

  it('market_type scalar → count = 1', () => {
    const fv: FilterValues = { market_type: 'primary' }
    expect(countActiveFilterValues(fv)).toBe(1)
  })

  it('price range: both bounds → count = 2', () => {
    const fv: FilterValues = { price_min: 50000, price_max: 150000 }
    expect(countActiveFilterValues(fv)).toBe(2)
  })
})
