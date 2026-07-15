'use client'

import { Card, Image, Text, Badge, Group, Stack, Button, ActionIcon } from '@mantine/core'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from './MantineListingCardPattern.module.css'

export interface MantineListingCardData {
  id: string
  title: string
  location: string
  price: string
  /** Old (pre-discount) price, already formatted. Present -> price renders as struck-through-old + new. */
  priceOld?: string
  area?: string
  rooms?: string
  badge?: string
  badgeColor?: string
  imageUrl?: string
  isFavorite?: boolean
}

export interface MantineListingCardPatternProps {
  data: MantineListingCardData
  contactLabel: string
  favoriteAriaLabel?: string
  onContact?: (id: string) => void
  onFavorite?: (id: string) => void
  onClick?: (id: string) => void
  /**
   * Replaces the default demo image + badge + favorite content of the top Card.Section wholesale
   * (e.g. the real `AppImage` + status overlay + photo-count + real `FavoriteButton`). Omit to keep
   * the pattern's own Mantine `Image`/`Badge`/`ActionIcon` demo content (Storybook default, unchanged).
   */
  imageSlot?: React.ReactNode
  /** Type label rendered above the title (e.g. "Sale · Apartment"). Omit to keep the title as the first line. */
  typeLabel?: string
  /** Icon-based features row (real content). Rendered instead of the plain rooms/area line when provided. */
  featuresSlot?: React.ReactNode
  /** Rendered below the price block (e.g. copy-ID + listing date). */
  footerSlot?: React.ReactNode
  /** Premium styling: top gradient stripe + brand ring + brand-tinted hover elevation (replaces the default hover shadow). */
  isPremium?: boolean
  /** Archived/expired dimming (grayscale + reduced opacity) on the whole card. */
  isArchived?: boolean
}

/**
 * Canonical listing card pattern for public marketplace.
 *
 * Mobile (<sm): card is full-width (natural at <640 in a grid col=1).
 * Desktop: card has fixed aspect-ratio image + content below.
 *
 * Responsive API:
 *   - Image height: 180px at base, 200px at sm+ via minHeight.
 *   - Used inside MantineCardGrid (cols={{ base: 1, sm: 2, md: 3 }}).
 *   - Contact button is full-width on mobile inside the card.
 *   - Favorite action icon: 44px touch target (size="lg").
 *
 * Matches the product listing card surface (src/modules/listings/components/ListingCard.tsx
 * migration target — Phase 4).
 */
export function MantineListingCardPattern({
  data,
  contactLabel,
  favoriteAriaLabel,
  onContact,
  onFavorite,
  onClick,
  imageSlot,
  typeLabel,
  featuresSlot,
  footerSlot,
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
        {imageSlot ?? (
          <>
            <Image
              src={data.imageUrl}
              height={180}
              alt={data.title}
              fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='180'%3E%3Crect width='400' height='180' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' fill='%23aaa' font-size='14' text-anchor='middle' dy='.3em'%3EPhoto%3C/text%3E%3C/svg%3E"
            />
            {data.badge && (
              <Badge
                color={data.badgeColor ?? 'brand'}
                variant="filled"
                size="sm"
                style={{ position: 'absolute', top: 8, left: 8 }}
              >
                {data.badge}
              </Badge>
            )}
            {onFavorite && (
              <ActionIcon
                variant="filled"
                color={data.isFavorite ? 'brand' : 'white'}
                size="lg"
                radius="xl"
                style={{ position: 'absolute', top: 8, right: 8, minWidth: 44, minHeight: 44 }}
                onClick={(e) => { e.stopPropagation(); onFavorite(data.id) }}
                aria-label={favoriteAriaLabel}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={data.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </ActionIcon>
            )}
          </>
        )}
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
        {featuresSlot ?? ((data.area || data.rooms) && (
          <Group gap="xs">
            {data.rooms && <Text size="xs" c="dimmed">{data.rooms}</Text>}
            {data.area && data.rooms && <Text size="xs" c="dimmed">·</Text>}
            {data.area && <Text size="xs" c="dimmed">{data.area}</Text>}
          </Group>
        ))}
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
        {footerSlot}
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
