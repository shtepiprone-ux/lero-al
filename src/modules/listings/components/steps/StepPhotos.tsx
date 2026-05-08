'use client'

import { useTranslations } from 'next-intl'
import { ImageUpload } from '@/modules/listings/components/ImageUpload'
import type { ListingImage } from '@/modules/listings/components/ImageUpload'
import type { FormValues } from '@/modules/listings/types/form'

interface Props {
  data: FormValues
  onChange: (patch: Partial<FormValues>) => void
  uploadPreset: string
  error?: string
}

export function StepPhotos({ data, onChange, uploadPreset, error }: Props) {
  const t = useTranslations('listing')

  return (
    <div className="flex flex-col gap-4">
      <ImageUpload
        images={data.images}
        onChange={(images: ListingImage[]) => onChange({ images })}
        uploadPreset={uploadPreset}
      />
      {error && (
        <p className="text-sm text-destructive text-center">{t('photos_required')}</p>
      )}
    </div>
  )
}
