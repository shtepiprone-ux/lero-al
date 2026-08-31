import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Box, Stack, Text, Title } from '@mantine/core';
import { storyT } from '@/stories/_storyI18n';
import { ListingsPageFrame } from '@/modules/listings/components/ListingsPageFrame';

const meta: Meta<typeof ListingsPageFrame> = {
  title: 'Patterns/Mantine/ListingsPageFrame',
  component: ListingsPageFrame,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Task 775 — `/listings` route chrome: background + breadcrumb band + content gutter. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof ListingsPageFrame>;

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box px={{ base: 'md', sm: 'xl' }} py="md">
        <Stack gap="xl">
          <Title order={6}>{storyT(l, 'storybook.mantine.listings_page_frame_section_short')}</Title>
          <ListingsPageFrame
            homeHref="/en"
            homeLabel={storyT(l, 'storybook.mantine.listings_page_frame_home')}
            currentLabel={storyT(l, 'storybook.mantine.listings_page_frame_current')}
            breadcrumbAriaLabel={storyT(l, 'storybook.mantine.listings_page_frame_aria')}
          >
            <Text>{storyT(l, 'storybook.mantine.listings_page_frame_body')}</Text>
          </ListingsPageFrame>

          <Title order={6}>{storyT(l, 'storybook.mantine.listings_page_frame_section_long')}</Title>
          <ListingsPageFrame
            homeHref="/en"
            homeLabel={storyT(l, 'storybook.mantine.listings_page_frame_home_long')}
            currentLabel={storyT(l, 'storybook.mantine.listings_page_frame_current_long')}
            breadcrumbAriaLabel={storyT(l, 'storybook.mantine.listings_page_frame_aria')}
          >
            <Text>{storyT(l, 'storybook.mantine.listings_page_frame_body')}</Text>
          </ListingsPageFrame>
        </Stack>
      </Box>
    );
  },
};
