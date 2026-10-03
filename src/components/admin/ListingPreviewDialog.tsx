'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ListingPreviewDialogView } from '@/components/admin/ListingPreviewDialogView'
import type { StatusSelectOption } from '@/components/admin/StatusChangeSelect'
import type { AdminListing } from '@/components/admin/AdminListingsTable'
import { deleteListing, updateListingStatus } from '@/modules/admin/actions'
import { toast } from '@/lib/toast'
import type { ListingStatus } from '@/types/database'
import { getPrivilegedTargetStatuses } from '@/modules/listings/domain'

/**
 * The statuses the dialog's `StatusChangeSelect` offers: the current one plus every target the privileged
 * gateway allows from it (Task 427 any-status resolver), labelled with the translated status names.
 * Exported so the View's Stories render the production data flow instead of a hand-written list.
 */
export function usePreviewStatusOptions(
  status: ListingStatus,
  statusLabels: Record<ListingStatus, string>,
): StatusSelectOption<ListingStatus>[] {
  return [status, ...getPrivilegedTargetStatuses(status)].map(code => ({
    code,
    label: statusLabels[code],
    labelKey: 'status_change_label',
  }))
}

interface Props {
  listing: AdminListing
  /** Kept for the caller's signature; the dialog's `StatusChangeSelect` labels come from `statusLabels`. */
  statusLabel?: string
  statusLabels: Record<ListingStatus, string>
  typeLabel: string
  onClose: () => void
  onDeleted: (id: string) => void
  onPremium: () => void
  onStatusChanged: (id: string, newStatus: ListingStatus) => void
}

/**
 * Container of the listing preview dialog (Task 857): the delete state, the server-action calls and the delete
 * toast. Admin/moderator (and owner, via the same privileged gateway) may move a listing directly to ANY other
 * status — derived from the transition engine's privileged any-status resolver (Task 427). The status change
 * itself is the canonical `StatusChangeSelect`, which owns the success and error toasts: this container throws
 * when the action reports an error and calls `onStatusChanged` on success. The UI is `ListingPreviewDialogView`.
 */
export function ListingPreviewDialog({
  listing,
  statusLabels,
  typeLabel,
  onClose,
  onDeleted,
  onPremium,
  onStatusChanged,
}: Props) {
  const t = useTranslations('admin.listings')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteListing(listing.id)
    setDeleting(false)
    toast.success(t('delete_success'))
    onDeleted(listing.id)
  }

  async function handleStatusChange({ toStatus }: { toStatus: ListingStatus }) {
    const result = await updateListingStatus(listing.id, toStatus)
    if (result.error) throw new Error(String(result.error))
    onStatusChanged(listing.id, toStatus)
  }

  const statusOptions = usePreviewStatusOptions(listing.status, statusLabels)

  return (
    <ListingPreviewDialogView
      listing={listing}
      typeLabel={typeLabel}
      statusOptions={statusOptions}
      showDeleteConfirm={showDeleteConfirm}
      deleting={deleting}
      onStatusChange={handleStatusChange}
      onShowDeleteConfirm={setShowDeleteConfirm}
      onDelete={handleDelete}
      onPremium={onPremium}
      onClose={onClose}
    />
  )
}
