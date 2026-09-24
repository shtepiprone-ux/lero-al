'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUser } from '@/lib/auth/server'
import { getBlockedError } from '@/lib/auth/blockCheck'
import { hasPermission } from '@/lib/auth/permissions'
import type { ReportReason, ReportStatus } from '@/types/database'
import * as React from 'react'
import { sendEmail } from '@/modules/notifications/lib/emails/send'
import {
  ReporterNotificationEmail,
  getReporterNotificationEmailStrings,
} from '@/modules/notifications/lib/emails/ReporterNotificationEmail'
import { createNotification } from '@/modules/notifications/lib/mutations'

// sq-fallback strings for the `title`/`body` columns (Owner decision 2, Task 319, same
// SUPPORT_NOTIFY_SQ pattern as src/modules/admin/actions/index.ts). The viewer-locale
// rendering comes from notifications.listing_report_*_title/_body (messages/{sq,en,uk,it}.json),
// resolved at render time by NotificationItem.
const REPORT_NOTIFY_SQ = {
  filedTitle: (listingName: string) => `Njoftimi juaj u raportua: ${listingName}`,
  filedBody: 'Dikush raportoi këtë njoftim. Ekipi ynë do ta shqyrtojë.',
  resolvedOwnerTitle: (listingName: string) => `Raporti për njoftimin tuaj u zgjidh: ${listingName}`,
  resolvedOwnerBody: 'Raporti për këtë njoftim është shqyrtuar dhe zgjidhur nga ekipi ynë.',
  dismissedOwnerTitle: (listingName: string) => `Raporti për njoftimin tuaj u hodh poshtë: ${listingName}`,
  dismissedOwnerBody: 'Raporti për këtë njoftim është shqyrtuar dhe hedhur poshtë nga ekipi ynë.',
}

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
  const blockError = await getBlockedError(user.id)
  if (blockError) return { error: blockError }

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

  // Owner notification — best-effort, service-role lookup; never blocks the reporter's result.
  // The row carries only the listing name and link — no reporter identity, no reason (R4).
  try {
    const admin = createAdminClient()
    const { data: listingRow, error: listingErr } = await admin
      .from('listings')
      .select('user_id, title, slug')
      .eq('id', listingId)
      .single()

    if (listingErr || !listingRow) {
      console.error('[reportListing] listing lookup failed', listingErr)
    } else if (listingRow.user_id !== user.id) {
      await createNotification({
        userId: listingRow.user_id,
        type: 'report_outcome',
        templateId: 'listing_report_filed',
        templateParams: { listingName: listingRow.title },
        title: REPORT_NOTIFY_SQ.filedTitle(listingRow.title),
        body: REPORT_NOTIFY_SQ.filedBody,
        link: listingRow.slug ? `/listings/${listingRow.slug}` : undefined,
      })
    }
  } catch (e) {
    console.error('[reportListing] owner notification failed', e)
  }

  return {}
}

const MODERATOR_ALLOWED: Record<string, string[]> = {
  pending:  ['reviewed', 'resolved', 'dismissed'],
  reviewed: ['resolved', 'dismissed'],
}

