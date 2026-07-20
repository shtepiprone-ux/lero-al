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
import { StoryListingCard, makeStoryListings } from './StoryListingCard'
import { ViewAllLink } from '@/components/shared/ViewAllLink'

const meta: Meta = {
  title: 'System/FeaturedListings',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Featured listings grid — public homepage section. Canonical §8.3 card grid: grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4. Header mirrors the real component\'s flex justify-between row with the ViewAllLink control; the control is shown unconditionally here (the fixtures have no loading/empty state) as the faithful analogue of the real `!loading && listings.length > 0` present branch.',
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
