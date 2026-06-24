import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { MantineDataTableToCards } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineDataTableToCards> = {
  title: 'Patterns/Mantine/DataTableToCards',
  component: MantineDataTableToCards,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Responsive data display: stacked cards on mobile (<640), Mantine Table on desktop. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineDataTableToCards>;

const makeArgs = (l = 'en') => ({
  columns: [
    { key: 'id', label: storyT(l, 'storybook.mantine.admin_table_col_id') },
    { key: 'name', label: storyT(l, 'storybook.mantine.admin_table_col_name') },
    { key: 'status', label: storyT(l, 'storybook.mantine.admin_table_col_status'), badge: true },
    { key: 'date', label: storyT(l, 'storybook.mantine.admin_table_col_date') },
  ],
  rows: [
    { id: '1', name: storyT(l, 'storybook.mantine.card_title_1'), status: storyT(l, 'storybook.mantine.admin_status_active'), date: '2026-06-24' },
    { id: '2', name: storyT(l, 'storybook.mantine.card_title_1'), status: storyT(l, 'storybook.mantine.admin_status_pending'), date: '2026-06-23' },
    { id: '3', name: storyT(l, 'storybook.mantine.card_title_1'), status: storyT(l, 'storybook.mantine.admin_status_archived'), date: '2026-06-22' },
  ],
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <MantineDataTableToCards {...makeArgs(l)} />;
  },
};
