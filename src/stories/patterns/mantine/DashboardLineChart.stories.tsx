import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent, expect } from 'storybook/test';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import {
  MantineDashboardLineChart,
  type DashboardLineChartDatum,
  type DashboardLineChartSeries,
} from '@/design-system/mantine/patterns/MantineDashboardLineChart';
import { MantineDashboardCard } from '@/design-system/mantine/patterns/MantineDashboardCard';
import { MantineCombobox } from '@/design-system/mantine/patterns/MantineCombobox';
import { formatMonthAbbrev, formatMonthFull, formatFullDate, formatShortDate, formatCount, formatWeekdayShort } from '@/lib/formatters';
import { theme } from '@/design-system/mantine/theme';

export type Period = 'week' | 'month' | 'year';

// Owner-requested (2026-09-19): a Week/Month/Year period filter in the card's top-right corner —
// TailAdmin's own Figma reference ("Line Chart V1 - Large") shows this exact control there.
// Owner correction (same day): the first pass used `MantineSelect` (Mantine's higher-level
// `<Select>` wrapper) — the owner rejected it as "not the canonical combobox", correctly: this
// project's own compact filter/sort dropdowns (`ListingsSortBar.tsx`, `ListingsFilterBar.tsx`)
// all use `MantineCombobox` (`variant="button"`), built on Mantine's LOW-LEVEL `Combobox`
// primitive — not `MantineSelect`. Swapped to match. `period`/`onPeriodChange` are now lifted to
// the story's own render function (not owned locally here) so selecting a period actually
// re-derives `buildData(period)` below — the owner's second, separate, and correct complaint:
// the first pass changed no rendered chart data at all.
function PeriodHeaderAction({ l, period, onPeriodChange }: { l: string; period: Period; onPeriodChange: (p: Period) => void }) {
  const options = [
    { value: 'week', label: storyT(l, 'storybook.mantine.dashboard_period_week') },
    { value: 'month', label: storyT(l, 'storybook.mantine.dashboard_period_month') },
    { value: 'year', label: storyT(l, 'storybook.mantine.dashboard_period_year') },
  ];
  return (
    <MantineCombobox
      options={options}
      value={period}
      onChange={(v) => onPeriodChange(v as Period)}
      variant="button"
      triggerAriaLabel={storyT(l, 'storybook.mantine.dashboard_period_filter_label')}
      noResultsLabel={storyT(l, 'storybook.mantine.dashboard_period_filter_label')}
    />
  );
}

const meta: Meta<typeof MantineDashboardLineChart> = {
  title: 'Patterns/Mantine/DashboardLineChart',
  component: MantineDashboardLineChart,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Canonical dashboard daily line/area chart (spec v3.3 §17.2 ADM-10, §17.3 AGT-03/04/05, §17.4), built against TailAdmin\'s own Line Chart 1 (demo.tailadmin.com/line-chart): a bold primary line with a very light area fill, thinner lighter lines for every other series, a legend below the plot (plain dot+label toggles, not a bordered chip), and no data table. The story wraps the pattern in the canonical `MantineDashboardCard` (Task 843) purely so its rendered card chrome matches the reference — the pattern itself owns no card. Task 845. Viewport and locale switched via Storybook toolbar (Task 799 caveat).',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardLineChart>;

// Fixed calendar fixture — 2026-06-01 is an arbitrary fixture anchor, unrelated to the frozen
// Storybook preview clock (2026-07-30, `.storybook/preview-head.html`, Task 698/D25), which only
// matters for `RelativeTime`-style "time ago" text. This chart plots absolute calendar dates, so
// no relationship to "now" is required — only that the series itself is deterministic
// (check:stories §14.10: never `Math.random()`, never the live clock).
const FIXTURE_MONTH_ANCHOR_YEAR = 2026;
const FIXTURE_MONTH_ANCHOR_MONTH_INDEX = 5; // June (0-indexed) — the fixture's anchor month

// Owner-requested (2026-09-19, Pass 12): the chart architecture must account for a real month's
// actual day count, including February's 29 days in a leap year — a fixed `FIXTURE_DAYS = 30`
// constant (this fixture's anchor month, June, happens to have exactly 30 days) would silently
// render a wrong day count for any other month. `day 0 of the FOLLOWING month` is the standard,
// calendar-correct way to get the last day of a given month from `Date`'s own UTC calendar math
// (which already knows leap-year rules) — never a hand-rolled 28/29/30/31 lookup table. Verified:
// `daysInMonth(2028, 1)` (February, a leap year) → 29; `daysInMonth(2026, 1)` (not a leap year) → 28.
function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
}
const FIXTURE_DAYS = daysInMonth(FIXTURE_MONTH_ANCHOR_YEAR, FIXTURE_MONTH_ANCHOR_MONTH_INDEX);

