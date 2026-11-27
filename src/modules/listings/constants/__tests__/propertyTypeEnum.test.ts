// @vitest-environment node
/**
 * Task 1022 AC1: every property type the listing form offers is a value of the database enum, so no offered type is refused at the insert.
 * Reads the committed catalog snapshot `supabase/catalog.json` (written by `scripts/quality/db-catalog-audit.mjs --save`), takes the `enum_values` of the column
 * `listings.property_type`, and holds against them every value of `PROPERTY_TYPES` (the form's options) and of the server schema `step1Schema.shape.property_type`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PROPERTY_TYPES } from '@/modules/listings/constants'
import { step1Schema } from '@/modules/listings/validations'

type CatalogColumn = { table?: string; name?: string; enum_values?: string[] }

function enumValuesOfListingsPropertyType(): string[] {
  const catalog: unknown = JSON.parse(readFileSync(join(process.cwd(), 'supabase', 'catalog.json'), 'utf8'))
  const columns: CatalogColumn[] = []
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) { node.forEach(walk); return }
    if (node && typeof node === 'object') {
      const o = node as CatalogColumn
      if (o.table === 'listings' && o.name === 'property_type' && Array.isArray(o.enum_values)) columns.push(o)
      Object.values(node).forEach(walk)
    }
  }
  walk(catalog)
  expect(columns, 'supabase/catalog.json holds exactly one column listings.property_type with enum_values').toHaveLength(1)
  return columns[0].enum_values as string[]
}

describe('Task 1022 AC1: the offered property types are values of the enum listings.property_type', () => {
  const enumValues = enumValuesOfListingsPropertyType()

  it('every value of PROPERTY_TYPES (the form options) is in the enum', () => {
    const missing = PROPERTY_TYPES.map(t => t.value).filter(v => !enumValues.includes(v))
    expect(missing, 'offered by the form, absent from the enum').toEqual([])
  })

  it('every value step1Schema.shape.property_type accepts (the server schema) is in the enum', () => {
    const missing = step1Schema.shape.property_type.options.filter(v => !enumValues.includes(v))
    expect(missing, 'accepted by the server schema, absent from the enum').toEqual([])
  })
})
