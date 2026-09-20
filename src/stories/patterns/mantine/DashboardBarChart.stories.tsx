import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent, expect } from 'storybook/test';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import {
  MantineDashboardBarChart,
  type DashboardBarChartDatum,
  type DashboardBarChartSeries,
} from '@/design-system/mantine/patterns/MantineDashboardBarChart';
import { MantineDashboardCard } from '@/design-system/mantine/patterns/MantineDashboardCard';
import { MantineCombobox } from '@/design-system/mantine/patterns/MantineCombobox';
import { formatCount, formatShortDate, formatMonthAbbrev, formatMonthFull, formatWeekdayShort, formatFullDate } from '@/lib/formatters';
import { theme } from '@/design-system/mantine/theme';

export type Period = 'week' | 'month' | 'year';

// Owner-requested (2026-09-19): a Week/Month/Year period filter in the card's top-right corner.
// Owner correction (same day, see `DashboardLineChart.stories.tsx`'s own copy of this helper for
// the full rationale): the canonical control is `MantineCombobox` (`variant="button"`), not
// `MantineSelect` — this project's own filter/sort dropdowns all use the former. `period` is
// lifted to the story's own render function so selecting one actually re-derives `buildData`.
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

const meta: Meta<typeof MantineDashboardBarChart> = {
  title: 'Patterns/Mantine/DashboardBarChart',
  component: MantineDashboardBarChart,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Canonical dashboard bar chart, built against TailAdmin\'s own Bar Chart 1 (single series) and Bar Chart 2 (stacked multi-series) references (demo.tailadmin.com/bar-chart): rounded bars, a restrained gap, no per-bar value label, no data table. The story wraps the pattern in the canonical `MantineDashboardCard` (Task 843) purely so its rendered card chrome matches the reference. No consumer wired yet.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardBarChart>;

// Fixed fixture counts (never `Math.random()`, check:stories §14.10). Owner-requested
// (2026-09-19): the period control must actually change what the chart renders — each period
// gets its own fixed category count/prefix and value set, never the same 6 weeks relabelled.
const WEEK_COUNT = 6;
const FROZEN_TODAY_ISO = '2026-07-30T00:00:00.000Z';
const FIXTURE_MONTH_ANCHOR = '2026-06-01';
function currentWeekMonday(): Date {
  const anchor = new Date(FROZEN_TODAY_ISO);
  const day = anchor.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - diffToMonday);
  return monday;
}
// Owner-reported (Task 845 Pass 12), twice in the same session: the week view showed a placeholder
// `day-1`/`day-2`/… category, and the month/year views showed `week-1`/`week-6`/`month-1`/`month-12`
// — every one an ordinal counter with no real calendar date behind it, rejected on sight ("Який
// Тиждень 1, Тиждень 2...? Має бути один стандарт для всіх чартів!"). All three periods' `category`
// now holds a real ISO date: `weekDate(i)` (7 real days off the current ISO week, the same
// `currentWeekMonday()` anchor `makeScopeLabel` below already uses), `monthWeekStart(i)` (the real
// start date of each of the 6 calendar weeks a month view buckets into, off `FIXTURE_MONTH_ANCHOR`),
// and `yearMonthDate(i)` (12 real calendar months, January through December — see its own comment,
// same fix `DashboardLineChart.stories.tsx`'s own `yearMonthDate` needed for the same owner-reported
// reason, one standard not a second invented formula). `makeCategoryLabel`/`makeTooltipCategoryLabel`
// below then format each with the same functions `DashboardLineChart.stories.tsx` already uses for
// the matching period, so both charts read identically for a given period.
function weekDate(dayIndex: number): string {
  const d = new Date(currentWeekMonday());
  d.setUTCDate(d.getUTCDate() + dayIndex);
  return d.toISOString().slice(0, 10);
}
function monthWeekStart(bucketIndex: number): string {
  const d = new Date(`${FIXTURE_MONTH_ANCHOR}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + bucketIndex * 7);
  return d.toISOString().slice(0, 10);
}
function monthWeekEnd(bucketIndex: number): string {
  const d = new Date(`${FIXTURE_MONTH_ANCHOR}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + bucketIndex * 7 + 6);
  return d.toISOString().slice(0, 10);
}
// A real calendar month (the 1st), January through December of the fixture year — never a fixed
// day-count stride (Task 845 Pass 12, owner-reported: "рік починається завжди з січня" / a year
// view must always start at January, and some charts showed a duplicated month name — a 30-day
// stride from `FIXTURE_MONTH_ANCHOR` both started mid-year and drifted two consecutive jumps into
// the same real calendar month for some `i`, since 30 days does not evenly divide every month's
// real length). Same fix, same rationale, as `DashboardLineChart.stories.tsx`'s own `yearMonthDate`.
function yearMonthDate(monthIndex: number): string {
  const year = new Date(FIXTURE_MONTH_ANCHOR).getUTCFullYear()
  return new Date(Date.UTC(year, monthIndex, 1)).toISOString().slice(0, 10)
}
function buildData(period: Period): DashboardBarChartDatum[] {
  if (period === 'week') {
    const newListings = [8, 11, 9, 13, 10, 14, 12];
    const renewedListings = [4, 5, 4, 6, 5, 7, 6];
    return Array.from({ length: 7 }, (_, i) => ({ category: weekDate(i), newListings: newListings[i], renewedListings: renewedListings[i] }));
  }
  if (period === 'year') {
    const newListings = [96, 124, 112, 140, 120, 152, 160, 144, 168, 132, 116, 180];
    const renewedListings = [48, 60, 40, 72, 56, 80, 88, 76, 84, 64, 52, 96];
    return Array.from({ length: 12 }, (_, i) => ({ category: yearMonthDate(i), newListings: newListings[i], renewedListings: renewedListings[i] }));
  }
  return Array.from({ length: WEEK_COUNT }, (_, i) => ({
    category: monthWeekStart(i),
    newListings: [24, 31, 28, 35, 30, 38][i],
    renewedListings: [12, 15, 10, 18, 14, 20][i],
  }));
}