function fixtureDate(dayIndex: number): string {
  const d = new Date(Date.UTC(FIXTURE_MONTH_ANCHOR_YEAR, FIXTURE_MONTH_ANCHOR_MONTH_INDEX, 1));
  d.setUTCDate(d.getUTCDate() + dayIndex);
  return d.toISOString().slice(0, 10);
}

// Storybook's OWN frozen preview clock anchor (Task 698/D25, `.storybook/preview-head.html`) — a
// bare `new Date()`/`Date.now()` resolves to this exact instant at render time (a `Proxy` pins it),
// but `check:stories` §14.10's own static scanner still flags the literal source-code PATTERN
// `new Date()` regardless of that runtime freeze ("Use a frozen, named, documented anchor constant
// instead" — its own fix instruction). This constant IS that documented anchor: the only "today" a
// story is allowed to reference, reused here (not the real 2026-09 calendar date) so the "current
// week" below is genuinely deterministic across any capture day, per this project's own governance
// — not a per-chart improvisation.
const FROZEN_TODAY_ISO = '2026-07-30T00:00:00.000Z';

// Monday of the ISO week containing `FROZEN_TODAY_ISO` — the owner-requested "always the current
// week" anchor (2026-09-19: "тиждень завжди має бути поточний згідно актуальної дати").
function currentWeekMonday(): Date {
  const anchor = new Date(FROZEN_TODAY_ISO);
  const day = anchor.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - diffToMonday);
  return monday;
}
function weekDate(dayIndex: number): string {
  const d = new Date(currentWeekMonday());
  d.setUTCDate(d.getUTCDate() + dayIndex);
  return d.toISOString().slice(0, 10);
}

// A real calendar month (the 1st), January through December of the fixture year — never a fixed
// day-count stride (Task 845 Pass 12, owner-reported: "рік починається завжди з січня" / a year
// view must always start at January, and some charts showed a duplicated month name). The prior
// `fixtureDate(i * 30)` stride both started mid-year (June, the fixture anchor's own month) and
// produced a duplicate month label for some `i`, since 30 days does not evenly divide every real
// calendar month's length (28–31 days) — two consecutive 30-day jumps can land in the same month.
function yearMonthDate(monthIndex: number): string {
  return new Date(Date.UTC(FIXTURE_MONTH_ANCHOR_YEAR, monthIndex, 1)).toISOString().slice(0, 10)
}

// Deterministic, seeded pseudo-series (a fixed formula, not `Math.random()`).
function fixtureValue(seed: number, dayIndex: number): number {
  return Math.max(0, Math.round(18 + 14 * Math.sin((dayIndex + seed) / 4.3) + 6 * Math.cos(dayIndex / 2.7)));
}

// Owner-requested (2026-09-19): the period control must actually change what the chart renders.
// `week`/`year` sample the SAME deterministic `fixtureValue` formula at a different stride/count —
// never `Math.random()`, never a second invented formula — so the three periods are genuinely
// different data, not the same 30 points redrawn under a relabelled control. `week`'s own DATES
// (not just its values) are anchored to the real current ISO week (`weekDate`), not the fixture's
// arbitrary June anchor — the owner's explicit "always the current week" instruction.
function buildData(period: Period): DashboardLineChartDatum[] {
  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => ({
      date: weekDate(i),
      recordedViews: fixtureValue(1, i),
      whatsappClicks: fixtureValue(2, i),
      formInquiries: fixtureValue(3, i),
    }));
  }
  if (period === 'year') {
    // 12 real calendar months, January through December — see `yearMonthDate` above.
    return Array.from({ length: 12 }, (_, i) => ({
      date: yearMonthDate(i),
      recordedViews: fixtureValue(1, i * 30),
      whatsappClicks: fixtureValue(2, i * 30),
      formInquiries: fixtureValue(3, i * 30),
    }));
  }
  return Array.from({ length: FIXTURE_DAYS }, (_, i) => ({
    date: fixtureDate(i),
    recordedViews: fixtureValue(1, i),
    whatsappClicks: i === 10 ? 0 : fixtureValue(2, i), // the required "one day with 0" (spec §17.4)
    formInquiries: fixtureValue(3, i),
  }));
}

