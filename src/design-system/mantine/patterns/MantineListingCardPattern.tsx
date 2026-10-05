'use client'

import type { ReactNode } from 'react'
import { Card, Text, Group, Stack, Button, Badge, Box, Divider, Overlay, rem, useMantineTheme } from '@mantine/core'
import { Camera, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveGalleryOffsetValue } from './GalleryNavActionIcon'
import styles from './MantineListingCardPattern.module.css'

// Task 741 Revision 3 — the label border colour per tone (same tokens the badges use via LISTING_STATUS_COLOR).
const OVERLAY_TONE_BORDER = { sold: 'var(--status-info)', rented: 'var(--status-rented)' } as const

export interface MantineListingCardBadge {
  label: string
  /**
   * Mantine theme color name (`'green'|'yellow'|'red'|'gray'|'brand'|'blueLight'|'purple'` —
   * see `theme.ts` `colors`). Task 617 — replaces the legacy `className` color override: Mantine's
   * own `Badge.css` sets `background`/`font-size`/`padding` as UNLAYERED rules (no `@layer`
   * wrapper), so a Tailwind `@layer utilities` className can never win regardless of specificity
   * (the same cascade-layer trap documented for `ActionIcon`/`Card`, Task 602/606/612/616) — a
   * `className` color override on this component would have silently done nothing.
   *
   * The pattern always renders these with `variant="filled"` (opaque, solid background + white
   * text) — not the theme's default `variant="light"` — because every badge here sits directly
   * on top of the listing photo (both `layout="grid"` and `layout="list"`); `light`'s translucent
   * tint lets the photo bleed through and kills contrast, the exact defect the owner caught on
   * the first Mantine-Badge pass (Task 617). `filled` is documented on the canonical
   * `Mantine/Primitives/Badge` story before use here, per the "add missing variant to the
   * primitive story first" rule.
   */
  color?: string
}

export interface MantineListingCardFeature {
  /** Pre-rendered icon element (e.g. `<ListingFeatureIcon .../>`) — pattern needs no app icon map. */
  icon: ReactNode
  value: string
}

export interface MantineListingCardOverlay {
  /** Already-translated, already-uppercased label (e.g. "SOLD"). */
  label: string
  /**
   * Closed-listing status colour, owned by the pattern (Task 886 R40, owner O83-1 2026-09-30 — supersedes
   * Task 741's "the pattern carries no status colour"): `'sold'` / `'rented'` apply the pattern's own
   * overlay background and border, so every surface that renders the pattern shows the same colour.
   */
  tone?: 'sold' | 'rented'
  /**
   * Arbitrary consumer-supplied class, merged onto the overlay label element via `cn()`
   * (Task 741 — a pass-through; status colour now comes from `tone`).
   */
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
   * `'list'` — horizontal row (List view): a left photo column and an info column. Same props, same parts as
   * `'grid'` (Task 741 Revision 3h, owner D46-9): every part is built once and placed by both layouts; only the
   * arrangement and the favourite position differ.
   */
  layout?: 'grid' | 'list'
  /** The actual `<img>`/`AppImage` photo element. Required — the pattern owns the frame + everything overlaid on it. */
  image: ReactNode
  /**
   * Real `FavoriteButton` (app) / demo heart button (story). Rendered as a bare child.
   * `layout='grid'`: floats on the image — the node must self-position (the real `FavoriteButton` does, via
   * `overlay` and `styles.overlayFavorite`).
   * `layout='list'`: sits inline at the end of the head row — the node must NOT be absolutely positioned.
   */
  favorite?: ReactNode
  typeLabel?: string
  /** Top-left status/promo badges (new/price_reduced/sold/rented/archived/expired etc.). Renders in both layouts. */
  badges?: MantineListingCardBadge[]
  /** Rotated centered overlay for closed listings (sold/rented). Renders in both layouts (Task 741 R63). */
  overlay?: MantineListingCardOverlay
  /**
   * Photo count badge, bottom-right on the photo in both layouts (Task 741 R63). Omit/0 -> no counter rendered.
   */
  photoCount?: number
  /** Icon+value feature row (rooms/area/floor/etc.). Renders in both layouts. */
  features?: MantineListingCardFeature[]
  /** Original-price (pre-conversion) line, already formatted. */
  originalPriceStr?: string | null
  /** Pre-formatted "<price> <per_sqm label>" string. */
  pricePerSqmStr?: string | null
  /** Copy-id + date cluster (app) / demo equivalent (story) — carries its own state, passed as a node. */
  footerActions?: ReactNode
  /** Premium styling: solid gold 1px border + brand-tinted hover elevation. */
  isPremium?: boolean
  /** Archived/expired dimming (grayscale + reduced opacity) on the whole card. */
  isArchived?: boolean
}

