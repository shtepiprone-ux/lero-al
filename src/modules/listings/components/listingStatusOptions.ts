import type { StatusSelectOption } from '@/components/admin/StatusChangeSelect'
import {
  ALLOWED_LISTING_TRANSITIONS,
  getAllowedTargetStatuses,
} from '@/modules/listings/domain/listingTransitionEngine'
import type { ListingStatus } from '@/types/database'

const ALL_LISTING_STATUSES = Object.keys(ALLOWED_LISTING_TRANSITIONS) as ListingStatus[]

/**
 * The options of the listing form's status select (Task 923 R35, owner decisions D6 / D20 / D22).
 * The current status comes first, then every status the viewer may set directly, in the order of
 * `ALLOWED_LISTING_TRANSITIONS`. `canPublish` is true only for staff (`canAdminEditListing`): an owner never gets
 * `active` unless it already is the current status, and `pending` from every status but `active` (O957-10, O957-11, Task 957 Revisions 3 and 4). The server gateway enforces the same rule; this list only offers it.
 * `label` is the existing listing text `listing.status_<status>`, resolved by the caller through `labelOf`. For the owner (`canPublish` false) the `pending` option reads `ownerLabels.publish` ("Publish":
 * the listing goes to moderation) and a listing that already is `pending` reads `ownerLabels.onModeration` ("On moderation"); staff keep `labelOf('pending')` ("Under review").
 */
export function buildListingStatusOptions(
  currentStatus: ListingStatus,
  { canPublish }: { canPublish: boolean },
  labelOf: (status: ListingStatus) => string = status => status,
  ownerLabels?: { publish: string; onModeration: string },
): StatusSelectOption<ListingStatus>[] {
  const allowed = getAllowedTargetStatuses(currentStatus, { privileged: true, canPublish })
  const labelFor = (code: ListingStatus) => {
    if (canPublish || code !== 'pending' || !ownerLabels) return labelOf(code)
    return code === currentStatus ? ownerLabels.onModeration : ownerLabels.publish
  }
  return [currentStatus, ...ALL_LISTING_STATUSES.filter(s => s !== currentStatus && allowed.includes(s))].map(code => ({
    code,
    label: labelFor(code),
    labelKey: 'status_change_label',
  }))
}
