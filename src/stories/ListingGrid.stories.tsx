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


export const Desktop: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">{HEADING(locale)}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {makeStoryListings(locale).map(listing => (<StoryListingCard key={listing.id} data={listing} />))}
        </div>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: '1280px desktop. Cards match live ListingCard field set.' } }
  },

  globals: {
    viewport: {
      value: 'desktop1280',
      isRotated: false
    }
  }
};

export const HugeDesktop: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-6">{HEADING(locale)}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {makeStoryListings(locale).map(listing => (<StoryListingCard key={listing.id} data={listing} />))}
        </div>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: 'At 2560px: 4 columns via 2xl:grid-cols-4.' } }
  },

  globals: {
    viewport: {
      value: 'desktop2560',
      isRotated: false
    }
  }
};

export const Mobile: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="px-4 py-4">
        <h2 className="text-lg font-bold mb-4">{HEADING(locale)}</h2>
        <div className="grid grid-cols-1 gap-4">
          {makeStoryListings(locale).slice(0, 4).map(listing => (<StoryListingCard key={listing.id} data={listing} />))}
        </div>
      </div>
    )
  },

  parameters: {
    docs: { description: { story: '375px: single-column grid.' } }
  },

  globals: {
    viewport: {
      value: 'mobile375',
      isRotated: false
    }
  }
};

export const LocaleStress: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
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
