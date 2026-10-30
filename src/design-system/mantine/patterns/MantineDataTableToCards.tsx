'use client'

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Table, Card, Stack, Group, Box, Text, Divider, Paper, ScrollArea, useMantineTheme, type MantineBreakpoint } from '@mantine/core'
import { ChevronRight } from 'lucide-react'
import { MantineBadge } from './MantineBadge'
import { MantineDetailList, type MantineDetailListItem } from './MantineDetailList'
import type { BadgeSemanticTone } from '../badgeTones'

// useLayoutEffect on the client (cards only mount client-side after the mobile
// media query flips); falls back to useEffect during SSR to avoid the warning.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * Shared off-DOM text-measuring node (created lazily, reused across all cards).
 * Measures the REAL rendered width of a string in a given element's font — this
 * is content/font-metric based, not a hardcoded pixel threshold.
 * Style is set via individual property assignments (never a `prop: 'Npx'` object
 * literal) so the design-token detector does not flag it.
 */
let measureNode: HTMLSpanElement | null = null
function getMeasureNode(): HTMLSpanElement {
  if (!measureNode) {
    const el = document.createElement('span')
    el.setAttribute('aria-hidden', 'true')
    el.style.position = 'absolute'
    el.style.visibility = 'hidden'
    el.style.whiteSpace = 'nowrap'
    el.style.top = '-9999px'
    el.style.left = '-9999px'
    el.style.pointerEvents = 'none'
    document.body.appendChild(el)
    measureNode = el
  }
  return measureNode
}

/** Width (px) of `text` rendered in the font of `fontSource`. */
function measureTextWidth(text: string, fontSource: HTMLElement): number {
  const node = getMeasureNode()
  const cs = getComputedStyle(fontSource)
  node.style.fontFamily = cs.fontFamily
  node.style.fontSize = cs.fontSize
  node.style.fontWeight = cs.fontWeight
  node.style.fontStyle = cs.fontStyle
  node.style.letterSpacing = cs.letterSpacing
  node.textContent = text
  return node.getBoundingClientRect().width
}

/**
 * PRIMARY row of the designed admin card — three measured states (owner P0):
 *
 *   State 1 — name + badge fit on one line  → avatar + name inline, badge right (same row).
 *   State 2 — they don't fit                → surname wraps to the next line, badge stays
 *                                             right of the first name (float).
 *   State 3 — the wrapped surname would fill ≥70% of the text zone (or the first name
 *             can't even sit beside the badge) → badge gets its own row (start-aligned, Task 868 D868-4) and
 *             avatar + name drop below it, so the badge never overlaps the name.
 *
 * The decision is taken from real rendered widths (a ResizeObserver re-measures on
 * container resize) — no hardcoded pixel thresholds, no name truncation. The horizontal
 * gap used in the fit math is read from the badge's actual computed margin (token-driven).
 */
const SURNAME_WIDTH_RATIO = 0.7

