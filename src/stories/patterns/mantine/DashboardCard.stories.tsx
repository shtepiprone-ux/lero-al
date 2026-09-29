import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SimpleGrid, Text, Box, Stack } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineDashboardCard } from '@/design-system/mantine/patterns/MantineDashboardCard';
import { MantineDashboardGrid, MantineDashboardGridSplit } from '@/design-system/mantine/patterns/MantineDashboardGrid';
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

// Task 891 review 3 (R20, GR-3a EXTEND) — `fill`: two cards of different content height in the same
// row end at the same bottom edge (AC25/AC28's own equal-height check against this Story).
// Review 5 (F12): a bare fixed-column grid forced two columns at every width (320 gave narrow,
// cramped cards) — GR-3b forbids a Story fixing a width. `MantineDashboardGridSplit` is the real
// production parent (`main` 8-of-12, `side` 4-of-12, stacking below `lg`), so this renders through
// it instead, removing that grid entirely.
export const Fill: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <MantineDashboardGrid>
        <MantineDashboardGridSplit
          main={
            <MantineDashboardCard
              title={storyT(l, 'storybook.mantine.dashboard_card_title')}
              scopeLabel={storyT(l, 'storybook.mantine.dashboard_card_scope_now')}
              state="ready"
              fill
            >
              <Stack gap="sm">
                <Text size="sm" c="gray.7">{storyT(l, 'storybook.mantine.dashboard_card_body')}</Text>
                <Text size="sm" c="gray.7">{storyT(l, 'storybook.mantine.dashboard_card_body')}</Text>
                <Text size="sm" c="gray.7">{storyT(l, 'storybook.mantine.dashboard_card_body')}</Text>
                <Text size="sm" c="gray.7">{storyT(l, 'storybook.mantine.dashboard_card_body')}</Text>
              </Stack>
            </MantineDashboardCard>
          }
          side={
            <MantineDashboardCard
              title={storyT(l, 'storybook.mantine.dashboard_card_title')}
              scopeLabel={storyT(l, 'storybook.mantine.dashboard_card_scope_now')}
              state="ready"
              fill
            >
              <Text size="sm" c="gray.7">
                {storyT(l, 'storybook.mantine.dashboard_card_body')}
              </Text>
            </MantineDashboardCard>
          }
        />
      </MantineDashboardGrid>
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
