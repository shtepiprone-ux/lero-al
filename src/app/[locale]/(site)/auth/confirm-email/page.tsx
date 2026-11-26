import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import { consumeEmailChangeToken } from '@/modules/cabinet/actions'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: `${t('confirm_email_success_title')} | Lero.al` }
}

export default async function ConfirmEmailPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale, namespace: 'auth' })

  const token = sp.token
  let success = false
  let errorCode: 'expired' | 'consumed' | 'invalid' | null = null

  if (token) {
    const result = await consumeEmailChangeToken(token)
    if (result.success) {
      success = true
    } else {
      errorCode = result.errorCode ?? 'invalid'
    }
  } else {
    errorCode = 'invalid'
  }

  function errorMessage() {
    if (errorCode === 'expired') return t('confirm_email_error_expired')
    if (errorCode === 'consumed') return t('confirm_email_error_consumed')
    return t('confirm_email_error_invalid')
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-card border rounded-2xl shadow-sm p-8 flex flex-col items-center gap-5 text-center">
        {success ? (
          <>
            <CheckCircle2 className="h-14 w-14 text-status-success" />
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-bold">{t('confirm_email_success_title')}</h1>
              <p className="text-sm text-muted-foreground">{t('confirm_email_success_body')}</p>
            </div>
            <Link
              href={`/${locale}/auth/login`}
              className={cn(buttonVariants({ size: 'xl' }), 'w-full justify-center')}
            >
              {t('confirm_email_go_login')}
            </Link>
          </>
        ) : (
          <>
            <XCircle className="h-14 w-14 text-destructive" />
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-bold">{t('confirm_email_error_title')}</h1>
              <p className="text-sm text-muted-foreground">{errorMessage()}</p>
            </div>
            <Link
              href={`/${locale}/cabinet?tab=profile`}
              className={cn(buttonVariants({ variant: 'outline', size: 'xl' }), 'w-full justify-center')}
            >
              {t('confirm_email_go_login')}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