// `series[0]` is the primary metric — bold line, light area fill. The other two are lighter,
// thinner reference lines with no fill (the pattern's own per-series treatment, R2).
function buildSeries(l: string): DashboardLineChartSeries[] {
  return [
    { key: 'recordedViews', label: storyT(l, 'storybook.mantine.dashboard_chart_series_views'), color: theme.other!.chartSeries!.recordedViews! },
    { key: 'whatsappClicks', label: storyT(l, 'storybook.mantine.dashboard_chart_series_whatsapp'), color: theme.other!.chartSeries!.whatsappClicks! },
    { key: 'formInquiries', label: storyT(l, 'storybook.mantine.dashboard_chart_series_inquiries'), color: theme.other!.chartSeries!.formInquiries! },
  ];
}

// Owner correction 2026-09-19 (Pass 10, second round): a per-point axis/tooltip label must never
// repeat the month (or the year) on every single tick — `MantineDashboardCard`'s own `scopeLabel`
// slot (next to the title, e.g. "e.g. a formatted period") already states which month/year/week is
// active ONCE; the chart's own `dateLabel` then only needs the bare value the reference actually
// varies per point. `month` varies by DAY (the month is fixed for the whole visible range, so only
// the bare day number changes point-to-point); `year` varies by MONTH (the year is fixed for all 12
// points, so only the bare month abbreviation changes). `week` is its own case (Task 845 Pass 12,
// owner-reported): a 7-point week view reads as "Mon/Tue/Wed…", never a bare day-of-month number or
// a generic "Day N" counter (the defect the owner flagged — `MantineDashboardBarChart.stories.tsx`
// still showed exactly that "Day N" counter for its own week view, inconsistent with this file's
// dates; both files now share one standard via `formatWeekdayShort`). No branch calls a live
// `Intl.DateTimeFormat` — `formatMonthAbbrev`/`formatWeekdayShort` reuse the same static, locale-safe
// `calendar_months_short`/`calendar_weekdays_short` data `formatListingDate` does (some browsers'
// bundled ICU has no `sq` locale data at all); a bare day-of-month number needs no locale data at
// all (Arabic numerals are identical across en/uk/sq/it).
function makeDateLabel(l: string, period: Period) {
  if (period === 'year') return (date: string) => formatMonthAbbrev(date, l);
  if (period === 'week') return (date: string) => formatWeekdayShort(date, l);
  return (date: string) => String(new Date(date).getUTCDate());
}
// Owner-requested (2026-09-19, second round): the tooltip needs a fuller, unambiguous date than
// the axis — "19 вересня" (day + full month), or a bare full month name ("вересень") when the
// period is year, since a year view's own point IS a whole month. A hover target has room a dense
// per-point axis tick does not, so this is deliberately a DIFFERENT label than `dateLabel` above,
// via `MantineDashboardLineChart`'s own additive `tooltipDateLabel` prop. `week`'s own tooltip
// (Task 845 Pass 12, owner-requested) pairs the axis's bare weekday with the full date it stands
// for — "Вт, 26 серпня" — since the axis alone doesn't say which calendar day "Tue" actually is.
function makeTooltipDateLabel(l: string, period: Period) {
  if (period === 'year') return (date: string) => formatMonthFull(date, l);
  if (period === 'week') return (date: string) => `${formatWeekdayShort(date, l)}, ${formatFullDate(date, l)}`;
  return (date: string) => formatFullDate(date, l);
}
function makeValueLabel(l: string) {
  return (n: number) => formatCount(n, l);
}

