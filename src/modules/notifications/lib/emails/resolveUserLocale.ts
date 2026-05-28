/**
 * @deprecated DEPRECATED 2026-05-25 (Task 251 — Albanian-only outbound email policy).
 * Outbound emails are now always sent in Albanian ('sq') — do NOT call this function
 * from any new email sender. Replace existing email-context calls with the constant 'sq'.
 *
 * This file is intentionally NOT deleted so the policy can be reversed by un-deprecating
 * it and restoring callers. Two consumers remain in admin/actions/index.ts for IN-APP
 * notification locale (not email) — those are intentionally preserved.
 *
 * Original purpose: returns the locale to use when sending email to a user.
 * Fallback chain: profile.preferred_locale → requestLocale (if provided) → 'sq'
 */
import { createAdminClient } from '@/lib/supabase/admin'

const SUPPORTED = ['sq', 'en', 'uk', 'it'] as const
type Locale = (typeof SUPPORTED)[number]

function isSupported(locale: unknown): locale is Locale {
  return typeof locale === 'string' && (SUPPORTED as readonly string[]).includes(locale)
}

export async function resolveUserLocale(
  userId: string,
  requestLocale?: string,
): Promise<string> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('users')
      .select('preferred_locale')
      .eq('id', userId)
      .single()
    if (isSupported(data?.preferred_locale)) return data.preferred_locale
  } catch {}

  if (isSupported(requestLocale)) return requestLocale
  return 'sq'
}
