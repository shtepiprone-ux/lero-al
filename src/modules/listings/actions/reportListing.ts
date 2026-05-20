'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import type { ReportReason, ReportStatus } from '@/types/database'

const VALID_STATUSES: ReportStatus[] = ['pending', 'reviewed', 'resolved', 'dismissed']

const VALID_REASONS: ReportReason[] = [
  'spam', 'fraud', 'duplicate', 'wrong_category', 'offensive', 'other',
]

export async function reportListingAction(
  listingId: string,
  reason: string,
  comment: string,
): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'unauthorized' }

  if (!VALID_REASONS.includes(reason as ReportReason)) return { error: 'invalid_reason' }

  const trimmedComment = comment.trim().slice(0, 500) || null

  const supabase = await createClient()

  // Guard: one report per user per listing
  const { data: existing } = await supabase
    .from('listing_reports')
    .select('id')
    .eq('listing_id', listingId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { error: 'already_reported' }

  const { error } = await supabase
    .from('listing_reports')
    .insert({
      listing_id: listingId,
      user_id: user.id,
      reason: reason as ReportReason,
      comment: trimmedComment,
      // eslint-disable-next-line no-restricted-syntax -- report status, not listing status transition
      status: 'pending',
    })

  if (error) {
    console.error('[reportListing] insert failed', error)
    return { error: 'save_failed' }
  }

  return {}
}

export async function updateReportStatusAction(
  reportId: string,
  newStatus: string,
  notes: string,
): Promise<{ error?: string }> {
  if (!VALID_STATUSES.includes(newStatus as ReportStatus)) return { error: 'invalid_status' }

  const user = await getUser()
  if (!user) return { error: 'unauthorized' }

  const db = createAdminClient()

  // Role check
  const { data: profile } = await db.from('users').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'moderator'].includes(profile.role as string)) return { error: 'forbidden' }

  // Get current status for the audit log
  const { data: report } = await db
    .from('listing_reports')
    .select('status')
    .eq('id', reportId)
    .single()

  if (!report) return { error: 'not_found' }

  // Update status — report status, not a listing status transition; disable is justified
  /* eslint-disable no-restricted-syntax */
  const { error: updateError } = await db
    .from('listing_reports')
    .update({ status: newStatus })
    .eq('id', reportId)
  /* eslint-enable no-restricted-syntax */

  if (updateError) {
    console.error('[updateReportStatus] update failed', updateError)
    return { error: 'save_failed' }
  }

  // Log the action
  const trimmedNotes = notes.trim() || null
  await db.from('report_actions').insert({
    report_id: reportId,
    actor_id: user.id,
    actor_role: profile.role,
    old_status: report.status,
    new_status: newStatus,
    notes: trimmedNotes,
  })

  return {}
}
