'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'

const SUPPORTED: readonly string[] = ['sq', 'en', 'uk', 'it']

export async function setAdminLocale(locale: string): Promise<void> {
  if (!SUPPORTED.includes(locale)) return
  const jar = await cookies()
  jar.set('admin-locale', locale, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  // Also persist preferred_locale in the user profile for locale-aware email sending.
  // Best-effort: failure does not block the locale switch.
  try {
    const user = await getUser()
    if (user) {
      const supabase = await createClient()
      await supabase.from('users').update({ preferred_locale: locale }).eq('id', user.id)
    }
  } catch {}
}
