'use client'

import type { Meta, StoryObj } from '@storybook/react';
import { StoryListingCard, makeStoryListings } from './StoryListingCard';

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

const HEADING: Record<string, string> = {
  en: 'Featured listings', sq: 'Njoftimet e veçuara', uk: 'Рекомендовані оголошення', it: 'Annunci in evidenza',
}


export const Desktop: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <h2 className="text-xl sm:text-2xl font-bold mb-6">{HEADING[locale] ?? HEADING.en}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {makeStoryListings(locale).map(listing => (<StoryListingCard key={listing.id} data={listing} />))}
        </div>
      </div>
    )
  },
  parameters: { viewport: { defaultViewport: 'desktop1280' }, docs: { description: { story: '1280px desktop. Cards match live ListingCard field set.' } } },
};

export const HugeDesktop: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-6">{HEADING[locale] ?? HEADING.en}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {makeStoryListings(locale).map(listing => (<StoryListingCard key={listing.id} data={listing} />))}
        </div>
      </div>
    )
  },
  parameters: { viewport: { defaultViewport: 'desktop2560' }, docs: { description: { story: 'At 2560px: 4 columns via 2xl:grid-cols-4.' } } },
};

export const Mobile: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="px-4 py-4">
        <h2 className="text-lg font-bold mb-4">{HEADING[locale] ?? HEADING.en}</h2>
        <div className="grid grid-cols-1 gap-4">
          {makeStoryListings(locale).slice(0, 4).map(listing => (<StoryListingCard key={listing.id} data={listing} />))}
        </div>
      </div>
    )
  },
  parameters: { viewport: { defaultViewport: 'mobile375' }, docs: { description: { story: '375px: single-column grid.' } } },
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
  parameters: { viewport: { defaultViewport: 'mobile320' }, docs: { description: { story: '@320: longest locale titles — verify line-clamp-2. Use locale toolbar for sq/en/uk/it.' } } },
};
