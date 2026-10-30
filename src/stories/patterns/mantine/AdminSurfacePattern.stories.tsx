import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Avatar, ActionIcon, Group } from '@mantine/core';
import { ShieldOff, ChevronRight } from 'lucide-react';
import { storyT } from '@/stories/_storyI18n';
import { MantineStoryShell } from '@/stories/mantine/_MantineStoryShell';
// Direct file import (not the `patterns` barrel) — check:story-coverage (scripts/check-story-coverage.mjs)
// resolves import specifiers to concrete file paths and the manifest entry is the component file itself
// (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s story header comment).
import { MantineAdminSurfacePattern } from '@/design-system/mantine/patterns/MantineAdminSurfacePattern';
import type { CardConfig } from '@/design-system/mantine/patterns';
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge';
import type { ListingStatus } from '@/types/database';

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
          '- **Primary row:** avatar + title (medium weight) + subtitle | status badge (top-aligned right)',
          '- **Meta rows:** ONE divider, edge-anchored label left / value right. No per-field dividers.',
          '',
          '## Desktop table',
          'Per-column `align` + `width`; `verticalSpacing="sm"`, `horizontalSpacing="xl"`.',
          '',
          '**Generic:** `<MantineAdminSurfacePattern<R>>` — row type narrowed from `TableRow`.',
          'Viewport and locale switched via Storybook toolbar.',
          '',
          '**Gutter:** the story renders inside `MantineStoryShell`, which owns the responsive page gutter (GR-3d).',
          '`skipCanvas:true` requires an explicit container; full-bleed is bottom-sheet only.',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MantineAdminSurfacePattern>;

type StoryRow = { id: string; name: string; company: string; status: string; date: string }

const STATUS_VALUE: Record<string, ListingStatus> = {
  Active: 'active', Pending: 'pending', Archived: 'archived',
  Активний: 'active', Очікує: 'pending', Архів: 'archived',
  Aktiv: 'active', 'Në pritje': 'pending', Arkivuar: 'archived',
  Attivo: 'active', 'In attesa': 'pending', Archiviato: 'archived',
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
  title: (row) => row.name,
  subtitle: (row) => row.company,
  badge: (row) => (
    <MantineBadge variant="status" entity="listing" value={STATUS_VALUE[row.status] ?? 'archived'}>{row.status}</MantineBadge>
  ),
  meta: [
    {
      label: storyT(l, 'storybook.mantine.admin_table_col_role'),
      value: () => <MantineBadge variant="status" entity="userRole" value="agent">{storyT(l, 'admin.users.role_agent')}</MantineBadge>,
    },
    {
      label: storyT(l, 'storybook.mantine.admin_table_col_phone'),
      value: () => '+355 69 123 4567',
    },
    {
      label: storyT(l, 'storybook.mantine.admin_table_col_date'),
      value: (row) => row.date,
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
      render: (row: StoryRow) => row.name,
    },
    {
      key: 'status',
      label: storyT(l, 'storybook.mantine.admin_table_col_status'),
      align: 'center' as const,
      width: '30%',
      render: (row: StoryRow) => (
        <MantineBadge variant="status" entity="listing" value={STATUS_VALUE[row.status] ?? 'archived'}>{row.status}</MantineBadge>
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
      <MantineStoryShell>
        <MantineAdminSurfacePattern<StoryRow>
          {...makeArgs(l)}
          card={makeCardConfig(l)}
        />
      </MantineStoryShell>
    );
  },
};
