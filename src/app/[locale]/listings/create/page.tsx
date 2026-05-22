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
  return { title: `${t('create_listing')} | Lero.al` }
}

export default async function CreateListingPage({ params }: Props) {
  const { locale } = await params

  const user = await getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ''
  // No listing_id yet in create mode — images are uploaded before the listing is saved.
  // Use `<userId>/listings` as an intermediate user-scoped path; listing_id level is added in edit mode.
  const uploadFolder = `${user.id}/listings`

  return (
    <div className="min-h-screen bg-muted/30">
      <ListingFormLoader locale={locale} uploadPreset={uploadPreset} uploadFolder={uploadFolder} mode="create" />
    </div>
  )
}
