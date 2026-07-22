'use client'

/**
 * Storybook story for the FeaturedListings public-homepage grid.
 *
 * Mirrors the live FeaturedListings markup (header + canonical §8.3 card grid)
 * using the shared StoryListingCard/makeStoryListings fixtures (Task 370 parity).
 * Added for Task 420 (Slice 5) to prove the §8.3 column step
 * (grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4) at every breakpoint.
 */

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useTranslations } from 'next-intl'
import { Text } from '@mantine/core'
import { StoryListingCard, makeStoryListings } from './StoryListingCard'
import { ViewAllLink } from '@/components/shared/ViewAllLink'
import { CardSkeleton } from '@/modules/listings/components/FeaturedListings'

const meta: Meta = {
  title: 'System/FeaturedListings',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Featured listings grid — public homepage section. Canonical §8.3 card grid: grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4. Header mirrors the real component\'s flex justify-between row with the ViewAllLink control; the control is shown unconditionally here (the fixtures have no loading/empty state) as the faithful analogue of the real `!loading && listings.length > 0` present branch. `Loading` and `Empty` render the actual production `CardSkeleton`/`Text` markup imported from `FeaturedListings.tsx` (Task 657 R7 — no divergent stand-in).',
      },
    },
  },
}
export default meta
type Story = StoryObj

function Header({ locale }: { locale: string }) {
  const t = useTranslations('listing')
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold">{t('featured')}</h2>
      <ViewAllLink href={`/${locale}/listings?premium=true`} label={t('view_all')} />
    </div>
  )
}

/** Mirrors FeaturedListings.tsx's `!listings.length` branch — same Mantine `Text` primitive
 * and props, reusing the real production i18n key (no new/story-only key). */
function EmptyMessage() {
  const t = useTranslations('listing')
  return <Text ta="center" c="var(--muted-foreground)" py="2rem">{t('no_premium_listings')}</Text>
}

export const Default: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <Header locale={locale} />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {makeStoryListings(locale).map(listing => (<StoryListingCard key={listing.id} data={listing} />))}
        </div>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Exercises the §8.3 column step across breakpoints: 1 col (<640) → 2 cols (sm) → 3 cols (xl, 1280px) → 4 cols (2xl, 1536px).' } }
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
        <Header locale={locale} />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <Header locale={locale} />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Loading state — three skeleton cards rendered via the production `CardSkeleton` (Mantine `Box`/`Skeleton`), byte-identical to the real §8.3 grid loading branch.' } }
  },
}

export const Empty: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <Header locale={locale} />
        <EmptyMessage />
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Empty state — zero premium listings resolved; renders the production Mantine `Text` (centered, dimmed) used by the real `!listings.length` branch.' } }
  },
}
