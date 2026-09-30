'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  FocusTrap,
  Group,
  Input,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { MantinePopover } from './MantinePopover'
import { MantineCombobox } from './MantineCombobox'

export interface DateRange {
  from: string | undefined
  to: string | undefined
}

export interface RangeDatePickerProps {
  value: DateRange
  /** Fired on Apply (desktop) / Confirm (mobile), NOT on each day click. */
  onChange: (next: DateRange) => void
  /** Days after this are disabled. */
  maxDate?: Date
  /** Days before this are disabled. */
  minDate?: Date
  /** Trigger placeholder when no range is set. */
  placeholder?: string
  /**
   * Task 561 (additive, default false): when true, days before *today* are disabled and
   * unreachable on both breakpoints (rental context). When false (default), past dates stay
   * fully selectable (listings-search context — a listing can predate the search). Combines with
   * `minDate`: effective min = `disablePastDates ? max(minDate ?? -∞, startOfToday) : minDate`.
   */
  disablePastDates?: boolean
  /**
   * Task 893 (additive, default `'range'` — the range behaviour is unchanged): in `'single'` a day click
   * stages exactly one day and replaces any day staged before, so a range is never built. Apply/Confirm
   * commit `{ from: day, to: day }`, the same shape a one-day range already commits.
   */
  selectionMode?: 'range' | 'single'
}

type SelectionMode = NonNullable<RangeDatePickerProps['selectionMode']>

interface StagedRange {
  from?: Date
  to?: Date
}

type TFunc = ReturnType<typeof useTranslations>

// Mobile scrolling window (Task 561): [minDate ?? anchor-12mo, maxDate ?? anchor+15mo], capped so
// the rendered DOM stays bounded regardless of how wide minDate/maxDate are apart.
const MOBILE_MAX_MONTHS = 60

function parseRangeDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined
  const d = parseISO(iso)
  return isValid(d) ? d : undefined
}

function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function capitalizeFirst(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s
}

function isDayDisabled(day: Date, minDate?: Date, maxDate?: Date): boolean {
  const d = startOfDay(day)
  if (maxDate && isAfter(d, startOfDay(maxDate))) return true
  if (minDate && isBefore(d, startOfDay(minDate))) return true
  return false
}

function buildMonthDays(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

// jsdom (RTL smoke tests) has no `Element.prototype.scrollTo` at all — guard so the mobile jump/
// initial-scroll effects never throw in tests; real browsers always have it.
function scrollViewportTo(viewport: HTMLDivElement | null, top: number): void {
  if (viewport && typeof viewport.scrollTo === 'function') {
    viewport.scrollTo({ top, behavior: 'auto' })
  }
}

/**
 * Review 6 F17: the mobile fixed header must read the section actually scrolled into view. The
 * closest-offset rule (last section whose top is at or above `scrollTop + 4`) is right everywhere
 * except the final page, where `maxDate`'s trailing section can be shorter than the viewport, so
 * the scroll clamps before that section's own top crosses the threshold and the header lags one
 * month behind (August shown while September is on screen). At the bottom of the scrollable range
 * the last section is always the one visible, regardless of its offset.
 */
export function pickVisibleMonthIdx(
  sectionTops: number[],
  scrollTop: number,
  clientHeight: number,
  scrollHeight: number,
): number {
  if (sectionTops.length === 0) return 0
  if (scrollTop + clientHeight >= scrollHeight - 1) return sectionTops.length - 1
  let idx = 0
  for (let i = 0; i < sectionTops.length; i++) {
    if (sectionTops[i] <= scrollTop + 4) idx = i
  }
  return idx
}

/**
 * Task 561, point 5: `effective min = disablePastDates ? max(minDate ?? -∞, startOfToday) : minDate`.
 * Computed ONCE at the top level (`RangeDatePicker`) and threaded down as the sole lower bound —
 * nothing downstream needs the raw `minDate` separately from this effective one.
 */
function computeEffectiveMinDate(minDate: Date | undefined, disablePastDates: boolean | undefined): Date | undefined {
  if (!disablePastDates) return minDate
  const todayStart = startOfDay(new Date())
  if (!minDate) return todayStart
  return isAfter(minDate, todayStart) ? minDate : todayStart
}

// Shared month/year dropdown bounding (Task 561 — single source for desktop's shared header AND
// the new mobile fixed header, both use §6c dropdown chrome via MantineCombobox).
function computeYearOptions(minDate?: Date, maxDate?: Date): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear()
  const minYear = minDate ? minDate.getFullYear() : currentYear - 5
  const maxYear = maxDate ? maxDate.getFullYear() : currentYear + 10
  const arr: { value: string; label: string }[] = []
  for (let y = minYear; y <= maxYear; y++) arr.push({ value: String(y), label: String(y) })
  return arr
}

