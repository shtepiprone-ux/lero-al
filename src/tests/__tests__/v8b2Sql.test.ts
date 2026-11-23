// @vitest-environment node
/**
 * Task 962 AC3: the two numbers of the per-currency price CHECK `listings_price_ceiling_check` in supabase/sql_migrations/task962/v8b2.sql are the two numbers of
 * MAX_LISTING_PRICE_BY_CURRENCY (the schema, the form and the server read the same map), for the price and for the old price. The live proof of the whole file is the preflight,
 * the owner's apply and the four integration files; the rollback proof is scripts/quality/db-sql-roundtrip.mjs, run by Opus.
 */
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { MAX_LISTING_PRICE_BY_CURRENCY } from '@/modules/listings/validations'

/** the file with its `--` comments removed and its layout collapsed (a comment may quote the very text a test looks for) */
const sql = fs.readFileSync(path.resolve(process.cwd(), 'supabase/sql_migrations/task962/v8b2.sql'), 'utf8').replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim()

describe('AC3: the per-currency price ceiling is the one map of the schema', () => {
  const eur = /\(currency = 'EUR' and price <= (\d+) and \(price_old is null or price_old <= (\d+)\)\)/.exec(sql)
  const all = /\(currency = 'ALL' and price <= (\d+) and \(price_old is null or price_old <= (\d+)\)\)/.exec(sql)

  it('is a CHECK of public.listings with one branch per currency', () => {
    expect(sql).toContain('alter table public.listings add constraint listings_price_ceiling_check check (')
    expect(eur, 'the EUR branch').not.toBeNull()
    expect(all, 'the ALL branch').not.toBeNull()
  })

  it('takes the numbers of MAX_LISTING_PRICE_BY_CURRENCY, for the price and for the old price', () => {
    expect(Number(eur![1])).toBe(MAX_LISTING_PRICE_BY_CURRENCY.EUR)
    expect(Number(eur![2])).toBe(MAX_LISTING_PRICE_BY_CURRENCY.EUR)
    expect(Number(all![1])).toBe(MAX_LISTING_PRICE_BY_CURRENCY.ALL)
    expect(Number(all![2])).toBe(MAX_LISTING_PRICE_BY_CURRENCY.ALL)
  })
})
