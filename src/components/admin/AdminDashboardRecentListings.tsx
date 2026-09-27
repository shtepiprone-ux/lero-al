'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Avatar, Badge, Button, Divider, Flex, Group, Stack, Text, UnstyledButton, useMantineTheme } from '@mantine/core'
import { Star } from 'lucide-react'
import { formatPrice } from '@/lib/formatters'
import { getListingStatusLabel } from '@/lib/i18n/listingStatusLabel'
import { RelativeTime } from '@/components/shared/RelativeTime'
import { tiraneAbsoluteLabel } from '@/lib/dashboard/period'
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'
import { MantineEmptyLoadingErrorState } from '@/design-system/mantine/patterns/MantineEmptyLoadingErrorState'
import { LISTING_STATUS_COLOR } from '@/modules/listings/lib/listingStatusTone'
import type { RecentListingRow } from '@/modules/admin/dashboard/types'

export interface AdminDashboardRecentListingsProps {
  listings: RecentListingRow[]
  locale: string
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
 * (unchanged from the legacy behavior), and a status `Badge` colored from `LISTING_STATUS_COLOR`
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
export function AdminDashboardRecentListings({ listings, locale, emptyText }: AdminDashboardRecentListingsProps) {
  const t = useTranslations('admin.dashboard')
  const tl = useTranslations('listing')
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
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <Avatar radius="xl" size="md" color="brand">
                    {initials(listing.ownerName)}
                  </Avatar>
                  <Stack gap="micro" flex={1} miw={0}>
                    <Group gap="xs" wrap="nowrap">
                      <Text size="sm" fw={600} c="gray.8" lineClamp={2} flex={1}>
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
                    <Text size="xs" c="gray.5" lineClamp={1}>
                      {listing.ownerName}
                    </Text>
                  </Stack>
                </Group>
                <Group gap="sm" wrap="wrap">
                  <Badge color={LISTING_STATUS_COLOR[listing.status]} variant="light">
                    {statusLabel(listing.status)}
                  </Badge>
                  {/* R16 (review 2, F8): RelativeTime has no sizing parent of its own and inherits
                      the body text color/size — the same meta-text wrap MantineDashboardWorkList.tsx:151
                      already uses. */}
                  <Text component="span" size="xs" c="gray.5">
                    <RelativeTime
                      date={listing.createdAt}
                      absoluteLabel={tiraneAbsoluteLabel(listing.createdAt, locale)}
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
                      <Text size="sm" fw={600} c="gray.8" lineClamp={1}>
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
                    <Text size="xs" c="gray.5" lineClamp={1}>
                      {listing.ownerName}
                    </Text>
                  </Stack>
                </Group>
                <Group gap="sm" wrap="nowrap">
                  <Text size="sm" fw={500} c="gray.8">
                    {formatPrice(listing.price, listing.currency, locale)}
                  </Text>
                  <Badge color={LISTING_STATUS_COLOR[listing.status]} variant="light">
                    {statusLabel(listing.status)}
                  </Badge>
                  <Text component="span" size="xs" c="gray.5">
                    <RelativeTime
                      date={listing.createdAt}
                      absoluteLabel={tiraneAbsoluteLabel(listing.createdAt, locale)}
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
        opened={selected !== null}
        onClose={() => setSelectedId(null)}
        title={selected?.title}
        footer={
          selected && (
            <Flex direction={{ base: 'column-reverse', sm: 'row' }} gap="sm">
              <Button
                component={Link}
                href={`/${locale}/listings/${selected.slug}`}
                target="_blank"
                rel="noopener"
                variant="outline"
                fullWidth
              >
                {t('dialog_view_site')}
              </Button>
              <Button component={Link} href="/admin/listings" variant="outline" fullWidth>
                {t('dialog_view_admin')}
              </Button>
            </Flex>
          )
        }
      >
        {selected && (
          <Stack gap="xs">
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm" c="gray.5">
                {t('dialog_owner')}
              </Text>
              <Text size="sm" fw={500}>
                {selected.ownerName}
              </Text>
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm" c="gray.5">
                {t('dialog_status')}
              </Text>
              <Badge color={LISTING_STATUS_COLOR[selected.status]} variant="light">
                {statusLabel(selected.status)}
              </Badge>
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm" c="gray.5">
                {t('dialog_price')}
              </Text>
              <Text size="sm" fw={500}>
                {formatPrice(selected.price, selected.currency, locale)}
              </Text>
            </Group>
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm" c="gray.5">
                {t('dialog_created')}
              </Text>
              <Text component="span" size="sm" fw={500}>
                <RelativeTime date={selected.createdAt} absoluteLabel={tiraneAbsoluteLabel(selected.createdAt, locale)} />
              </Text>
            </Group>
          </Stack>
        )}
      </MantineModal>
    </>
  )
}