function computeMonthOptions(
  year: number,
  minDate: Date | undefined,
  maxDate: Date | undefined,
  months: string[],
  fallbackMonth: number,
): { value: string; label: string }[] {
  const arr: { value: string; label: string }[] = []
  for (let m = 0; m < 12; m++) {
    const candidate = new Date(year, m, 1)
    if (minDate && isBefore(endOfMonth(candidate), startOfMonth(minDate))) continue
    if (maxDate && isAfter(startOfMonth(candidate), endOfMonth(maxDate))) continue
    arr.push({ value: String(m), label: capitalizeFirst(months[m]) })
  }
  if (arr.length === 0) {
    arr.push({ value: String(fallbackMonth), label: capitalizeFirst(months[fallbackMonth]) })
  }
  return arr
}

/**
 * Selection model (Positive flow step 3 / Negative flow "end before start"): click a day → sets
 * `from` (if none staged, or both already set → restart); the NEXT click sets `to` — swapped so
 * `from <= to` if the 2nd click lands before the 1st. Clicking the SAME day twice yields a
 * single-day range (`from === to`) — see the Apply/Confirm-enablement decision below.
 */
function pickDay(staged: StagedRange, day: Date): StagedRange {
  if (!staged.from || (staged.from && staged.to)) {
    return { from: day, to: undefined }
  }
  if (isSameDay(day, staged.from)) {
    return { from: day, to: day }
  }
  if (isBefore(day, staged.from)) {
    return { from: day, to: staged.from }
  }
  return { from: staged.from, to: day }
}

/** Task 893: the day-click reducer for both modes. `'range'` is `pickDay` untouched; `'single'` restages one day. */
function pickStaged(mode: SelectionMode, staged: StagedRange, day: Date): StagedRange {
  return mode === 'single' ? { from: day, to: undefined } : pickDay(staged, day)
}

// Task 562: calendar month/weekday names come from `messages/*.json` `common.calendar_*`, NOT
// `Intl.DateTimeFormat(locale, {month:'long'|'weekday':'short'})`. Root cause (verified directly,
// not assumed): Node's ICU has full `sq` data (`Intl.DateTimeFormat('sq',{month:'long'})` →
// "korrik"), but Chromium's bundled ICU does not (`Intl.DateTimeFormat.supportedLocalesOf(['sq'])`
// → `[]` in the browser) — `sq` silently fell back to English on the client, the only runtime that
// actually renders this popover (it opens on click, never during SSR). Rather than branch on
// per-browser ICU support, every locale's calendar strings are now static data (same
// "explicit locale in, fixed formatting out" discipline as `src/lib/formatters.ts`), byte-identical
// across every runtime by construction — verified against the previously-correct `Intl` output for
// en/it/uk so their rendering is unchanged; only `sq` output actually changes (fixed).
interface CalendarLocaleData {
  months: string[]
  monthsShort: string[]
  weekdaysShort: string[]
  monthYearSuffix: string
  summaryOrder: 'day_month' | 'month_day'
}

function useCalendarLocaleData(t: TFunc): CalendarLocaleData {
  return useMemo(
    () => ({
      months: t.raw('calendar_months') as string[],
      monthsShort: t.raw('calendar_months_short') as string[],
      weekdaysShort: t.raw('calendar_weekdays_short') as string[],
      monthYearSuffix: t.raw('calendar_month_year_suffix') as string,
      summaryOrder: t.raw('calendar_summary_order') as 'day_month' | 'month_day',
    }),
    [t],
  )
}

function formatMonthYearLabel(month: Date, cal: CalendarLocaleData): string {
  return `${capitalizeFirst(cal.months[month.getMonth()])} ${month.getFullYear()}${cal.monthYearSuffix}`
}

function formatSummaryDate(d: Date, cal: CalendarLocaleData): string {
  const day = d.getDate()
  const mon = cal.monthsShort[d.getMonth()]
  return cal.summaryOrder === 'month_day' ? `${mon} ${day}` : `${day} ${mon}`
}

// Task 891 review 5 (F13 item 7): a day's accessible name previously came from `date-fns`'
// English-only `format(day, 'd MMMM yyyy')`, so every non-`en` locale announced English month
// names. Built from the same static `common.calendar_*` data (and order) as the visible summary —
// full month name + year, never `Intl`/`date-fns` locale formatting (Task 562's own rule, above).
function dayAriaLabel(day: Date, cal: CalendarLocaleData): string {
  const dayNum = day.getDate()
  const month = cal.months[day.getMonth()]
  const year = day.getFullYear()
  return cal.summaryOrder === 'month_day' ? `${month} ${dayNum} ${year}` : `${dayNum} ${month} ${year}`
}

