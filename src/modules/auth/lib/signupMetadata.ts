/**
 * The user_metadata a new account may start with (Task 923 Revision 7, finding S41). The browser chooses `data` in the sign-up call, so only the fields the sign-up
 * form really sends are passed on, with plain values. Lives outside the `'use server'` file on purpose: everything a Server Action file exports is a public endpoint.
 */
import { isE164 } from '@/lib/security/inputs'

const SIGNUP_METADATA_KEYS = ['name', 'phone', 'user_type', 'location_id', 'company_id', 'preferred_locale'] as const

export function cleanSignupMetadata(data: unknown): Record<string, string | number> | undefined {
  if (!data || typeof data !== 'object') return undefined
  const out: Record<string, string | number> = {}
  for (const key of SIGNUP_METADATA_KEYS) {
    if (!Object.hasOwn(data, key)) continue
    const value = (data as Record<string, unknown>)[key]
    if (key === 'phone') { if (isE164(value)) out[key] = value; continue }
    if (typeof value === 'string' && value.length <= 200) out[key] = value
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value
  }
  if (out.user_type !== undefined && out.user_type !== 'private' && out.user_type !== 'agent') delete out.user_type
  return out
}
