'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StoryListingCard, makeStoryListings } from './StoryListingCard';
import { storyT } from './_storyI18n';

const meta: Meta = {
  title: 'System/ListingGrid',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Listing card grid — canonical responsive pattern. MUST include 2xl:grid-cols-4 for huge desktop.' } },
  },
};
export default meta;
type Story = StoryObj;

const HEADING = (l: string) => storyT(l, 'storybook.listinggrid.heading')

export const Default: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div data-testid="listing-grid" className="container-wide mx-auto px-4 py-8">
        <h2 className="text-lg sm:text-2xl 2xl:text-3xl font-bold mb-6">{HEADING(locale)}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {makeStoryListings(locale).map(listing => (<StoryListingCard key={listing.id} data={listing} />))}
        </div>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'Responsive grid: 1-col@mobile → 2-col@sm → 3-col@xl → 4-col@2xl. Full fixture set. Use viewport toolbar for breakpoint proofs.' } }
  },
};

export const LocaleStress: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div data-testid="listing-grid" className="container-wide mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {makeStoryListings(locale).slice(0, 4).map(listing => (
            <StoryListingCard key={listing.id} data={listing} />
          ))}
        </div>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: '@320: longest locale titles — verify line-clamp-2. Use locale toolbar for sq/en/uk/it.' } }
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
};

/** Old-price wrap stress — reduced listing (50k/62k, 667/m²) at 320px. Proves old price wraps as whole cluster, not clipped. */
export const OldPriceWrap: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const stressCard = makeStoryListings(locale)[0]!
    return (
      <div data-testid="listing-grid" className="px-3 py-4" style={{ maxWidth: 320 }}>
        <StoryListingCard data={stressCard} />
      </div>
    )
  },

  parameters: {
    docs: { description: { story: '@320 narrow: card 0 — price 50,000 EUR, old 62,000 EUR, per-m² 667 EUR /m², date with year. Old price must wrap as one atomic cluster; no clipping; year visible.' } }
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
};

/** Currency switcher — all cards show USD to verify both main price AND per-m² use the same selected currency (no € hardcode). */
export const CurrencyUSD: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const listings = makeStoryListings(locale).map(l => ({ ...l, displayCurrency: 'USD' as string }))
    return (
      <div data-testid="listing-grid" className="container-wide mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {listings.map(listing => (
            <StoryListingCard key={listing.id} data={listing} />
          ))}
        </div>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'USD display currency — both main price and per-m² show USD (same selected currency, zero hardcoded € markers).' } }
  },

  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
};
