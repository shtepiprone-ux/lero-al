import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { SimpleGrid, Box } from '@mantine/core';
import { ClipboardList } from 'lucide-react';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardStatCard } from '@/design-system/mantine/patterns/MantineDashboardStatCard';
import { MantineDashboardSparkline } from '@/design-system/mantine/patterns/MantineDashboardSparkline';
import { formatCount, formatWeekdayShort } from '@/lib/formatters';
import { theme } from '@/design-system/mantine/theme';

const meta: Meta<typeof MantineDashboardStatCard> = {
  title: 'Patterns/Mantine/DashboardStatCard',
  component: MantineDashboardStatCard,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Canonical dashboard top-row KPI/queue card (spec v3.3 §16.1-§17.3, TailAdmin §6u anatomy). With `href`, the whole card is one `<a>` — the spec\'s single drill-down target. Task 843. Viewport and locale switched via Storybook toolbar (Task 799 caveat).' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardStatCard>;

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md">
        <MantineDashboardStatCard
          icon={<ClipboardList size={theme.other!.iconSize!.decorative} />}
          label={storyT(l, 'storybook.mantine.dashboard_stat_label')}
          value="12"
          caption={storyT(l, 'storybook.mantine.dashboard_stat_caption')}
          href="/admin/listings?status=pending"
          state="ready"
        />

        <MantineDashboardStatCard
          icon={<ClipboardList size={theme.other!.iconSize!.decorative} />}
          label={storyT(l, 'storybook.mantine.dashboard_stat_label')}
          value="0"
          zeroText={storyT(l, 'storybook.mantine.dashboard_stat_zero_text')}
          href="/admin/listings?status=pending"
          state="zero"
        />

        <MantineDashboardStatCard
          icon={<ClipboardList size={theme.other!.iconSize!.decorative} />}
          label={storyT(l, 'storybook.mantine.dashboard_stat_label')}
          value="—"
          state="loading"
          loadingAriaLabel={storyT(l, 'dashboard.common.loading_label')}
        />

        <MantineDashboardStatCard
          icon={<ClipboardList size={theme.other!.iconSize!.decorative} />}
          label={storyT(l, 'storybook.mantine.dashboard_stat_label')}
          value="—"
          state="error"
          errorMessage={storyT(l, 'storybook.mantine.dashboard_stat_error')}
          retryLabel={storyT(l, 'dashboard.common.retry')}
          onRetry={() => {}}
        />
      </SimpleGrid>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // AC2 — exactly one <a> wraps the ready/zero (href) cards' content, and the error card's
  // Retry <button> is never a descendant of any <a> (spec §17.1 single-drill-down-target rule).
  play: async ({ canvasElement }) => {
    const anchors = canvasElement.querySelectorAll('a');
    expect(anchors.length).toBe(2); // ready card + zero card, each exactly one <a>
    for (const a of anchors) {
      expect(a.querySelectorAll('a').length).toBe(0); // no nested <a>
    }
    const buttons = canvasElement.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button.closest('a')).toBeNull();
    }
  },
};

export const Loading: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.emptyState}>
        <MantineDashboardStatCard
          icon={<ClipboardList size={theme.other!.iconSize!.decorative} />}
          label={storyT(l, 'storybook.mantine.dashboard_stat_label')}
          value="—"
          state="loading"
          loadingAriaLabel={storyT(l, 'dashboard.common.loading_label')}
        />
      </Box>
    );
  },
};

export const Zero: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.emptyState}>
        <MantineDashboardStatCard
          icon={<ClipboardList size={theme.other!.iconSize!.decorative} />}
          label={storyT(l, 'storybook.mantine.dashboard_stat_label')}
          value="0"
          zeroText={storyT(l, 'storybook.mantine.dashboard_stat_zero_text')}
          href="/admin/listings?status=pending"
          state="zero"
        />
      </Box>
    );
  },
};

