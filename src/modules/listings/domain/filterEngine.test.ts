import { describe, it, expect } from 'vitest'
import { parseSearchParams } from './filterEngine'

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

  // ── condition ────────────────────────────────────────────────────────────────

  it('passes known condition values', () => {
    expect(parseSearchParams(new URLSearchParams('condition=new_build')).condition).toBe('new_build')
    expect(parseSearchParams(new URLSearchParams('condition=good')).condition).toBe('good')
  })

  it('drops unknown condition', () => {
    expect(parseSearchParams(new URLSearchParams('condition=perfect')).condition).toBe('')
  })

  // ── heating ──────────────────────────────────────────────────────────────────

  it('passes known heating values', () => {
    expect(parseSearchParams(new URLSearchParams('heating=gas')).heating).toBe('gas')
  })

  it('drops unknown heating', () => {
    expect(parseSearchParams(new URLSearchParams('heating=solar')).heating).toBe('')
  })

  // ── wall_type ────────────────────────────────────────────────────────────────

  it('drops unknown wall_type', () => {
    expect(parseSearchParams(new URLSearchParams('wall_type=glass')).wallType).toBe('')
  })

  // ── offer_type ───────────────────────────────────────────────────────────────

  it('passes known offer_type values', () => {
    expect(parseSearchParams(new URLSearchParams('offer_type=owner')).offerType).toBe('owner')
  })

  it('drops unknown offer_type', () => {
    expect(parseSearchParams(new URLSearchParams('offer_type=broker')).offerType).toBe('')
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
