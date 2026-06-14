'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useLocations } from '@/modules/locations/hooks/useLocations'
import type { ListingFormMode } from '@/modules/listings/domain/listingFormMode'
import type { FormValues } from '@/modules/listings/types/form'
import type { ListingStatus } from '@/types/database'

const ListingFormShell = dynamic(
  () => import('./ListingFormShell').then(m => m.ListingFormShell),
  { ssr: false },
)

interface BaseLoaderProps {
  locale: string
  uploadPreset: string
  uploadFolder: string
  mode?: ListingFormMode
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
  currentStatus: ListingStatus
}

type Props = CreateLoaderProps | EditLoaderProps

export function ListingFormLoader(props: Props) {
  const { locale, uploadPreset, uploadFolder } = props
  const mode = props.mode ?? 'create'

  const { locations } = useLocations()
  const cityRegions = useMemo(
    () => locations.filter(l => l.type === 'city' || l.type === 'region'),
    [locations],
  )

  if (mode === 'edit') {
    const { listingId, initialValues, canManageStatus, currentStatus } = props as EditLoaderProps
    return (
      <ListingFormShell
        locale={locale}
        uploadPreset={uploadPreset}
        uploadFolder={uploadFolder}
        locations={cityRegions}
        mode="edit"
        listingId={listingId}
        initialValues={initialValues}
        canManageStatus={canManageStatus}
        currentStatus={currentStatus}
      />
    )
  }

  return (
    <ListingFormShell
      locale={locale}
      uploadPreset={uploadPreset}
      uploadFolder={uploadFolder}
      locations={cityRegions}
      mode="create"
    />
  )
}
