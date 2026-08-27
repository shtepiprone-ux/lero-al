'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Group,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
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
  className?: string
  /**
   * Task 561 (additive, default false): when true, days before *today* are disabled and
   * unreachable on both breakpoints (rental context). When false (default), past dates stay
   * fully selectable (listings-search context — a listing can predate the search). Combines with
   * `minDate`: effective min = `disablePastDates ? max(minDate ?? -∞, startOfToday) : minDate`.
   */
  disablePastDates?: boolean
}

interface StagedRange {
  from?: Date
  to?: Date
}

type TFunc = ReturnType<typeof useTranslations>

// §6t resting day-cell size — ALL breakpoints INCLUDING the <640 bottom sheet (documented owner
// exemption from the clause-11 ≥44px touch minimum, docs/tailadmin-style-reference.md §6t).
const DAY_CELL_PX = 39
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

// ── Day cell ─────────────────────────────────────────────────────────────────
// §6t day-cell state matrix: resting pill/gray-700, hover gray-200 (CSS :hover, see
// range-date-picker-chrome.css — cannot be expressed via inline style), start/end brand-700 fill,
// inRange light brand tint spanning the row (rendered as a background layer behind the day
// button so start/end's solid fill visually "connects" to the lighter band), today gray-400
// border, out-of-month gray-400, disabled very-light/non-interactive.
function DayCell({
  day,
  inMonth,
  staged,
  disabled,
  onSelect,
}: {
  day: Date
  inMonth: boolean
  staged: StagedRange
  disabled: boolean
  onSelect: (day: Date) => void
}) {
  const isStart = !!staged.from && isSameDay(day, staged.from)
  const isEnd = !!staged.to && isSameDay(day, staged.to)
  const isBoundary = isStart || isEnd
  const inRangeSpan =
    !!staged.from && !!staged.to && isWithinInterval(day, { start: staged.from, end: staged.to })
  const todayFlag = isToday(day)

  const showBand = inMonth && !disabled && inRangeSpan
  let bandRadius = '0px'
  if (isStart && isEnd) bandRadius = '9999px'
  else if (isStart) bandRadius = '9999px 0 0 9999px'
  else if (isEnd) bandRadius = '0 9999px 9999px 0'

  return (
    <Box style={{ position: 'relative', width: DAY_CELL_PX, height: DAY_CELL_PX, flexShrink: 0 }}>
      {showBand && (
        <Box
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'var(--mantine-color-brand-0)',
            borderRadius: bandRadius,
          }}
        />
      )}
      <UnstyledButton
        type="button"
        className="range-day-cell"
        data-boundary={isBoundary ? 'true' : undefined}
        data-date={toISO(day)}
        aria-label={format(day, 'd MMMM yyyy')}
        disabled={disabled || !inMonth}
        onClick={() => {
          if (inMonth && !disabled) onSelect(day)
        }}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '9999px',
          fontSize: 'var(--mantine-font-size-sm)',
          fontWeight: isBoundary ? 600 : 400,
          color: !inMonth
            ? 'var(--mantine-color-gray-4)'
            : disabled
              ? 'var(--mantine-color-gray-3)'
              : isBoundary
                ? 'var(--mantine-color-white)'
                : 'var(--mantine-color-gray-7)',
          backgroundColor: isBoundary ? 'var(--mantine-color-brand-7)' : 'transparent',
          border:
            todayFlag && !isBoundary && inMonth
              ? '1px solid var(--mantine-color-gray-4)'
              : '1px solid transparent',
          cursor: disabled || !inMonth ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {day.getDate()}
      </UnstyledButton>
    </Box>
  )
}