function buildSeries(l: string): DashboardBarChartSeries[] {
  return [
    { key: 'newListings', label: storyT(l, 'storybook.mantine.dashboard_bar_series_new'), color: theme.other!.chartSeries!.recordedViews! },
    { key: 'renewedListings', label: storyT(l, 'storybook.mantine.dashboard_bar_series_renewed'), color: theme.other!.chartSeries!.whatsappClicks! },
  ];
}

// One standard, all three periods, matching `DashboardLineChart.stories.tsx`'s own axis convention
// for the same period exactly (Task 845 Pass 12, owner-requested): `week` → bare weekday name
// (`formatWeekdayShort`); `year` → bare month abbreviation (`formatMonthAbbrev`, the identical
// function the line chart's year view already uses); `month`'s own bucket is a calendar week, not a
// single date, so its axis shows that week's start as a short date (`formatShortDate`, the same
// function `makeScopeLabel` below already uses for a week range) — never a translated ordinal
// prefix.
function makeCategoryLabel(l: string, period: Period) {
  if (period === 'week') return (category: string) => formatWeekdayShort(category, l);
  if (period === 'year') return (category: string) => formatMonthAbbrev(category, l);
  return (category: string) => formatShortDate(category, l);
}
// The tooltip needs a fuller, unambiguous label than the axis (Task 845 Pass 12, owner-requested):
// `week` pairs the weekday with its full date ("Вт, 26 серпня"); `year` shows the full month name
// (`formatMonthFull`, matching the line chart's year-view tooltip exactly); `month`'s bucket is a
// whole week, so its tooltip states the real start–end range (the same `formatShortDate` range shape
// `makeScopeLabel` below already renders for the week period's own scope label).
function makeTooltipCategoryLabel(l: string, period: Period) {
  if (period === 'week') return (category: string) => `${formatWeekdayShort(category, l)}, ${formatFullDate(category, l)}`;
  if (period === 'year') return (category: string) => formatMonthFull(category, l);
  return (category: string) => {
    const bucketIndex = Math.round((new Date(`${category}T00:00:00.000Z`).getTime() - new Date(`${FIXTURE_MONTH_ANCHOR}T00:00:00.000Z`).getTime()) / (7 * 86400000));
    return `${formatShortDate(category, l)} - ${formatShortDate(monthWeekEnd(bucketIndex), l)}`;
  };
}

