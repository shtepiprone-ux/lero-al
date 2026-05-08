import { NextResponse } from 'next/server'
import { resolveSession } from '@/lib/auth/server'

// Server-authoritative session endpoint — strictly read-only.
//
// Called by AuthContext on every SIGNED_IN / USER_UPDATED / visibility-change
// event. Returns the server-validated user profile or null.
//
// Profile creation is NOT performed here (GET must not write).
// First-time profile rows are created by auth/callback/route.ts after the
// PKCE code exchange, before the browser is redirected to the application.
// This guarantees the profile always exists by the time this endpoint is hit.
export async function GET() {
  const { user } = await resolveSession()
  return NextResponse.json({ user })
}
