/**
 * The position of the listings page saved in `sessionStorage` when the person opens a listing, so the way back returns to the same search, page count and card.
 * Written by `ListingsShell` before it navigates, read by `ListingsShell` and `ListingBackButton`, removed by `ListingsShell` when it restores the position.
 * Browser-only: every read returns `null` on the server and when the stored value is missing or not readable (a private window, blocked storage, broken JSON).
 */
export const RESTORE_KEY = 'listings_restore'

export interface SavedListingsPosition {
  returnUrl: string
  slug: string
  extraPage: number
}

export function readSavedPosition(): SavedListingsPosition | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(RESTORE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedListingsPosition
  } catch {
    return null
  }
}
