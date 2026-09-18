import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { SimpleGrid, Box } from '@mantine/core';
import { ClipboardList } from 'lucide-react';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardStatCard } from '@/design-system/mantine/patterns/MantineDashboardStatCard';
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
