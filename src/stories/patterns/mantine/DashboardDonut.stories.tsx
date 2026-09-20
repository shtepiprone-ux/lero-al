import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent, expect } from 'storybook/test';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardDonut, type DashboardDonutSegment } from '@/design-system/mantine/patterns/MantineDashboardDonut';
import { MantineDashboardCard } from '@/design-system/mantine/patterns/MantineDashboardCard';
import { MantineCombobox } from '@/design-system/mantine/patterns/MantineCombobox';
import { formatCount, formatShortDate, formatMonthAbbrev } from '@/lib/formatters';
import { theme } from '@/design-system/mantine/theme';

export type Period = 'week' | 'month' | 'year';

// Owner-requested (2026-09-19): a Week/Month/Year period filter in the card's top-right corner.
// Owner correction (same day, see `DashboardLineChart.stories.tsx`'s own copy of this helper for
// the full rationale): the canonical control is `MantineCombobox` (`variant="button"`), not
// `MantineSelect`. `period` is lifted to the story's own render function so selecting one actually
// re-derives `buildSegments`.
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
      // Task 845 Pass 15 (owner-reported): pinned to the same `dashboardPeriodColumn` width the
      // chart's own legend column now shares, so both trailing columns start at the identical X —
      // previously an implicit "auto" width that happened to render at this same value, not a
      // guaranteed one. Mobile (`base: '100%'`) is unchanged.
      triggerWidth={{ base: '100%', sm: theme.other!.boxSize!.dashboardPeriodColumn! }}
      triggerAriaLabel={storyT(l, 'storybook.mantine.dashboard_period_filter_label')}
      noResultsLabel={storyT(l, 'storybook.mantine.dashboard_period_filter_label')}
    />
  );
}

