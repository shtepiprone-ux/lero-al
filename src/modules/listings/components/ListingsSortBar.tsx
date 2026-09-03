'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react'
import { ActionIcon, Box, Group, Stack, Text, useMantineTheme } from '@mantine/core'
import { MantineCombobox, MantineCountButton } from '@/design-system/mantine/patterns'

interface Props {
  total: number
  page: number
  perPage: number
  view: 'grid' | 'list'
  onViewChange: (v: 'grid' | 'list') => void
  onFiltersOpen: () => void
  activeFiltersCount: number
}

const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'sort_newest' },
  { value: 'price_asc', labelKey: 'sort_price_asc' },
  { value: 'price_desc', labelKey: 'sort_price_desc' },
  { value: 'area_desc', labelKey: 'sort_area_desc' },
  { value: 'area_asc', labelKey: 'sort_area_asc' },
] as const

export function ListingsSortBar({ total, page, perPage, view, onViewChange, onFiltersOpen, activeFiltersCount }: Props) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const theme = useMantineTheme()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const sort = searchParams.get('sort') ?? 'newest'
  const from = Math.min((page - 1) * perPage + 1, total)
  const to = Math.min(page * perPage, total)

  function setSort(value: string | null) {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    // Root stays a single Group with exactly two direct-child elements (left Stack, right
    // Group) — the same two-direct-children shape the legacy `<div><div/><div/></div>` root had.
    // task772-listings-overflow-probe.mjs's structural `.listings-sort-bar > div:nth-of-type(1)`/
    // `(2)` locators (kickoff §3.5) depend on this shape surviving the migration.
    // `wrap="wrap"` (owner instruction, 2026-09-03): when the count text and the right-side
    // controls (filters/sort/toggle) cannot both fit on one line, the controls — which must stay
    // together and usable, not shrink below functional size — move to their own line below,
    // instead of forcing a single nowrap row that crushes the count text to zero width (Task
    // 781R, found via live measurement: the count Text's rendered width was measured at 0px with
    // `overflow:visible` spilling unclipped text under the sibling controls).
    <Group
      justify="space-between"
      align="center"
      wrap="wrap"
      gap="sm"
      py="sm"
      className="listings-sort-bar"
      style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
    >
      {/* Left: count + range. `miw={0}` lets this flex item shrink below its content size (a
          flex item's automatic min-width is otherwise its own content width, which is what
          silently forced this text to 0 rendered width with `overflow:visible` spilling
          unclipped text instead of truncating — Task 781R, found via live measurement).
          `truncate="end"` (Mantine's own Text prop, not a Tailwind/CSS-module addition) makes
          that shrink degrade to a real ellipsis instead. */}
      <Stack gap={2} miw={0}>
        <Text fw={600} size="sm" c="gray.9" truncate="end" data-testid="listings-count-text">
          {total === 1 ? t('found_results_one') : t('found_results', { count: total })}
        </Text>
        {total > 0 && (
          <Text size="xs" c="gray.5" visibleFrom="sm" truncate="end">
            · {t('showing_results', { from, to, total })}
          </Text>
        )}
      </Stack>

      {/* Right: filters btn (mobile) + sort + view toggle, back in a single `Group` with
          `wrap="wrap"` (Task 781R, owner correction, 2026-09-03: a `Stack` always stacked below
          `sm` even when there was room to share a row — e.g. 376-639px, where the filters button
          and combobox comfortably fit side by side; owner: "on screens >375px the filters button
          and combobox can already share one row"). `w={{ base: '100%', sm: 'auto' }}` still binds
          this row to the available width (a Group with no explicit width only hugs its children's
          content size, leaving flex-grow nothing to expand into — verified live this session), so
          real CSS flex-wrap now makes the content-driven call: share the row when both controls'
          natural sizes actually fit, wrap the combobox to its own full-width line only when they
          don't — not a guessed pixel breakpoint. */}
      <Group align="center" wrap="wrap" gap="xs" flex="0 0 auto" w={{ base: '100%', sm: 'auto' }}>
        {/* Mobile filters button — Task 782/F13 (owner triage D69-13, 2026-09-03): uses the
            canonical `MantineCountButton` pattern (`src/design-system/mantine/patterns`),
            already the project's shared Button+count primitive (same composition as
            `HeroSearchView.tsx`'s `advanced_filters` trigger and `FiltersPanel.tsx`'s apply
            button). It renders the count as a plain, content-sized Mantine `Badge` inline in the
            Button's `rightSection` — never `circle` (whose native `[data-circle]` CSS pins
            `width: var(--badge-height)`, cramping a two-digit count) and never an
            absolutely-positioned `Indicator` overlay (the pre-781R pattern, and the exact
            mechanism of that reported defect: an overlay escapes the button's own box and can
            collide with neighboring controls at narrow widths).
            `hiddenFrom="sm"` (not "md"): `ListingsShellView` now shows the full
            `ListingsFilterBar` from 640px up (owner decision, Task 781R, 2026-09-03 — filters
            must be visible inline the same as desktop from 640px, not gated behind this compact
            drawer trigger until 768px), so this trigger's entire domain is now <640px. It shows
            its label text (owner correction, 2026-09-03) matching every other filter trigger in
            the app (`ListingsFilterBar`'s own `advanced_filters` button). `flex="1 1 auto"` +
            `miw={0}` (owner correction, 2026-09-03: this button must adapt the same way the
            combobox does, not sit at a fixed content width while only the combobox grows) — both
            controls share a row's surplus space evenly via Mantine's own `flex` style prop; when
            even a fully-shrunk pair can't both stay readable, the parent Group's `wrap="wrap"`
            still drops the combobox to its own line rather than clipping either control. */}
        <MantineCountButton
          variant="default"
          hiddenFrom="sm"
          flex="1 1 auto"
          miw={0}
          leftSection={<SlidersHorizontal size={theme.other.iconSize.standard} />}
          count={activeFiltersCount}
          onClick={onFiltersOpen}
          data-testid="listings-mobile-filters-trigger"
        >
          {t('filters_title')}
        </MantineCountButton>

        <Group align="center" wrap="nowrap" gap="xs" flex="1 1 auto" miw={0}>
          {/* Sort combobox. No fixed pixel `triggerWidth` (a measured-but-still-fixed 280 was
              rejected by the owner as hardcode, Task 781R 2026-09-03, and separately confirmed to
              overflow 320px once positioned after the mobile filters button).
              A genuine HTML constraint rules out pure content-based auto-sizing here: a plain
              `<input>` (what `MantineCombobox`'s `variant="button"` trigger renders under the
              hood) never auto-sizes to its own VALUE text — its intrinsic/`width:auto` size is a
              fixed UA default independent of content, confirmed empirically this session by
              forcing the longest sq/it option (`.artifacts/worstcase-audit.mjs`): the rendered
              trigger stayed a fixed ~212px regardless of a 25-44 character label, silently
              clipping the sq/it text. The canonical, non-hardcoded resolution instead makes the
              wrapper a genuine flex-grow item via Mantine's own `flex` style prop (`flex="1 1
              auto"` — fill whatever room the row actually has, shrink below that if squeezed) and
              `miw={0}`, not a raw `style` object — so the trigger claims whatever width the row
              genuinely has left (its own full line when wrapped alone, a shared portion when it
              isn't) rather than a rigid fixed number.
              `MantineCombobox` also renders its `variant="button"` input with
              `text-overflow: ellipsis` (primitive fix, this session) as the safety net for the
              rare case even that isn't enough. */}
          <Box data-testid="listings-sort-trigger" flex="1 1 auto" miw={0}>
            <MantineCombobox
              options={SORT_OPTIONS.map(o => ({ value: o.value, label: t(o.labelKey) }))}
              value={sort}
              onChange={v => { if (v) setSort(v) }}
              variant="button"
              triggerWidth="100%"
              noResultsLabel={tc('no_results')}
            />
          </Box>

          {/* Grid / List toggle */}
          <Group
            gap={0}
            p="xs"
            visibleFrom="sm"
            bg="gray.1"
            bdrs="lg"
            data-testid="listings-view-toggle"
          >
            <ActionIcon
              variant={view === 'grid' ? 'filled' : 'subtle'}
              color={view === 'grid' ? 'brand' : 'gray'}
              size="md"
              onClick={() => onViewChange('grid')}
              aria-label={t('view_grid')}
            >
              <LayoutGrid size={theme.other.iconSize.standard} />
            </ActionIcon>
            <ActionIcon
              variant={view === 'list' ? 'filled' : 'subtle'}
              color={view === 'list' ? 'brand' : 'gray'}
              size="md"
              onClick={() => onViewChange('list')}
              aria-label={t('view_list')}
            >
              <List size={theme.other.iconSize.standard} />
            </ActionIcon>
          </Group>
        </Group>
      </Group>
    </Group>
  )
}
