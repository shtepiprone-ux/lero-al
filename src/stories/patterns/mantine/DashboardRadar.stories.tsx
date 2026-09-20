import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent, expect } from 'storybook/test';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import {
  MantineDashboardRadar,
  type DashboardRadarDatum,
  type DashboardRadarSeries,
} from '@/design-system/mantine/patterns/MantineDashboardRadar';
import { MantineDashboardCard } from '@/design-system/mantine/patterns/MantineDashboardCard';
import { MantineCombobox } from '@/design-system/mantine/patterns/MantineCombobox';
import { formatCount, formatShortDate, formatMonthAbbrev } from '@/lib/formatters';
import { theme } from '@/design-system/mantine/theme';

export type Period = 'week' | 'month' | 'year';

// Owner-requested (2026-09-19): a Week/Month/Year period filter in the card's top-right corner.
// Owner correction (same day, see `DashboardLineChart.stories.tsx`'s own copy of this helper for
// the full rationale): the canonical control is `MantineCombobox` (`variant="button"`), not
// `MantineSelect`. `period` is lifted to the story's own render function so selecting one actually
// re-derives `buildData`.
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
      // Task 845 Pass 15 (owner-reported): same fix as `DashboardDonut.stories.tsx` — pinned to
      // the same `dashboardPeriodColumn` width the chart's own legend column now shares.
      triggerWidth={{ base: '100%', sm: theme.other!.boxSize!.dashboardPeriodColumn! }}
      triggerAriaLabel={storyT(l, 'storybook.mantine.dashboard_period_filter_label')}
      noResultsLabel={storyT(l, 'storybook.mantine.dashboard_period_filter_label')}
    />
  );
}

const meta: Meta<typeof MantineDashboardRadar> = {
  title: 'Patterns/Mantine/DashboardRadar',
  component: MantineDashboardRadar,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Canonical dashboard radar chart, built against TailAdmin\'s own Radar Chart 2 (demo.tailadmin.com/radar-chart): a filled polygon per series with vertex dots, a legend below (plain dot+label toggles, canonical `Button variant="subtle"`), no data table. The story wraps the pattern in the canonical `MantineDashboardCard` (Task 843) purely so its rendered card chrome matches the reference. No consumer wired yet.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardRadar>;

// Fixed fixture values (never `Math.random()`, check:stories §14.10). Owner-requested
// (2026-09-19): the period control must actually change what the chart renders.
const RADAR_VALUES: Record<Period, { current: number[]; previous: number[] }> = {
  week: { current: [19, 14, 8, 17, 11, 5], previous: [15, 11, 9, 12, 9, 4] },
  month: { current: [82, 58, 34, 71, 45, 22], previous: [64, 45, 40, 52, 38, 18] },
  year: { current: [940, 660, 410, 810, 520, 260], previous: [760, 520, 460, 600, 440, 210] },
};
function buildData(period: Period): DashboardRadarDatum[] {
  const categories = ['views', 'inquiries', 'calls', 'messages', 'visits', 'offers'];
  const { current, previous } = RADAR_VALUES[period];
  return categories.map((category, i) => ({ category, current: current[i], previous: previous[i] }));
}

// Owner-reported (Task 845 Pass 12): the tooltip always read "Цей місяць"/"Минулий місяць" (This
// month/Last month) regardless of the selected period — hovering the Week view's own point still
// claimed it was a monthly value. The series label must track `period` the same way
// `makeScopeLabel` already does, so it needs its own translated key per period (never composed by
// string-concatenating a period noun onto a fixed "This"/"Last" — Italian/Albanian require
// per-noun grammatical agreement `settimana`/`mese`/`anno` and `javë`/`muaj`/`vit` do not share,
// so a fully translated literal per period, matching this project's existing convention for every
// other chart label, is the only correct approach).
function buildSeries(l: string, period: Period): DashboardRadarSeries[] {
  return [
    { key: 'current', label: storyT(l, `storybook.mantine.dashboard_radar_series_current_${period}`), color: theme.other!.chartSeries!.recordedViews! },
    { key: 'previous', label: storyT(l, `storybook.mantine.dashboard_radar_series_previous_${period}`), color: theme.other!.chartSeries!.formInquiries! },
  ];
}

const CATEGORY_KEY_MAP: Record<string, string> = {
  views: 'storybook.mantine.dashboard_radar_category_views',
  inquiries: 'storybook.mantine.dashboard_radar_category_inquiries',
  calls: 'storybook.mantine.dashboard_radar_category_calls',
  messages: 'storybook.mantine.dashboard_radar_category_messages',
  visits: 'storybook.mantine.dashboard_radar_category_visits',
  offers: 'storybook.mantine.dashboard_radar_category_offers',
};

function makeCategoryLabel(l: string) {
  return (category: string) => storyT(l, CATEGORY_KEY_MAP[category] ?? category);
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
          title={storyT(l, 'storybook.mantine.dashboard_radar_card_title')}
          scopeLabel={makeScopeLabel(l, period)}
          state="ready"
          headerAction={<PeriodHeaderAction l={l} period={period} onPeriodChange={setPeriod} />}
        >
          <MantineDashboardRadar
            data={buildData(period)}
            series={buildSeries(l, period)}
            categoryLabel={makeCategoryLabel(l)}
            valueLabel={makeValueLabel(l)}
            state="ready"
            allHiddenHint={storyT(l, 'storybook.mantine.dashboard_chart_all_hidden_hint')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_radar_aria_label')}
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
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_radar_card_title')} state="ready">
          <MantineDashboardRadar
            data={buildData('month')}
            series={buildSeries(l, 'month')}
            categoryLabel={makeCategoryLabel(l)}
            valueLabel={makeValueLabel(l)}
            state="ready"
            allHiddenHint={storyT(l, 'storybook.mantine.dashboard_chart_all_hidden_hint')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_radar_aria_label')}
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
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_radar_card_title')} state="ready">
          <MantineDashboardRadar
            data={[]}
            series={buildSeries(l, 'month')}
            categoryLabel={makeCategoryLabel(l)}
            valueLabel={makeValueLabel(l)}
            state="empty"
            emptyTitle={storyT(l, 'storybook.mantine.dashboard_chart_empty_title')}
            emptyDescription={storyT(l, 'storybook.mantine.dashboard_chart_empty_description')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_radar_aria_label')}
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
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_radar_card_title')} state="ready">
          <MantineDashboardRadar
            data={[]}
            series={buildSeries(l, 'month')}
            categoryLabel={makeCategoryLabel(l)}
            valueLabel={makeValueLabel(l)}
            state="error"
            errorText={storyT(l, 'storybook.mantine.dashboard_chart_error')}
            retryLabel={storyT(l, 'dashboard.common.retry')}
            onRetry={() => {}}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_radar_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
};
