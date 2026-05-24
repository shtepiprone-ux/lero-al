import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ContactForm } from '@/modules/contacts/components/ContactForm'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  return {
    title: `${t('title')} — Lero.al`,
    description: t('subtitle'),
  }
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('contact')

  return (
    <div className="container-wide py-12 md:py-16">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">{t('title')}</h1>
          <p className="text-muted-foreground leading-relaxed">{t('subtitle')}</p>
        </div>
        <ContactForm />
      </div>
    </div>
  )
}
