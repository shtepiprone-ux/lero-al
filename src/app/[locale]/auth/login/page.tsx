/**
 * /[locale]/auth/login
 *
 * Thin page — auto-opens the canonical AuthSheet login drawer.
 * All gated routes (admin, cabinet, favorites, listings/create, etc.) redirect
 * here. The `next` searchParam is forwarded to AuthRedirect which stores it in
 * sessionStorage so AuthSheet can redirect the user after a successful login.
 *
 * Task 159 / Sprint 4
 */

import { AuthRedirect } from '@/modules/auth/components/AuthRedirect'

interface Props {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams
  return <AuthRedirect view="login" next={next} />
}