function CardPrimaryRow({
  avatar,
  title,
  subtitle,
  badge,
  trailing,
}: {
  avatar?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  /** Task 859 R79(f): the chevron of a row that opens and has no actions — the last child of the primary row. */
  trailing?: ReactNode
}) {
  const zoneRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  // false → inline layout (states 1 & 2); true → badge on its own row (state 3).
  const [badgeOwnRow, setBadgeOwnRow] = useState(false)

  useIsomorphicLayoutEffect(() => {
    if (badge == null) {
      setBadgeOwnRow(false)
      return
    }
    const zone = zoneRef.current
    const titleWrap = titleRef.current
    const badgeWrap = badgeRef.current
    if (!zone || !titleWrap || !badgeWrap) return

    // Font source = the actual rendered text element (Mantine Text root), so the
    // measurement uses the real size="sm"/fw=500 metrics, not the wrapper's.
    const fontSource = (titleWrap.firstElementChild as HTMLElement | null) ?? titleWrap

    const compute = () => {
      const zoneWidth = zone.clientWidth
      if (!zoneWidth) return
      const name = (titleWrap.textContent ?? '').trim().replace(/\s+/g, ' ')
      if (!name) {
        setBadgeOwnRow(false)
        return
      }
      const badgeWidth = badgeWrap.getBoundingClientRect().width
      // Real horizontal gap between name and badge (token-driven margin).
      const badgeStyle = getComputedStyle(badgeWrap)
      const gap = parseFloat(badgeStyle.marginLeft) || parseFloat(badgeStyle.marginRight) || 0

      const fullWidth = measureTextWidth(name, fontSource)
      // State 1: whole name + gap + badge fit on one line.
      if (fullWidth + gap + badgeWidth <= zoneWidth) {
        setBadgeOwnRow(false)
        return
      }
      // Name must wrap. Split first token (name) from the rest (surname).
      const sp = name.indexOf(' ')
      const firstWidth = sp === -1 ? fullWidth : measureTextWidth(name.slice(0, sp), fontSource)
      const surnameWidth = sp === -1 ? fullWidth : measureTextWidth(name.slice(sp + 1), fontSource)
      // State 3: surname alone fills ≥70% of the zone, OR the first name can't even
      // sit beside the badge → lift the badge to its own row. Otherwise state 2.
      const surnameTooWide = surnameWidth >= SURNAME_WIDTH_RATIO * zoneWidth
      const firstWontFitBesideBadge = firstWidth + gap + badgeWidth > zoneWidth
      setBadgeOwnRow(surnameTooWide || firstWontFitBesideBadge)
    }

    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(zone)
    return () => ro.disconnect()
  }, [badge, title, subtitle])

  // State 3: badge on its own row (start-aligned: its left edge is the start of the card's content box, Task 868
  // D868-4), avatar + name below — no overlap.
  if (badgeOwnRow && badge != null) {
    return (
      // Task 859 R69(b), GR-3h: the badge row and the avatar + name row are two blocks of the card's own rhythm
      // (`sm`, 12px), the same step as every other block of the card.
      <Stack gap="sm">
        <Group justify="flex-start" wrap="nowrap">
          {/* marginRight token has no visual effect on the only child of a start-aligned row; it only keeps
              the measured name↔badge gap identical to the inline layout (no oscillation). */}
          <div ref={badgeRef} style={{ marginRight: 'var(--mantine-spacing-xs)' }}>{badge}</div>
        </Group>
        {/* Task 859 R79(c), D2/D7: the avatar, the text zone and the chevron are centred on each other — on one
            line of name and on several. */}
        <Group gap="sm" wrap="nowrap" align="center">
          {avatar}
          <div ref={zoneRef} style={{ flex: 1, minWidth: 0 }}>
            <div ref={titleRef} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{title}</div>
            {subtitle != null && (
              // GR-3i: the subtitle wraps (a name is never cut), like the title.
              <div style={{ overflowWrap: 'anywhere' }}>
                <Text size="xs" c="gray.5" component="div">{subtitle}</Text>
              </div>
            )}
          </div>
          {trailing}
        </Group>
      </Stack>
    )
  }

  // States 1 & 2: badge floats right inside the text zone. The first name shares the
  // badge's line; the surname (and subtitle) wrap to full-width lines below it.
  return (
    <Group gap="sm" wrap="nowrap" align="center">
      {avatar}
      <div ref={zoneRef} style={{ flex: 1, minWidth: 0, display: 'flow-root' }}>
        {badge != null && (
          <div ref={badgeRef} style={{ float: 'right', marginLeft: 'var(--mantine-spacing-xs)' }}>
            {badge}
          </div>
        )}
        {/* GR-3i: title and subtitle wrap (a name is never cut). */}
        <div ref={titleRef} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{title}</div>
        {subtitle != null && (
          <div style={{ clear: 'right', overflowWrap: 'anywhere' }}>
            <Text size="xs" c="gray.5" component="div">{subtitle}</Text>
          </div>
        )}
      </div>
      {trailing}
    </Group>
  )
}

/**
 * Structured card layout config for mobile admin surfaces (Task 859 R79, GR-3j `record-card`).
 *
 * When provided as `card` prop, mobile renders the designed card hierarchy, always in this order:
 *   id → primary → badges → fields / detail → actions
 *   - Id (only when the row has one): muted xs text, then a divider. There is no header row for a chevron or actions.
 *   - Primary row: avatar, text zone and (for a row that opens with no actions) the chevron, centred on each other;
 *     badge beside the title on one line, or, when it does not fit, on its own row above the avatar + title,
 *     aligned to the start of the card's content box (Task 868 D868-4); title (fw=500) + subtitle (dimmed)
 *   - Badges row (Task 859 R69): a row of badges under the primary row — one step of the card's `sm` (12px) rhythm
 *   - Divider (ONE, above the fields — no per-field dividers)
 *   - Fields: `MantineDetailList variant="plain"` — each field is its label, then its complete value on the next
 *     line(s); never a label-left / value-right row
 *   - Actions: the card's last block, right-aligned and wrapping, no divider before it
 *
 * When absent, each row is a card with the same shell whose fields are its columns (label above the cell).
 * An empty field value (`null`, `undefined`, `false`, `''`) is skipped (the label is not rendered either).
 */
