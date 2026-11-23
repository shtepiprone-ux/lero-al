'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useLocations } from '@/modules/locations/hooks/useLocations'
import type { ListingFormMode } from '@/modules/listings/domain/listingFormMode'
import type { FormValues } from '@/modules/listings/types/form'
import type { CloudinaryWidgetConfig } from '@/modules/listings/lib/cloudinaryWidgetConfig'
import type { ListingStatus } from '@/types/database'

const ListingFormShell = dynamic(
  () => import('./ListingFormShell').then(m => m.ListingFormShell),
  { ssr: false },
)

interface BaseLoaderProps {
  locale: string
  mode?: ListingFormMode
  /** The API key and the cloud name the page read on the server (`getCloudinaryWidgetConfig`); the photo widget needs both when it is created. */
  cloudinary: CloudinaryWidgetConfig
}

interface CreateLoaderProps extends BaseLoaderProps {
  mode?: 'create'
  listingId?: never
  initialValues?: never
}

interface EditLoaderProps extends BaseLoaderProps {
  mode: 'edit'
  listingId: string
  initialValues: Partial<FormValues>
  /** Server-computed (canAdminEditListing) — only staff (admin/moderator) get the status control. */
  canManageStatus: boolean
  /** Server-computed (canAdminEditListing) — only staff may set `active` (Task 923 R35, D6). */
  canPublish: boolean
  /** Server-computed on the edit page (`listing.user_id` is the viewer): only the listing's owner gets the delete section (O957-18). */
  canDelete?: boolean
  currentStatus: ListingStatus
}

type Props = CreateLoaderProps | EditLoaderProps

export function ListingFormLoader(props: Props) {
  const { locale, cloudinary } = props
  const mode = props.mode ?? 'create'

  const { locations } = useLocations()
  const cityRegions = useMemo(
    () => locations.filter(l => l.type === 'city' || l.type === 'region'),
    [locations],
  )

  if (mode === 'edit') {
    const { listingId, initialValues, canManageStatus, canPublish, canDelete, currentStatus } = props as EditLoaderProps
    return (
      <ListingFormShell
        locale={locale}
        locations={cityRegions}
        mode="edit"
        cloudinary={cloudinary}
        listingId={listingId}
        initialValues={initialValues}
        canManageStatus={canManageStatus}
        canPublish={canPublish}
        canDelete={canDelete}
        currentStatus={currentStatus}
      />
    )
  }

  return (
    <ListingFormShell
      locale={locale}
      locations={cityRegions}
      mode="create"
      cloudinary={cloudinary}
    />
  )
}
