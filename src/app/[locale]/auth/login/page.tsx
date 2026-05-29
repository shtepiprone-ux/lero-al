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
 * Task 159 / Sprint 4
 */

import { AuthRedirect } from '@/modules/auth/components/AuthRedirect'

interface Props {
  searchParams: Promise<{ next?: string; session?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { next, session } = await searchParams
  return <AuthRedirect view="login" next={next} sessionLost={session === 'lost'} />
}