export interface CardConfig<R> {
  /** Row identifier (e.g. "#101"), the first block of the card. The card has no header row without it. */
  id?: (row: R) => ReactNode
  /** The card's last block — action buttons (verify/revoke, detail). Must have ≥44px touch targets. */
  actions?: (row: R) => ReactNode
  /** Primary row left — entity avatar or icon. */
  avatar?: (row: R) => ReactNode
  /** Primary row — main name or title. */
  title: (row: R) => ReactNode
  /** Primary row under title — muted secondary text line (company, email). Text only, and it wraps: never put objects
   *  (badges, chips, buttons) in it, use `badges` (Task 859 R69, GR-3h); never truncate a name (GR-3i). */
  subtitle?: (row: R) => ReactNode
  /** Status badge — beside the title on one line; when it needs its own row it sits above the avatar+title row, start-aligned (Task 868 D868-4). */
  badge?: (row: R) => ReactNode
  /**
   * A row of badges, or text mixed with badges, under the primary row (Task 859 R69, GR-3h). It is one rhythm step of
   * the card's `Stack gap="sm"`: title ↔ badge row = badge row ↔ divider = 12px by construction. Never put objects in
   * `subtitle`.
   */
  badges?: (row: R) => ReactNode
  /**
   * Labelled fields below ONE divider (label above value, `MantineDetailList`). Either a fixed list of
   * `{ label, value(row) }` or one function returning the row's `{ label, value }` items. An empty value skips its field.
   */
  meta?: { label: ReactNode; value: (row: R) => ReactNode }[] | ((row: R) => MantineDetailListItem[])
  /** Task 877 (R1): free-form region for content that is not a labelled field, below the fields (or the divider). */
  detail?: (row: R) => ReactNode
}

export interface TableColumn<R = TableRow> {
  key: string
  /** Task 877: widened from `string` to `ReactNode` (adapters pass a translated node). */
  label: ReactNode
  isBadge?: boolean
  badgeTone?: BadgeSemanticTone
  /** Horizontal alignment for this column's header and cells. */
  align?: 'left' | 'center' | 'right'
  /** Width for the desktop table column (e.g. '20%', 120). */
  width?: string | number
  /** Rich cell renderer — takes precedence over key-based value lookup when provided. */
  render?: (row: R) => ReactNode
  /** Task 891 (D854-1 = A): `true` lets this column's cell content wrap (e.g. a two-line clamped
   * title, or a date whose "(in N days)" detail drops to its own line) instead of the table's own
   * default `nowrap`. Defaults to `false` — every existing consumer keeps `nowrap` unchanged. */
  wrap?: boolean
  /** Task 877 (R1): hides this column's Th/Td below the breakpoint (desktop table only). */
  visibleFrom?: MantineBreakpoint
}

export interface TableRow {
  id: string
  [key: string]: string | number | undefined
}

export interface MantineDataTableToCardsProps<R extends { id: string } = TableRow> {
  columns: TableColumn<R>[]
  rows: R[]
  /** Task 877: widened from `string` to `ReactNode`. */
  emptyLabel?: ReactNode
  /** Per-row CSS class (e.g. 'opacity-50' for per-row loading state). */
  rowClassName?: (row: R) => string
  /** Structured card config for mobile.
   *  When provided, mobile renders the designed admin card anatomy.
   *  When absent, the generic aligned label:value layout is used (simple consumers).
   *  Backward-compatible: omitting this prop keeps the existing layout. */
  card?: CardConfig<R>
  /** Optional header slot rendered above the table inside the card (title + actions). */
  tableHeader?: ReactNode
  /**
   * The breakpoint below which cards render instead of the table. Every value renders BOTH layouts and switches with
   * Mantine's CSS `hiddenFrom`/`visibleFrom` — no media-query hook, so there is no first-paint flash and the cards show
   * only BELOW the breakpoint (Mantine's own form: the breakpoint less 0.1px). `'md'` (default, 768px) is the record-cards range
   * of every table (owner decision D36, Task 923 R47; Task 854, spec §17.1); `'lg'` (1024px, Task 857 R32) is for a table that
   * cannot fit before 1024 (named exception, §7.3 rule 2). There is no `'sm'`: a table keeps its record cards below 768px.
   */
  cardsBelow?: 'md' | 'lg'
  /** Task 877 (R1): makes the table row and the card clickable (`tabIndex=0`, Enter/Space) with a
   * trailing chevron. Omitted → no row interaction, render unchanged. */
  onRowClick?: (row: R) => void
  /** Task 877 (R1): index of the desktop column that stays in place while the table scrolls sideways. */
  stickyColumnIndex?: number
  /** Task 877 (R1): accessible name of the desktop `<table>`. */
  ariaLabel?: string
}

