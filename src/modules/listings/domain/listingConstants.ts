import type { ListingStatus } from '@/types/database'
import { PUBLIC_VISIBLE_STATUSES } from '@/modules/listings/lib/visibility'

export const LISTING_ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export function computeExpiresAt(now: number = Date.now()): string {
  return new Date(now + LISTING_ACTIVE_WINDOW_MS).toISOString()
}

export function shouldReStampExpiresAt(nextStatus: ListingStatus): boolean {
  return PUBLIC_VISIBLE_STATUSES[nextStatus].publicEligible === true
}
