'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { ExternalLink, Eye, Pencil, Star, Trash2 } from 'lucide-react'
import { Badge, Button, Group, useMantineTheme } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineDetailList } from '@/design-system/mantine/patterns/MantineDetailList'
import { MantineNavRowList } from '@/design-system/mantine/patterns/MantineNavRowList'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { StatusChangeSelect, type StatusSelectOption } from '@/components/admin/StatusChangeSelect'
import type { AdminListing } from '@/components/admin/AdminListingsTable'
import { formatListingDate } from '@/lib/formatters'
import { formatVisibility } from '@/modules/listings/lib/visibility'
import { isListingHidden } from '@/modules/listings/domain'
import type { ListingStatus } from '@/types/database'

export interface ListingPreviewDialogViewProps {
  listing: AdminListing
  /** `<listing type> · <property type>` (the container resolves both labels). */
  typeLabel: string
  /** The current status plus every status the privileged gateway offers from it, labelled (the container resolves them). */
  statusOptions: StatusSelectOption<ListingStatus>[]
  /** Applies a status; a thrown error is the `StatusChangeSelect` error toast, a resolution its success toast. */
  onStatusChange: (next: { toStatus: ListingStatus; note: string | null }) => Promise<void> | void
  showDeleteConfirm: boolean
  deleting: boolean
  onShowDeleteConfirm: (show: boolean) => void
  onDelete: () => void
  onPremium: () => void
  onClose: () => void
}

/**
 * Presentational View of the listing preview dialog (Task 857, Container/Presentational split of
 * `AdminListingsTable`). It is built only from the canonical dialog anatomy (`docs/mantine-responsive-design-system.md`
 * §23.7): a structured `MantineModal` (bottom sheet below 640px) with sections — the status as
 * `StatusChangeSelect`, the facts as `MantineDetailList` and the navigation as `MantineNavRowList`. The dialog does not
 * repeat the subject: the listing's row stays visible behind it. The footer is a `MantineDialogFooter` pair: Delete (secondary) and Edit (the one primary).
 * The delete confirmation replaces the sections with one section and the footer with Cancel and a filled red Delete.
 * `useTranslations` / `useLocale` / `useMantineTheme` only: no state, no server action, no toast.
 */
export function ListingPreviewDialogView({
  listing,
  typeLabel,
  statusOptions,
  onStatusChange,
  showDeleteConfirm,
  deleting,
  onShowDeleteConfirm,
  onDelete,
  onPremium,
  onClose,
}: ListingPreviewDialogViewProps) {
  const t = useTranslations('admin.listings')
  const tc = useTranslations('common')
  const locale = useLocale()
  const theme = useMantineTheme()
  const iconSize = theme.other.iconSize.standard

  const vis = formatVisibility({ status: listing.status, expires_at: listing.expires_at })
  const premiumState = listing.is_premium && listing.premium_until
    ? t('premium_active_until', { date: formatListingDate(listing.premium_until, locale) })
    : t('premium_inactive')

  const restingFooter = (
    <MantineDialogFooter
      secondary={
        <Button variant="default" c="red.7" leftSection={<Trash2 size={iconSize} />} onClick={() => onShowDeleteConfirm(true)}>
          {tc('delete')}
        </Button>
      }
      primary={
        <Button component={Link} href={`/${locale}/listings/${listing.slug}/edit`} target="_blank" leftSection={<Pencil size={iconSize} />}>
          {tc('edit')}
        </Button>
      }
    />
  )

  // Delete-confirm footer: Delete is that step's primary (filled, destructive colour), Cancel is secondary.
  const confirmFooter = (
    <MantineDialogFooter
      secondary={
        <Button variant="default" disabled={deleting} onClick={() => onShowDeleteConfirm(false)}>
          {tc('cancel')}
        </Button>
      }
      primary={
        <Button color="red" loading={deleting} onClick={onDelete}>
          {tc('delete')}
        </Button>
      }
    />
  )

  return (
    <MantineModal
      opened
      onClose={onClose}
      structured
      size="lg"
      title={listing.title}
      description={typeLabel}
      footer={showDeleteConfirm ? confirmFooter : restingFooter}
    >
      {showDeleteConfirm ? (
        <MantineDialogSections>
          <MantineDialogSection title={t('delete_confirm')} description={t('delete_dialog_body')} />
        </MantineDialogSections>
      ) : (
        <MantineDialogSections>
          <MantineDialogSection title={t('col_status')}>
            <StatusChangeSelect
              currentStatus={listing.status}
              statuses={statusOptions}
              onSubmit={onStatusChange}
              aria-label={t('col_status')}
            />
          </MantineDialogSection>
          <MantineDialogSection title={t('preview_section_details')}>
            <MantineDetailList
              items={[
                {
                  label: t('visibility_label'),
                  value: (
                    <Group gap={0} justify="flex-end">
                      <Badge variant="light" size="sm" color={vis.visible ? 'green' : 'red'}>
                        {vis.visible ? t('visibility_visible') : t(vis.labelKey as Parameters<typeof t>[0])}
                      </Badge>
                    </Group>
                  ),
                },
                { label: t('col_agent'), value: listing.owner?.name ?? '—' },
                { label: t('col_date'), value: <RelativeTime date={listing.created_at} /> },
                { label: t('premium_badge'), value: premiumState },
              ]}
            />
          </MantineDialogSection>
          <MantineDialogSection>
            <MantineNavRowList
              items={[
                {
                  key: 'view',
                  icon: <Eye size={iconSize} />,
                  label: t('btn_view'),
                  href: `/admin/listings/${listing.id}/preview`,
                },
                ...(!isListingHidden(listing.status)
                  ? [{
                      key: 'public',
                      icon: <ExternalLink size={iconSize} />,
                      label: t('btn_open_public'),
                      href: `/${locale}/listings/${listing.slug}`,
                      external: true,
                    }]
                  : []),
                {
                  key: 'premium',
                  icon: <Star size={iconSize} />,
                  label: t('premium_manage'),
                  description: premiumState,
                  onClick: onPremium,
                },
              ]}
            />
          </MantineDialogSection>
        </MantineDialogSections>
      )}
    </MantineModal>
  )
}