/**
 * Canonical listing card pattern for public marketplace — SINGLE SOURCE OF TRUTH for the whole card (Task 605).
 *
 * Task 741 Revision 3h (owner D46-9, GR-10): ONE card for grid and list. Each part — the photo chrome (badges,
 * overlay, photo count), the head (type, title, address), the chips and the footer (price block, per-m² line, id and
 * date) — is built once per render as a local value, carries a `data-card-part` test hook, and is placed by both
 * layouts. The layouts differ only in the arrangement (photo on top in grid, a photo column on the left in list) and
 * in where the favourite control sits. `image`/`favorite`/`footerActions` are passed in as nodes because they carry app
 * behaviour (photo delivery, favourite toggle, copy-id) that this pattern must stay agnostic of.
 *
 * Every visual value is a Mantine prop on a primitive or a theme token; the CSS module holds only hover/premium/
 * archived states and a few keyword declarations Mantine has no prop for.
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
  const theme = useMantineTheme()
  const horizontal = layout === 'list'
  const open = () => onClick?.(data.id)
  // `top`/`left`/`bottom`/`right` are Mantine size props (identity resolver): a bare "xs" compiles to the invalid `top: xs`,
  // which the browser drops, and the badges fall under the photo and are clipped (Task 741 R69). Resolve the theme key first.
  const inset = resolveGalleryOffsetValue(theme, 'xs')

  // ── Parts, built once and placed by both layouts ──────────────────────────────────────────────────────────────
  const badgesPart = badges && badges.length > 0 && (
    <Group data-card-part="badges" gap="tight" wrap="wrap" pos="absolute" top={inset} left={inset}>
      {badges.map(b => (
        <Badge key={b.label} variant="filled" color={b.color}>
          {b.label}
        </Badge>
      ))}
    </Group>
  )

  const overlayPart = overlay && (
    <Overlay data-card-part="overlay" color="var(--overlay)" backgroundOpacity={0.3} zIndex="auto" center>
      <Box
        component="span"
        fz="sm"
        lh="sm"
        fw={700}
        px="sm"
        py="compact"
        bdrs="2xl"
        c="var(--overlay-foreground)"
        bd={`${theme.other.borderWidth.statusOverlay} solid ${(overlay.tone && OVERLAY_TONE_BORDER[overlay.tone]) ?? 'currentColor'}`}
        className={cn(styles.overlayLabel, overlay.tone === 'sold' && styles.overlaySold, overlay.tone === 'rented' && styles.overlayRented, overlay.className)}
      >
        {overlay.label}
      </Box>
    </Overlay>
  )

  const photoCountPart = !!photoCount && photoCount > 0 && (
    <Badge
      data-card-part="photo-count"
      variant="filled"
      color="gray.9"
      pos="absolute"
      bottom={inset}
      right={inset}
      leftSection={<Camera size={theme.other.iconSize.badge} />}
    >
      {photoCount}
    </Badge>
  )

  const headPart = (
    <Stack data-card-part="head" gap="tight" miw={0}>
      {typeLabel && (
        <Text size="xs" c="dimmed">
          {typeLabel}
        </Text>
      )}
      <Text component="h3" fw={600} size="sm" lineClamp={2} className={styles.cardTitle}>
        {data.title}
      </Text>
      {data.location && (
        <Group gap="tight" wrap="nowrap" c="dimmed">
          <MapPin size={theme.other.iconSize.badge} className={styles.icon} />
          <Text size="xs" c="dimmed" truncate className={styles.locationText}>
            {data.location}
          </Text>
        </Group>
      )}
    </Stack>
  )

  const chipsPart = features && features.length > 0 && (
    <Stack data-card-part="chips" gap="xs">
      <Divider color="gray.2" />
      <Group gap="sm" wrap="wrap" fz="xs" c="dimmed">
        {features.map((f, i) => (
          <Group key={i} component="span" gap="tight" wrap="nowrap">
            {f.icon}
            {f.value}
          </Group>
        ))}
      </Group>
    </Stack>
  )

  const footerPart = (
    <Stack data-card-part="footer" gap="tight">
      <Group gap="compact" align="baseline" wrap="wrap">
        <Text component="span" fw={700} size="md" c="brand" className={styles.nowrap}>
          {data.price}
        </Text>
        {data.priceOld && (
          <Text component="span" size="xs" c="dimmed" td="line-through" className={styles.nowrap}>
            {data.priceOld}
          </Text>
        )}
      </Group>
      {(originalPriceStr || pricePerSqmStr) && (
        <Group justify={originalPriceStr ? 'space-between' : 'flex-end'} gap="xs" wrap="wrap">
          {originalPriceStr && (
            <Text component="span" size="xs" c="dimmed">
              {originalPriceStr}
            </Text>
          )}
          {pricePerSqmStr && (
            <Text component="span" size="xs" c="dimmed" className={styles.nowrap}>
              {pricePerSqmStr}
            </Text>
          )}
        </Group>
      )}
      {footerActions}
    </Stack>
  )

  const cardClass = cn(
    styles.card,
    horizontal ? styles.horizontal : styles.vertical,
    onClick && styles.clickable,
    isPremium && styles.premium,
    isArchived && styles.archived,
  )

  // The overlay scrim is placed before the badges and the photo count so that they paint above it (a later sibling paints
  // over an earlier one), in both layouts.

  // ── layout='list': a photo column on the left, the info column on the right. The favourite sits inline at the end
  // of the head row (unchanged from before this revision).
  if (horizontal) {
    const thumb = theme.other.layout.listingCardListThumb
    return (
      <Card padding={0} radius="md" withBorder className={cardClass}>
        <Card.Section
          pos="relative"
          bg="gray.1"
          mih="var(--homepage-runtime-space-20)"
          w={{ base: rem(thumb.base), sm: rem(thumb.sm) }}
          flex="0 0 auto"
          className={styles.imageSection}
          onClick={open}
        >
          {/* `{image}` stays the section's first child: the archived fade (`.archived .imageSection > :first-child`) depends on it */}
          {image}
          {overlayPart}
          {badgesPart}
          {photoCountPart}
        </Card.Section>

        <Stack gap="tight" py="sm" pr="sm" className={styles.infoColumn} onClick={open}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" gap="tight">
            <Box flex={1} miw={0}>
              {headPart}
            </Box>
            {favorite}
          </Group>
          {chipsPart}
          {footerPart}
        </Stack>
      </Card>
    )
  }

  // ── layout='grid': the photo on top (the favourite floats on it), the info below, the optional contact button last.
  return (
    <Card padding={0} radius="md" withBorder className={cardClass}>
      <Card.Section pos="relative" bg="gray.1" className={styles.imageSection} onClick={open}>
        {/* `{image}` stays the section's first child: the archived fade (`.archived .imageSection > :first-child`) depends on it */}
        {image}
        {overlayPart}
        {badgesPart}
        {photoCountPart}
        {favorite}
      </Card.Section>

      <Stack gap="tight" p="sm" onClick={open}>
        {headPart}
        {chipsPart}
        {footerPart}
      </Stack>

      {onContact && (
        <Card.Section withBorder p="sm">
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
