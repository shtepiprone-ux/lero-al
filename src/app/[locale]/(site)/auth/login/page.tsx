/**
 * /[locale]/auth/login
 *
 * Thin page — auto-opens the canonical AuthSheet login drawer.
 * All gated routes (admin, cabinet, favorites, listings/create, etc.) redirect
 * here. The `next` searchParam is forwarded to AuthRedirect which stores it in
 * sessionStorage so AuthSheet can redirect the user after a successful login.
 * The `session=lost` param triggers a localized session-recovery banner inside
 * the login sheet (Task 281).
 *
 * If the user is already authenticated, SSR redirects them away immediately
 * (no spinner, no client JS). The destination is the sanitized `next` param,
 * falling back to /{locale}/cabinet.
 *
 * Task 159 / Sprint 4
 */

import { redirect } from 'next/navigation'
import { resolveSession } from '@/lib/auth/server'
import { sanitizeReturnTo } from '@/modules/auth/lib/sanitizeReturnTo'
import { AuthRedirect } from '@/modules/auth/components/AuthRedirect'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string; session?: string }>
}

export default async function LoginPage({ params, searchParams }: Props) {
  const [{ locale }, { next, session }] = await Promise.all([params, searchParams])

  const { user } = await resolveSession()
  if (user) {
    redirect(sanitizeReturnTo(next) ?? `/${locale}/cabinet`)
  }

  return <AuthRedirect view="login" next={next} sessionLost={session === 'lost'} />
}
