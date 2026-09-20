import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardRadialProgress } from '@/design-system/mantine/patterns/MantineDashboardRadialProgress';
import { MantineDashboardCard } from '@/design-system/mantine/patterns/MantineDashboardCard';
import { MantineCombobox } from '@/design-system/mantine/patterns/MantineCombobox';
import { theme } from '@/design-system/mantine/theme';
import { formatShortDate, formatMonthAbbrev } from '@/lib/formatters';

export type Period = 'week' | 'month' | 'year';

// Owner-requested (2026-09-19): a Week/Month/Year period filter in the card's top-right corner.
// Owner correction (same day, see `DashboardLineChart.stories.tsx`'s own copy of this helper for
// the full rationale): the canonical control is `MantineCombobox` (`variant="button"`), not
// `MantineSelect`. `period` is lifted to the story's own render function so selecting one actually
// changes the rendered value below.
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

const meta: Meta<typeof MantineDashboardRadialProgress> = {
  title: 'Patterns/Mantine/DashboardRadialProgress',
  component: MantineDashboardRadialProgress,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Canonical dashboard radial progress ring, built against TailAdmin\'s own "Radial Progress Chart" reference (demo.tailadmin.com/radial-chart): a single value drawn as a full-circle arc over a light track, with a centred value + caption. A single value has nothing to toggle, so this pattern has no legend, unlike every other chart in the family. The story wraps the pattern in the canonical `MantineDashboardCard` (Task 843) purely so its rendered card chrome matches the reference. No consumer wired yet.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardRadialProgress>;

function formatPercent(n: number): string {
  return `${n}%`;
}

// Owner-requested (2026-09-19): the period control must actually change what the chart renders.
const RADIAL_VALUES: Record<Period, number> = { week: 48.5, month: 62.25, year: 74.8 };

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
          title={storyT(l, 'storybook.mantine.dashboard_radial_card_title')}
          scopeLabel={makeScopeLabel(l, period)}
          state="ready"
          headerAction={<PeriodHeaderAction l={l} period={period} onPeriodChange={setPeriod} />}
        >
          <MantineDashboardRadialProgress
            value={RADIAL_VALUES[period]}
            label={storyT(l, 'storybook.mantine.dashboard_radial_label')}
            formatValue={formatPercent}
            color={theme.other!.chartSeries!.recordedViews!}
            state="ready"
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_radial_aria_label')}
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
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_radial_card_title')} state="ready">
          <MantineDashboardRadialProgress
            value={0}
            label={storyT(l, 'storybook.mantine.dashboard_radial_label')}
            formatValue={formatPercent}
            color={theme.other!.chartSeries!.recordedViews!}
            state="ready"
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_radial_aria_label')}
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
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_radial_card_title')} state="ready">
          <MantineDashboardRadialProgress
            value={0}
            label={storyT(l, 'storybook.mantine.dashboard_radial_label')}
            formatValue={formatPercent}
            color={theme.other!.chartSeries!.recordedViews!}
            state="loading"
            loadingAriaLabel={storyT(l, 'dashboard.common.loading_label')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_radial_aria_label')}
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
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_radial_card_title')} state="ready">
          <MantineDashboardRadialProgress
            value={0}
            label={storyT(l, 'storybook.mantine.dashboard_radial_label')}
            formatValue={formatPercent}
            color={theme.other!.chartSeries!.recordedViews!}
            state="error"
            errorText={storyT(l, 'storybook.mantine.dashboard_chart_error')}
            retryLabel={storyT(l, 'dashboard.common.retry')}
            onRetry={() => {}}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_radial_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
};
