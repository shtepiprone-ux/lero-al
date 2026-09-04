'use client'

import type { ReactNode } from 'react'
import { Card, Text, Group, Stack, Button, Badge, Box, Center } from '@mantine/core'
import { Camera, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import styles from './MantineListingCardPattern.module.css'

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
   * Arbitrary consumer-supplied class, merged onto the overlay label element via `cn()`
   * (Task 741 — the pattern itself carries no status-color styling; the consumer owns the
   * visual treatment entirely, e.g. `ListingCard.tsx`'s sold/rented closed-listing colors).
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
   * must NOT be absolutely positioned. The contract is still live (Task 756 — corrected this
   * comment, which cited a Tailwind string no longer used verbatim): the real consumer,
   * `ListingCard.tsx`'s `inlineFavorite`, now applies `styles.inlineFavorite`
   * (`ListingCard.module.css`), a CSS Module class that reproduces the identical
   * `flex-shrink:0` / `margin-top:-2px` / `margin-right:-4px` declarations under a different
   * name, not the literal `"shrink-0 -mt-0.5 -mr-1"` string.
   */
  favorite?: ReactNode
  /**
   * Task 764 Revision 1 — a second, independent image-section overlay slot for a behaviour-
   * bearing action that must stay inside the Card's own hover chain (F3: `FavoritesShell.tsx`'s
   * `SaveToCollectionButton` used to render as a `.group` sibling of `<ListingCard>`, outside
   * `.cardGrid`, so hovering it never triggered the card's hover zoom). `layout='grid'` only —
   * the list layout has no consumer for this slot (Q2, kickoff §5) and is byte-identical.
   * Positioned at the same `top`/`left` offsets as `.badgesGrid` (§3.4) and painted above it
   * (rendered after `{badges}` below); revealed on `.cardGrid:hover`/`:focus-within`, never via
   * a Tailwind `group`/`group-hover:` mechanism (owner-forbidden, §1).
   */
  imageActions?: ReactNode
  typeLabel?: string
  /** Top-left status/promo badges (new/price_reduced/sold/rented/archived/expired etc.). Renders in both layouts. */
  badges?: MantineListingCardBadge[]
  /** Rotated centered overlay for closed listings (sold/rented). `layout='grid'` only — the ported legacy `layout='list'` design never had this (the badge already conveys sold/rented). */
  overlay?: MantineListingCardOverlay
  /**
   * Photo count pill. Renders in both layouts (Task 656): `layout='grid'` → bottom-right
   * (unchanged); `layout='list'` → bottom-left (owner-specified position, distinct from
   * grid's bottom-right so it doesn't collide with the list row's own right-aligned footer
   * meta). Omit/0 -> no counter rendered.
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
 * Canonical listing card pattern for public marketplace — SINGLE SOURCE OF TRUTH for the
 * whole card (Task 605). Owns layout + all pure-visual chrome (badges, sold/rented overlay,
 * photo counter, type/title/location, features row, price(+old), footer layout, premium/
 * archived states, hover). `image`/`favorite`/`footerActions` are passed in as positioned
 * nodes because they carry app behavior/state (real photo delivery, favorite toggle,
 * copy-id) that this pattern must stay agnostic of (presentational-split gate).
 *
 * Matches the product listing card surface (src/modules/listings/components/ListingCard.tsx
 * — the vertical branch is a thin data-mapper over this pattern).
 *
 * Task 658 note (internal chrome de-Tailwind): every raw `<div>/<span>/<p>` structural element
 * below is now a Mantine primitive (`Box`/`Group`/`Stack`/`Center`/`Text`). Mantine's own
 * component CSS (`@mantine/core/styles.css`) is imported UNLAYERED in this project
 * (`src/app/layout.tsx`) and always wins over a Tailwind `@layer utilities` class for any
 * property Mantine's own stylesheet declares on that exact component (the cascade-layer trap
 * already documented for `Card`/`Badge`/`ActionIcon` in Task 602/606/612/616/617) — so:
 *   - `Group`/`Stack` always receive explicit `gap`/`wrap`/`justify`/`align` props (their own
 *     CSS sets unconditional unlayered fallbacks for all four — a kept Tailwind class for any
 *     of them would be silently defeated).
 *   - `Text` always receives an explicit `size`/`fw` (or the `inherit` prop) whenever the
 *     desired value isn't its own default (font-size/line-height/font-weight have unlayered
 *     fallbacks; only `color` safely falls through to the inherited value when no `c` is set).
 *   - Elements needing a token-less carve-out class (`text-2xs`, opacity tints, overlay/photo-
 *     counter tints, `group-hover:`) use `Box` (no component-level CSS of its own — a className
 *     on `Box` behaves exactly as it did on the raw element), never `Text`, to avoid the same trap.
 */
export function MantineListingCardPattern({
  data,
  contactLabel,
  onContact,
  onClick,
  layout = 'grid',
  image,
  favorite,
  imageActions,
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
  // Tailwind `hover:shadow-md`. `overlay` is intentionally NOT rendered here — the ported legacy
  // design never had it (the `badges` array already carries the sold/rented status);
  // `onContact` CTA is likewise not rendered (legacy horizontal never had one). `photoCount`
  // IS rendered (Task 656 — bottom-left, see below).
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
          isArchived && styles.archived,
        )}
        style={{ cursor: onClick ? 'pointer' : undefined }}
      >
        <Box
          className={cn(styles.imageSection, styles.listImage)}
          onClick={() => onClick?.(data.id)}
        >
          {image}

          {badges && badges.length > 0 && (
            <Box className={styles.badgesList}>
              {badges.map(b => (
                <Badge key={b.label} variant="filled" color={b.color}>
                  {b.label}
                </Badge>
              ))}
            </Box>
          )}

          {!!photoCount && photoCount > 0 && (
            <Group gap="tight" className={styles.photoCountList}>
              <Camera className={styles.cardIcon} />
              {photoCount}
            </Group>
          )}
        </Box>

        <Stack justify="space-between" gap={0} py="sm" pr="sm" className={styles.infoColumn} onClick={() => onClick?.(data.id)}>
          <Box>
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="tight" mb="tight">
              {typeLabel && (
                <Text size="xs" c="var(--muted-foreground)">
                  {typeLabel}
                </Text>
              )}
              {favorite}
            </Group>
            <Text component="h3" fw={600} size="sm" lineClamp={2} className={styles.cardTitle}>
              {data.title}
            </Text>
          </Box>
          <Box>
            <Box className={styles.priceWrapper}>
              <Group justify="space-between" align="baseline" wrap="wrap" gap="var(--mantine-spacing-micro) var(--mantine-spacing-sm)">
                <Group align="baseline" wrap="wrap" gap="xs">
                  <Text component="span" size="md" fw={700} c="brand" style={{ whiteSpace: 'nowrap' }}>
                    {data.price}
                  </Text>
                  {data.priceOld && (
                    <Text component="span" size="xs" c="var(--muted-foreground)" td="line-through" style={{ whiteSpace: 'nowrap' }}>
                      {data.priceOld}
                    </Text>
                  )}
                </Group>
                {pricePerSqmStr && (
                  <Text component="span" size="xs" c="var(--muted-foreground)" style={{ whiteSpace: 'nowrap' }}>
                    {pricePerSqmStr}
                  </Text>
                )}
              </Group>
              {originalPriceStr && (
                <Box component="span" className={styles.originalPriceList}>
                  {originalPriceStr}
                </Box>
              )}
            </Box>
            {features && features.length > 0 && (
              <Group gap="var(--mantine-spacing-tight) var(--mantine-spacing-sm)" wrap="wrap" mt="compact" className={styles.metaRow}>
                {features.map((f, i) => (
                  <Group key={i} component="span" gap="tight" wrap="nowrap">
                    {f.icon}
                    {f.value}
                  </Group>
                ))}
              </Group>
            )}
            {/*
              Location + footer actions (copy-id, date) share ONE wrapping row (Task 656 fix
              — owner-caught regression). Each is an independent flex item — never a single
              non-wrapping `shrink-0` cluster — so when all of them don't fit on one line, they
              shed to the next line starting from the LAST one (date first, then copy-id): the
              browser's native flex-wrap placement order, no custom measurement needed. All
              three flow left, same as every other text element in this card (title, price,
              features) — no forced right-alignment: an earlier draft pushed copy-id right via
              `ml-auto` so it stayed clustered with date when both fit next to location, but that
              same margin also yanked a LONE wrapped copy-id to the row's right edge once it had
              shed onto its own line, which read as a stray hardcoded position (owner-caught).
              Previously `location` used `truncate` inside a NON-wrapping row next to a
              `shrink-0` sibling: per spec, `overflow:hidden` makes a flex item's automatic
              min-width resolve to 0, so `location` silently collapsed to `width:0` (invisible)
              instead of truncating or wrapping, whenever the row was too narrow for both
              (verified via rendered computed-style inspection: `location` span computed
              `width: 0px` at 320px while the footer cluster alone needed more width than the
              row had). `shrink-0` + `max-w-full` on the location item now caps it against the
              row's own full width without letting sibling competition crush it to zero.
              Task 658: this row is now a Mantine `Group` — its `gap`/`wrap` are explicit props
              (Group's own CSS sets unlayered fallbacks for both; a bare `gap-x-2 gap-y-1`
              className would be silently defeated) reproducing the same asymmetric 4px/8px
              row/column gap via the CSS `gap` shorthand's two-value form.
            */}
            <Group wrap="wrap" gap="var(--mantine-spacing-tight) var(--mantine-spacing-xs)" mt="tight" className={styles.metaRow}>
              {data.location && (
                <Group component="span" gap="tight" wrap="nowrap" className={styles.locationRow}>
                  <MapPin className={styles.locationIcon} />
                  <Text component="span" inherit truncate className={styles.locationText}>
                    {data.location}
                  </Text>
                </Group>
              )}
              {footerActions}
            </Group>
          </Box>
        </Stack>
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
        styles.cardGrid,
        isPremium && styles.premium,
        isArchived && styles.archived,
      )}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <Card.Section className={styles.imageSection} style={{ position: 'relative', overflow: 'hidden' }} onClick={() => onClick?.(data.id)}>
        {image}

        {badges && badges.length > 0 && (
          <Box className={styles.badgesGrid}>
            {badges.map(b => (
              <Badge key={b.label} variant="filled" color={b.color}>
                {b.label}
              </Badge>
            ))}
          </Box>
        )}

        {imageActions && (
          <Box className={styles.imageActions}>
            {imageActions}
          </Box>
        )}

        {overlay && (
          <Center pos="absolute" inset={0} className={styles.overlayCenter}>
            <Box component="span" className={cn(styles.overlayLabel, overlay.className)}>
              {overlay.label}
            </Box>
          </Center>
        )}

        {!!photoCount && photoCount > 0 && (
          <Group gap="tight" className={styles.photoCountGrid}>
            <Camera className={styles.cardIcon} />
            {photoCount}
          </Group>
        )}

        {favorite}
      </Card.Section>

      <Stack gap="tight" p="sm" onClick={() => onClick?.(data.id)}>
        {typeLabel && (
          <Text size="xs" c="dimmed">
            {typeLabel}
          </Text>
        )}
        <Text component="h3" fw={600} size="sm" lineClamp={2} className={styles.cardTitle}>
          {data.title}
        </Text>
        <Group gap="tight" wrap="nowrap">
          <MapPin className={styles.locationIconGrid} />
          <Text size="xs" c="dimmed" truncate className={styles.locationText}>
            {data.location}
          </Text>
        </Group>
        {features && features.length > 0 && (
          <Group gap="sm" wrap="wrap" className={styles.metaRowBordered}>
            {features.map((f, i) => (
              <Group key={i} component="span" gap="tight" wrap="nowrap">
                {f.icon}
                {f.value}
              </Group>
            ))}
          </Group>
        )}
        {data.priceOld ? (
          <Group gap="compact" align="baseline" mt="tight" wrap="wrap">
            <Text fw={700} size="md" c="brand">
              {data.price}
            </Text>
            <Text size="xs" c="dimmed" td="line-through">
              {data.priceOld}
            </Text>
          </Group>
        ) : (
          <Text fw={700} size="md" c="brand" mt="tight">
            {data.price}
          </Text>
        )}
        {(originalPriceStr || pricePerSqmStr) && (
          <Group justify="space-between" gap="xs" className={styles.priceMetaRow}>
            <Box component="span">{originalPriceStr}</Box>
            {pricePerSqmStr && (
              <Box component="span" className={styles.priceMetaAuto}>{pricePerSqmStr}</Box>
            )}
          </Group>
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
