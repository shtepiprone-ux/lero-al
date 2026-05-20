import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: `${t('verified_title')} | Lero.al` }
}

// Landing page after signup email confirmation.
// The user arrives here after clicking the confirmation link, which goes through
// /auth/callback (PKCE code exchange + ensureUserProfile), then redirects here.
// Supabase's email_confirmed_at is already set by the time this page renders.
export default async function VerifiedPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-card border rounded-2xl shadow-sm p-8 flex flex-col items-center gap-5 text-center">
        <CheckCircle2 className="h-14 w-14 text-status-success shrink-0" />
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">{t('verified_title')}</h1>
          <p className="text-sm text-muted-foreground">{t('verified_body')}</p>
        </div>
        <Link
          href={`/${locale}/listings`}
          className={cn(buttonVariants({ size: 'xl' }), 'w-full justify-center')}
        >
          {t('verified_browse')}
        </Link>
      </div>
    </div>
  )
}
