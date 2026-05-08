import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getUser } from '@/lib/auth/server'
import { ListingFormLoader } from '@/modules/listings/components/ListingFormLoader'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'listing' })
  return { title: `${t('create_listing')} | Shtepi.al` }
}

export default async function CreateListingPage({ params }: Props) {
  const { locale } = await params

  const user = await getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ''

  return (
    <div className="min-h-screen bg-muted/30">
      <ListingFormLoader locale={locale} uploadPreset={uploadPreset} mode="create" />
    </div>
  )
}
