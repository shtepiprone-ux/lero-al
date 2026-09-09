import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Stack } from '@mantine/core'
import { storyT } from '../../_storyI18n'
import { ListingStatusBanner } from '@/modules/listings/components/ListingStatusBanner'
import { MantineStoryShell } from '../_MantineStoryShell'
import type { ListingStatus } from '@/types/database'

/**
 * Task 792 — canonical story for the real production `ListingStatusBanner`. Statically imports
 * the real component (clause 16c) — no demo stand-in. Covers all 6 non-active statuses (R6/AC2/AC6)
 * — `active` never renders this banner (`ListingDetailView.tsx`'s own
 * `isListingNonActiveStatus` gate). `href` is a representative fixture query string; the real
 * value is built by `ListingDetailView.tsx`'s `buildSimilarListingsHref` from the current
 * listing's own fields (R5), not reproduced here.
 */
const meta: Meta = {
  title: 'Mantine/Primitives/ListingStatusBanner',
  parameters: { skipCanvas: true, layout: 'fullscreen' },
}
export default meta
type Story = StoryObj<typeof meta>

const STATUSES: Exclude<ListingStatus, 'active'>[] = ['sold', 'rented', 'archived', 'expired', 'pending', 'inactive']

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineStoryShell>
        <Stack gap="xl">
          {STATUSES.map(status => (
            <ListingStatusBanner
              key={status}
              status={status}
              message={storyT(locale, `listing.status_banner_${status}`)}
              similarLabel={storyT(locale, 'listing.similar_listings')}
              href={`/${locale}/listings?type=sale&property_type=apartment`}
            />
          ))}
        </Stack>
      </MantineStoryShell>
    )
  },
}
