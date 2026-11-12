'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Avatar, Button, Divider, Group, Stack, Text, UnstyledButton, useMantineTheme } from '@mantine/core'
import { Star } from 'lucide-react'
import { formatPrice } from '@/lib/formatters'
import { getListingStatusLabel } from '@/lib/i18n/listingStatusLabel'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { tiraneAbsoluteLabel } from '@/lib/dashboard/period'
import { SquareArrowRightUpIcon, ListIcon } from '@solar-icons/react/broken'
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineDetailList } from '@/design-system/mantine/patterns/MantineDetailList'
import { MantineNavRowList } from '@/design-system/mantine/patterns/MantineNavRowList'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
import { MantineEmptyLoadingErrorState } from '@/design-system/mantine/patterns/MantineEmptyLoadingErrorState'
import type { RecentListingRow } from '@/modules/admin/dashboard/types'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'

export interface AdminDashboardRecentListingsProps {
  listings: RecentListingRow[]
  locale: string
  /** The server's `now` (ISO): every relative time is measured against it, so the server render and the browser's first render print the same text (Task 965). */
  now?: string
  /** R14 — shown instead of the row list when `listings` is empty; no row button in that state. */
  emptyText: string
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '—'
  return parts.slice(0, 2).map((part) => part[0]!.toUpperCase()).join('')
}

/**
 * Recent-listings panel for `/admin` (Task 853, row 5, spec v3.3 §6.1 item 6). Rebuilt on
 * canonical Mantine per agent-contract 16d: a `Stack` of dividered rows whose primary text is an
 * `UnstyledButton` opening the preview `MantineModal` (Epic K §11 preserved), a premium star
 * (lucide, `iconSize.compact`, theme `yellow` — the same "closest theme color to gold" choice
 * `MantineListingDetailPattern.tsx` already made for a premium badge), price hidden below `sm`
 * (unchanged from the legacy behavior), and a status `MantineBadge` (`listing` entity)
 * (844). The buyer/owner name pairs with an `Avatar` (initials fallback — no photo in
 * `RecentListingRow`), matching the owner's `techzaa.in` reference (kickoff §3.2). No legacy
 * shadcn primitives, no Tailwind utility classes, no style-merge helper.
 *
 * R10 (review 1, F1): below `sm` the row is stacked, not a horizontal `nowrap` split — the same
 * `hiddenFrom="sm"`/`visibleFrom="sm"` split `MantineDashboardWorkList.tsx:135-160` already uses,
 * cited here rather than re-derived. The whole row stays one `UnstyledButton` (one tab stop); line 1
 * is the avatar plus a full-width title column (with the premium star) and the owner name, line 2 is
 * the status badge plus the relative time.
 */