// ── Day cell ─────────────────────────────────────────────────────────────────
// §6t day-cell state matrix: resting pill/gray-700, hover gray-200 (CSS :hover), start/end
// brand-700 fill, inRange light brand tint spanning the row, today gray-400 border, out-of-month
// gray-400, disabled very-light/non-interactive. Review 5 (F13 item 1): every state color/border/
// cursor moved to `range-date-picker-chrome.css`, keyed on the `data-*` attributes below — this
// component only sets layout (Mantine style props, no `style=`) and which attribute applies.
function DayCell({
  day,
  inMonth,
  staged,
  disabled,
  cal,
  onSelect,
}: {
  day: Date
  inMonth: boolean
  staged: StagedRange
  disabled: boolean
  cal: CalendarLocaleData
  onSelect: (day: Date) => void
}) {
  const theme = useMantineTheme()
  const cellSize = theme.other.rangeDatePicker.dayCell
  const isStart = !!staged.from && isSameDay(day, staged.from)
  const isEnd = !!staged.to && isSameDay(day, staged.to)
  const isBoundary = isStart || isEnd
  const inRangeSpan =
    !!staged.from && !!staged.to && isWithinInterval(day, { start: staged.from, end: staged.to })
  const todayFlag = isToday(day)
  const showBand = inMonth && !disabled && inRangeSpan
  const bandShape = isStart && isEnd ? 'pill' : isStart ? 'start' : isEnd ? 'end' : 'middle'

  return (
    <Box pos="relative" w={cellSize} h={cellSize} flex="0 0 auto">
      {showBand && <Box aria-hidden className="range-day-band" data-band-shape={bandShape} pos="absolute" inset={0} />}
      <UnstyledButton
        type="button"
        className="range-day-cell"
        data-boundary={isBoundary ? 'true' : undefined}
        data-today={todayFlag && !isBoundary && inMonth ? 'true' : undefined}
        data-in-month={inMonth ? 'true' : undefined}
        data-blocked={disabled ? 'true' : undefined}
        data-date={toISO(day)}
        aria-label={dayAriaLabel(day, cal)}
        disabled={disabled || !inMonth}
        onClick={() => {
          if (inMonth && !disabled) onSelect(day)
        }}
        pos="relative"
        w="100%"
        h="100%"
        bdrs="pill"
      >
        <Center h="100%">
          <Text component="span" size="sm" fw={isBoundary ? 600 : 400}>
            {day.getDate()}
          </Text>
        </Center>
      </UnstyledButton>
    </Box>
  )
}

// ── Month grid (weekday header + 6×7 day grid) ────────────────────────────────
// Task 561 D3: every consumer (desktop's shared-header grids AND each mobile section) shows its
// own weekday header directly above its day grid.
function MonthGrid({
  month,
  staged,
  minDate,
  maxDate,
  cal,
  onSelect,
}: {
  month: Date
  staged: StagedRange
  minDate?: Date
  maxDate?: Date
  cal: CalendarLocaleData
  onSelect: (day: Date) => void
}) {
  const theme = useMantineTheme()
  const cellSize = theme.other.rangeDatePicker.dayCell
  const rowHeight = theme.other.rangeDatePicker.weekdayRowHeight
  const gridWidth = cellSize * 7
  const days = useMemo(() => buildMonthDays(month), [month])
  return (
    <Box>
      <Group gap={0} wrap="nowrap" mb="xs" w={gridWidth}>
        {cal.weekdaysShort.map((w, i) => (
          <Center key={i} w={cellSize} h={rowHeight}>
            <Text size="xs" fw={700} c="gray.5">
              {w}
            </Text>
          </Center>
        ))}
      </Group>
      <Flex wrap="wrap" w={gridWidth}>
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            inMonth={isSameMonth(day, month)}
            staged={staged}
            disabled={isDayDisabled(day, minDate, maxDate)}
            cal={cal}
            onSelect={onSelect}
          />
        ))}
      </Flex>
    </Box>
  )
}