function makeValueLabel(l: string) {
  return (n: number) => formatCount(n, l);
}

// Scope label stated once next to the title (`MantineDashboardCard`'s own `scopeLabel` slot) — the
// same anchor `DashboardLineChart.stories.tsx` establishes (Task 845 Pass 11 audit: this chart had
// a functional period control but never stated which period was active, one of five charts missing
// this slot entirely). `FROZEN_TODAY_ISO` matches the Storybook preview clock's own frozen instant
// (`.storybook/preview-head.html`, Task 698/D25) so "current week" is deterministic; the month/year
// anchor is this story's own fixture month, not tied to a specific calendar date.
function makeScopeLabel(l: string, period: Period): string {
  if (period === 'week') {
    const monday = currentWeekMonday();
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return `${formatShortDate(monday.toISOString().slice(0, 10), l)} - ${formatShortDate(sunday.toISOString().slice(0, 10), l)}`;
  }
  const year = new Date(FIXTURE_MONTH_ANCHOR).getUTCFullYear();
  if (period === 'year') return String(year);
  return `${formatMonthAbbrev(FIXTURE_MONTH_ANCHOR, l)} ${year}`;
}

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    const [period, setPeriod] = useState<Period>('month');
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard
          title={storyT(l, 'storybook.mantine.dashboard_bar_card_title')}
          scopeLabel={makeScopeLabel(l, period)}
          state="ready"
          headerAction={<PeriodHeaderAction l={l} period={period} onPeriodChange={setPeriod} />}
        >
          <MantineDashboardBarChart
            data={buildData(period)}
            series={buildSeries(l)}
            categoryLabel={makeCategoryLabel(l, period)}
            tooltipCategoryLabel={makeTooltipCategoryLabel(l, period)}
            valueLabel={makeValueLabel(l)}
            state="ready"
            allHiddenHint={storyT(l, 'storybook.mantine.dashboard_chart_all_hidden_hint')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_bar_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  play: async ({ canvasElement }) => {
    const legendToggles = canvasElement.querySelectorAll('button[aria-pressed]');
    expect(legendToggles.length).toBe(2);
    for (const toggle of legendToggles) expect(toggle.getAttribute('aria-pressed')).toBe('true');
  },
};

export const OneSeriesHidden: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_bar_card_title')} state="ready">
          <MantineDashboardBarChart
            data={buildData('month')}
            series={buildSeries(l)}
            categoryLabel={makeCategoryLabel(l, 'month')}
            valueLabel={makeValueLabel(l)}
            state="ready"
            allHiddenHint={storyT(l, 'storybook.mantine.dashboard_chart_all_hidden_hint')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_bar_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  play: async ({ canvasElement }) => {
    const legendToggles = canvasElement.querySelectorAll('button[aria-pressed]');
    const second = legendToggles[1] as HTMLButtonElement;
    second.focus();
    await userEvent.keyboard(' ');
    expect(second.getAttribute('aria-pressed')).toBe('false');
  },
};

export const Empty: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_bar_card_title')} state="ready">
          <MantineDashboardBarChart
            data={[]}
            series={buildSeries(l)}
            categoryLabel={makeCategoryLabel(l, 'month')}
            valueLabel={makeValueLabel(l)}
            state="empty"
            emptyTitle={storyT(l, 'storybook.mantine.dashboard_chart_empty_title')}
            emptyDescription={storyT(l, 'storybook.mantine.dashboard_chart_empty_description')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_bar_aria_label')}
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
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_bar_card_title')} state="ready">
          <MantineDashboardBarChart
            data={[]}
            series={buildSeries(l)}
            categoryLabel={makeCategoryLabel(l, 'month')}
            valueLabel={makeValueLabel(l)}
            state="error"
            errorText={storyT(l, 'storybook.mantine.dashboard_chart_error')}
            retryLabel={storyT(l, 'dashboard.common.retry')}
            onRetry={() => {}}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_bar_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
};
