import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stack } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { MantineEmptyLoadingErrorState } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineEmptyLoadingErrorState> = {
  title: 'Patterns/Mantine/EmptyLoadingErrorState',
  component: MantineEmptyLoadingErrorState,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Three canonical async states: empty, loading, error. Full-width action button on mobile. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineEmptyLoadingErrorState>;

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Stack gap="xl" p="md">
        <MantineEmptyLoadingErrorState
          state="empty"
          title={storyT(l, 'storybook.mantine.empty_title')}
          description={storyT(l, 'storybook.mantine.empty_description')}
          actionLabel={storyT(l, 'storybook.mantine.action_search')}
        />
        <MantineEmptyLoadingErrorState
          state="loading"
          title=""
        />
        <MantineEmptyLoadingErrorState
          state="error"
          title={storyT(l, 'storybook.mantine.error_title')}
          description={storyT(l, 'storybook.mantine.error_description')}
          actionLabel={storyT(l, 'storybook.mantine.action_submit')}
        />
      </Stack>
    );
  },
};
