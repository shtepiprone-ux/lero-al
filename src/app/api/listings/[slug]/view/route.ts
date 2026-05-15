import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

// Common bot / automated-client UA patterns.
// Intentionally small — enough to filter curl, Lighthouse, crawlers, and
// prerender agents. Not a full allowlist; real users are never rejected.
const BOT_PATTERN =
  /bot|crawler|spider|curl|wget|python-requests|java\/|go-http-client|headless|prerender|lighthouse|playwright|puppeteer|facebookexternalhit|twitterbot|slackbot/i

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 })

  // Bot filter — silent pass (don't reveal that we skipped them)
  const ua = req.headers.get('user-agent') ?? ''
  if (BOT_PATTERN.test(ua)) return NextResponse.json({ ok: true, recorded: false })

  const db = createAdminClient()

  // Resolve the listing (any publicly-viewable status — matches detail page query)
  const { data: listing } = await db
    .from('listings')
    .select('id, user_id')
    .eq('slug', slug)
    .in('status', ['active', 'sold', 'rented', 'archived'])
    .single()

  if (!listing) return NextResponse.json({ ok: false }, { status: 404 })

  // Resolve caller for owner-exclusion and authenticated dedup
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()

  // Owner self-view exclusion (application-layer; RLS is not involved)
  if (user?.id && user.id === listing.user_id) {
    return NextResponse.json({ ok: true, recorded: false })
  }

  // Build anonymous fingerprint: SHA-256(IP + first 60 chars of UA), truncated to 24 hex chars.
  // Privacy note: the hash is one-way and short — it cannot identify individuals.
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    ''
  const ipHash = ip
    ? createHash('sha256')
        .update(`${ip}|${ua.slice(0, 60)}`)
        .digest('hex')
        .slice(0, 24)
    : ''

  // Atomic dedup + increment via Postgres function (SECURITY DEFINER).
  // The RPC returns TRUE when a new view row was inserted (real increment),
  // FALSE when the 24-hour dedup window suppressed it.
  const { data: recorded, error } = await db.rpc('record_listing_view', {
    p_listing_id: listing.id,
    p_user_id: user?.id ?? null,
    p_ip_hash: ipHash,
  })

  if (error) {
    console.error('[ViewTracker] record_listing_view rpc failed', { error, slug })
    return NextResponse.json({ ok: false, recorded: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true, recorded: recorded === true })
}
