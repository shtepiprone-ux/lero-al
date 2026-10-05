import { Info } from 'lucide-react'
import Link from 'next/link'
import { Alert, Anchor, Stack, Text } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { LISTING_STATUS_COLOR } from '@/modules/listings/lib/listingStatusTone'
import type { ListingStatus } from '@/types/database'

// Task 793 F3 — widened from 4 to all 6 non-active statuses (`isListingVisible` returns true
// only for `active`, so `ListingDetailView.tsx` renders this banner for every other status;
// `pending`/`inactive` had no entry here and rendered a raw i18n key, owner-reported 2026-09-06).
interface Props {
  status: Exclude<ListingStatus, 'active'>
  message: string
  similarLabel: string
  /** Task 792 — pre-filtered `/{locale}/listings` search, computed by the caller from the
   * current listing's `listing_type`/`property_type`/`location_id` (filterEngine.ts:181-183).
   * Replaces the pre-migration `href="#similar-listings"` in-page anchor, which scrolled the
   * reader down the same dead listing instead of taking them anywhere (owner-reported 2026-09-06). */
  href: string
}

// Task 741 Revision 3 — the colour comes from `LISTING_STATUS_COLOR` (`listingStatusTone.ts`), the one
// source `ListingCard` also reads; this file keeps no copy. Owner D46-1 (2026-10-04): `inactive` is gray.
export function ListingStatusBanner({ status, message, similarLabel, href }: Props) {
  return (
    <Alert
      color={LISTING_STATUS_COLOR[status]}
      icon={<Info size={theme.other!.iconSize!.roomy} />}
      mb="xl"
    >
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          {message}
        </Text>
        <Anchor component={Link} href={href} size="xs" underline="always" fw={500}>
          {similarLabel}
        </Anchor>
      </Stack>
    </Alert>
  )
}