// ── Desktop body: two-month consecutive pair + shared header + Clear/Cancel/Apply ────────────
function DesktopBody({
  staged,
  setStaged,
  anchorMonth,
  setAnchorMonth,
  minDate,
  maxDate,
  cal,
  t,
  onApply,
  onCancel,
  selectionMode,
}: {
  staged: StagedRange
  setStaged: (next: StagedRange) => void
  anchorMonth: Date
  setAnchorMonth: (next: Date) => void
  minDate?: Date
  maxDate?: Date
  cal: CalendarLocaleData
  t: TFunc
  onApply: () => void
  onCancel: () => void
  selectionMode: SelectionMode
}) {
  const theme = useMantineTheme()
  const rdp = theme.other.rangeDatePicker
  const rightMonth = addMonths(anchorMonth, 1)
  const columnWidth = rdp.dayCell * 7

  const yearOptions = useMemo(() => computeYearOptions(minDate, maxDate), [minDate, maxDate])

  // Month dropdown trivially bounded by minDate/maxDate's own month (clause 16 Negative flow).
  const monthOptions = useMemo(
    () => computeMonthOptions(anchorMonth.getFullYear(), minDate, maxDate, cal.months, anchorMonth.getMonth()),
    [anchorMonth, minDate, maxDate, cal.months],
  )

  function setLeftMonth(next: Date) {
    setAnchorMonth(startOfMonth(next))
  }

  // Prev/Next disable when shifting the pair would push it entirely out of bounds (no
  // wrap-around, no empty month) — Negative flow.
  const canPrev = !minDate || !(isSameMonth(anchorMonth, minDate) || isBefore(anchorMonth, minDate))
  const canNext = !maxDate || !(isSameMonth(rightMonth, maxDate) || isAfter(rightMonth, maxDate))

  // Task 561 D1: single-day summary collapses to one date instead of "X — X".
  const rangeSummary = staged.from
    ? staged.to && !isSameDay(staged.from, staged.to)
      ? `${format(staged.from, 'dd.MM.yyyy')} — ${format(staged.to, 'dd.MM.yyyy')}`
      : format(staged.from, 'dd.MM.yyyy')
    : ''

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <TextInput
          readOnly
          value={rangeSummary}
          placeholder={t('select_range')}
          radius="lg"
          w={theme.other.boxSize.compactTrigger}
        />
        <Group gap="md" wrap="nowrap">
          {/* Review 5 (F13 item 6): reuses the existing "Clear" string — a dashboard/filter row has
              no "filters" of its own, so `clear_filters` overstated what this link does. */}
          <Anchor
            component="button"
            type="button"
            fz="xs"
            fw={500}
            c="brand.7"
            mih={theme.other.touchTarget}
            onClick={() => setStaged({ from: undefined, to: undefined })}
          >
            {t('aria_clear')}
          </Anchor>
          <Button variant="default" onClick={onCancel}>
            {t('cancel')}
          </Button>
          {/* Task 561 D1: enabled once `from` is staged — commit() maps missing `to` to `from`. */}
          <Button color="brand" disabled={!staged.from} onClick={onApply}>
            {t('apply')}
          </Button>
        </Group>
      </Group>

      {/* Review 5 (F13 item 3): two columns, each exactly the width of its own month grid
          (7 × dayCell), separated by the grids' own `xl` gap — the header now sits directly above
          the grids it controls instead of an eyeballed `justify="space-between"` row across the
          whole width. The month/year selectors alone (150 + 100 + an `xs` gap, D891-1 sizes) are
          already wider than one grid column, so an arrow cannot also fit INSIDE that same column
          without overflowing it (measured live: the column's own width — `dayCell × 7` — is
          narrower than the two selectors' combined rendered width, leaving no room for an arrow
          on either side). Each arrow instead sits
          OUTSIDE its column, and the grid row below gets the exact same "arrow + gap" leading
          offset from a matching invisible spacer — so the CONTENT columns (selectors/label above,
          day grids below) still align exactly, and the visible arrows sit at the true outer edges
          of the whole two-month panel. */}
      <Group align="center" gap="xl" wrap="nowrap">
        <Group gap="xs" align="center" wrap="nowrap">
          <ActionIcon
            variant="default"
            aria-label={t('aria_prev')}
            disabled={!canPrev}
            onClick={() => setLeftMonth(subMonths(anchorMonth, 1))}
          >
            <ChevronLeft size={theme.other.iconSize.standard} />
          </ActionIcon>
          <Center w={columnWidth}>
            <Group gap="xs" wrap="nowrap">
              {/* Review 5 (F13 item 5): opening the panel previously auto-focused the read-only
                  summary field (the first tabbable descendant) because `MantinePopover`'s
                  `Popover` runs `trapFocus`, whose `useFocusTrap` targets the first
                  `[data-autofocus]` descendant when one exists. `FocusTrap.InitialFocus` is
                  Mantine's own canonical component for exactly this — a visually-hidden,
                  `data-autofocus`-carrying anchor — so opening lands on this header instead of
                  the decorative summary field, with no effect and no raw markup of our own. */}
              <FocusTrap.InitialFocus />
              {/* Task 774 — `dropdownMinWidth` on both selectors. The list inherits the
                  TRIGGER's width (Mantine `Combobox` defaults `width: "target"`), and the row
                  chrome eats a fixed part of it before a single glyph is drawn (dropdown padding
                  + option padding + border + `Group gap="sm"` + the selected row's `CheckIcon` +
                  a classic scrollbar). Measured in Chromium (Open Sans, the theme's `sm` font
                  size) across sq/en/uk/it — widest month label uk «Вересень»/«Березень», widest
                  year 4 digits — set to the values below for locale headroom
                  (`theme.other.rangeDatePicker`). Re-measure if a locale with longer month names
                  is added. */}
              {/* Task 773: `withinPortal={false}` on BOTH in-calendar selectors. These render
                  inside the desktop calendar's own `MantinePopover` dropdown; a portalled option
                  list is a sibling of that dropdown in Mantine's shared portal node, never a
                  descendant, so the `mousedown` that selects an option fails the popover's
                  `composedPath().includes(dropdownNode)` outside-click test and closes the whole
                  calendar before the pick lands. Rendering the list inline keeps it inside the
                  popover's DOM subtree. Owner-reported 2026-08-27. */}
              <MantineCombobox
                variant="button"
                options={monthOptions}
                value={String(anchorMonth.getMonth())}
                onChange={(v) => setLeftMonth(new Date(anchorMonth.getFullYear(), Number(v), 1))}
                noResultsLabel={t('no_results')}
                triggerAriaLabel={t('period_month')}
                triggerWidth={rdp.monthTriggerWidth}
                withinPortal={false}
                dropdownMinWidth={rdp.monthDropdownMinWidth}
              />
              <MantineCombobox
                variant="button"
                options={yearOptions}
                value={String(anchorMonth.getFullYear())}
                onChange={(v) => setLeftMonth(new Date(Number(v), anchorMonth.getMonth(), 1))}
                noResultsLabel={t('no_results')}
                triggerAriaLabel={t('period_year')}
                triggerWidth={rdp.yearTriggerWidth}
                withinPortal={false}
                dropdownMinWidth={rdp.yearDropdownMinWidth}
              />
            </Group>
          </Center>
        </Group>

        <Group gap="xs" align="center" wrap="nowrap">
          <Center w={columnWidth}>
            <Text c="gray.5" fw={600} size="sm" truncate="end">
              {formatMonthYearLabel(rightMonth, cal)}
            </Text>
          </Center>
          <ActionIcon
            variant="default"
            aria-label={t('aria_next')}
            disabled={!canNext}
            onClick={() => setLeftMonth(addMonths(anchorMonth, 1))}
          >
            <ChevronRight size={theme.other.iconSize.standard} />
          </ActionIcon>
        </Group>
      </Group>

      <Group align="flex-start" gap="xl" wrap="wrap">
        <Group gap="xs" wrap="nowrap">
          {/* Invisible spacer — same control/size as the real Prev arrow above, so this grid's
              own leading offset matches the header's, keeping the two rows aligned. */}
          <ActionIcon variant="default" disabled aria-hidden="true" tabIndex={-1} opacity={0}>
            <ChevronLeft size={theme.other.iconSize.standard} />
          </ActionIcon>
          <MonthGrid
            month={anchorMonth}
            staged={staged}
            minDate={minDate}
            maxDate={maxDate}
            cal={cal}
            onSelect={(d) => setStaged(pickStaged(selectionMode, staged, d))}
          />
        </Group>
        <Group gap="xs" wrap="nowrap">
          <MonthGrid
            month={rightMonth}
            staged={staged}
            minDate={minDate}
            maxDate={maxDate}
            cal={cal}
            onSelect={(d) => setStaged(pickStaged(selectionMode, staged, d))}
          />
          {/* Invisible spacer — mirrors the real Next arrow above. */}
          <ActionIcon variant="default" disabled aria-hidden="true" tabIndex={-1} opacity={0}>
            <ChevronRight size={theme.other.iconSize.standard} />
          </ActionIcon>
        </Group>
      </Group>
    </Stack>
  )
}

