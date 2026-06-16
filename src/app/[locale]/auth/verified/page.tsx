import { getTranslations } from 'next-intl/server'
import { resolveSession } from '@/lib/auth/server'
import { VerifiedBridge } from './VerifiedBridge'
import { VerifiedCard } from './VerifiedCard'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ locale }, { error }] = await Promise.all([params, searchParams])
  const t = await getTranslations({ locale, namespace: 'auth' })
  const title = error === 'confirm_failed' ? t('verified_error_title') : t('verified_title')
  return { title: `${title} | Lero.al` }
}

// Landing page after signup email confirmation.
// /auth/confirm verifies the token-hash OTP server-side, writes the session
// cookies directly onto the redirect response (Branch C fix — Task 446), and
// redirects here. The session is established before this page renders.
export default async function VerifiedPage({ params, searchParams }: Props) {
  const [{ locale }, { error }] = await Promise.all([params, searchParams])
  const t = await getTranslations({ locale, namespace: 'auth' })

  const confirmFailed = error === 'confirm_failed'

  // Only check session when the token was accepted (no error param).
  // When confirmFailed=true we already know the state; calling resolveSession()
  // is unnecessary and would surface Supabase latency in the error path.
  const { user: initialUser } = confirmFailed ? { user: null } : await resolveSession()
  const syncFailed = !confirmFailed && !initialUser

  if (confirmFailed) {
    return (
      <VerifiedCard
        variant="error"
        title={t('verified_error_title')}
        body={t('verified_error_body')}
        ctaLabel={t('login')}
        ctaHref={`/${locale}/auth/login`}
      />
    )
  }

  if (syncFailed) {
    return (
      <VerifiedCard
        variant="syncfail"
        title={t('verified_error_title')}
        body={t('verified_nosession_body')}
        ctaLabel={t('login')}
        ctaHref={`/${locale}/auth/login`}
      />
    )
  }

  return (
    <>
      <VerifiedCard
        variant="success"
        title={t('verified_title')}
        body={t('verified_body')}
        ctaLabel={t('verified_browse')}
        ctaHref={`/${locale}/listings`}
      />
      {/* Re-syncs client-side auth state after the server-established session.
          Guards against any browser SDK / hydration timing edge. */}
      <VerifiedBridge />
    </>
  )
}
