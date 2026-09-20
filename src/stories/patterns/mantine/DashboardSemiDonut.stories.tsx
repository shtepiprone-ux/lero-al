import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent, expect } from 'storybook/test';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import {
  MantineDashboardSemiDonut,
  type DashboardSemiDonutSegment,
} from '@/design-system/mantine/patterns/MantineDashboardSemiDonut';
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
      // Task 845 Pass 15 (owner-reported): same fix as `DashboardDonut.stories.tsx` — pinned to
      // the same `dashboardPeriodColumn` width the chart's own legend column now shares.
      triggerWidth={{ base: '100%', sm: theme.other!.boxSize!.dashboardPeriodColumn! }}
      triggerAriaLabel={storyT(l, 'storybook.mantine.dashboard_period_filter_label')}
      noResultsLabel={storyT(l, 'storybook.mantine.dashboard_period_filter_label')}
    />
  );
}

const meta: Meta<typeof MantineDashboardSemiDonut> = {
  title: 'Patterns/Mantine/DashboardSemiDonut',
  component: MantineDashboardSemiDonut,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Semicircle status/category donut, a literal structural copy of TailAdmin\'s own "Semi Donut Chart" (demo.tailadmin.com/pie-chart) — a distinct component from `MantineDashboardDonut` (the full-ring pattern), not a variant of it. A top-facing 180° arc, a 3px white gap between segments, nothing drawn inside the ring, and a plain dot+label legend below where every item is a hide/show toggle. The initial mount sweeps the arc in (recharts\' own animation, ~850ms); toggling a segment reflows the remaining arcs in ~350ms. The story wraps the pattern in the canonical `MantineDashboardCard` (Task 843) purely so its rendered card chrome matches the reference. Fixture: exactly the reference\'s 5 categories (Email, Social Media, Mobile, Direct, Other) — this component is never used for the 8 real listing statuses; that business mapping is a separate product decision.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardSemiDonut>;

// Fixed fixture values (never `Math.random()`, check:stories §14.10) — the same 5 categories as
// TailAdmin's own reference, in the same order. Owner-requested (2026-09-19): the period control
// must actually change what the chart renders — each period is its own fixed value set.
const SEGMENT_VALUES: Record<Period, number[]> = {
  week: [11, 7, 5, 2, 1],
  month: [42, 28, 18, 9, 3],
  year: [480, 320, 210, 110, 40],
};
function buildSegments(l: string, period: Period): DashboardSemiDonutSegment[] {
  const [email, social, mobile, direct, other] = SEGMENT_VALUES[period];
  return [
    { id: 'email', label: storyT(l, 'storybook.mantine.dashboard_semi_donut_email'), value: email, color: theme.other!.chartSeries!.chatThreads! },
    { id: 'social', label: storyT(l, 'storybook.mantine.dashboard_semi_donut_social'), value: social, color: theme.other!.chartSeries!.recordedViews! },
    { id: 'mobile', label: storyT(l, 'storybook.mantine.dashboard_semi_donut_mobile'), value: mobile, color: theme.other!.chartSeries!.formInquiries! },
    { id: 'direct', label: storyT(l, 'storybook.mantine.dashboard_semi_donut_direct'), value: direct, color: theme.other!.chartSeries!.whatsappClicks! },
    { id: 'other', label: storyT(l, 'storybook.mantine.dashboard_semi_donut_other'), value: other, color: theme.other!.chartSeries!.chatInboundMessages! },
  ];
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
          title={storyT(l, 'storybook.mantine.dashboard_semi_donut_card_title')}
          scopeLabel={makeScopeLabel(l, period)}
          state="ready"
          headerAction={<PeriodHeaderAction l={l} period={period} onPeriodChange={setPeriod} />}
        >
          <MantineDashboardSemiDonut
            segments={buildSegments(l, period)}
            valueLabel={makeValueLabel(l)}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_semi_donut_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  play: async ({ canvasElement }) => {
    const legendToggles = canvasElement.querySelectorAll('button[aria-pressed]');
    expect(legendToggles.length).toBe(5);
    for (const toggle of legendToggles) expect(toggle.getAttribute('aria-pressed')).toBe('true');
  },
};

export const OneSegmentHidden: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_semi_donut_card_title')} state="ready">
          <MantineDashboardSemiDonut
            segments={buildSegments(l, 'month')}
            valueLabel={makeValueLabel(l)}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_semi_donut_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // Toggling by keyboard (focus + Space, never a mouse click) hides that segment; the ring
  // reflows to fill the semicircle from what remains (visual proof: real-browser screenshots).
  play: async ({ canvasElement }) => {
    const legendToggles = canvasElement.querySelectorAll('button[aria-pressed]');
    const first = legendToggles[0] as HTMLButtonElement;
    first.focus();
    await userEvent.keyboard(' ');
    expect(first.getAttribute('aria-pressed')).toBe('false');
  },
};

export const MultipleSegmentsHidden: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardCard title={storyT(l, 'storybook.mantine.dashboard_semi_donut_card_title')} state="ready">
          <MantineDashboardSemiDonut
            segments={buildSegments(l, 'month')}
            valueLabel={makeValueLabel(l)}
            ariaLabel={storyT(l, 'storybook.mantine.dashboard_semi_donut_aria_label')}
          />
        </MantineDashboardCard>
      </Box>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // Task 845 Revision 1 (W4 gate evidence) — a real, reproducible defect found while running the
  // final gate: raw unawaited `.click()` + a synchronous assertion races React's state flush (the
  // click handler's `setState` does not always land on the DOM's `aria-pressed` attribute within
  // the same synchronous tick a real browser gives a native `.click()`). Reproduced directly
  // (Playwright against the built `storybook-static`, real Chromium, 320px viewport, `sq` locale):
  // the assertion failed on the story's own automatic play-function run, which then left
  // Storybook's error overlay covering the component and blocking every further pointer event.
  // Fixed with `userEvent.click` (awaited), the same properly-awaited mechanism every other play
  // function in this file (and its siblings) already uses for a keyboard toggle.
  play: async ({ canvasElement }) => {
    const legendToggles = canvasElement.querySelectorAll('button[aria-pressed]');
    await userEvent.click(legendToggles[1] as HTMLButtonElement);
    await userEvent.click(legendToggles[3] as HTMLButtonElement);
    expect(legendToggles[1].getAttribute('aria-pressed')).toBe('false');
    expect(legendToggles[3].getAttribute('aria-pressed')).toBe('false');
  },
};
