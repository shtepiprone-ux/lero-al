import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getUser } from '@/lib/auth/server'
import { ListingFormLoader } from '@/modules/listings/components/ListingFormLoader'
import { getCloudinaryWidgetConfig } from '@/modules/listings/lib/cloudinaryWidgetConfig'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'listing' })
  return { title: `${t('create_listing')} | Lero.al` }
}

export default async function CreateListingPage({ params }: Props) {
  const { locale } = await params

  const user = await getUser()
  if (!user) redirect(`/${locale}/auth/login?next=${encodeURIComponent(`/${locale}/listings/create`)}&session=lost`)

  // The photo widget needs the API key (not the secret) and the cloud name when it is created; the signature route signs every upload. An unset variable gives '' and the form offers no upload.
  return <ListingFormLoader locale={locale} mode="create" cloudinary={getCloudinaryWidgetConfig()} />
}
