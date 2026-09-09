import { Info } from 'lucide-react'
import Link from 'next/link'
import { Alert, Anchor, Stack, Text } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
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

// Task 792 — colour provenance preserved from the pre-migration `STYLES` Tailwind record, mapped
// onto the SAME Mantine colours ListingCard.tsx's Task 617 status-badge migration already
// established for this exact 6-status family: sold→blueLight (--status-info), rented→purple
// (--status-rented), archived→gray (--muted/--border neutral), expired→yellow (--status-warning).
// `pending`/`inactive` reuse `--status-warning` (yellow) verbatim — the same deliberate reuse this
// file's STYLES record already documented, not re-decided here. No new colour, no new token.
const COLORS: Record<Props['status'], string> = {
  sold: 'blueLight',
  rented: 'purple',
  archived: 'gray',
  expired: 'yellow',
  pending: 'yellow',
  inactive: 'yellow',
}

export function ListingStatusBanner({ status, message, similarLabel, href }: Props) {
  return (
    <Alert
      color={COLORS[status]}
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