// ── Month grid (weekday header + 6×7 day grid) ────────────────────────────────
// Task 561 D3: every consumer (desktop's shared-header grids AND each mobile section) now shows
// its own weekday header directly above its day grid — the old mobile-only `showWeekdayHeader`
// toggle is gone, this component always renders both.
function MonthGrid({
  month,
  staged,
  minDate,
  maxDate,
  weekdays,
  onSelect,
}: {
  month: Date
  staged: StagedRange
  minDate?: Date
  maxDate?: Date
  weekdays: string[]
  onSelect: (day: Date) => void
}) {
  const days = useMemo(() => buildMonthDays(month), [month])
  return (
    <Box>
      <Box style={{ display: 'flex', width: DAY_CELL_PX * 7, marginBottom: 8 }}>
        {weekdays.map((w, i) => (
          <Box
            key={i}
            style={{
              width: DAY_CELL_PX,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 24,
            }}
          >
            <Text size="xs" fw={700} c="gray.5">
              {w}
            </Text>
          </Box>
        ))}
      </Box>
      <Box style={{ display: 'flex', flexWrap: 'wrap', width: DAY_CELL_PX * 7 }}>
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            day={day}
            inMonth={isSameMonth(day, month)}
            staged={staged}
            disabled={isDayDisabled(day, minDate, maxDate)}
            onSelect={onSelect}
          />
        ))}
      </Box>
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
}) {
  const rightMonth = addMonths(anchorMonth, 1)

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
    <Box style={{ width: DAY_CELL_PX * 14 + 32, maxWidth: '90vw' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <TextInput
            readOnly
            value={rangeSummary}
            placeholder={t('select_range')}
            radius="lg"
            w={280}
          />
          <Group gap="md" wrap="nowrap">
            <Anchor
              component="button"
              type="button"
              fz="var(--mantine-font-size-xs)"
              fw={500}
              c="brand.7"
              mih="2.75rem"
              onClick={() => setStaged({ from: undefined, to: undefined })}
            >
              {t('clear_filters')}
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

        <Group justify="space-between" align="center" wrap="nowrap">
          <ActionIcon
            variant="default"
            aria-label={t('aria_prev')}
            disabled={!canPrev}
            onClick={() => setLeftMonth(subMonths(anchorMonth, 1))}
          >
            <ChevronLeft size={16} />
          </ActionIcon>
          <Group gap="xs" wrap="nowrap">
            {/* Task 773: `withinPortal={false}` on BOTH in-calendar selectors. These render inside
                the desktop calendar's own `MantinePopover` dropdown; a portalled option list is a
                sibling of that dropdown in Mantine's shared portal node, never a descendant, so
                the `mousedown` that selects an option fails the popover's
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
              triggerWidth={150}
              withinPortal={false}
            />
            <MantineCombobox
              variant="button"
              options={yearOptions}
              value={String(anchorMonth.getFullYear())}
              onChange={(v) => setLeftMonth(new Date(Number(v), anchorMonth.getMonth(), 1))}
              noResultsLabel={t('no_results')}
              triggerWidth={100}
              withinPortal={false}
            />
          </Group>
          <Text c="gray.5" fw={600} size="sm" style={{ whiteSpace: 'nowrap' }}>
            {formatMonthYearLabel(rightMonth, cal)}
          </Text>
          <ActionIcon
            variant="default"
            aria-label={t('aria_next')}
            disabled={!canNext}
            onClick={() => setLeftMonth(addMonths(anchorMonth, 1))}
          >
            <ChevronRight size={16} />
          </ActionIcon>
        </Group>

        <Group align="flex-start" gap="xl" wrap="wrap">
          <MonthGrid
            month={anchorMonth}
            staged={staged}
            minDate={minDate}
            maxDate={maxDate}
            weekdays={cal.weekdaysShort}
            onSelect={(d) => setStaged(pickDay(staged, d))}
          />
          <MonthGrid
            month={rightMonth}
            staged={staged}
            minDate={minDate}
            maxDate={maxDate}
            weekdays={cal.weekdaysShort}
            onSelect={(d) => setStaged(pickDay(staged, d))}
          />
        </Group>
      </Stack>
    </Box>
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
}: {
  staged: StagedRange
  setStaged: (next: StagedRange) => void
  anchorMonth: Date
  minDate?: Date
  maxDate?: Date
  cal: CalendarLocaleData
  t: TFunc
  onConfirm: () => void
}) {

  // Window bounds (Task 561 point 5 / D2): reaches PAST months via minDate (already the
  // disablePastDates-clamped effective bound by the time it reaches here) instead of the old
  // forward-only scroll; falls back to a bounded span around the anchor when a bound is absent.
  const months = useMemo(() => {
    const start = minDate ? startOfMonth(minDate) : startOfMonth(subMonths(anchorMonth, 12))
    const end = maxDate ? startOfMonth(maxDate) : startOfMonth(addMonths(anchorMonth, 15))
    const arr: Date[] = []
    let cursor = start
    let guard = 0
    while (!isAfter(cursor, end) && guard < MOBILE_MAX_MONTHS) {
      arr.push(cursor)
      cursor = addMonths(cursor, 1)
      guard += 1
    }
    return arr.length ? arr : [anchorMonth]
  }, [anchorMonth, minDate, maxDate])

  const initialIdx = Math.max(
    0,
    months.findIndex((m) => isSameMonth(m, anchorMonth)),
  )
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([])
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [visibleMonthIdx, setVisibleMonthIdx] = useState(initialIdx)

  // Opens scrolled to value.from's month (or today) — same as desktop's anchor — since the
  // window can now start up to 12 months BEFORE the anchor (point 5), index 0 is no longer
  // necessarily "today"/anchor.
  useLayoutEffect(() => {
    const el = sectionRefs.current[initialIdx]
    if (el) scrollViewportTo(viewportRef.current, el.offsetTop)
    // Mount-only: re-running on every anchor/window change would fight the user's own scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fixed-header dropdowns reflect the month currently scrolled into view (D2) — whichever
  // section's top has scrolled past the viewport top is the "currently visible" month.
  function handleScrollPositionChange(pos: { x: number; y: number }) {
    let idx = 0
    for (let i = 0; i < sectionRefs.current.length; i++) {
      const el = sectionRefs.current[i]
      if (el && el.offsetTop <= pos.y + 4) idx = i
    }
    setVisibleMonthIdx(idx)
  }

  function jumpTo(target: Date) {
    const idx = months.findIndex((m) => isSameMonth(m, target))
    if (idx === -1) return
    const el = sectionRefs.current[idx]
    if (el) scrollViewportTo(viewportRef.current, el.offsetTop)
    setVisibleMonthIdx(idx)
  }

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
    <Box style={{ display: 'flex', flexDirection: 'column' }}>
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
          triggerWidth={150}
        />
        <MantineCombobox
          variant="button"
          options={yearOptions}
          value={String(visibleMonth.getFullYear())}
          onChange={handleYearChange}
          noResultsLabel={t('no_results')}
          triggerAriaLabel={t('period_year')}
          triggerWidth={100}
        />
      </Group>

      {/* scrolling month list — the ONLY scroll region (D4). Fixed `height` (not an
          ancestor-dependent `flex:1`/percentage) so this component's own total height stays
          well under the sheet's 90dvh cap regardless of how tall the header/footer render,
          which keeps the OUTER ResponsiveBottomSheet body from ever needing to scroll too —
          avoiding a double-scroll container that would let the footer drift with the list. */}
      <ScrollArea
        style={{ height: '45dvh' }}
        viewportRef={viewportRef}
        onScrollPositionChange={handleScrollPositionChange}
      >
        <Stack gap="lg" style={{ position: 'relative' }} align="center">
          {months.map((m, i) => (
            <Box
              key={m.toISOString()}
              ref={(el: HTMLDivElement | null) => {
                sectionRefs.current[i] = el
              }}
            >
              {/* D3: Title → weekday row (inside MonthGrid) → day grid, in this order, per section. */}
              <Text fw={600} size="sm" c="gray.8" mb={8} ta="center">
                {formatMonthYearLabel(m, cal)}
              </Text>
              <MonthGrid
                month={m}
                staged={staged}
                minDate={minDate}
                maxDate={maxDate}
                weekdays={cal.weekdaysShort}
                onSelect={(d) => setStaged(pickDay(staged, d))}
              />
            </Box>
          ))}
        </Stack>
      </ScrollArea>

      {/* fixed bottom bar (D4) — range summary + full-width Confirm CTA, does NOT scroll. */}
      <Box
        style={{
          paddingTop: 12,
          borderTop: '1px solid var(--mantine-color-gray-2)',
        }}
      >
        <Text size="sm" c="gray.7" mb={8}>
          {rangeSummary}
        </Text>
        {/* Task 561 D1: enabled once `from` is staged — commit() maps missing `to` to `from`. */}
        <Button fullWidth color="brand" mih="2.75rem" disabled={!staged.from} onClick={onConfirm}>
          {t('confirm')}
        </Button>
      </Box>
    </Box>
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
}: {
  value: DateRange
  onChange: (next: DateRange) => void
  minDate?: Date
  maxDate?: Date
  close: () => void
  isMobile: boolean
}) {
  const t = useTranslations('common')
  const cal = useCalendarLocaleData(t)

  const initialFrom = parseRangeDate(value.from)
  const initialTo = parseRangeDate(value.to)
  const [staged, setStaged] = useState<StagedRange>({ from: initialFrom, to: initialTo })
  const [anchorMonth, setAnchorMonth] = useState<Date>(() => startOfMonth(initialFrom ?? new Date()))

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
        anchorMonth={anchorMonth}
        minDate={minDate}
        maxDate={maxDate}
        cal={cal}
        t={t}
        onConfirm={commit}
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
    />
  )
}

/**
 * Booking.com-style range date picker (Task 558 / Sprint 42 / Epic MM Phase-2; reworked by Task
 * 561 after an owner rejection of the first mobile render, 2026-07-08).
 *
 * Desktop `≥640`: anchored `MantinePopover` panel — two-month CONSECUTIVE pair with a single
 * shared header (prev/next arrows shift the pair, month/year dropdowns anchor the LEFT month,
 * gray non-interactive label for the right month), a range-summary field, "Clear filters", and
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
  className,
  disablePastDates,
}: RangeDatePickerProps) {
  const t = useTranslations('common')
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
    <TextInput
      readOnly
      w="100%"
      radius="lg"
      value={displayText}
      placeholder={placeholder ?? t('select_range')}
      className={className}
      leftSection={<CalendarDays size={16} style={{ color: 'var(--mantine-color-gray-5)' }} />}
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
            <X size={14} />
          </ActionIcon>
        ) : undefined
      }
      style={{ cursor: 'pointer' }}
    />
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
        />
      )}
    </MantinePopover>
  )
}