export const Error: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.emptyState}>
        <MantineDashboardStatCard
          icon={<ClipboardList size={theme.other!.iconSize!.decorative} />}
          label={storyT(l, 'storybook.mantine.dashboard_stat_label')}
          value="—"
          state="error"
          errorMessage={storyT(l, 'storybook.mantine.dashboard_stat_error')}
          retryLabel={storyT(l, 'dashboard.common.retry')}
          onRetry={() => {}}
        />
      </Box>
    );
  },
};

// Fixed fixture dates/values (never `Math.random()`, check:stories §14.10) — same frozen-clock
// anchor `DashboardBarChart.stories.tsx`/`DashboardSparkline.stories.tsx` already use.
const CHART_SLOT_ANCHOR_ISO = '2026-07-30T00:00:00.000Z';
function chartSlotDaysAgo(days: number): string {
  const anchor = new Date(CHART_SLOT_ANCHOR_ISO);
  const d = new Date(anchor);
  d.setUTCDate(anchor.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}
const CHART_SLOT_VALUES = [12, 18, 9, 22, 15, 27, 19];

export const WithChart: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md">
        <MantineDashboardStatCard
          icon={<ClipboardList size={theme.other!.iconSize!.decorative} />}
          label={storyT(l, 'storybook.mantine.dashboard_stat_label')}
          value="12"
          caption={storyT(l, 'storybook.mantine.dashboard_stat_caption')}
          state="ready"
          chart={
            <MantineDashboardSparkline
              data={CHART_SLOT_VALUES.map((value, i) => ({ date: chartSlotDaysAgo(CHART_SLOT_VALUES.length - 1 - i), value }))}
              color={theme.other!.chartSeries!.recordedViews!}
              valueLabel={(n) => formatCount(n, l)}
              dateLabel={(date) => formatWeekdayShort(date, l)}
              ariaLabel={storyT(l, 'storybook.mantine.dashboard_sparkline_aria_label')}
            />
          }
        />
      </SimpleGrid>
    );
  },
};

export const Accent: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md">
        <MantineDashboardStatCard
          icon={<ClipboardList size={theme.other!.iconSize!.decorative} />}
          label={storyT(l, 'storybook.mantine.dashboard_stat_label')}
          value="12"
          caption={storyT(l, 'storybook.mantine.dashboard_stat_caption')}
          state="ready"
          variant="accent"
        />
      </SimpleGrid>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // AC4-R3 (rev 3, D889-2) — accent fill is `theme.other.accentHeroGradient` (`brand.7` -> `brand.9`,
  // 180deg): a `linear-gradient` computed `background-image` whose two colour stops are
  // `rgb(236, 84, 71)` (`brand.7`, #EC5447) and `rgb(142, 50, 43)` (`brand.9`, #8E322B). `brand.8`
  // (#BD4339 -> rgb(189, 67, 57)) is no longer used by the accent variant. The `180deg` angle is
  // asserted against the element's own inline `style` attribute, not `getComputedStyle`: 180deg is
  // CSS's default gradient direction ("to bottom"), so Chromium's computed-style serializer omits
  // the angle entirely once resolved (verified live: computed `background-image` reads
  // `linear-gradient(rgb(236, 84, 71) 0%, rgb(142, 50, 43) 100%)`, no angle token) — the inline style
  // still carries the authored `linear-gradient(180deg, var(--mantine-color-brand-7) 0%, ...)`.
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('.mantine-Card-root') as HTMLElement | null;
    expect(card).not.toBeNull();
    if (card) {
      const backgroundImage = getComputedStyle(card).backgroundImage;
      expect(backgroundImage).toContain('linear-gradient');
      expect(backgroundImage).toContain('rgb(236, 84, 71)');
      expect(backgroundImage).toContain('rgb(142, 50, 43)');
      expect(card.getAttribute('style') ?? '').toContain('180deg');
    }
  },
};
