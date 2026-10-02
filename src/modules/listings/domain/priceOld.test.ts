import { describe, it, expect } from 'vitest'
import { computeNextPriceOld } from './priceOld'

describe('computeNextPriceOld — Task 917 rule table', () => {
  it.each([
    [1, 100000, null, 90000, false, 100000],
    [2, 90000, 100000, 80000, false, 100000],
    [3, 100000, 120000, 90000, false, 120000],
    [4, 90000, 100000, 95000, false, 100000],
    [5, 90000, 100000, 100000, false, null],
    [6, 90000, 100000, 110000, false, null],
    [7, 90000, 100000, 80000, true, null],
    [8, 100000, null, 100000, false, null],
    [9, 100000, null, 110000, false, null],
    [10, 100000, 80000, 100000, false, null],
    [11, 100000, 100000, 90000, false, 100000],
  ])(
    'row %i: prev %i / old %s → next %i (currency change %s) = %s',
    (_row, prevPrice, prevPriceOld, nextPrice, currencyChanged, expected) => {
      expect(
        computeNextPriceOld({
          prev: { price: prevPrice, priceOld: prevPriceOld, currency: 'EUR' },
          next: { price: nextPrice, currency: currencyChanged ? 'ALL' : 'EUR' },
        }),
      ).toBe(expected)
    },
  )
})
