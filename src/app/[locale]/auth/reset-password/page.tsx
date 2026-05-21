import { getTranslations } from 'next-intl/server'
import { ResetPasswordClient } from '@/modules/auth/components/ResetPasswordClient'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth' })
  return { title: `${t('reset_password_title')} | Lero.al` }
}

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params
  return <ResetPasswordClient locale={locale} />
}
