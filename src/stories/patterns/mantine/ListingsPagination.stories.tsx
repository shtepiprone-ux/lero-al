import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box, Stack, Title } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { ListingsPagination } from '@/modules/listings/components/ListingsPagination';

const meta: Meta<typeof ListingsPagination> = {
  title: 'Patterns/Mantine/ListingsPagination',
  component: ListingsPagination,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Task 777 — `/listings` and `/favorites` pagination row, migrated onto the canonical MantinePagination pattern. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof ListingsPagination>;

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box px={{ base: 'md', sm: 'xl' }} py="md">
        <Stack gap="xl">
          <Title order={6}>{storyT(l, 'storybook.mantine.listings_pagination_section_first')}</Title>
          <ListingsPagination total={50} page={1} perPage={10} />

          <Title order={6}>{storyT(l, 'storybook.mantine.listings_pagination_section_middle')}</Title>
          <ListingsPagination total={50} page={3} perPage={10} />

          <Title order={6}>{storyT(l, 'storybook.mantine.listings_pagination_section_last')}</Title>
          <ListingsPagination total={50} page={5} perPage={10} />

          <Title order={6}>{storyT(l, 'storybook.mantine.listings_pagination_section_ellipsis')}</Title>
          <ListingsPagination total={200} page={10} perPage={10} />

          <Title order={6}>{storyT(l, 'storybook.mantine.listings_pagination_section_narrow')}</Title>
          <Box w={280}>
            <ListingsPagination total={200} page={10} perPage={10} />
          </Box>
        </Stack>
      </Box>
    );
  },
};
