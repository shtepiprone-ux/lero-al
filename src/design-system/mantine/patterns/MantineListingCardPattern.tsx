'use client'

import type { ReactNode } from 'react'
import { Card, Text, Group, Stack, Button } from '@mantine/core'
import { Camera, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import styles from './MantineListingCardPattern.module.css'

export interface MantineListingCardBadge {
  label: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}

export interface MantineListingCardFeature {
  /** Pre-rendered icon element (e.g. `<ListingFeatureIcon .../>`) — pattern needs no app icon map. */
  icon: ReactNode
  value: string
}

export interface MantineListingCardOverlay {
  /** Already-translated, already-uppercased label (e.g. "SOLD"). */
  label: string
  /** Status color classes (e.g. `bg-status-info/80 border-status-info`) — a presentation-layer constant. */
  className?: string
}

export interface MantineListingCardData {
  id: string
  title: string
  location: string
  price: string
  /** Old (pre-discount) price, already formatted. Present -> price renders as struck-through-old + new. */
  priceOld?: string
}

export interface MantineListingCardPatternProps {
  data: MantineListingCardData
  contactLabel?: string
  onContact?: (id: string) => void
  onClick?: (id: string) => void
  /**
   * `'grid'` (default) — photo-first vertical card (Grid/Latest surfaces).
   * `'list'` — horizontal row (List view), structurally ported from the legacy
   * `ListingCard.tsx` `variant==='horizontal'` branch (Task 606) — image-left fixed width,
   * info-right column. Same props/data model as `'grid'`; only layout + which pieces render
   * differ (see `overlay`/`photoCount` below — `'list'` never had these in the legacy design).
   */
  layout?: 'grid' | 'list'
  /** The actual `<img>`/`AppImage` photo element. Required — the pattern owns the frame + everything overlaid on it. */
  image: ReactNode
  /**
   * Real `FavoriteButton` (app) / demo heart button (story). Rendered as a bare child.
   * `layout='grid'`: floats on the image — the node must self-position via
   * `absolute top-2 right-2` (the contract the real `FavoriteButton` already follows).
   * `layout='list'`: sits inline in the info column's top row next to `typeLabel` — the node
   * must NOT be absolutely positioned (matches the legacy horizontal branch's own
   * `className="shrink-0 -mt-0.5 -mr-1"` contract).
   */
  favorite?: ReactNode
  typeLabel?: string
  /** Top-left status/promo badges (new/price_reduced/sold/rented/archived/expired etc.). Renders in both layouts. */
  badges?: MantineListingCardBadge[]
  /** Rotated centered overlay for closed listings (sold/rented). `layout='grid'` only — the ported legacy `layout='list'` design never had this (the badge already conveys sold/rented). */
  overlay?: MantineListingCardOverlay
  /** Bottom-right photo count pill. `layout='grid'` only — the ported legacy `layout='list'` design never had this. Omit/0 -> no counter rendered. */
  photoCount?: number
  /** Icon+value feature row (rooms/area/floor/etc.). Renders in both layouts. */
  features?: MantineListingCardFeature[]
  /** Original-price (pre-conversion) line, already formatted. */
  originalPriceStr?: string | null
  /** Pre-formatted "<price> <per_sqm label>" string. */
  pricePerSqmStr?: string | null
  /** Copy-id + date cluster (app) / demo equivalent (story) — carries its own state, passed as a node. */
  footerActions?: ReactNode
  /** Premium styling: brand ring + brand-tinted hover elevation. `layout='grid'` additionally gets the top gradient stripe (no structural "top" to stripe in `layout='list'`'s row shape). */
  isPremium?: boolean
  /** Archived/expired dimming (grayscale + reduced opacity) on the whole card. */
  isArchived?: boolean
}

/**
 * Canonical listing card pattern for public marketplace — SINGLE SOURCE OF TRUTH for the
 * whole card (Task 605). Owns layout + all pure-visual chrome (badges, sold/rented overlay,
 * photo counter, type/title/location, features row, price(+old), footer layout, premium/
 * archived states, hover). `image`/`favorite`/`footerActions` are passed in as positioned
 * nodes because they carry app behavior/state (real photo delivery, favorite toggle,
 * copy-id) that this pattern must stay agnostic of (presentational-split gate).
 *
 * Matches the product listing card surface (src/modules/listings/components/ListingCard.tsx
 * — the vertical branch is a thin data-mapper over this pattern).
 */
export function MantineListingCardPattern({
  data,
  contactLabel,
  onContact,
  onClick,
  layout = 'grid',
  image,
  favorite,
  typeLabel,
  badges,
  overlay,
  photoCount,
  features,
  originalPriceStr,
  pricePerSqmStr,
  footerActions,
  isPremium = false,
  isArchived = false,
}: MantineListingCardPatternProps) {
  // ── layout='list' — structural port of the legacy ListingCard.tsx `variant==='horizontal'`
  // branch (Task 606): image-left fixed width row, info-right column. Reuses `styles.card`'s
  // hover/premium CSS (same guards as 'grid' — (hover:hover)/(pointer:fine) + reduced-motion) so
  // hover behavior is unified rather than re-deriving the legacy's own (cascade-layer-broken)
  // Tailwind `hover:shadow-md`. `overlay`/`photoCount` are intentionally NOT rendered here — the
  // ported legacy design never had them (the `badges` array already carries the sold/rented
  // status); `onContact` CTA is likewise not rendered (legacy horizontal never had one).
  if (layout === 'list') {
    return (
      <Card
        padding={0}
        radius="md"
        withBorder
        className={cn(
          styles.card,
          styles.listRow,
          isPremium && styles.premium,
          'group gap-3 overflow-hidden',
          isArchived && 'grayscale opacity-60',
        )}
        style={{ cursor: onClick ? 'pointer' : undefined }}
      >
        <div
          className={cn(styles.imageSection, 'relative w-32 shrink-0 sm:w-44 self-stretch min-h-20 overflow-hidden bg-muted')}
          onClick={() => onClick?.(data.id)}
        >
          {image}

          {badges && badges.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {badges.map(b => (
                <Badge key={b.label} variant={b.variant} className={cn('text-2xs px-1.5 py-0', b.className)}>
                  {b.label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between py-3 pr-3 flex-1 min-w-0" onClick={() => onClick?.(data.id)}>
          <div>
            <div className="flex items-start justify-between gap-1 mb-1">
              {typeLabel && <p className="text-xs text-muted-foreground">{typeLabel}</p>}
              {favorite}
            </div>
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {data.title}
            </h3>
          </div>
          <div>
            <div className="w-full mt-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 justify-between">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-base font-bold text-primary whitespace-nowrap">{data.price}</span>
                  {data.priceOld && (
                    <span className="text-xs text-muted-foreground line-through whitespace-nowrap">{data.priceOld}</span>
                  )}
                </div>
                {pricePerSqmStr && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{pricePerSqmStr}</span>
                )}
              </div>
              {originalPriceStr && (
                <span className="text-2xs text-muted-foreground/70 leading-tight">{originalPriceStr}</span>
              )}
            </div>
            {features && features.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                {features.map((f, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {f.icon}
                    {f.value}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
              {data.location ? (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {data.location}
                </span>
              ) : <span />}
              <span className="ml-auto shrink-0 pl-2 flex items-center gap-2">
                {footerActions}
              </span>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      padding={0}
      radius="md"
      withBorder
      className={cn(
        styles.card,
        isPremium && styles.premium,
        'flex h-full flex-col',
        isArchived && 'grayscale opacity-60',
      )}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      {isPremium && (
        <div className="h-0.5 bg-gradient-to-r from-badge-premium/0 via-badge-premium to-badge-premium/0 shrink-0" />
      )}

      <Card.Section className={styles.imageSection} style={{ position: 'relative', overflow: 'hidden' }} onClick={() => onClick?.(data.id)}>
        {image}

        {badges && badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {badges.map(b => (
              <Badge key={b.label} variant={b.variant} className={cn('text-2xs px-1.5 py-0', b.className)}>
                {b.label}
              </Badge>
            ))}
          </div>
        )}

        {overlay && (
          <div className="absolute inset-0 bg-overlay/30 flex items-center justify-center">
            <span className={cn(
              'text-overlay-foreground font-bold text-sm px-3 py-1.5 rounded-xl rotate-[-8deg] border-2',
              overlay.className,
            )}>
              {overlay.label}
            </span>
          </div>
        )}

        {!!photoCount && photoCount > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-overlay/60 text-overlay-foreground text-xs px-2 py-0.5 rounded-full">
            <Camera className="h-3 w-3" />
            {photoCount}
          </div>
        )}

        {favorite}
      </Card.Section>

      <Stack gap={4} p="sm" onClick={() => onClick?.(data.id)}>
        {typeLabel && (
          <Text size="xs" c="dimmed">
            {typeLabel}
          </Text>
        )}
        <Text fw={600} size="sm" lineClamp={2}>
          {data.title}
        </Text>
        <Group gap={4} wrap="nowrap">
          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
          <Text size="xs" c="dimmed" truncate className="min-w-0">
            {data.location}
          </Text>
        </Group>
        {features && features.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2 flex-wrap">
            {features.map((f, i) => (
              <span key={i} className="flex items-center gap-1">
                {f.icon}
                {f.value}
              </span>
            ))}
          </div>
        )}
        {data.priceOld ? (
          <Group gap={6} align="baseline" mt={4} wrap="wrap">
            <Text fw={700} size="md" c="brand">
              {data.price}
            </Text>
            <Text size="xs" c="dimmed" td="line-through">
              {data.priceOld}
            </Text>
          </Group>
        ) : (
          <Text fw={700} size="md" c="brand" mt={4}>
            {data.price}
          </Text>
        )}
        {(originalPriceStr || pricePerSqmStr) && (
          <div className="flex items-center justify-between gap-2 text-2xs text-muted-foreground/70">
            <span>{originalPriceStr}</span>
            {pricePerSqmStr && <span className="ml-auto whitespace-nowrap">{pricePerSqmStr}</span>}
          </div>
        )}
        {footerActions}
      </Stack>

      {onContact && (
        <Card.Section p="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
          <Button
            color="brand"
            variant="filled"
            size="sm"
            fullWidth
            onClick={(e) => { e.stopPropagation(); onContact(data.id) }}
          >
            {contactLabel}
          </Button>
        </Card.Section>
      )}
    </Card>
  )
}
