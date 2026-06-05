/**
 * Storybook story for the recently-viewed responsive layout.
 *
 * Uses the shared StoryListingCard helper (Task 370 parity: mirrors live ListingCard).
 * The live feature uses RecentlyViewedGrid + ListingCard; the markup is identical.
 *
 * Governance note: docs/responsive-screenshot-governance.md §12 forbids
 * capturing components that require auth/DB (RecentlyViewedSection), so this
 * story tests the presentational shell (RecentlyViewedGrid) via stable fixtures.
 * Seven breakpoints are required: 320, 375, 390, 768, 1280, 1440, 2560.
 */

'use client'

import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StoryListingCard, makeStoryListings, type StoryCardData } from './StoryListingCard'

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
  listings: StoryCardData[]
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
      {/* Flat flex-wrap: title + clear button on same row; only wrap left-aligned when title fills row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
        <h2 className="text-xl font-bold">{t('recently_viewed_title')}</h2>
        {showClear && <StoryClrButton onClear={onClear} />}
      </div>
      {/* Mobile: horizontal scroll (scrollbar visible in story for QA; production uses no-scrollbar).
          sm+: grid 2→3→4 cols. Equal-height rows via sm:[&>*]:h-full. */}
      <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 md:grid-cols-3 lg:grid-cols-4 sm:[&>*]:h-full">
        {listings.map(listing => (
          <div key={listing.id} className="w-48 shrink-0 sm:w-auto sm:shrink flex flex-col">
            <StoryListingCard data={listing} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Meta ───────────────────────────────────────────────────────────────────────

type RvsArgs = {
  onClear?: () => void
}

const meta: Meta<RvsArgs> = {
  title: 'System/RecentlyViewedSection',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Recently-viewed listings section — responsive layout story. ' +
          'Mobile: horizontal scroll (w-48 cards, no-scrollbar). ' +
          'sm+: 2-col grid → md: 3-col → lg: 4-col. ' +
          'Clear button (profile only) via clearSlot prop. ' +
          'Cards use shared StoryListingCard (Task 370 parity: image, status/premium, price + €/m², beds/area, location, photo count, favorite, days-ago). ' +
          'See docs/responsive-screenshot-governance.md for screenshot matrix.',
      },
    },
  },
}

export default meta
type Story = StoryObj<RvsArgs>

// ── Stories ────────────────────────────────────────────────────────────────────

/** Desktop grid — populated with 8 listings + clear button (profile context). */
function PopulatedRender({ onClear, locale }: { onClear?: () => void; locale: string }) {
  const [cleared, setCleared] = useState(false)
  function handleClear() {
    onClear?.()
    setCleared(true)
  }
  return (
    <div className="container-wide mx-auto px-4 py-8">
      <RecentlyViewedLayout listings={makeStoryListings(locale)} showClear onClear={handleClear} />
      {cleared && <p className="text-xs text-muted-foreground mt-3 px-1">{'Clear history clicked ✓'}</p>}
    </div>
  )
}

export const Populated: Story = {
  args: { onClear: fn() },
  render: (args, context) => <PopulatedRender onClear={args.onClear} locale={(context?.globals?.locale as string) ?? 'en'} />,
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: { description: { story: 'Desktop 1280px: 3-col grid. Full field-parity cards (premium stripe, status badges, price/m², features, photo count, favorite, date). Click Clear — logs to Actions panel via fn() AND shows in-canvas confirmation.' } },
  },
}

/** Mobile horizontal scroll — key breakpoint for the scroll→grid transition. */
export const MobileScroll: Story = {
  args: { onClear: fn() },
  render: (args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="py-4 px-4">
        <RecentlyViewedLayout listings={makeStoryListings(locale).slice(0, 6)} showClear onClear={args.onClear} />
      </div>
    )
  },
  parameters: {
    viewport: { defaultViewport: 'mobile375' },
    docs: { description: { story: 'Mobile 375px: horizontal scroll, w-48 shrink-0 cards with full field set. Scrollbar visible in story (production uses no-scrollbar). Swipe or drag horizontally to scroll.' } },
  },
}

/** Huge desktop — 4-col grid via lg:grid-cols-4 (2560px, container-wide bounds content). */
export const HugeDesktop: Story = {
  args: { onClear: fn() },
  render: (args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <RecentlyViewedLayout listings={makeStoryListings(locale)} showClear onClear={args.onClear} />
      </div>
    )
  },
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

/** Locale stress — longest strings, primary overflow stress test. Use locale toolbar for sq/en/uk/it. */
export const LocaleStress: Story = {
  args: { onClear: fn() },
  render: (args, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return (
      <div className="container-wide mx-auto px-4 py-8">
        <RecentlyViewedLayout
          listings={makeStoryListings(locale).slice(0, 4)}
          showClear
          onClear={args.onClear}
        />
      </div>
    )
  },
  parameters: {
    viewport: { defaultViewport: 'mobile320' },
    docs: { description: { story: '@320: longest locale titles — title line-clamp-2, badge labels localize, no horizontal overflow. Use locale toolbar for sq/en/uk/it; viewport toolbar for other widths.' } },
  },
}
