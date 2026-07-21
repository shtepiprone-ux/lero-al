import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { storyT } from '../../_storyI18n'
import { PopularLocationsView, type PopularLocationsViewLocation } from '@/modules/locations/components/PopularLocationsView'

const meta: Meta = {
  title: 'Mantine/Primitives/PopularLocationsView',
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Real Cloudinary-shaped/HTTPS demo photo — exercises the AppImage branch.
// AppImage's optimizer is a no-op pass-through for non-`res.cloudinary.com` URLs (imageDelivery.ts),
// so any HTTPS photo renders correctly here, same convention as ListingCardPattern.stories.tsx.
const DEMO_IMAGE_URL = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'

// Real Albanian city names — proper nouns, not translatable UI copy (same convention as
// StoryListingCard.tsx's LOCATIONS fixture array).
const CITY_NAMES = ['Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Berat', 'Korçë', 'Sarandë']

function makeLocations(): PopularLocationsViewLocation[] {
  return CITY_NAMES.map((name, i) => ({
    id: `loc-${i}`,
    name,
    href: `/en/listings?location_id=loc-${i}`,
    // Alternate branches: even index → real photo (AppImage + overlay), odd index → gradient fallback.
    imageUrl: i % 2 === 0 ? DEMO_IMAGE_URL : null,
  }))
}

export const Default: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <PopularLocationsView
        heading={storyT(locale, 'home.popular_locations')}
        locations={makeLocations()}
      />
    )
  },
}

export const LongCityName: Story = {
  render: (_args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const locations = makeLocations()
    locations[0] = { ...locations[0], name: 'Rrogozhinë-Peqin-Kavajë Bashkiake', imageUrl: null }
    return (
      <PopularLocationsView
        heading={storyT(locale, 'home.popular_locations')}
        locations={locations}
      />
    )
  },

  parameters: {
    docs: { description: { story: 'Longest-name stress: `truncate` clips to one line with an ellipsis, no card overflow — verify at uk@320.' } }
  },

  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}