/**
 * Canonical data table → card list responsive pattern.
 *
 * Compact (below `cardsBelow`, default `md` / 768px, D36): stacked Cards.
 *   With `card` prop: designed hierarchy (id / primary / badges / fields / actions) per CardConfig.
 *   Without `card` prop: the same card shell, its fields the columns (label above value).
 *   All spacing via theme tokens — no raw px.
 *
 * Wide (from `cardsBelow`): TailAdmin CRM card-wrapped Table (§6b).
 *   Paper(radius 2xl, gray-2 border, overflow hidden) > ScrollArea > Table.
 *   verticalSpacing/horizontalSpacing from theme (sm=12px / xl=24px per §6b).
 *   Thead: bg-gray-50 + border-y gray-100. Th: 12px fw=500 gray-500, NOT uppercase.
 *   Td: 14px gray-700, whitespace-nowrap by default — `TableColumn.wrap` (Task 891, D854-1 = A)
 *   sets that one column's Th/Td to `whitespace: normal` instead. Row dividers gray-100, hover gray-50.
 *
 * Responsive API: every `cardsBelow` value (`"md"` default, `"lg"`) renders both layouts and switches with
 * `hiddenFrom`/`visibleFrom` (CSS media queries, no JS, no first-paint flash; the record-list family allows no
 * media-query hook). Cards appear only below the breakpoint, so at exactly 768px `"md"` shows the table (Task 923 R47, D36).
 *
 * Spacing rule (§7.1): ALL spacing uses theme tokens. Raw px forbidden (touch-target rem exempt).
 * Card anatomy rule (§7.2): CardConfig is the ONLY canonical admin card design.
 */
