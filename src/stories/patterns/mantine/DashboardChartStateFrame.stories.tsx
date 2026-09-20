import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box, Text } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardChartStateFrame } from '@/design-system/mantine/patterns/MantineDashboardChartStateFrame';
import { theme } from '@/design-system/mantine/theme';

const meta: Meta<typeof MantineDashboardChartStateFrame> = {
  title: 'Patterns/Mantine/DashboardChartStateFrame',
  component: MantineDashboardChartStateFrame,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The one canonical loading / error / empty frame shared by every `MantineDashboard*` chart pattern that takes a `state` prop (Task 845 Revision 2, X2) — previously the same three blocks were copied into five patterns. Every state keeps the chart minimum block size (`theme.other.boxSize.dashboardChartMinHeight`). Composes `MantineEmptyLoadingErrorState`. The Ready story renders a labelled placeholder child, not a chart; the real chart patterns each have their own Story. Viewport and locale switched via Storybook toolbar (Task 799 caveat — the toolbar does not yet resize the preview; open iframe.html directly and resize the browser window for owner review).',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardChartStateFrame>;

export const Ready: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardChartStateFrame state="ready">
          <Box mih={theme.other!.boxSize!.dashboardChartMinHeight}>
            {/* Fixture child — stands in for a chart; the label reuses an existing chart Story string. */}
            <Text size="sm" c="dimmed">
              {storyT(l, 'storybook.mantine.dashboard_chart_aria_label')}
            </Text>
          </Box>
        </MantineDashboardChartStateFrame>
      </Box>
    );
  },
};

export const Loading: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardChartStateFrame state="loading" loadingAriaLabel={storyT(l, 'dashboard.common.loading_label')} />
      </Box>
    );
  },
};

export const Empty: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardChartStateFrame
          state="empty"
          emptyTitle={storyT(l, 'storybook.mantine.dashboard_chart_empty_title')}
          emptyDescription={storyT(l, 'storybook.mantine.dashboard_chart_empty_description')}
        />
      </Box>
    );
  },
};

export const Error: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <MantineDashboardChartStateFrame
          state="error"
          errorText={storyT(l, 'storybook.mantine.dashboard_chart_error')}
          retryLabel={storyT(l, 'dashboard.common.retry')}
          onRetry={() => {}}
        />
      </Box>
    );
  },
};
