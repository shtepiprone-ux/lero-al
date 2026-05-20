/**
 * resolveUserLocale — returns the locale to use when sending email to a user.
 *
 * Fallback chain:
 *   profile.preferred_locale → requestLocale (if provided) → 'sq'
 *
 * Uses the admin (service-role) client because this is called from server-side
 * email dispatch contexts where there is no user session cookie available.
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
