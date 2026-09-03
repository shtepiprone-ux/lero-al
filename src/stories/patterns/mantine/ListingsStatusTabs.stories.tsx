import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box } from '@mantine/core';
import { ListingsStatusTabs } from '@/modules/listings/components/ListingsStatusTabs';

/**
 * Task 781 Phase 1 — `/listings` status tabs, migrated off the shadcn `Tabs`/`TabsList`/
 * `TabsTrigger` primitives onto Mantine `Tabs` (theme defaults: `variant="pills"`,
 * `radius="md"`, `theme.ts:855-868`). The component passes no `variant`/`radius` itself — the
 * theme owns them.
 *
 * `className="listings-status-tabs"` is preserved verbatim on the root — it is a semantic
 * selector hook consumed by the retargeted route probe (kickoff §3.5/§7.1), not a Tailwind
 * utility.
 *
 * `nextjs.navigation.query` is empty so the default `active` tab renders selected, exercising
 * the component's default branch (`tab` param absent → `active`).
 */
const meta: Meta<typeof ListingsStatusTabs> = {
  title: 'Patterns/Mantine/ListingsStatusTabs',
  component: ListingsStatusTabs,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    nextjs: {
      navigation: {
        pathname: '/listings',
        query: {},
      },
    },
    docs: {
      description: {
        component: 'Task 781 — `/listings` status tabs migrated onto Mantine `Tabs`. Viewport and locale switched via the Storybook toolbar.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ListingsStatusTabs>;

export const Default: Story = {
  render: () => (
    <Box px={{ base: 'md', sm: 'xl', lg: '2xl', xxl: '3xl' }} py="md">
      <ListingsStatusTabs />
    </Box>
  ),
};
