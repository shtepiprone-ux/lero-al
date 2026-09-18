import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { SimpleGrid, Box } from '@mantine/core';
import { Inbox } from 'lucide-react';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardStatRows, type DashboardStatRow } from '@/design-system/mantine/patterns/MantineDashboardStatRows';
import { theme } from '@/design-system/mantine/theme';

const meta: Meta<typeof MantineDashboardStatRows> = {
  title: 'Patterns/Mantine/DashboardStatRows',
  component: MantineDashboardStatRows,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Canonical dashboard labelled-count-row list (spec v3.3 §17.2 ADM-09, §17.3 AGT-01/AGT-02). Each row is its own link at least `touchTarget` (44px) tall. `allZeroState` replaces the rows only when the caller passes it. Task 843. Viewport and locale switched via Storybook toolbar (Task 799 caveat).' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardStatRows>;

function threeRows(l: string): DashboardStatRow[] {
  return [
    { label: storyT(l, 'storybook.mantine.dashboard_rows_label_pending'), count: 3, href: '/admin/reports?status=pending', tone: 'warning' },
    { label: storyT(l, 'storybook.mantine.dashboard_rows_label_in_review'), count: 0, href: '/admin/reports?status=in_review', tone: 'neutral' },
    { label: storyT(l, 'storybook.mantine.dashboard_rows_label_rejected'), count: 1, href: '/admin/reports?status=rejected', tone: 'danger' },
  ];
}

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md">
        <Box maw={theme.other!.boxSize!.emptyState}>
          <MantineDashboardStatRows rows={threeRows(l)} state="ready" />
        </Box>

        <Box maw={theme.other!.boxSize!.emptyState}>
          {/* Revision 1, F1 — the all-zero demo passes real rows with count 0 (AC3's own
              `[0, 0, 0]` shape), not `rows={[]}`, since the pattern now evaluates
              `rows.every((r) => r.count === 0)` itself rather than trusting the caller alone. */}
          <MantineDashboardStatRows
            rows={[
              { label: storyT(l, 'storybook.mantine.dashboard_rows_label_pending'), count: 0, href: '/admin/reports?status=pending', tone: 'warning' },
              { label: storyT(l, 'storybook.mantine.dashboard_rows_label_in_review'), count: 0, href: '/admin/reports?status=in_review', tone: 'neutral' },
              { label: storyT(l, 'storybook.mantine.dashboard_rows_label_rejected'), count: 0, href: '/admin/reports?status=rejected', tone: 'danger' },
            ]}
            allZeroState={{
              icon: <Inbox size={theme.other!.iconSize!.decorative} aria-hidden="true" />,
              text: storyT(l, 'storybook.mantine.dashboard_rows_all_zero_text'),
            }}
            state="ready"
          />
        </Box>

        <Box maw={theme.other!.boxSize!.emptyState}>
          <MantineDashboardStatRows
            rows={threeRows(l)}
            state="loading"
            loadingAriaLabel={storyT(l, 'dashboard.common.loading_label')}
          />
        </Box>

        <Box maw={theme.other!.boxSize!.emptyState}>
          <MantineDashboardStatRows
            rows={threeRows(l)}
            state="error"
            errorMessage={storyT(l, 'storybook.mantine.dashboard_rows_error')}
            retryLabel={storyT(l, 'dashboard.common.retry')}
            onRetry={() => {}}
          />
        </Box>
      </SimpleGrid>
    );
  },
  parameters: { throwPlayFunctionExceptions: true },
  // AC3 — three rows with counts [3,0,1] render three links; AC6 — each link is >= touchTarget tall.
  play: async ({ canvasElement }) => {
    const firstGroupLinks = canvasElement.querySelectorAll('a');
    expect(firstGroupLinks.length).toBe(3); // the "ready" three-row group only renders <a> rows
    const minPx = 44; // resolved theme.other.touchTarget at a 16px root
    for (const link of firstGroupLinks) {
      const rect = link.getBoundingClientRect();
      expect(rect.height).toBeGreaterThanOrEqual(minPx - 1); // -1: sub-pixel rounding tolerance
    }
  },
};

export const Loading: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.emptyState}>
        <MantineDashboardStatRows
          rows={threeRows(l)}
          state="loading"
          loadingAriaLabel={storyT(l, 'dashboard.common.loading_label')}
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
        <MantineDashboardStatRows
          rows={threeRows(l)}
          state="error"
          errorMessage={storyT(l, 'storybook.mantine.dashboard_rows_error')}
          retryLabel={storyT(l, 'dashboard.common.retry')}
          onRetry={() => {}}
        />
      </Box>
    );
  },
};
