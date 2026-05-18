import type { Meta, StoryObj } from '@storybook/react';
import { MapPin, Maximize2, BedDouble, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LISTINGS_GRID_FIXTURE } from './fixtures/listing.fixture';

const meta: Meta = {
  title: 'System/ListingGrid',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Listing card grid — canonical responsive pattern. ' +
          'MUST include `2xl:grid-cols-4` for huge desktop. ' +
          'See docs/tailwind-canonical-fragments.md §4.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Simplified listing card for story purposes (no live data / auth dependencies)
function StoryListingCard({ listing }: { listing: typeof LISTINGS_GRID_FIXTURE[number] }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden group">
      {/* Image placeholder */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
          {listing.area_sqm}m² image
        </div>
        {listing.is_premium && (
          <div className="absolute top-2 left-2">
            <Badge variant="info">Premium</Badge>
          </div>
        )}
        {listing.is_new && (
          <div className="absolute top-2 left-2">
            <Badge variant="success">New</Badge>
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
          <Camera className="h-3 w-3 text-white" />
          <span className="text-[10px] text-white">5</span>
        </div>
      </div>
      {/* Content */}
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs truncate">{listing.neighborhood}, {listing.city}</span>
        </div>
        <h3 className="text-sm font-medium line-clamp-2 leading-snug">{listing.title}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5 shrink-0" />
            {listing.area_sqm}m²
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5 shrink-0" />
            {listing.bedrooms}
          </span>
        </div>
        <div className="font-semibold text-sm pt-1">
          €{listing.price.toLocaleString()}
          {listing.transaction_type === 'rent' && <span className="text-xs font-normal text-muted-foreground">/mo</span>}
        </div>
      </div>
    </div>
  );
}

export const Desktop: Story = {
  render: () => (
    <div className="container-wide mx-auto px-4 py-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Featured listings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {LISTINGS_GRID_FIXTURE.map(listing => (
          <StoryListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
  },
};

export const HugeDesktop: Story = {
  render: () => (
    <div className="container-wide mx-auto px-4 py-8">
      <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-6">Featured listings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {LISTINGS_GRID_FIXTURE.map(listing => (
          <StoryListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'desktop2560' },
    docs: {
      description: {
        story: 'At 2560px: 4 columns via `2xl:grid-cols-4`. Content bounded by `.container-wide` — no whitespace wasteland.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => (
    <div className="px-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {LISTINGS_GRID_FIXTURE.slice(0, 4).map(listing => (
          <StoryListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
  },
};

export const WithUkrainianTitles: Story = {
  render: () => (
    <div className="container-wide mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {LISTINGS_GRID_FIXTURE.slice(0, 4).map((listing, i) => (
          <StoryListingCard
            key={listing.id}
            listing={{
              ...listing,
              title: [
                'Сучасна квартира в центрі Тирани',
                'Будинок з садом у Дурресі',
                'Студія в районі Сауку з усіма зручностями',
                'Офісне приміщення в новому бізнес-центрі',
              ][i] ?? listing.title,
            }}
          />
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ukrainian listing titles — longer strings test card title clamp (line-clamp-2).',
      },
    },
  },
};
