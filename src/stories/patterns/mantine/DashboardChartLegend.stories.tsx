import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardChartLegend, type DashboardChartLegendItem } from '@/design-system/mantine/patterns/MantineDashboardChartLegend';
import { theme } from '@/design-system/mantine/theme';

const meta: Meta<typeof MantineDashboardChartLegend> = {
  title: 'Patterns/Mantine/DashboardChartLegend',
  component: MantineDashboardChartLegend,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The one canonical dot+label legend-toggle row/column shared by every `MantineDashboard*` chart pattern (Task 845 Revision 1, W2) — previously a `LegendToggle` function copied six times, once per pattern file. Viewport and locale switched via Storybook toolbar (Task 799 caveat — the toolbar does not yet resize the preview; open iframe.html directly and resize the browser window for owner review).',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardChartLegend>;

// Reuses the existing dashboard-chart-series fixture labels/colours (Task 845's own
// `dashboard_chart_series_*` keys) — no new i18n keys needed for this Story.
function buildItems(l: string, hiddenKeys: string[]): DashboardChartLegendItem[] {
  const base = [
    { key: 'recordedViews', label: storyT(l, 'storybook.mantine.dashboard_chart_series_views'), color: theme.other!.chartSeries!.recordedViews! },
    { key: 'whatsappClicks', label: storyT(l, 'storybook.mantine.dashboard_chart_series_whatsapp'), color: theme.other!.chartSeries!.whatsappClicks! },
    { key: 'formInquiries', label: storyT(l, 'storybook.mantine.dashboard_chart_series_inquiries'), color: theme.other!.chartSeries!.formInquiries! },
  ];
  return base.map((item) => ({ ...item, visible: !hiddenKeys.includes(item.key) }));
}

function InteractiveLegend({ l, layout, initialHidden = [] }: { l: string; layout: 'row' | 'column'; initialHidden?: string[] }) {
  const [hidden, setHidden] = useState<string[]>(initialHidden);
  const toggle = (key: string) => setHidden((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  return (
    <MantineDashboardChartLegend
      items={buildItems(l, hidden)}
      onToggle={toggle}
      layout={layout}
      columnWidth={theme.other!.boxSize!.dashboardPeriodColumn}
      ariaLabel={storyT(l, 'storybook.mantine.dashboard_chart_aria_label')}
    />
  );
}

export const AllVisible: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <InteractiveLegend l={l} layout="row" />
      </Box>
    );
  },
};

export const OneHidden: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.content}>
        <InteractiveLegend l={l} layout="row" initialHidden={['whatsappClicks']} />
      </Box>
    );
  },
};