export async function updateReportStatusAction(
  reportId: string,
  newStatus: string,
  notes: string,
): Promise<{ error?: string }> {
  if (!VALID_STATUSES.includes(newStatus as ReportStatus)) return { error: 'invalid_status' }

  const user = await getUser()
  if (!user) return { error: 'unauthorized' }

  // Gate: verify caller has at least one report capability BEFORE any service-role read
  const [canManage, canOverride] = await Promise.all([
    hasPermission('reports.manage'),
    hasPermission('reports.status_override'),
  ])
  if (!canManage && !canOverride) return { error: 'forbidden' }

  const db = createAdminClient()

  const { data: profile } = await db.from('users').select('role').eq('id', user.id).single()
  if (!profile) return { error: 'forbidden' }

  const { data: report } = await db
    .from('listing_reports')
    .select('status')
    .eq('id', reportId)
    .single()

  if (!report) return { error: 'not_found' }

  const oldStatus = report.status as string
  if (oldStatus === newStatus) return { error: 'invalid_status' }

  // Classify: override holders pass any transition; manage-only restricted to allowlist
  if (!canOverride) {
    const isModeratorAllowed = MODERATOR_ALLOWED[oldStatus]?.includes(newStatus) ?? false
    if (!isModeratorAllowed) return { error: 'forbidden' }
  }

  // CAS update: filter on oldStatus to prevent concurrent transition race
  /* eslint-disable no-restricted-syntax */
  const { data: updated, error: updateError } = await db
    .from('listing_reports')
    .update({ status: newStatus })
    .eq('id', reportId)
    .eq('status', oldStatus)
    .select('id')
  /* eslint-enable no-restricted-syntax */

  if (updateError) {
    console.error('[updateReportStatus] update failed', updateError)
    return { error: 'save_failed' }
  }

  if (!updated || updated.length === 0) return { error: 'conflict' }

  const trimmedNotes = notes.trim() || null
  const { error: auditError } = await db.from('report_actions').insert({
    report_id: reportId,
    actor_id: user.id,
    actor_role: profile.role,
    old_status: oldStatus,
    new_status: newStatus,
    notes: trimmedNotes,
  })

  if (auditError) {
    // CAS revert: only revert if the row still has OUR newStatus (prevents clobbering a concurrent write)
    /* eslint-disable no-restricted-syntax */
    const { data: reverted, error: revertError } = await db
      .from('listing_reports')
      .update({ status: oldStatus })
      .eq('id', reportId)
      .eq('status', newStatus)
      .select('id')
    /* eslint-enable no-restricted-syntax */
    if (revertError || !reverted || reverted.length === 0) {
      console.error('[updateReportStatus] CRITICAL: audit insert failed and status NOT reverted (concurrent change or revert error)', { reportId, oldStatus, newStatus, revertError })
    } else {
      console.error('[updateReportStatus] audit insert failed, status reverted', auditError)
    }
    return { error: 'save_failed' }
  }

  const TERMINAL: ReportStatus[] = ['resolved', 'dismissed']
  if (TERMINAL.includes(newStatus as ReportStatus)) {
    const outcomeStatus = newStatus as 'resolved' | 'dismissed'

    const { data: reportRow, error: reportRowError } = await db
      .from('listing_reports')
      .select('user_id, listings(user_id, title, slug)')
      .eq('id', reportId)
      .single()

    if (reportRowError) {
      console.error('[updateReportStatus] report lookup failed', { reportId, error: reportRowError })
    }

    const reporterUserId = (reportRow as unknown as { user_id?: string } | null)?.user_id
    const listing = (reportRow as unknown as {
      listings: { user_id: string; title: string; slug: string } | null
    } | null)?.listings ?? null

    // Reporter — awaited (R6: no longer fire-and-forget; a freeze mid-request can no longer
    // drop the notification, see F5). Isolated try/catch: a reporter-side failure never blocks
    // the owner notification below, and neither ever changes this action's return value.
    if (reporterUserId) {
      try {
        await notifyReporter(db, reporterUserId, listing?.title ?? '', outcomeStatus)
      } catch (e) {
        console.error('[updateReportStatus] reporter notification failed', { reportId, newStatus, error: e })
      }
    }

    // Listing owner — skipped when the owner is also the reporter, in which case the
    // reporter notification alone is sent (R5).
    if (listing?.user_id && listing.user_id !== reporterUserId) {
      try {
        await createNotification({
          userId: listing.user_id,
          type: 'report_outcome',
          templateId: outcomeStatus === 'resolved' ? 'listing_report_resolved_owner' : 'listing_report_dismissed_owner',
          templateParams: { listingName: listing.title },
          title: outcomeStatus === 'resolved'
            ? REPORT_NOTIFY_SQ.resolvedOwnerTitle(listing.title)
            : REPORT_NOTIFY_SQ.dismissedOwnerTitle(listing.title),
          body: outcomeStatus === 'resolved' ? REPORT_NOTIFY_SQ.resolvedOwnerBody : REPORT_NOTIFY_SQ.dismissedOwnerBody,
          link: listing.slug ? `/listings/${listing.slug}` : undefined,
        })
      } catch (e) {
        console.error('[updateReportStatus] owner notification failed', { reportId, newStatus, error: e })
      }
    }
  }

  return {}
}

export async function deleteReportAction(
  reportId: string,
): Promise<{ error?: string }> {
  const user = await getUser()
  if (!user) return { error: 'unauthorized' }

  const canDelete = await hasPermission('reports.delete')
  if (!canDelete) return { error: 'forbidden' }

  const db = createAdminClient()

  // ON DELETE CASCADE on report_actions.report_id handles dependent audit rows
  const { data: deleted, error } = await db
    .from('listing_reports')
    .delete()
    .eq('id', reportId)
    .select('id')

  if (error) {
    console.error('[deleteReport] delete failed', error)
    return { error: 'save_failed' }
  }

  if (!deleted || deleted.length === 0) return { error: 'not_found' }

  return {}
}

// ── Reporter notification helper ──────────────────────────────────────────────

async function notifyReporter(
  db: ReturnType<typeof createAdminClient>,
  reporterUserId: string,
  listingTitle: string,
  status: 'resolved' | 'dismissed',
): Promise<void> {
  // Albanian-only policy (Task 251): reporter notification email always in sq.
  const emailLocale = 'sq'
  const s = getReporterNotificationEmailStrings(emailLocale, status)

  // In-app notification — sq-fallback title/body (Owner decision 2, Task 319);
  // viewer-locale render comes from notifications.report_resolved_*/report_dismissed_*
  // (NotificationItem.tsx) via templateId.
  await createNotification({
    userId: reporterUserId,
    type: 'report_outcome',
    templateId: status === 'resolved' ? 'report_resolved' : 'report_dismissed',
    templateParams: {},
    title: s.heading,
    body: s.body.slice(0, 120) + (s.body.length > 120 ? '…' : ''),
  })

  // Email — requires reporter's email from auth
  const { data: authData } = await db.auth.admin.getUserById(reporterUserId)
  const reporterEmail = authData?.user?.email
  if (!reporterEmail) return

  await sendEmail({
    to: reporterEmail,
    subject: s.subject,
    react: React.createElement(ReporterNotificationEmail, {
      status,
      listingTitle,
      locale: emailLocale,
    }),
  })
}
