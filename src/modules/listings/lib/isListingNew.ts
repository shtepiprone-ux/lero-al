import { LISTING_NEW_DAYS } from '@/modules/listings/constants'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * True while a listing created at `createdAt` is inside the "new" window (`LISTING_NEW_DAYS` days before `now`). The two pages that call it are Server Components rendered
 * once per request, so they still read the clock while they render, and that is right for them: the answer belongs to the request. The clock read sits in this plain function
 * (the page body is not the place for it: `react-hooks/purity`, Task 953), and `now` is a parameter so a test can place the clock on either side of the edge.
 */
export function isListingNew(createdAt: string, now: number = Date.now()): boolean {
  return new Date(createdAt) > new Date(now - LISTING_NEW_DAYS * DAY_MS)
}
