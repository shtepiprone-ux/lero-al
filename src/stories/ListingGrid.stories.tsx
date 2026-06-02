'use client'

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Maximize2, Camera, Heart, Copy, Check, BedDouble } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { isListingClosed, isListingArchived } from '@/modules/listings/domain';
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
          'StoryListingCard mirrors the live ListingCard field set (Task 365 parity). ' +
          'See docs/tailwind-canonical-fragments.md §4.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ── Story-level extended fixture (adds status/price variants, no live deps) ───

type StoryCardData = Omit<typeof LISTINGS_GRID_FIXTURE[number], 'status'> & {
  price_old?: number
  public_id: number
  imageCount: number
  status: 'active' | 'sold' | 'rented' | 'archived'
  location: string
}

const STORY_STATUSES: StoryCardData['status'][] = ['active','active','sold','active','rented','active','archived','active']

const STORY_LISTINGS: StoryCardData[] = LISTINGS_GRID_FIXTURE.map((l, i) => ({
  ...(l as Omit<typeof l, 'status'>),
  price_old:  i === 0 ? l.price + 12000 : undefined,
  public_id:  1000 + i,
  imageCount: 3 + (i % 4),
  status:     STORY_STATUSES[i] ?? 'active',
  location:   ['Tirana','Durrës','Sauk','Kombinat','Blloku','Vlorë','Berat','Elbasan'][i] ?? l.city,
}))

// ── StoryListingCard — mirrors live ListingCard field set (no auth/API deps) ──