export function AdminDashboardRecentListings({ listings, locale, now, emptyText }: AdminDashboardRecentListingsProps) {
  const t = useTranslations('admin.dashboard')
  const tl = useTranslations('listing')
  const tc = useTranslations('common')
  const theme = useMantineTheme()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = listings.find((listing) => listing.id === selectedId) ?? null

  const statusLabel = (status: string) =>
    getListingStatusLabel(status, (key) => tl(key as Parameters<typeof tl>[0]))

  if (listings.length === 0) {
    return <MantineEmptyLoadingErrorState state="empty" description={emptyText} />
  }

  return (
    <>
      <Stack gap={0}>
        {listings.map((listing, i) => (
          <Stack key={listing.id} gap={0}>
            <UnstyledButton
              type="button"
              onClick={() => setSelectedId(listing.id)}
              mih={theme.other.touchTarget}
              py="sm"
              display="block"
              w="100%"
            >
              {/* R10 (review 1, F1): below `sm` a horizontal `nowrap` split crushed the title down
                  to a sliver of the row's own width. Stacked instead — the row stays one
                  `UnstyledButton`/one tab stop, line 1 is the avatar + a full-width title/owner
                  column, line 2 is the badge + time — the same `hiddenFrom="sm"` /
                  `visibleFrom="sm"` split `MantineDashboardWorkList.tsx:135-160` already uses. */}
              <Stack gap="xs" hiddenFrom="sm">
                {/* D2/D7 (GR-3j): the avatar is centred on the whole text block, one line or several. */}
                <Group gap="sm" wrap="nowrap" align="center">
                  <Avatar radius="xl" size="md" color="brand">
                    {initials(listing.ownerName)}
                  </Avatar>
                  <Stack gap="micro" flex={1} miw={0}>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} c="gray.8" flex={1} miw={0}>
                        {listing.title}
                      </Text>
                      {listing.isPremium && (
                        <Star
                          size={theme.other.iconSize.compact}
                          color={theme.colors.yellow[6]}
                          fill={theme.colors.yellow[6]}
                          aria-hidden="true"
                        />
                      )}
                    </Group>
                    <Text size="xs" c="gray.5">
                      {listing.ownerName}
                    </Text>
                  </Stack>
                </Group>
                <Group gap="sm" wrap="wrap">
                  <MantineBadge variant="status" entity="listing" value={listing.status}>
                    {statusLabel(listing.status)}
                  </MantineBadge>
                  {/* R16 (review 2, F8): RelativeTime has no sizing parent of its own and inherits
                      the body text color/size — the same meta-text wrap MantineDashboardWorkList.tsx:151
                      already uses. */}
                  <Text component="span" size="xs" c="gray.5">
                    <RelativeTime
                      date={listing.createdAt}
                      absoluteLabel={tiraneAbsoluteLabel(listing.createdAt, locale)}
                      baseDate={now}
                      focusable={false}
                    />
                  </Text>
                </Group>
              </Stack>

              {/* >=640: unchanged horizontal split (avatar+title+owner left, price+badge+time right). */}
              <Group justify="space-between" wrap="nowrap" gap="sm" align="center" visibleFrom="sm">
                <Group gap="sm" wrap="nowrap" flex={1} miw={0}>
                  <Avatar radius="xl" size="md" color="brand">
                    {initials(listing.ownerName)}
                  </Avatar>
                  <Stack gap="micro" miw={0}>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} c="gray.8" miw={0}>
                        {listing.title}
                      </Text>
                      {listing.isPremium && (
                        <Star
                          size={theme.other.iconSize.compact}
                          color={theme.colors.yellow[6]}
                          fill={theme.colors.yellow[6]}
                          aria-hidden="true"
                        />
                      )}
                    </Group>
                    <Text size="xs" c="gray.5">
                      {listing.ownerName}
                    </Text>
                  </Stack>
                </Group>
                <Group gap="sm" wrap="nowrap">
                  <Text size="sm" fw={500} c="gray.8">
                    {formatPrice(listing.price, listing.currency, locale)}
                  </Text>
                  <MantineBadge variant="status" entity="listing" value={listing.status}>
                    {statusLabel(listing.status)}
                  </MantineBadge>
                  <Text component="span" size="xs" c="gray.5">
                    <RelativeTime
                      date={listing.createdAt}
                      absoluteLabel={tiraneAbsoluteLabel(listing.createdAt, locale)}
                      baseDate={now}
                      focusable={false}
                    />
                  </Text>
                </Group>
              </Group>
            </UnstyledButton>
            {i < listings.length - 1 && <Divider />}
          </Stack>
        ))}
      </Stack>

      <MantineModal
        structured
        opened={selected !== null}
        onClose={() => setSelectedId(null)}
        title={selected?.title}
        footer={
          <MantineDialogFooter
            primary={<Button type="button" variant="default" onClick={() => setSelectedId(null)}>{tc('close')}</Button>}
          />
        }
      >
        {selected && (
          <MantineDialogSections>
            <MantineDialogSection>
              <MantineDetailList
                items={[
                  { label: t('dialog_owner'), value: selected.ownerName },
                  {
                    label: t('dialog_status'),
                    value: (
                      <Group gap={0} justify="flex-end">
                        <MantineBadge variant="status" entity="listing" value={selected.status}>
                          {statusLabel(selected.status)}
                        </MantineBadge>
                      </Group>
                    ),
                  },
                  { label: t('dialog_price'), value: formatPrice(selected.price, selected.currency, locale) },
                  {
                    label: t('dialog_created'),
                    value: <RelativeTime date={selected.createdAt} absoluteLabel={tiraneAbsoluteLabel(selected.createdAt, locale)} baseDate={now} />,
                  },
                ]}
              />
            </MantineDialogSection>
            <MantineDialogSection>
              <MantineNavRowList
                items={[
                  {
                    key: 'site',
                    icon: <SquareArrowRightUpIcon size={theme.other.iconSize.standard} aria-hidden="true" />,
                    label: t('dialog_view_site'),
                    href: `/${locale}/listings/${selected.slug}`,
                    external: true,
                  },
                  {
                    key: 'admin',
                    icon: <ListIcon size={theme.other.iconSize.standard} aria-hidden="true" />,
                    label: t('dialog_view_admin'),
                    href: '/admin/listings',
                  },
                ]}
              />
            </MantineDialogSection>
          </MantineDialogSections>
        )}
      </MantineModal>
    </>
  )
}
