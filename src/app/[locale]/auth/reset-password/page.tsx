import { getTranslations } from 'next-intl/server'
import { ResetPasswordClient } from '@/modules/auth/components/ResetPasswordClient'

interface Props {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token_hash?: string; type?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: `${t('reset_password_title')} | Lero.al` }
}

export default async function ResetPasswordPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { token_hash, type } = await searchParams
  return <ResetPasswordClient locale={locale} tokenHash={token_hash} otpType={type} />
}
