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
  /** The actual `<img>`/`AppImage` photo element. Required — the pattern owns the frame + everything overlaid on it. */
  image: ReactNode
  /**
   * Real `FavoriteButton` (app) / demo heart button (story). Renders as a bare child of the
   * (position:relative) image frame — the node itself must self-position via
   * `absolute top-2 right-2` (the contract the real `FavoriteButton` already follows).
   */
  favorite?: ReactNode
  typeLabel?: string
  /** Top-left status/promo badges (new/price_reduced/sold/rented/archived/expired etc.). */
  badges?: MantineListingCardBadge[]
  /** Rotated centered overlay for closed listings (sold/rented). */
  overlay?: MantineListingCardOverlay
  /** Bottom-right photo count pill. Omit/0 -> no counter rendered. */
  photoCount?: number
  /** Icon+value feature row (rooms/area/floor/etc.). */
  features?: MantineListingCardFeature[]
  /** Original-price (pre-conversion) line, already formatted. */
  originalPriceStr?: string | null
  /** Pre-formatted "<price> <per_sqm label>" string. */
  pricePerSqmStr?: string | null
  /** Copy-id + date cluster (app) / demo equivalent (story) — carries its own state, passed as a node. */
  footerActions?: ReactNode
  /** Premium styling: top gradient stripe + brand ring + brand-tinted hover elevation (replaces the default hover shadow). */
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