// ── Mobile body: Booking-style vertically-scrolling multi-month sheet ────────────────────────
// Task 561 D2/D3/D4 rework (owner rejection, 2026-07-08): a FIXED (non-scrolling) header carries
// month + year dropdowns (§6c chrome, same as desktop) instead of a redundant sticky label; each
// scrolling section renders Title → weekday row → grid (no separate pinned weekday header); the
// bottom summary+Confirm bar is a fixed sibling AFTER the scroll region, never inside it.
function MobileBody({
  staged,
  setStaged,
  anchorMonth,
  minDate,
  maxDate,
  cal,
  t,
  onConfirm,
  selectionMode,
}: {
  staged: StagedRange
  setStaged: (next: StagedRange) => void
  anchorMonth: Date
  minDate?: Date
  maxDate?: Date
  cal: CalendarLocaleData
  t: TFunc
  onConfirm: () => void
  selectionMode: SelectionMode
}) {
  const theme = useMantineTheme()
  const rdp = theme.other.rangeDatePicker

  // Window bounds (Task 561 point 5 / D2): reaches PAST months via minDate (already the
  // disablePastDates-clamped effective bound by the time it reaches here) instead of the old
  // forward-only scroll; falls back to a bounded span around the anchor when a bound is absent.
  // Task 893 R18: the window is built around a state anchor that starts at `anchorMonth` (the opening view is
  // unchanged) and moves when the header dropdowns pick a month outside the window (see `jumpTo`).
  const [windowAnchor, setWindowAnchor] = useState<Date>(anchorMonth)
  const pendingJumpRef = useRef<Date | null>(null)
  const months = useMemo(() => {
    // A moved window (re-anchored by a far jump) starts 12 months before the target, clipped to minDate, so the
    // 60-month cap cannot cut the target off.
    const moved = !isSameMonth(windowAnchor, anchorMonth)
    const windowStart = startOfMonth(subMonths(windowAnchor, 12))
    const start = minDate ? (moved && isAfter(windowStart, startOfMonth(minDate)) ? windowStart : startOfMonth(minDate)) : windowStart
    const end = maxDate ? startOfMonth(maxDate) : startOfMonth(addMonths(windowAnchor, 15))
    const arr: Date[] = []
    let cursor = start
    let guard = 0
    while (!isAfter(cursor, end) && guard < MOBILE_MAX_MONTHS) {
      arr.push(cursor)
      cursor = addMonths(cursor, 1)
      guard += 1
    }
    return arr.length ? arr : [windowAnchor]
  }, [windowAnchor, anchorMonth, minDate, maxDate])

  const initialIdx = Math.max(
    0,
    months.findIndex((m) => isSameMonth(m, anchorMonth)),
  )
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([])
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [visibleMonthIdx, setVisibleMonthIdx] = useState(initialIdx)

  // Opens scrolled to value.from's month (or maxDate's, or today) — same anchor rule as desktop's
  // right-hand month (review 5, F13 item 4) — since the window can now start up to 12 months
  // BEFORE the anchor (point 5), index 0 is no longer necessarily "today"/anchor.
  useLayoutEffect(() => {
    const el = sectionRefs.current[initialIdx]
    if (el) scrollViewportTo(viewportRef.current, el.offsetTop)
    // Mount-only: re-running on every anchor/window change would fight the user's own scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fixed-header dropdowns reflect the month currently scrolled into view (D2) — whichever
  // section's top has scrolled past the viewport top is the "currently visible" month.
  function handleScrollPositionChange(pos: { x: number; y: number }) {
    const viewport = viewportRef.current
    // Task 893 R20: only the sections of the CURRENT window; after a shrinking re-anchor the array keeps stale
    // null entries past `months.length`, which would read as offsetTop 0 and push the index past the window.
    const sectionTops = sectionRefs.current.slice(0, months.length).map((el) => el?.offsetTop ?? 0)
    const clientHeight = viewport?.clientHeight ?? 0
    // No viewport metrics yet: fall back to the closest-offset rule only (never claim "at the end").
    const scrollHeight = viewport?.scrollHeight ?? Number.POSITIVE_INFINITY
    setVisibleMonthIdx(pickVisibleMonthIdx(sectionTops, pos.y, clientHeight, scrollHeight))
  }

  function jumpTo(target: Date) {
    const idx = months.findIndex((m) => isSameMonth(m, target))
    if (idx === -1) {
      // Out of the window (a year/month the dropdowns offer): re-anchor the window on it; the layout effect
      // below scrolls to it once the new window has rendered. Never a silent no-op (Task 893 R18).
      pendingJumpRef.current = target
      setWindowAnchor(startOfMonth(target))
      return
    }
    const el = sectionRefs.current[idx]
    if (el) scrollViewportTo(viewportRef.current, el.offsetTop)
    setVisibleMonthIdx(idx)
  }

  useLayoutEffect(() => {
    const target = pendingJumpRef.current
    if (!target) return
    pendingJumpRef.current = null
    const idx = months.findIndex((m) => isSameMonth(m, target))
    if (idx === -1) return
    const el = sectionRefs.current[idx]
    if (el) scrollViewportTo(viewportRef.current, el.offsetTop)
    setVisibleMonthIdx(idx)
  }, [months])

  const visibleMonth = months[visibleMonthIdx] ?? anchorMonth
  const yearOptions = useMemo(() => computeYearOptions(minDate, maxDate), [minDate, maxDate])
  const monthOptions = useMemo(
    () => computeMonthOptions(visibleMonth.getFullYear(), minDate, maxDate, cal.months, visibleMonth.getMonth()),
    [visibleMonth, minDate, maxDate, cal.months],
  )

  function handleYearChange(v: string) {
    const year = Number(v)
    const opts = computeMonthOptions(year, minDate, maxDate, cal.months, visibleMonth.getMonth())
    const validMonths = opts.map((o) => Number(o.value))
    const month = validMonths.includes(visibleMonth.getMonth()) ? visibleMonth.getMonth() : validMonths[0]
    jumpTo(new Date(year, month, 1))
  }

  // Task 561 D1: single-day summary collapses to one date instead of "X – …".
  const rangeSummary = staged.from
    ? staged.to && !isSameDay(staged.from, staged.to)
      ? `${formatSummaryDate(staged.from, cal)} – ${formatSummaryDate(staged.to, cal)}`
      : formatSummaryDate(staged.from, cal)
    : t('select_range')

  return (
    <Flex direction="column">
      {/* fixed header (D2) — month + year dropdowns, does NOT scroll. Replaces the old redundant
          sticky month/year label (point 1) and reaches past months + any year directly. */}
      <Group justify="center" gap="xs" pb="sm" wrap="nowrap">
        <MantineCombobox
          variant="button"
          options={monthOptions}
          value={String(visibleMonth.getMonth())}
          onChange={(v) => jumpTo(new Date(visibleMonth.getFullYear(), Number(v), 1))}
          noResultsLabel={t('no_results')}
          triggerAriaLabel={t('period_month')}
          triggerWidth={rdp.monthTriggerWidth}
        />
        <MantineCombobox
          variant="button"
          options={yearOptions}
          value={String(visibleMonth.getFullYear())}
          onChange={handleYearChange}
          noResultsLabel={t('no_results')}
          triggerAriaLabel={t('period_year')}
          triggerWidth={rdp.yearTriggerWidth}
        />
      </Group>

      {/* scrolling month list — the ONLY scroll region (D4). Fixed `height`
          (`theme.other.rangeDatePicker.mobileListHeight`, not an ancestor-dependent
          `flex:1`/percentage) so this component's own total height stays well under the sheet's
          own dvh cap regardless of how tall the header/footer render, which keeps the OUTER
          ResponsiveBottomSheet body from ever needing to scroll too — avoiding a double-scroll
          container that would let the footer drift with the list. */}
      <ScrollArea h={rdp.mobileListHeight} viewportRef={viewportRef} onScrollPositionChange={handleScrollPositionChange}>
        <Stack gap="lg" pos="relative" align="center">
          {months.map((m, i) => (
            <Box
              key={m.toISOString()}
              ref={(el: HTMLDivElement | null) => {
                sectionRefs.current[i] = el
              }}
            >
              {/* D3: Title → weekday row (inside MonthGrid) → day grid, in this order, per section. */}
              <Text fw={600} size="sm" c="gray.8" mb="xs" ta="center">
                {formatMonthYearLabel(m, cal)}
              </Text>
              <MonthGrid
                month={m}
                staged={staged}
                minDate={minDate}
                maxDate={maxDate}
                cal={cal}
                onSelect={(d) => setStaged(pickStaged(selectionMode, staged, d))}
              />
            </Box>
          ))}
        </Stack>
      </ScrollArea>

      {/* fixed bottom bar (D4) — range summary + full-width Confirm CTA, does NOT scroll.
          Review 6 F16: a Mantine `Divider` (theme default gray.2, one hairline wide) replaces
          the old all-sides `bd` border, which boxed the bar on four sides instead of separating
          it from the scrolling list above. */}
      <Divider />
      <Box pt="sm">
        <Text size="sm" c="gray.7" mb="xs">
          {rangeSummary}
        </Text>
        {/* Task 561 D1: enabled once `from` is staged — commit() maps missing `to` to `from`. */}
        <Button fullWidth color="brand" mih={theme.other.touchTarget} disabled={!staged.from} onClick={onConfirm}>
          {t('confirm')}
        </Button>
      </Box>
    </Flex>
  )
}

// ── Calendar body (shared staged-range state, remounts fresh on every open — see
// MantinePopover.tsx "close() render-function children" doc comment) ────────────────────────
function RangeCalendarBody({
  value,
  onChange,
  minDate,
  maxDate,
  close,
  isMobile,
  selectionMode,
}: {
  value: DateRange
  onChange: (next: DateRange) => void
  minDate?: Date
  maxDate?: Date
  close: () => void
  isMobile: boolean
  selectionMode: SelectionMode
}) {
  const t = useTranslations('common')
  const cal = useCalendarLocaleData(t)

  const initialFrom = parseRangeDate(value.from)
  const initialTo = parseRangeDate(value.to)
  const [staged, setStaged] = useState<StagedRange>({ from: initialFrom, to: initialTo })

  // Review 5 (F13 item 4): with no staged value and a `maxDate`, desktop's RIGHT-hand month (not
  // the anchor) must be `maxDate`'s month — so the anchor (desktop's LEFT/mutable month) is
  // `maxDate` minus one — while mobile's initial scroll target is `maxDate`'s month DIRECTLY. Two
  // different months from the same rule; `initialMobileMonth` is computed once (mount-only, like
  // the pre-existing scroll effect below) and never changes after, independent of desktop's own
  // `anchorMonth` navigation state.
  const initialMobileMonth = useMemo(
    () => startOfMonth(initialFrom ?? maxDate ?? new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [anchorMonth, setAnchorMonth] = useState<Date>(() =>
    startOfMonth(initialFrom ?? (maxDate ? subMonths(maxDate, 1) : new Date())),
  )

  // Apply/Confirm-enablement decision (Task 561 D1, owner-locked 2026-07-08): enabled once `from`
  // is staged. Committing with no `to` emits a single-day range `{from, to: from}` — never a
  // half-open range and never a no-op.
  function commit() {
    if (!staged.from) return
    const to = staged.to ?? staged.from
    onChange({ from: toISO(staged.from), to: toISO(to) })
    close()
  }

  if (isMobile) {
    return (
      <MobileBody
        staged={staged}
        setStaged={setStaged}
        anchorMonth={initialMobileMonth}
        minDate={minDate}
        maxDate={maxDate}
        cal={cal}
        t={t}
        onConfirm={commit}
        selectionMode={selectionMode}
      />
    )
  }

  return (
    <DesktopBody
      staged={staged}
      setStaged={setStaged}
      anchorMonth={anchorMonth}
      setAnchorMonth={setAnchorMonth}
      minDate={minDate}
      maxDate={maxDate}
      cal={cal}
      t={t}
      onApply={commit}
      onCancel={close}
      selectionMode={selectionMode}
    />
  )
}

/**
 * Booking.com-style range date picker (Task 558 / Sprint 42 / Epic MM Phase-2; reworked by Task
 * 561 after an owner rejection of the first mobile render, 2026-07-08; composition and tokens
 * corrected by Task 891 review 5, F13).
 *
 * Desktop `≥640`: anchored `MantinePopover` panel — two-month CONSECUTIVE pair with a single
 * shared header (prev/next arrows shift the pair, month/year dropdowns anchor the LEFT month,
 * gray non-interactive label for the right month), a range-summary field, "Clear", and
 * Cancel/Apply. Mobile `<640`: full-width bottom sheet — a FIXED header with month + year
 * dropdowns (§6c chrome, same mechanism as desktop, Task 561 D2), a vertically-scrolling
 * multi-month list (the ONLY scroll region; each section is Title → weekday row → grid, Task 561
 * D3), and a fixed bottom bar with a range summary + full-width Confirm CTA (Task 561 D4). Day-tap
 * STAGES in both cases; `onChange` fires only on Apply/Confirm (never on a bare day click), and
 * fires as soon as `from` alone is staged — a missing `to` commits `{from, to: from}` (Task 561
 * D1) — see `RangeCalendarBody`.
 *
 * `inRange` fill color: `docs/tailadmin-style-reference.md §6t` has no cited range/connector
 * value (the zip's own flatpickr reference is explicitly single-select — §6t "What lero does NOT
 * take from flatpickr" excludes range-mode shadows). Resolved pragmatically using the EXISTING
 * `brand.0` token (lightest shade already in `theme.ts`'s brand scale, used nowhere else as a
 * fill) rather than inventing a new hex/alpha value — flagged by Task 558 for the orchestrator per
 * clause 16a's "zero invented values" spirit, accepted as-is by Task 561 (not a literal zip
 * citation; a documented divergence pending a future §6t range-state extraction).
 */
export function RangeDatePicker({
  value,
  onChange,
  maxDate,
  minDate,
  placeholder,
  disablePastDates,
  selectionMode = 'range',
}: RangeDatePickerProps) {
  const t = useTranslations('common')
  const theme = useMantineTheme()
  const isMobile = useMediaQuery('(max-width: 40em)') ?? false

  const effectiveMinDate = useMemo(
    () => computeEffectiveMinDate(minDate, disablePastDates),
    [minDate, disablePastDates],
  )

  const from = parseRangeDate(value.from)
  const to = parseRangeDate(value.to)
  const hasValue = !!from

  const displayText = from
    ? to && !isSameDay(from, to)
      ? `${format(from, 'dd.MM.yyyy')} — ${format(to, 'dd.MM.yyyy')}`
      : format(from, 'dd.MM.yyyy')
    : ''

  function clearValue(e: React.MouseEvent) {
    e.stopPropagation()
    onChange({ from: undefined, to: undefined })
  }

  const trigger = (
    // Task 861: a semantic <button type="button"> — Enter/Space activate it natively, so the popover opens
    // from the keyboard with no key handler of its own. It stays a <TextInput> (runtime-polymorphic: it
    // renders InputBase with a caller-overridable `component`) so the theme's TextInput defaults and
    // input-chrome.css (keyed on .mantine-TextInput-input) keep applying — chrome unchanged, no new value.
    // `component` is not in TextInput's public types, hence the one narrow cast. The clear-X below is a
    // SIBLING inside .mantine-Input-wrapper, never nested in the button. `pointer` (below) already gives
    // it `cursor:pointer` — Mantine's own Input prop, not a component-local style override.
    <TextInput
      {...({ component: 'button' } as object)}
      type="button"
      pointer
      w="100%"
      radius="lg"
      leftSection={<CalendarDays size={theme.other.iconSize.standard} color="var(--mantine-color-gray-5)" />}
      rightSection={
        hasValue ? (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label={t('aria_clear')}
            tabIndex={-1}
            onClick={clearValue}
          >
            <X size={theme.other.iconSize.compact} />
          </ActionIcon>
        ) : undefined
      }
    >
      {displayText || <Input.Placeholder c="gray.4">{placeholder ?? t('select_range')}</Input.Placeholder>}
    </TextInput>
  )

  return (
    <MantinePopover trigger={trigger} fullWidthTrigger position="bottom-start">
      {(close) => (
        <RangeCalendarBody
          value={value}
          onChange={onChange}
          minDate={effectiveMinDate}
          maxDate={maxDate}
          close={close}
          isMobile={isMobile}
          selectionMode={selectionMode}
        />
      )}
    </MantinePopover>
  )
}
