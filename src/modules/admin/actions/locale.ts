'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/auth/requireViewer'
import { isAppLocale, UI_LOCALE_COOKIE, uiLocaleCookieOptions } from '@/i18n/uiLocale'

/**
 * The interface language the site and admin switchers choose (Task 988, owner decisions O988-1, O988-3, O988-5). Only the four exact codes are accepted; anything
 * else writes nothing. Every caller, guest or signed in, gets the session language cookie `lero_ui_locale`; a signed-in person with access also gets the account
 * language (`users.preferred_locale`) of their OWN row (Task 923 R44: the id is the session's), which the request proxy reads on every page. Returns whether the
 * account row was written. The switchers await it before they navigate: the proxy would otherwise send the new address back to the old language.
 */
export async function setAccountLocale(locale: unknown): Promise<boolean> {
  if (!isAppLocale(locale)) return false
  const jar = await cookies()
  jar.set(UI_LOCALE_COOKIE, locale, uiLocaleCookieOptions())
  try {
    const viewer = await requireViewer()
    if (!viewer.ok) return false
    const supabase = await createClient()
    const { error } = await supabase.from('users').update({ preferred_locale: locale }).eq('id', viewer.userId)
    return !error
  } catch {
    return false
  }
}
