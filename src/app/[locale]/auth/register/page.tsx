/**
 * /[locale]/auth/register
 *
 * Thin page — auto-opens the canonical AuthSheet drawer with the correct view.
 * ?type=agent → register-agent view (collects city, company — Tasks 112/113).
 * Default  → register view (private user).
 *
 * The homepage agent CTA links here with ?type=agent.
 *
 * Task 159 / Sprint 4
 */

import { AuthRedirect } from '@/modules/auth/components/AuthRedirect'

interface Props {
  searchParams: Promise<{ type?: string }>
}

export default async function RegisterPage({ searchParams }: Props) {
  const { type } = await searchParams
  const view = type === 'agent' ? 'register-agent' : 'register'
  return <AuthRedirect view={view} />
}
