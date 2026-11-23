import type { StatusSelectOption } from '@/components/admin/StatusChangeSelect'
import {
  ALLOWED_LISTING_TRANSITIONS,
  getAllowedTargetStatuses,
} from '@/modules/listings/domain/listingTransitionEngine'
import type { ListingStatus } from '@/types/database'

const ALL_LISTING_STATUSES = Object.keys(ALLOWED_LISTING_TRANSITIONS) as ListingStatus[]

/** The owner's operations in the order the owner reads them (O957-17): Publish, Archived, Deactivate, Sold, Rented. */
const OWNER_STATUS_ORDER: readonly ListingStatus[] = ['pending', 'archived', 'inactive', 'sold', 'rented']

/**
 * The options of the listing form's status select (Task 923 R35, owner decisions D6 / D20 / D22).
 * Staff (`canPublish` true, `canAdminEditListing`): the current status first, then every other status in the order of `ALLOWED_LISTING_TRANSITIONS`, each labelled `labelOf`
 * (`pending` reads "Under review").
 * The owner (`canPublish` false, O957-10, O957-11, O957-16, O957-17, Task 957 Revisions 3 to 5): only the operations the server allows, in the order `OWNER_STATUS_ORDER` — "Publish"
 * (`pending`, the listing goes to moderation), Archived, "Deactivate" (`inactive`), Sold, Rented — without the current status (the form shows it as a badge) and without `active`,
 * `expired` and `pending` from `active`. The server gateway enforces the same rule; this list only offers it.
 * `label` is the existing listing text `listing.status_<status>`, resolved by the caller through `labelOf`; for the owner `ownerLabels` gives "Publish" and "Deactivate".
 */
export function buildListingStatusOptions(
  currentStatus: ListingStatus,
  { canPublish }: { canPublish: boolean },
  labelOf: (status: ListingStatus) => string = status => status,
  ownerLabels?: { publish: string; deactivate: string },
): StatusSelectOption<ListingStatus>[] {
  const allowed = getAllowedTargetStatuses(currentStatus, { privileged: true, canPublish })
  const labelFor = (code: ListingStatus) => {
    if (canPublish || !ownerLabels) return labelOf(code)
    if (code === 'pending') return ownerLabels.publish
    if (code === 'inactive') return ownerLabels.deactivate
    return labelOf(code)
  }
  const codes = canPublish
    ? [currentStatus, ...ALL_LISTING_STATUSES.filter(s => s !== currentStatus && allowed.includes(s))]
    : OWNER_STATUS_ORDER.filter(s => allowed.includes(s))
  return codes.map(code => ({
    code,
    label: labelFor(code),
    labelKey: 'status_change_label',
  }))
}
