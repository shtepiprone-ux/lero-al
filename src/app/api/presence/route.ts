import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireViewer } from '@/lib/auth/requireViewer'

// Throttle window: only write to DB if last_seen_at is older than this.
const THROTTLE_MS = 15 * 60 * 1000

export async function POST() {
  // Task 923 R77 (e), owner decision D58: NO ACCOUNT RESTORES ITSELF WHEN ITS PERSON COMES BACK. The route used to restore (clear `deleted_at`, set the status active,
  // write a history row) an account that the inactivity job had marked within the last 90 days, from a plain presence ping. A marked account has no access, as it has
  // today, and is restored only by the account lifecycle task's own activation. So the ping goes through `requireViewer()`: an account without access (marked,
  // blocked, deactivated, deleted, no profile row) gets 401 and NOTHING is written; a failed lookup is 503.
  const viewer = await requireViewer()
  if (!viewer.ok) {
    return NextResponse.json({ ok: false }, { status: viewer.reason === 'lookup_failed' ? 503 : 401 })
  }

  const throttleTime = new Date(Date.now() - THROTTLE_MS).toISOString()
  const now = new Date().toISOString()
  const db = createAdminClient()

  // Normal presence update: refresh last_seen_at and clear warning tracking (the person is active again, so the next absence is reminded again).
  const { error } = await db
    .from('users')
    .update({
      last_seen_at: now,
      inactivity_warning_sent_at: null,
    })
    .eq('id', viewer.userId)
    .or(`last_seen_at.is.null,last_seen_at.lt.${throttleTime}`)
  if (error) {
    console.error('[presence] last_seen_at update failed', { userId: viewer.userId, code: error.code })
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