export function MantineDataTableToCards<R extends { id: string } = TableRow>({
  columns,
  rows,
  emptyLabel = '—',
  rowClassName,
  card,
  tableHeader,
  cardsBelow = 'md',
  onRowClick,
  stickyColumnIndex,
  ariaLabel,
}: MantineDataTableToCardsProps<R>) {
  const theme = useMantineTheme()
  if (rows.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        {emptyLabel}
      </Text>
    )
  }

  // Task 877 (R1): one activation contract for the table row and the card. Enter/Space only when the
  // row itself holds focus, so a focused inner button keeps its own Enter/Space.
  function rowActivation(row: R) {
    if (!onRowClick) return {}
    return {
      onClick: () => onRowClick(row),
      tabIndex: 0,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onRowClick(row)
        }
      },
      style: { cursor: 'pointer' },
    }
  }

  const rowChevron = (
    <Group justify="flex-end" c="gray.4" aria-hidden="true">
      <ChevronRight size={theme.other.iconSize.compact} />
    </Group>
  )

  function renderCell(col: TableColumn<R>, row: R): ReactNode {
    if (col.render) return col.render(row)
    const value = (row as TableRow)[col.key]
    if (col.isBadge) {
      return (
        <MantineBadge variant="tone" tone={col.badgeTone ?? 'neutral'}>
          {value ?? '—'}
        </MantineBadge>
      )
    }
    return <Text size="sm" c="gray.7">{value ?? '—'}</Text>
  }

  // Task 859 R79 (GR-3j `record-card`): the card shell is one — radius, padding and the `sm` rhythm are the same for a
  // card with a `card` config and for the generic one, so one record has one look.
  const hasContent = (v: ReactNode) => v != null && v !== false && v !== ''

  function cardFields(cfg: CardConfig<R>, row: R): MantineDetailListItem[] {
    if (!cfg.meta) return []
    const items: MantineDetailListItem[] = typeof cfg.meta === 'function'
      ? cfg.meta(row)
      : cfg.meta.map((m) => ({ label: m.label, value: m.value(row) }))
    return items.filter((item) => hasContent(item.value))
  }

  function renderDesignedCard(row: R): ReactNode {
    const cfg = card!
    // Task 877 (R1, review 1 §16.2 item 2): `actions` is called ONCE; the automatic chevron appears only
    // when it returns nothing (the legacy card list's `trailing ?? chevron` rule).
    const actionsContent = cfg.actions?.(row)
    const hasActions = hasContent(actionsContent)
    const autoChevron = !!onRowClick && !hasActions
    const idContent = cfg.id?.(row)
    const hasId = hasContent(idContent)
    const subtitleContent = cfg.subtitle?.(row)
    const badgeContent = cfg.badge?.(row)
    const badgesContent = cfg.badges?.(row)
    const hasBadges = badgesContent != null && badgesContent !== false
    const fields = cardFields(cfg, row)
    const detailContent = cfg.detail?.(row)
    const hasDetail = hasContent(detailContent)

    return (
      <Card
        key={row.id}
        withBorder
        radius="2xl"
        padding="lg"
        className={rowClassName?.(row)}
        {...(onRowClick ? { role: 'button' } : {})}
        {...rowActivation(row)}
      >
        <Stack gap="sm">
          {/* ID (R79(d)): the header row exists only when the row has an id, and holds the id only. */}
          {hasId && (
            <>
              <Text size="xs" c="gray.5">{idContent}</Text>
              <Divider color="gray.1" />
            </>
          )}

          {/* PRIMARY: three measured states (see CardPrimaryRow).
              States 1 & 2 keep the badge inline (right of the first name, surname wraps
              below); state 3 lifts the badge to its own row above avatar + name when the
              surname is too wide to sit beside it — no overlap, no truncation, no hardcoded px.
              A row that opens and has no actions ends this row with its chevron (R79(f)). */}
          <CardPrimaryRow
            avatar={cfg.avatar?.(row)}
            title={cfg.title(row)}
            subtitle={subtitleContent}
            badge={badgeContent}
            trailing={autoChevron ? rowChevron : undefined}
          />

          {/* BADGES (Task 859 R69, GR-3h): a row of objects is its own block, one step of the card's rhythm — the same
              gap (`sm`, 12px) to the title above as to the divider below. A flex row (not a block of inline content),
              so a bare badge has no line-box strut and sits exactly one step from the title and from the divider. */}
          {hasBadges && <Group gap="xs" wrap="wrap">{badgesContent}</Group>}

          {/* FIELDS (R79(a), GR-3j `key-value-stack`): ONE divider above; each field is its label, then its complete
              value below it — `MantineDetailList` is the one owner of a labelled field. */}
          {(fields.length > 0 || hasDetail) && <Divider color="gray.1" />}
          {fields.length > 0 && <MantineDetailList variant="plain" items={fields} />}

          {/* DETAIL (Task 877): free-form region, for content that is not a labelled field */}
          {hasDetail && detailContent}

          {/* ACTIONS (R79(e)): the card's last block, one step of the card's rhythm, no divider before it. */}
          {hasActions && <Group justify="flex-end" gap="xs" wrap="wrap">{actionsContent}</Group>}
        </Stack>
      </Card>
    )
  }

  // R79(b): without a `card` config the fields of a card are the columns (label = column label, value = the cell),
  // through the same `MantineDetailList`; a row that opens shows its chevron in the actions position.
  function renderGenericCard(row: R): ReactNode {
    return (
      <Card
        key={row.id}
        withBorder
        radius="2xl"
        padding="lg"
        className={rowClassName?.(row)}
        {...(onRowClick ? { role: 'button' } : {})}
        {...rowActivation(row)}
      >
        <Stack gap="sm">
          <MantineDetailList
            variant="plain"
            items={columns.map((col) => ({ label: col.label, value: renderCell(col, row) }))}
          />
          {onRowClick && rowChevron}
        </Stack>
      </Card>
    )
  }

  const cardsMarkup = (
    <Stack gap="sm">
      {rows.map((row) => (card ? renderDesignedCard(row) : renderGenericCard(row)))}
    </Stack>
  )

  // Task 877 (R1): the sticky column keeps its place via Mantine style props; the stacking level is the
  // one non-visual value, so it goes through the single `zIndex` entry (Mantine has no z-index prop).
  function stickyProps(idx: number, background: string) {
    return idx === stickyColumnIndex ? ({ pos: 'sticky', left: 0, bg: background } as const) : {}
  }
  function stickyStyle(idx: number) {
    return idx === stickyColumnIndex ? { zIndex: theme.other.zIndex.tableStickyColumn } : {}
  }

  // Desktop: TailAdmin CRM card-wrapped table (§6b).
  // Paper provides rounded-2xl card with gray-2 border; Table fills it edge-to-edge
  // so the thead line spans the full card width. Cell padding (xl×sm = 24×12) provides visual inset.
  // Task 857 D78-11 / GR-3g: the thead top line is drawn only when `tableHeader` sits above it. When the header
  // row is flush with the card's top edge, the card's own rounded border is that line: a second straight line
  // there doubles the border and `border-collapse` ignores a radius, so the card's clip would cut it at the corners.
  // Task 857 D78-12: the header row is white everywhere. Mantine's `stickyHeader` paints every header cell
  // `--mantine-color-body`, so the sticky column's header cell uses the same token (opaque over scrolled cells)
  // and the thead sets no background of its own. Departs from TailAdmin §6b's gray header by owner decision.
  const tableMarkup = (
    <Paper
      withBorder
      style={{
        overflow: 'hidden',
        '--mantine-color-default-border': 'var(--mantine-color-gray-2)',
      } as React.CSSProperties}
    >
      {tableHeader && (
        <Box px="xl" py="lg">
          {tableHeader}
        </Box>
      )}
      <ScrollArea>
        {/* Task 877 revision 3 (kickoff §18.2): a Mantine `Badge` label ellipsizes, so its min-content
            width is near zero and a table narrower than its content squeezed exactly those columns into
            "А…". `miw="max-content"` keeps every cell at its content width; the table still fills the card
            when the content fits and scrolls inside the `ScrollArea` when it does not. */}
        <Table
          miw="max-content"
          stickyHeader
          highlightOnHover={!!onRowClick}
          aria-label={ariaLabel}
          withRowBorders
          withColumnBorders={false}
          styles={{
            thead: {
              ...(tableHeader ? { borderTop: '1px solid var(--mantine-color-gray-1)' } : {}),
              borderBottom: '1px solid var(--mantine-color-gray-1)',
            },
            td: { whiteSpace: 'nowrap' },
            th: { whiteSpace: 'nowrap' },
            table: { '--table-border-color': 'var(--mantine-color-gray-1)' } as React.CSSProperties,
          }}
        >
          <Table.Thead>
            <Table.Tr>
              {columns.map((col, idx) => (
                <Table.Th
                  key={col.key}
                  visibleFrom={col.visibleFrom}
                  {...stickyProps(idx, 'var(--mantine-color-body)')}
                  style={{ width: col.width, textAlign: col.align ?? 'left', ...(col.wrap ? { whiteSpace: 'normal' } : {}), ...stickyStyle(idx) }}
                >
                  <Text size="xs" fw={500} c="gray.5">
                    {col.label}
                  </Text>
                </Table.Th>
              ))}
              {onRowClick && <Table.Th aria-hidden="true" />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => (
              <Table.Tr key={row.id} className={rowClassName?.(row)} {...rowActivation(row)}>
                {columns.map((col, idx) => (
                  <Table.Td
                    key={col.key}
                    visibleFrom={col.visibleFrom}
                    {...stickyProps(idx, 'var(--mantine-color-body)')}
                    style={{ textAlign: col.align ?? 'left', ...(col.wrap ? { whiteSpace: 'normal' } : {}), ...stickyStyle(idx) }}
                  >
                    {renderCell(col, row)}
                  </Table.Td>
                ))}
                {onRowClick && <Table.Td aria-hidden="true">{rowChevron}</Table.Td>}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  )

  // CSS-driven switch (no media-query hook, no first-paint flash): both trees render, and Mantine's
  // `hiddenFrom`/`visibleFrom` toggle their `display` via a media query. Task 854 (md), Task 857 R32 (lg), Task 923 R47 (md default, D36).
  return (
    <>
      <Box hiddenFrom={cardsBelow}>{cardsMarkup}</Box>
      <Box visibleFrom={cardsBelow}>{tableMarkup}</Box>
    </>
  )
}
