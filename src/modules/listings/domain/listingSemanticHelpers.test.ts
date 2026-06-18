import { describe, it, expect } from 'vitest'
import {
  isListingVisible,
  isListingHidden,
  isListingArchived,
  isListingClosed,
  isListingEditableStatus,
  isListingReadonlyStatus,
  getListingVisibilityGroup,
} from './listingSemanticHelpers'

describe('isListingVisible', () => {
  it('returns true for active', () => {
    expect(isListingVisible('active')).toBe(true)
  })

  it('returns false for inactive', () => {
    expect(isListingVisible('inactive')).toBe(false)
  })

  it('returns false for pending', () => {
    expect(isListingVisible('pending')).toBe(false)
  })

  it('returns false for archived', () => {
    expect(isListingVisible('archived')).toBe(false)
  })

  it('returns false for sold', () => {
    expect(isListingVisible('sold')).toBe(false)
  })

  it('returns false for rented', () => {
    expect(isListingVisible('rented')).toBe(false)
  })

  it('returns false for expired', () => {
    expect(isListingVisible('expired')).toBe(false)
  })
})

describe('isListingHidden', () => {
  it('returns true for pending', () => {
    expect(isListingHidden('pending')).toBe(true)
  })

  it('returns true for inactive', () => {
    expect(isListingHidden('inactive')).toBe(true)
  })

  it('returns false for active', () => {
    expect(isListingHidden('active')).toBe(false)
  })

  it('returns false for archived', () => {
    expect(isListingHidden('archived')).toBe(false)
  })

  it('returns false for sold', () => {
    expect(isListingHidden('sold')).toBe(false)
  })

  it('returns false for rented', () => {
    expect(isListingHidden('rented')).toBe(false)
  })

  it('returns true for expired', () => {
    expect(isListingHidden('expired')).toBe(true)
  })
})

describe('isListingArchived', () => {
  it('returns true for archived', () => {
    expect(isListingArchived('archived')).toBe(true)
  })

  it('returns false for sold', () => {
    expect(isListingArchived('sold')).toBe(false)
  })

  it('returns false for rented', () => {
    expect(isListingArchived('rented')).toBe(false)
  })

  it('returns false for active', () => {
    expect(isListingArchived('active')).toBe(false)
  })

  it('returns false for inactive', () => {
    expect(isListingArchived('inactive')).toBe(false)
  })

  it('returns false for pending', () => {
    expect(isListingArchived('pending')).toBe(false)
  })

  it('returns false for expired', () => {
    expect(isListingArchived('expired')).toBe(false)
  })
})

describe('isListingClosed', () => {
  it('returns true for sold', () => {
    expect(isListingClosed('sold')).toBe(true)
  })

  it('returns true for rented', () => {
    expect(isListingClosed('rented')).toBe(true)
  })

  it('returns false for archived', () => {
    expect(isListingClosed('archived')).toBe(false)
  })

  it('returns false for active', () => {
    expect(isListingClosed('active')).toBe(false)
  })

  it('returns false for inactive', () => {
    expect(isListingClosed('inactive')).toBe(false)
  })

  it('returns false for pending', () => {
    expect(isListingClosed('pending')).toBe(false)
  })

  it('returns false for expired', () => {
    expect(isListingClosed('expired')).toBe(false)
  })
})

describe('getListingVisibilityGroup', () => {
  it('maps active → VISIBLE', () => {
    expect(getListingVisibilityGroup('active')).toBe('VISIBLE')
  })

  it('maps inactive → HIDDEN', () => {
    expect(getListingVisibilityGroup('inactive')).toBe('HIDDEN')
  })

  it('maps pending → HIDDEN', () => {
    expect(getListingVisibilityGroup('pending')).toBe('HIDDEN')
  })

  it('maps archived → ARCHIVED', () => {
    expect(getListingVisibilityGroup('archived')).toBe('ARCHIVED')
  })

  it('maps sold → CLOSED', () => {
    expect(getListingVisibilityGroup('sold')).toBe('CLOSED')
  })

  it('maps rented → CLOSED', () => {
    expect(getListingVisibilityGroup('rented')).toBe('CLOSED')
  })

  it('maps expired → HIDDEN', () => {
    expect(getListingVisibilityGroup('expired')).toBe('HIDDEN')
  })

  it('covers all seven DB statuses without overlap', () => {
    const allStatuses = ['active', 'inactive', 'pending', 'archived', 'sold', 'rented', 'expired'] as const
    const groups = allStatuses.map(getListingVisibilityGroup)
    expect(groups).toHaveLength(7)
    expect(getListingVisibilityGroup('archived')).not.toBe('CLOSED')
    expect(getListingVisibilityGroup('sold')).not.toBe('ARCHIVED')
    expect(getListingVisibilityGroup('expired')).not.toBe('CLOSED')
  })
})

describe('isListingEditableStatus', () => {
  it('returns true for active', () => {
    expect(isListingEditableStatus('active')).toBe(true)
  })

  it('returns true for inactive', () => {
    expect(isListingEditableStatus('inactive')).toBe(true)
  })

  it('returns true for pending', () => {
    expect(isListingEditableStatus('pending')).toBe(true)
  })

  it('returns false for sold', () => {
    expect(isListingEditableStatus('sold')).toBe(false)
  })

  it('returns false for rented', () => {
    expect(isListingEditableStatus('rented')).toBe(false)
  })

  it('returns false for archived', () => {
    expect(isListingEditableStatus('archived')).toBe(false)
  })

  it('returns true for expired (HIDDEN group → editable)', () => {
    expect(isListingEditableStatus('expired')).toBe(true)
  })
})

describe('isListingReadonlyStatus', () => {
  it('returns false for active', () => {
    expect(isListingReadonlyStatus('active')).toBe(false)
  })

  it('returns false for inactive', () => {
    expect(isListingReadonlyStatus('inactive')).toBe(false)
  })

  it('returns false for pending', () => {
    expect(isListingReadonlyStatus('pending')).toBe(false)
  })

  it('returns true for sold', () => {
    expect(isListingReadonlyStatus('sold')).toBe(true)
  })

  it('returns true for rented', () => {
    expect(isListingReadonlyStatus('rented')).toBe(true)
  })

  it('returns true for archived', () => {
    expect(isListingReadonlyStatus('archived')).toBe(true)
  })

  it('returns false for expired', () => {
    expect(isListingReadonlyStatus('expired')).toBe(false)
  })

  it('is the exact inverse of isListingEditableStatus', () => {
    const allStatuses = ['active', 'inactive', 'pending', 'archived', 'sold', 'rented', 'expired'] as const
    for (const s of allStatuses) {
      expect(isListingReadonlyStatus(s)).toBe(!isListingEditableStatus(s))
    }
  })
})
