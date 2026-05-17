import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Throttle window: only write to DB if last_seen_at is older than this.
const THROTTLE_MS = 15 * 60 * 1000

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const throttleTime = new Date(Date.now() - THROTTLE_MS).toISOString()
  const now = new Date().toISOString()

  // Single DB write, skipped automatically if last_seen_at is fresh.
  // The OR condition means: update only when (never seen) OR (seen > 15 min ago).
  await supabase
    .from('users')
    .update({ last_seen_at: now })
    .eq('id', user.id)
    .or(`last_seen_at.is.null,last_seen_at.lt.${throttleTime}`)

  return NextResponse.json({ ok: true })
}
