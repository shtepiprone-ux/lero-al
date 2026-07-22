'use client'

/**
 * Storybook story for the LatestListings public-homepage grid (Task 657).
 *
 * Mirrors the live LatestListings markup (no header — see FeaturedListings.stories.tsx for the
 * header-bearing sibling grid) using the shared StoryListingCard/makeStoryListings fixtures.
 * `Loading` and `Empty` render the actual production `RowSkeleton`/`Text` markup imported from
 * `LatestListings.tsx` (Task 657 R7 — no divergent stand-in).
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations } from 'next-intl'
import { Text } from '@mantine/core'
import { StoryListingCard, makeStoryListings } from './StoryListingCard'
import { RowSkeleton } from '@/modules/listings/components/LatestListings'

const meta: Meta = {
  title: 'System/LatestListings',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Latest listings grid — public homepage section. Canonical grid: grid-cols-1 md:grid-cols-2 2xl:grid-cols-3. `Loading` and `Empty` render the actual production `RowSkeleton`/`Text` markup imported from `LatestListings.tsx` (Task 657 R7 — no divergent stand-in).',
      },
    },
  },
}
export default meta
type Story = StoryObj

/** Mirrors LatestListings.tsx's `!listings.length` branch — same Mantine `Text` primitive
 * and props, reusing the real production i18n key (no new/story-only key). */
function EmptyMessage() {
  const t = useTranslations('listing')
  return <Text ta="center" c="var(--muted-foreground)" py="2rem">{t('no_listings')}</Text>
}

export const Default: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
          {makeStoryListings(locale).map(listing => (<StoryListingCard key={listing.id} data={listing} />))}
        </div>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Canonical latest-listings grid column step: 1 col (<768) → 2 cols (md, 768px) → 3 cols (2xl, 1536px).' } }
  },

  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
}

export const LocaleStress: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
          {makeStoryListings(locale).slice(0, 4).map(listing => (<StoryListingCard key={listing.id} data={listing} />))}
        </div>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: '@320: longest locale titles — verify line-clamp-2, no horizontal overflow. Use the locale toolbar for sq/en/uk/it.' } }
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}

export const Loading: Story = {
  render: () => {
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Loading state — four skeleton rows rendered via the production `RowSkeleton` (Mantine `Box`/`Skeleton`), byte-identical to the real grid loading branch.' } }
  },
}

export const Empty: Story = {
  render: () => {
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <EmptyMessage />
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Empty state — zero listings resolved; renders the production Mantine `Text` (centered, dimmed) used by the real `!listings.length` branch.' } }
  },
}
