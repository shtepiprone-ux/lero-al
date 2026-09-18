import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SimpleGrid, Text, Box } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardCard } from '@/design-system/mantine/patterns/MantineDashboardCard';
import { theme } from '@/design-system/mantine/theme';

const meta: Meta<typeof MantineDashboardCard> = {
  title: 'Patterns/Mantine/DashboardCard',
  component: MantineDashboardCard,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Canonical dashboard section-card shell (spec v3.3 §16.1, §17.1, §17.4). Title stays visible in every state; error/stale never replace it. Task 843. Viewport and locale switched via Storybook toolbar (Task 799 caveat — the toolbar does not yet resize the preview; open iframe.html directly and resize the browser window for owner review).' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDashboardCard>;

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} p="md">
        <MantineDashboardCard
          title={storyT(l, 'storybook.mantine.dashboard_card_title')}
          scopeLabel={storyT(l, 'storybook.mantine.dashboard_card_scope_now')}
          state="ready"
        >
          <Text size="sm" c="gray.7">
            {storyT(l, 'storybook.mantine.dashboard_card_body')}
          </Text>
        </MantineDashboardCard>

        <MantineDashboardCard
          title={storyT(l, 'storybook.mantine.dashboard_card_title')}
          scopeLabel={storyT(l, 'storybook.mantine.dashboard_card_scope_now')}
          state="loading"
          loadingAriaLabel={storyT(l, 'dashboard.common.loading_label')}
        />

        <MantineDashboardCard
          title={storyT(l, 'storybook.mantine.dashboard_card_title')}
          scopeLabel={storyT(l, 'storybook.mantine.dashboard_card_scope_now')}
          state="error"
          errorMessage={storyT(l, 'storybook.mantine.dashboard_card_error')}
          retryLabel={storyT(l, 'dashboard.common.retry')}
          onRetry={() => {}}
        />

        <MantineDashboardCard
          title={storyT(l, 'storybook.mantine.dashboard_card_title')}
          scopeLabel={storyT(l, 'storybook.mantine.dashboard_card_scope_now')}
          state="stale"
          staleLabel={storyT(l, 'dashboard.common.updated_at_prefix')}
          staleTime="14:32"
        >
          <Text size="sm" c="gray.7">
            {storyT(l, 'storybook.mantine.dashboard_card_body')}
          </Text>
        </MantineDashboardCard>
      </SimpleGrid>
    );
  },
};

export const Loading: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box p="md" maw={theme.other!.boxSize!.emptyState}>
        <MantineDashboardCard
          title={storyT(l, 'storybook.mantine.dashboard_card_title')}
          scopeLabel={storyT(l, 'storybook.mantine.dashboard_card_scope_now')}
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
        <MantineDashboardCard
          title={storyT(l, 'storybook.mantine.dashboard_card_title')}
          scopeLabel={storyT(l, 'storybook.mantine.dashboard_card_scope_now')}
          state="error"
          errorMessage={storyT(l, 'storybook.mantine.dashboard_card_error')}
          retryLabel={storyT(l, 'dashboard.common.retry')}
          onRetry={() => {}}
        />
      </Box>
    );
  },
};