function StoryListingCard({ data }: { data: StoryCardData }) {
  const t = useTranslations('listing')
  const [copied, setCopied] = useState(false)
  const [favorited, setFavorited] = useState(false)

  const isClosed = isListingClosed(data.status)
  const isArchived = isListingArchived(data.status)

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const pricePerSqm = data.area_sqm > 0 ? Math.round(data.price / data.area_sqm) : null

  return (
    <div
      className={cn(
        'listing-card listing-card--vertical flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        data.is_premium
          ? 'border-badge-premium/50 shadow-[0_0_0_1px_oklch(0.700_0.162_65_/_0.2)]'
          : '',
        isArchived && 'grayscale opacity-60',
      )}
    >
      {/* Premium top stripe */}
      {data.is_premium && (
        <div className="h-0.5 bg-gradient-to-r from-badge-premium/0 via-badge-premium to-badge-premium/0 shrink-0" />
      )}

      {/* Image area */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Maximize2 className="h-8 w-8" />
        </div>

        {/* Sold/Rented overlay — display map (presentation-layer constant) */}
        {isClosed && (
          <div className="absolute inset-0 bg-overlay/30 flex items-center justify-center">
            <span className={cn(
              'text-overlay-foreground font-bold text-sm px-3 py-1.5 rounded-xl rotate-[-8deg] border-2',
              ({ sold: 'bg-status-info/80 border-status-info', rented: 'bg-status-rented/80 border-status-rented' } as Record<string,string>)[data.status] ?? 'bg-overlay/80 border-overlay',
            )}>
              {t(`status_${data.status}` as 'status_sold' | 'status_rented').toUpperCase()}
            </span>
          </div>
        )}

        {/* Status badges — new / price_reduced */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {data.is_new && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-badge-new text-primary-foreground">
              {t('new')}
            </Badge>
          )}
          {data.price_old && data.price < data.price_old && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-badge-reduced text-primary-foreground">
              {t('price_reduced')}
            </Badge>
          )}
          {isArchived && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
              {t('status_archived')}
            </Badge>
          )}
        </div>

        {/* Photo count chip */}
        {data.imageCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-overlay/60 text-overlay-foreground text-xs px-2 py-0.5 rounded-full">
            <Camera className="h-3 w-3" />
            {data.imageCount}
          </div>
        )}

        {/* Favorite button stub (visual, no server action) */}
        <button
          type="button"
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 flex items-center justify-center shadow-sm hover:bg-background transition-colors"
          onClick={e => { e.preventDefault(); e.stopPropagation(); setFavorited(f => !f) }}
          disabled={isClosed}
        >
          <Heart className={cn('h-4 w-4', favorited ? 'fill-destructive text-destructive' : 'text-muted-foreground')} />
        </button>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-3">
        {/* Listing type + property type */}
        <p className="text-xs text-muted-foreground">
          {t(data.transaction_type as 'sale' | 'rent')} · {t('property_type_apartment')}
        </p>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors">
          {data.title}
        </h3>

        {/* Price block */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">
                €{data.price.toLocaleString()}
              </span>
              {data.price_old && (
                <span className="text-xs text-muted-foreground line-through">
                  €{data.price_old.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          {pricePerSqm && (
            <span className="text-xs text-muted-foreground">
              €{pricePerSqm} {t('per_sqm')}
            </span>
          )}
        </div>

        {/* Features row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
          <span className="flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5 shrink-0" />
            {data.area_sqm}m²
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5 shrink-0" />
            {data.bedrooms}
          </span>
        </div>

        {/* Location + date + public ID */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {data.location}
          </span>
          <span className="ml-auto shrink-0 pl-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              title={`ID: ${data.id}`}
              aria-label={copied ? 'Copied' : 'Copy ID'}
              className="font-mono text-[10px] text-muted-foreground/70 hover:text-muted-foreground transition-colors inline-flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded cursor-pointer"
            >
              #{data.public_id}
              {copied
                ? <Check className="h-2.5 w-2.5 shrink-0 text-status-success" />
                : <Copy className="h-2.5 w-2.5 shrink-0 opacity-50" />
              }
            </button>
            <span className="text-[10px]">2h ago</span>
          </span>
        </div>
      </div>
    </div>
  )
}

export const Desktop: Story = {
  render: () => (
    <div className="container-wide mx-auto px-4 py-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">{/* section title via locale toolbar */}
        Featured listings
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {STORY_LISTINGS.map(listing => (
          <StoryListingCard key={listing.id} data={listing} />
        ))}
      </div>
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: {
      description: {
        story:
          '1280px desktop. Cards match live ListingCard field set: type label, price block with old/reduced price + per-m², status badges (new/price_reduced/sold overlay/rented overlay/archived), photo count chip, favorite stub, public-id copy, premium stripe + border.',
      },
    },
  },
};

export const HugeDesktop: Story = {
  render: () => (
    <div className="container-wide mx-auto px-4 py-8">
      <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-bold mb-6">Featured listings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {STORY_LISTINGS.map(listing => (
          <StoryListingCard key={listing.id} data={listing} />
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
        {STORY_LISTINGS.slice(0, 4).map(listing => (
          <StoryListingCard key={listing.id} data={listing} />
        ))}
      </div>
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: {
      description: {
        story: '375px: single-column grid. Long title clamp (line-clamp-2), badges, and premium stripe visible.',
      },
    },
  },
};

export const LocaleStress: Story = {
  render: () => (
    <div className="container-wide mx-auto px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {STORY_LISTINGS.slice(0, 4).map((listing, i) => (
          <StoryListingCard
            key={listing.id}
            data={{
              ...listing,
              title: [
                'Сучасна квартира в центрі Тирани — довга назва для перевірки обрізання тексту',
                'Будинок з садом у Дурресі — ще одна довга назва',
                'Студія в районі Сауку з усіма зручностями поруч',
                'Офісне приміщення в новому бізнес-центрі',
              ][i] ?? listing.title,
            }}
          />
        ))}
      </div>
    </div>
  ),
  parameters: {
    globals: { locale: 'uk' },
    viewport: { defaultViewport: 'mobile320' },
    docs: {
      description: {
        story: 'uk@320: longest Ukrainian titles — verify line-clamp-2 clamps correctly, badge labels localize, price block does not overflow.',
      },
    },
  },
};
