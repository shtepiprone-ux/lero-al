import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { storyT } from '@/stories/_storyI18n';
import { MantineAdminSurfacePattern } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineAdminSurfacePattern> = {
  title: 'Patterns/Mantine/AdminSurfacePattern',
  component: MantineAdminSurfacePattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: { description: { component: 'Admin CRUD surface: search + add (full-width on mobile), table→cards, pagination. Viewport and locale switched via Storybook toolbar.' } },
  },
};
export default meta;
type Story = StoryObj<typeof MantineAdminSurfacePattern>;

const makeArgs = (l = 'en') => ({
  title: storyT(l, 'storybook.mantine.page_title_listings'),
  searchPlaceholder: storyT(l, 'storybook.mantine.admin_search_placeholder'),
  addLabel: storyT(l, 'storybook.mantine.admin_add_label'),
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
  totalPages: 3,
  currentPage: 1,
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return <MantineAdminSurfacePattern {...makeArgs(l)} />;
  },
};
