import { NextResponse } from 'next/server'
import { resolveSession } from '@/lib/auth/server'
import { requireViewer } from '@/lib/auth/requireViewer'

// Server-authoritative session endpoint — strictly read-only.
//
// Called by AuthContext on every SIGNED_IN / USER_UPDATED / visibility-change
// event. Returns the server-validated user profile or null.
//
// Profile creation is NOT performed here (GET must not write).
// First-time profile rows are created by auth/callback/route.ts after the
// PKCE code exchange, before the browser is redirected to the application.
// This guarantees the profile always exists by the time this endpoint is hit.
//
// Task 923 R44 / R45 (owner decisions D26, D27, D29): a person whose account has no access (blocked, deactivated, suspended, deleted, no profile) or
// whose lookup failed is answered as a guest (`user: null`), whatever the role, so the client shows the signed-out state at once.
export async function GET() {
  const viewer = await requireViewer()
  if (!viewer.ok) return NextResponse.json({ user: null })
  const { user } = await resolveSession()
  return NextResponse.json({ user })
}
