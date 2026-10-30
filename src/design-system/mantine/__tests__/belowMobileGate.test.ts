import { describe, expect, it } from 'vitest'
import { belowMobileGateQuery } from '../belowMobileGate'

// shared/mobile-adaptation-contract.md: the compact composition is required BELOW 640px; 640px is the wider layout.
describe('belowMobileGateQuery', () => {
  it('is the em gate less 0.1px (Mantine "smaller than" form), so it does not match at exactly 640px', () => {
    const query = belowMobileGateQuery({ other: { mobileGate: '40em' } } as never)
    expect(query).toBe('(max-width: 39.99375em)')
    const px = Number.parseFloat(query.replace('(max-width: ', '')) * 16
    expect(px).toBeLessThan(640)
    expect(px).toBeGreaterThan(639)
  })

  it('falls back to calc() for a gate that is not in em', () => {
    expect(belowMobileGateQuery({ other: { mobileGate: '640px' } } as never)).toBe('(max-width: calc(640px - 0.1px))')
  })
})
