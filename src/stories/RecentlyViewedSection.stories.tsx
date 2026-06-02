/**
 * Storybook story for the recently-viewed responsive layout.
 *
 * Uses a simplified StoryCard (no FavoriteButton / server-action deps) and a
 * StoryClrButton stub so the locale-aware layout renders cleanly in Storybook.
 * The live feature uses RecentlyViewedGrid + ListingCard; the markup is identical.
 *
 * Governance note: docs/responsive-screenshot-governance.md §12 forbids
 * capturing components that require auth/DB (RecentlyViewedSection), so this
 * story tests the presentational shell (RecentlyViewedGrid) via stable fixtures.
 * Seven breakpoints are required: 320, 375, 390, 768, 1280, 1440, 2560.
 */

'use client'

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin, Maximize2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LISTINGS_GRID_FIXTURE } from './fixtures/listing.fixture'

// ── Simplified listing card (no server-action deps) ───────────────────────────

function StoryCard({ listing }: { listing: (typeof LISTINGS_GRID_FIXTURE)[number] }) {
  const t = useTranslations('listing')
  return (
    <div className="rounded-xl border bg-card overflow-hidden group">
      <div className="relative aspect-[4/3] bg-muted flex items-center justify-center">
        <Maximize2 className="h-8 w-8 text-muted-foreground" />
        {listing.is_premium && (
          <div className="absolute top-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-badge-premium text-primary-foreground">
            Premium
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-xs text-muted-foreground">
          {t(listing.transaction_type as 'sale' | 'rent')} · {t('property_type_apartment')}
        </p>
        <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>
        <div className="text-lg font-bold text-primary">
          €{listing.price.toLocaleString()}
          {listing.transaction_type === 'rent' && (
            <span className="text-xs font-normal text-muted-foreground">/mo</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {listing.neighborhood}, {listing.city}
        </div>
      </div>
    </div>
  )
}

// ── Canonical clear button (canonical Button, cursor-pointer, action-wired) ────

function StoryClrButton({ onClear }: { onClear?: () => void }) {
  const t = useTranslations('listing')
  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
      onClick={onClear}
    >
      <Trash2 className="h-4 w-4 shrink-0" />
      {t('recently_viewed_clear')}
    </Button>
  )
}

// ── Layout component (mirrors RecentlyViewedGrid markup exactly) ───────────────

function RecentlyViewedLayout({
  listings,
  showClear = false,
  showEmptyState = false,
  onClear,
}: {
  listings: (typeof LISTINGS_GRID_FIXTURE)
  showClear?: boolean
  showEmptyState?: boolean
  onClear?: () => void
}) {
  const t = useTranslations('listing')

  if (!listings.length) {
    if (!showEmptyState) return null
    return (
      <div className="recently-viewed">
        <h2 className="text-xl font-bold mb-4">{t('recently_viewed_title')}</h2>
        <p className="text-sm text-muted-foreground">{t('recently_viewed_empty')}</p>
      </div>
    )
  }

  return (
    <div className="recently-viewed">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t('recently_viewed_title')}</h2>
        {showClear && <StoryClrButton onClear={onClear} />}
      </div>
      {/* Mobile: horizontal scroll (scrollbar visible in story for QA; production uses no-scrollbar).
          sm+: grid 2→3→4 cols. Matches RecentlyViewedGrid markup. */}
      <div className="flex gap-3 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 md:grid-cols-3 lg:grid-cols-4">
        {listings.map(listing => (
          <div key={listing.id} className="w-48 shrink-0 sm:w-auto sm:shrink">
            <StoryCard listing={listing} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Meta ───────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'System/RecentlyViewedSection',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Recently-viewed listings section — responsive layout story. ' +
          'Mobile: horizontal scroll (w-48 cards, no-scrollbar). ' +
          'sm+: 2-col grid → md: 3-col → lg: 4-col. ' +
          'Clear button (profile only) via clearSlot prop. ' +
          'See docs/responsive-screenshot-governance.md for screenshot matrix.',
      },
    },
  },
}

export default meta
type Story = StoryObj

const ITEMS = LISTINGS_GRID_FIXTURE

// ── Stories ────────────────────────────────────────────────────────────────────

/** Desktop grid — populated with 8 listings + clear button (profile context). */
function PopulatedRender() {
  const [cleared, setCleared] = useState(false)
  return (
    <div className="container-wide mx-auto px-4 py-8">
      <RecentlyViewedLayout listings={ITEMS} showClear onClear={() => setCleared(true)} />
      {cleared && <p className="text-xs text-muted-foreground mt-3 px-1">Clear history clicked ✓</p>}
    </div>
  )
}

export const Populated: Story = {
  render: () => <PopulatedRender />,
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'Desktop 1280px: 3-col grid. Canonical Button for Clear — click logs action in canvas.' } },
  },
}

/** Mobile horizontal scroll — key breakpoint for the scroll→grid transition. */
export const MobileScroll: Story = {
  render: () => (
    <div className="py-4 px-4">
      <RecentlyViewedLayout listings={ITEMS.slice(0, 6)} showClear onClear={() => {}} />
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: { description: { story: 'Mobile 375px: horizontal scroll, w-48 shrink-0 cards. Scrollbar visible in story (production uses no-scrollbar). Swipe or drag horizontally to scroll.' } },
  },
}

/** Huge desktop — 4-col grid via lg:grid-cols-4 (2560px, container-wide bounds content). */
export const HugeDesktop: Story = {
  render: () => (
    <div className="container-wide mx-auto px-4 py-8">
      <RecentlyViewedLayout listings={ITEMS} showClear />
    </div>
  ),
  parameters: {
    viewport: { defaultViewport: 'desktop2560' },
    docs: { description: { story: '2560px: 4-col grid via lg:grid-cols-4. Content bounded by .container-wide.' } },
  },
}

/** Empty state — shown after clearing history or before any listing is visited. */
export const EmptyState: Story = {
  render: () => (
    <div className="container-wide mx-auto px-4 py-8">
      <RecentlyViewedLayout listings={[]} showEmptyState />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Empty state (showEmptyState=true). No clear button when no items.' } },
  },
}

/** Ukrainian locale — longest strings, primary overflow stress test. */
export const UkrainianLocale: Story = {
  render: () => (
    <div className="container-wide mx-auto px-4 py-8">
      <RecentlyViewedLayout listings={ITEMS.slice(0, 4)} showClear onClear={() => {}} />
    </div>
  ),
  parameters: {
    globals: { locale: 'uk' },
    docs: { description: { story: 'Ukrainian (uk) locale — longest strings; checks title wrap and button label.' } },
  },
}