const meta: Meta<typeof MantineDashboardDonut> = {
  title: 'Patterns/Mantine/DashboardDonut',
  component: MantineDashboardDonut,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Canonical dashboard status-distribution donut (spec v3.3 §17.2 ADM-11; also the agent portfolio-visibility donut, 855), built against TailAdmin\'s own "Donut Pie Chart 2" (demo.tailadmin.com/pie-chart): a full ring, a bare total in the centre, and a plain horizontal dot+label legend below — every item is a hide/show toggle, never a link. The story wraps the pattern in the canonical `MantineDashboardCard` (Task 843) purely so its rendered card chrome matches the reference. Task 845. Viewport and locale switched via Storybook toolbar (Task 799 caveat).',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardDonut>;

// Fixed fixture counts (never `Math.random()`, check:stories §14.10). Seven real `ListingStatus`
// values plus one fixture-only 8th segment ("flagged") that has no `ListingStatus` counterpart —
// added only to exercise the required 8-segment layout (R6); it is not a real domain status.
// Owner-requested (2026-09-19): the period control must actually change what the chart renders —
// each period is its own fixed count set (a shorter window has fewer listings), never the same
// month's counts redrawn under a relabelled control.
const SEGMENT_COUNTS: Record<Period, number[]> = {
  week: [118, 9, 22, 15, 0, 5, 14, 2],
  month: [482, 37, 96, 64, 0, 21, 58, 9],
  year: [5240, 410, 1080, 720, 6, 240, 640, 96],
};
// Owner-reported (Task 845 Pass 13): the donut used `LISTING_STATUS_COLOR`/`VISIBILITY_TONE_COLOR`
// (this project's real status-badge palette) instead of the warm-pastel `theme.other.chartSeries`
// palette every other chart in this family reads (Pass 10's owner-provided reference) — a real,
// visible palette mismatch, not the "matches the badges elsewhere" justification this file
// previously recorded. Corrected to cycle through the same 5 `chartSeries` colours every sibling
// chart uses; `MantineDashboardDonut.tsx`'s own `resolveDistinctSegmentColors()` (already in that
// file, unchanged) shifts each of the 3 colliding segments (8 segments, 5 hues) to a different
// shade of the *same* hue, so all 8 still render as visually distinct swatches.
const SEGMENT_COLOR_CYCLE = [
  theme.other!.chartSeries!.recordedViews!,
  theme.other!.chartSeries!.whatsappClicks!,
  theme.other!.chartSeries!.formInquiries!,
  theme.other!.chartSeries!.chatThreads!,
  theme.other!.chartSeries!.chatInboundMessages!,
];
function buildSegments(l: string, period: Period): DashboardDonutSegment[] {
  const [active, pending, sold, rented, expired, inactive, archived, flagged] = SEGMENT_COUNTS[period];
  return [
    { key: 'active', label: storyT(l, 'storybook.mantine.admin_status_active'), count: active, color: SEGMENT_COLOR_CYCLE[0] },
    { key: 'pending', label: storyT(l, 'storybook.mantine.admin_status_pending'), count: pending, color: SEGMENT_COLOR_CYCLE[1] },
    { key: 'sold', label: storyT(l, 'storybook.mantine.admin_status_sold'), count: sold, color: SEGMENT_COLOR_CYCLE[2] },
    { key: 'rented', label: storyT(l, 'storybook.mantine.admin_status_rented'), count: rented, color: SEGMENT_COLOR_CYCLE[3] },
    { key: 'expired', label: storyT(l, 'storybook.mantine.admin_status_expired'), count: expired, color: SEGMENT_COLOR_CYCLE[4] },
    { key: 'inactive', label: storyT(l, 'storybook.mantine.admin_status_inactive'), count: inactive, color: SEGMENT_COLOR_CYCLE[0] },
    { key: 'archived', label: storyT(l, 'storybook.mantine.admin_status_archived'), count: archived, color: SEGMENT_COLOR_CYCLE[1] },
    { key: 'flagged', label: storyT(l, 'storybook.mantine.admin_status_flagged'), count: flagged, color: SEGMENT_COLOR_CYCLE[2] },
  ];
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
          title={storyT(l, 'storybook.mantine.dashboard_donut_card_title')}
          scopeLabel={makeScopeLabel(l, period)}
          state="ready"
          headerAction={<PeriodHeaderAction l={l} period={period} onPeriodChange={setPeriod} />}
        >
          <MantineDashboardDonut
            segments={buildSegments(l, period)}
            formatCount={(n) => formatCount(n, l)}
            state="ready"
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_donut_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // Confirms the legend renders one visible toggle per segment (8, including the 0-count
  // "Expired" one, which is muted-but-listed, never drawn in the ring).
  play: async ({ canvasElement }) => {
    const legendToggles = canvasElement.querySelectorAll('button[aria-pressed]');
    expect(legendToggles.length).toBe(8);
    for (const toggle of legendToggles) expect(toggle.getAttribute('aria-pressed')).toBe('true');
  },
};

export const OneSegmentHidden: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_donut_card_title')} state="ready">
          <MantineDashboardDonut
            segments={buildSegments(l, 'month')}
            formatCount={(n) => formatCount(n, l)}
            state="ready"
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_donut_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // Toggling the first legend item (keyboard: focus + Space, never a mouse click) hides its
  // segment and mutes the toggle; the ring and the centre total recompute from what remains.
  play: async ({ canvasElement }) => {
    const legendToggles = canvasElement.querySelectorAll('button[aria-pressed]');
    const first = legendToggles[0] as HTMLButtonElement;
    first.focus();
    await userEvent.keyboard(' ');
    expect(first.getAttribute('aria-pressed')).toBe('false');
  },
};

export const Empty: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_donut_card_title')} state="ready">
          <MantineDashboardDonut
            segments={[]}
            formatCount={(n) => formatCount(n, l)}
            state="empty"
            emptyText={storyT(l, 'storybook.mantine.dashboard_donut_empty_text')}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_donut_aria_label')}
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
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_donut_card_title')} state="ready">
          <MantineDashboardDonut
            segments={[]}
            formatCount={(n) => formatCount(n, l)}
            state="error"
            errorText={storyT(l, 'storybook.mantine.dashboard_chart_error')}
            retryLabel={storyT(l, 'dashboard.common.retry')}
            onRetry={() => {}}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_donut_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
};