// The scope label stated ONCE next to the title (`MantineDashboardCard`'s own `scopeLabel` slot,
// documented since Task 843 for exactly "a formatted period", rendered under the title per the
// owner's 2026-09-19 correction) — never invented per-point axis text. `month`/`year` anchor off
// the fixture's own first plotted point (`fixtureDate(0)`, always June 2026 in this fixture);
// `week` anchors off the real current ISO week (`currentWeekMonday`, not the fixture month) and
// shows its actual date range, e.g. "27 черв. - 3 лип." — the owner's explicit correction from an
// earlier "Week N" attempt, which stated a week NUMBER rather than the dates it actually covers.
function makeScopeLabel(l: string, period: Period): string {
  if (period === 'week') {
    const monday = currentWeekMonday();
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return `${formatShortDate(monday.toISOString().slice(0, 10), l)} - ${formatShortDate(sunday.toISOString().slice(0, 10), l)}`;
  }
  const anchor = fixtureDate(0);
  const year = new Date(anchor).getUTCFullYear();
  if (period === 'year') return String(year);
  return `${formatMonthAbbrev(anchor, l)} ${year}`;
}

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    const [period, setPeriod] = useState<Period>('month');
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard
          title={storyT(l, 'storybook.mantine.dashboard_chart_card_title')}
          scopeLabel={makeScopeLabel(l, period)}
          state="ready"
          headerAction={<PeriodHeaderAction l={l} period={period} onPeriodChange={setPeriod} />}
        >
          <MantineDashboardLineChart
            data={buildData(period)}
            series={buildSeries(l)}
            mode="multi"
            dateLabel={makeDateLabel(l, period)}
            tooltipDateLabel={makeTooltipDateLabel(l, period)}
            valueLabel={makeValueLabel(l)}
            state="ready"
            allHiddenHint={storyT(l, 'storybook.mantine.dashboard_chart_all_hidden_hint')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_chart_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // Reliability-first play: confirms the legend renders one visible (aria-pressed=true) toggle
  // per series — never asserting recharts' own internal SVG structure, proven visually in a real
  // browser per the pattern's own jsdom/ResizeObserver caveat.
  play: async ({ canvasElement }) => {
    const legendToggles = canvasElement.querySelectorAll('button[aria-pressed]');
    expect(legendToggles.length).toBe(3);
    for (const toggle of legendToggles) expect(toggle.getAttribute('aria-pressed')).toBe('true');
  },
};

export const OneSeriesHidden: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_chart_card_title')} state="ready">
          <MantineDashboardLineChart
            data={buildData('month')}
            series={buildSeries(l)}
            mode="multi"
            dateLabel={makeDateLabel(l, 'month')}
            valueLabel={makeValueLabel(l)}
            state="ready"
            allHiddenHint={storyT(l, 'storybook.mantine.dashboard_chart_all_hidden_hint')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_chart_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // AC2 — activates the third series' legend toggle by keyboard (focus + Space, never a mouse
  // click) and asserts its `aria-pressed` state flips.
  play: async ({ canvasElement }) => {
    const legendToggles = canvasElement.querySelectorAll('button[aria-pressed]');
    const third = legendToggles[2] as HTMLButtonElement;
    third.focus();
    await userEvent.keyboard(' ');
    expect(third.getAttribute('aria-pressed')).toBe('false');
  },
};

export const SingleMode: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_chart_single_card_title')} state="ready">
          <MantineDashboardLineChart
            data={buildData('month')}
            series={[buildSeries(l)[0]]}
            mode="single"
            dateLabel={makeDateLabel(l, 'month')}
            valueLabel={makeValueLabel(l)}
            state="ready"
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_chart_single_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
};

export const Empty: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_chart_card_title')} state="ready">
          <MantineDashboardLineChart
            data={[]}
            series={buildSeries(l)}
            mode="multi"
            dateLabel={makeDateLabel(l, 'month')}
            valueLabel={makeValueLabel(l)}
            state="empty"
            emptyTitle={storyT(l, 'storybook.mantine.dashboard_chart_empty_title')}
            emptyDescription={storyT(l, 'storybook.mantine.dashboard_chart_empty_description')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_chart_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
};

export const Loading: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_chart_card_title')} state="ready">
          <MantineDashboardLineChart
            data={[]}
            series={buildSeries(l)}
            mode="multi"
            dateLabel={makeDateLabel(l, 'month')}
            valueLabel={makeValueLabel(l)}
            state="loading"
            loadingAriaLabel={storyT(l, 'dashboard.common.loading_label')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_chart_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
};

export const Error: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_chart_card_title')} state="ready">
          <MantineDashboardLineChart
            data={[]}
            series={buildSeries(l)}
            mode="multi"
            dateLabel={makeDateLabel(l, 'month')}
            valueLabel={makeValueLabel(l)}
            state="error"
            errorText={storyT(l, 'storybook.mantine.dashboard_chart_error')}
            retryLabel={storyT(l, 'dashboard.common.retry')}
            onRetry={() => {}}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_chart_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
};
