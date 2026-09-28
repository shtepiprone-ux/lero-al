import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, waitFor } from 'storybook/test';
import { SimpleGrid } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import {
  MantineDashboardSparkline,
  type DashboardSparklineDatum,
} from '@/design-system/mantine/patterns/MantineDashboardSparkline';
import { formatCount, formatWeekdayShort, formatShortDate } from '@/lib/formatters';
import { theme } from '@/design-system/mantine/theme';

const meta: Meta<typeof MantineDashboardSparkline> = {
  title: 'Patterns/Mantine/DashboardSparkline',
  component: MantineDashboardSparkline,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Canonical KPI mini bar chart (Task 889, D78-9), built against the Lahomes Analytics KPI row (techzaa.in/lahomes/admin/index.html, top four cards). No axes, no legend — the native ApexCharts tooltip carries the date/value text. Consumed by `MantineDashboardStatCard`\'s `chart` slot (890/891, not wired in this task).',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardSparkline>;

// Fixed fixture dates/values (never `Math.random()`, check:stories §14.10). The anchor matches the
// Storybook preview's frozen clock (`.storybook/preview-head.html`, Task 698, D25:
// `2026-07-30T00:00:00.000Z`), same anchor `DashboardBarChart.stories.tsx`/`DashboardLineChart.stories.tsx`
// already use.
const FROZEN_TODAY_ISO = '2026-07-30T00:00:00.000Z';
function daysAgo(days: number): string {
  const anchor = new Date(FROZEN_TODAY_ISO);
  const d = new Date(anchor);
  d.setUTCDate(anchor.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}
function seriesData(values: number[]): DashboardSparklineDatum[] {
  return values.map((value, i) => ({ date: daysAgo(values.length - 1 - i), value }));
}

const DEFAULT_VALUES = [12, 18, 9, 22, 15, 27, 19];
const ALL_ZERO_VALUES = [0, 0, 0, 0, 0, 0, 0];
const THIRTY_DAY_VALUES = [
  6, 9, 7, 11, 8, 13, 10, 15, 12, 17, 14, 19, 16, 21, 18, 23, 20, 25, 22, 27, 24, 29, 26, 31, 28, 33, 30, 35, 32, 37,
];

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      // Task 889 rev 4 (O889-1 row 1): the same KPI-cell grid `DashboardStatCard.stories.tsx` uses
      // (`SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md"`) — breakpoint-keyed, no fixed width
      // (GR-3b) — so the chart's fluid width is exercised against a real KPI-card-sized cell.
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md">
        <MantineDashboardSparkline
          data={seriesData(DEFAULT_VALUES)}
          color={theme.other!.chartSeries!.recordedViews!}
          valueLabel={(n) => formatCount(n, l)}
          dateLabel={(date) => formatWeekdayShort(date, l)}
          ariaLabel={storyT(l, 'storybook.mantine.dashboard_sparkline_aria_label')}
        />
      </SimpleGrid>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // AC1 — 7 bars, role="img" wrapper with the story's aria-label. `ReactApexChart` is a client-only
  // dynamic import (`ssr:false`) that draws its SVG asynchronously after mount, so the bar count is
  // awaited rather than read immediately — the same `waitFor` pattern
  // `DashboardPeriodControl.stories.tsx` already uses for its own async-rendered popup content. The
  // aria-label is compared against the active toolbar locale (`globals.locale`), not a fixed `'en'` —
  // `render`'s own `ariaLabel={storyT(l, ...)}` renders the translated string for sq/uk/it too.
  play: async ({ canvasElement, globals }) => {
    const l = (globals?.locale as string) ?? 'en';
    const wrapper = canvasElement.querySelector<HTMLElement>('[role="img"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute('aria-label')).toBe(storyT(l, 'storybook.mantine.dashboard_sparkline_aria_label'));
    await waitFor(() => {
      expect(canvasElement.querySelectorAll('.apexcharts-bar-area').length).toBe(7);
      // Task 889 rev 4 (AC10, O889-1 row 1): the chart fills its grid cell, not a fixed-width box.
      // The grid item (`wrapper`) itself IS the cell content box under CSS Grid's default
      // `justify-items: stretch`, so the independent check reads the container's own resolved
      // `grid-template-columns` track sizes rather than comparing the wrapper to itself.
      const grid = wrapper!.parentElement!;
      const trackWidths = getComputedStyle(grid).gridTemplateColumns.split(' ').map((v) => parseFloat(v));
      const cellWidth = trackWidths[0];
      expect(Math.round(wrapper!.getBoundingClientRect().width)).toBe(Math.round(cellWidth));
      const svg = wrapper!.querySelector<SVGElement>('svg.apexcharts-svg');
      expect(svg).not.toBeNull();
      expect(Math.round(svg!.getBoundingClientRect().width)).toBe(Math.round(cellWidth));
    }, { timeout: 5000 });
  },
};

export const AllZero: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      // Task 889 rev 4 (O889-1 row 1): same KPI-cell grid as `Default` (see its comment).
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md">
        <MantineDashboardSparkline
          data={seriesData(ALL_ZERO_VALUES)}
          color={theme.other!.chartSeries!.recordedViews!}
          valueLabel={(n) => formatCount(n, l)}
          dateLabel={(date) => formatWeekdayShort(date, l)}
          ariaLabel={storyT(l, 'storybook.mantine.dashboard_sparkline_aria_label')}
        />
      </SimpleGrid>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // AC1 — with AllZero, every bar's rendered height is 0 (never a fake baseline). Awaited for the
  // same async-chart-draw reason as `Default`.
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelectorAll('.apexcharts-bar-area').length).toBe(7), { timeout: 5000 });
    const bars = canvasElement.querySelectorAll<SVGElement>('.apexcharts-bar-area');
    for (const bar of bars) {
      expect(bar.getBoundingClientRect().height).toBe(0);
    }
  },
};

export const ThirtyDays: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      // Task 889 rev 4 (O889-1 row 1): same KPI-cell grid as `Default` (see its comment).
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md">
        <MantineDashboardSparkline
          data={seriesData(THIRTY_DAY_VALUES)}
          color={theme.other!.chartSeries!.recordedViews!}
          valueLabel={(n) => formatCount(n, l)}
          dateLabel={(date) => formatShortDate(date, l)}
          ariaLabel={storyT(l, 'storybook.mantine.dashboard_sparkline_aria_label')}
        />
      </SimpleGrid>
    );
  },
};
