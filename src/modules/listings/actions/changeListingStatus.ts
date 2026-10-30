/**
 * Cabinet/shared edit-form status-change action — Task 238 (Epic Y.3).
 *
 * Thin 'use server' bridge from the shared listing edit form's "Change status"
 * control to the transition gateway (`applyListingTransitionByStatus`). Resolves
 * the caller's identity + role server-side (never trusts a client-supplied role)
 * and tags the actor source as 'cabinet' since both owner and staff reach this
 * control through the same `/[locale]/listings/[slug]/edit` route.
 */

'use server'

import { requireViewer } from '@/lib/auth/requireViewer'
import { roleHasPermission } from '@/lib/auth/permissions'
import { createAdminClient } from '@/lib/supabase/admin'
import { applyListingTransitionByStatus, type TransitionApplicationResult } from './applyListingTransition'
import type { ListingStatus } from '@/types/database'

export async function changeListingStatusAction(
  listingId: string,
  toStatus: ListingStatus,
): Promise<TransitionApplicationResult> {
  // The role comes from requireViewer() (Task 923 R44): a blocked, deactivated, deleted or missing account of any role, or a failed lookup, is forbidden
  // before the gateway is reached.
  const viewer = await requireViewer()
  if (!viewer.ok) return { ok: false, reason: 'forbidden' }

  // Task 923 R75: a moderator changing the status of ANOTHER person's listing needs the `listings.moderate` key (the owner changes their own listing without it, and an
  // administrator holds every key). The listing's owner is read here because the gateway decides ownership itself, after this check.
  if (viewer.role === 'moderator' && !(await roleHasPermission('moderator', 'listings.moderate'))) {
    const { data: listing, error } = await createAdminClient().from('listings').select('user_id').eq('id', listingId).maybeSingle()
    if (error) return { ok: false, reason: 'db_error' }
    if (listing && listing.user_id !== viewer.userId) return { ok: false, reason: 'forbidden' }
  }

  return applyListingTransitionByStatus(listingId, toStatus, {
    userId: viewer.userId,
    role: viewer.role,
    source: 'cabinet',
  })
}
