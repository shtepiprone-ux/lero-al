import React from 'react';
import { Box } from '@mantine/core';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Avatar, Badge, ActionIcon, Group, Text } from '@mantine/core';
import { ShieldOff, ChevronRight } from 'lucide-react';
import { storyT } from '@/stories/_storyI18n';
import { MantineAdminSurfacePattern } from '@/design-system/mantine/patterns';
import type { CardConfig } from '@/design-system/mantine/patterns';

const meta: Meta<typeof MantineAdminSurfacePattern> = {
  title: 'Patterns/Mantine/AdminSurfacePattern',
  component: MantineAdminSurfacePattern,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Admin CRUD surface: search + add (full-width on mobile), table→cards, pagination.',
          '',
          '## Mobile card anatomy (`card` prop)',
          'When `card` is provided, mobile (<sm) renders the **designed card hierarchy** (§7.2):',
          '- **Header:** id (muted xs) | actions (≥44px)',
          '- **Primary row:** avatar + title (medium fw=500) + subtitle | status badge (top-aligned right)',
          '- **Meta rows:** ONE divider, edge-anchored label left / value right. No per-field dividers.',
          '',
          '## Desktop table',
          'Per-column `align` + `width`; `verticalSpacing="sm"`, `horizontalSpacing="xl"`.',
          '',
          '**Generic:** `<MantineAdminSurfacePattern<R>>` — row type narrowed from `TableRow`.',
          'Viewport and locale switched via Storybook toolbar.',
          '',
          '**Gutter:** story wraps in `Box px={{ base: \'md\', sm: \'xl\' }} py="md"` — canonical responsive',
          'admin page gutter. `skipCanvas:true` requires explicit container; full-bleed is bottom-sheet only.',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineAdminSurfacePattern>;

type StoryRow = { id: string; name: string; company: string; status: string; date: string }

const STATUS_COLOR: Record<string, string> = {
  Active: 'green', Pending: 'yellow', Archived: 'gray',
  Активний: 'green', Очікує: 'yellow', Архів: 'gray',
  Aktiv: 'green', 'Në pritje': 'yellow', Arkivuar: 'gray',
  Attivo: 'green', 'In attesa': 'yellow', Archiviato: 'gray',
}

const makeCardConfig = (l: string): CardConfig<StoryRow> => ({
  id: (row) => `#${row.id}`,
  actions: () => (
    <Group gap="xs">
      <ActionIcon variant="subtle" color="red" size="sm" mih="2.75rem" miw="2.75rem">
        <ShieldOff size={14} />
      </ActionIcon>
      <ActionIcon variant="subtle" size="sm" mih="2.75rem" miw="2.75rem" component="a" href="#">
        <ChevronRight size={14} />
      </ActionIcon>
    </Group>
  ),
  avatar: (row) => (
    <Avatar radius="xl" size={40} color="brand">
      {row.name.slice(0, 2).toUpperCase()}
    </Avatar>
  ),
  title: (row) => <Text size="sm" fw={500} c="gray.7" truncate="end">{row.name}</Text>,
  subtitle: (row) => row.company,
  badge: (row) => (
    <Badge color={STATUS_COLOR[row.status] ?? 'gray'} variant="light" size="sm">
      {row.status}
    </Badge>
  ),
  meta: [
    {
      label: storyT(l, 'storybook.mantine.admin_table_col_role'),
      value: () => <Badge color="blue" variant="light" size="sm">Agent</Badge>,
    },
    {
      label: storyT(l, 'storybook.mantine.admin_table_col_phone'),
      value: () => <Text size="sm" c="gray.7">+355 69 123 4567</Text>,
    },
    {
      label: storyT(l, 'storybook.mantine.admin_table_col_date'),
      value: (row) => <Text size="sm" c="gray.7">{row.date}</Text>,
    },
  ],
})

const makeArgs = (l = 'en') => ({
  title: storyT(l, 'storybook.mantine.page_title_listings'),
  searchPlaceholder: storyT(l, 'storybook.mantine.admin_search_placeholder'),
  addLabel: storyT(l, 'storybook.mantine.admin_add_label'),
  columns: [
    {
      key: 'name',
      label: storyT(l, 'storybook.mantine.admin_table_col_name'),
      width: '40%',
      render: (row: StoryRow) => <Text fw={500}>{row.name}</Text>,
    },
    {
      key: 'status',
      label: storyT(l, 'storybook.mantine.admin_table_col_status'),
      align: 'center' as const,
      width: '30%',
      render: (row: StoryRow) => (
        <Badge color={STATUS_COLOR[row.status] ?? 'gray'} variant="light" size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'date',
      label: storyT(l, 'storybook.mantine.admin_table_col_date'),
      align: 'right' as const,
      width: '30%',
    },
  ],
  rows: [
    { id: '101', name: 'Arben Krasniqi', company: 'Tirana RE', status: storyT(l, 'storybook.mantine.admin_status_active'), date: '2026-06-24' },
    { id: '102', name: 'Oksana Petrenko', company: 'Albhome', status: storyT(l, 'storybook.mantine.admin_status_pending'), date: '2026-06-23' },
    { id: '103', name: 'Giulia Romano', company: 'Roma Immobili', status: storyT(l, 'storybook.mantine.admin_status_archived'), date: '2026-06-22' },
  ] as StoryRow[],
  totalPages: 3,
  currentPage: 1,
});

export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en';
    return (
      <Box px={{ base: 'md', sm: 'xl' }} py="md">
        <MantineAdminSurfacePattern<StoryRow>
          {...makeArgs(l)}
          card={makeCardConfig(l)}
        />
      </Box>
    );
  },
};
