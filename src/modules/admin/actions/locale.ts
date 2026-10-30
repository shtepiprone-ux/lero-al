'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { requireViewer } from '@/lib/auth/requireViewer'

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
  // Task 923 R44: only a person whose account has access writes to the profile (the cookie above is what a guest gets).
  try {
    const viewer = await requireViewer()
    if (viewer.ok) {
      const supabase = await createClient()
      await supabase.from('users').update({ preferred_locale: locale }).eq('id', viewer.userId)
    }
  } catch {}
}
