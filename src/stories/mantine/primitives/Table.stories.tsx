import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Badge, Avatar, ActionIcon, Group, Text } from '@mantine/core'
import { ShieldOff, ChevronRight } from 'lucide-react'
import { storyT } from '../../_storyI18n'
import { MantineDataTableToCards, type CardConfig } from '@/design-system/mantine/patterns'
import { MantineStoryShell } from '../_MantineStoryShell'

const meta: Meta<typeof MantineDataTableToCards> = {
  title: 'Mantine/Primitives/Table',
  component: MantineDataTableToCards,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
  },
}
export default meta
type Story = StoryObj<typeof MantineDataTableToCards>

type StoryRow = { id: string; name: string; company: string; status: string; date: string }

// STATUS_COLOR: all on-palette (green/yellow/gray — no blue). Fix #4 confirmed.
const STATUS_COLOR: Record<string, string> = {
  Active: 'green', Pending: 'yellow', Archived: 'gray',
  'Активний': 'green', 'На розгляді': 'yellow', 'Архів': 'gray',
  Aktiv: 'green', 'Në pritë': 'yellow', Arkivuar: 'gray',
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
  // Fix #2: radius="pill" (circular — §6b/Task 491 standard). Was radius="xl".
  avatar: (row) => (
    <Avatar radius="pill" size={40} color="brand">
      {row.name.slice(0, 2).toUpperCase()}
    </Avatar>
  ),
  // Fix #5: no truncate. Badge has its own row above; name takes full Stack width and wraps freely.
  title: (row) => <Text size="sm" fw={500} c="gray.7">{row.name}</Text>,
  subtitle: (row) => row.company,
  badge: (row) => (
    <Badge color={STATUS_COLOR[row.status] ?? 'gray'} variant="light" size="sm">
      {row.status}
    </Badge>
  ),
  meta: [
    {
      // Fix #1: on-palette badge for role (gray, not blue).
      label: storyT(l, 'storybook.mantine.admin_table_col_role'),
      value: () => <Badge color="gray" variant="light" size="sm">Agent</Badge>,
    },
    {
      label: storyT(l, 'storybook.mantine.admin_table_col_phone'),
      value: () => <Text size="sm" c="gray.7">+355 69 123 4567</Text>,
    },
    {
      // Fix #3: long-uk label "Дата реєстрації" (15 chars) wraps in card at 320; desktop Th is nowrap.
      label: storyT(l, 'storybook.mantine.admin_table_col_registered'),
      value: (row) => <Text size="sm" c="gray.7">{row.date}</Text>,
    },
  ],
})

const makeArgs = (l = 'en') => ({
  columns: [
    {
      key: 'name',
      label: storyT(l, 'storybook.mantine.admin_table_col_name'),
      width: '35%',
      render: (row: StoryRow) => <Text fw={500} size="sm" c="gray.7">{row.name}</Text>,
    },
    {
      key: 'status',
      label: storyT(l, 'storybook.mantine.admin_table_col_status'),
      align: 'center' as const,
      width: '20%',
      render: (row: StoryRow) => (
        <Badge color={STATUS_COLOR[row.status] ?? 'gray'} variant="light" size="sm">
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'role',
      // Fix #1: role column uses gray badge (on-palette), not blue.
      label: storyT(l, 'storybook.mantine.admin_table_col_role'),
      align: 'center' as const,
      width: '20%',
      render: () => <Badge color="gray" variant="light" size="sm">Agent</Badge>,
    },
    {
      key: 'date',
      // Fix #3: long-uk desktop header "Дата реєстрації" — whiteSpace:nowrap (from theme) keeps it single-line.
      label: storyT(l, 'storybook.mantine.admin_table_col_registered'),
      align: 'right' as const,
      width: '25%',
    },
  ],
  rows: [
    {
      id: '101',
      name: 'Arben Krasniqi',
      company: 'Tirana RE',
      status: storyT(l, 'storybook.mantine.admin_status_active'),
      date: '2026-06-24',
    },
    {
      id: '102',
      name: 'Antonio Berluskoni',
      company: 'Roma Immobili',
      status: storyT(l, 'storybook.mantine.admin_status_pending'),
      date: '2026-06-23',
    },
    {
      id: '103',
      name: 'Oksana Petrenko',
      company: 'Albhome',
      status: storyT(l, 'storybook.mantine.admin_status_archived'),
      date: '2026-06-22',
    },
    {
      // Stress-test: compound surname — should push avatar+name below badge at narrow widths
      id: '104',
      name: 'Arben RichardsonMontgomery',
      company: 'Tirana RE',
      status: storyT(l, 'storybook.mantine.admin_status_active'),
      date: '2026-06-21',
    },
  ] as StoryRow[],
})

// SSR caveat: useMediaQuery (inside MantineDataTableToCards) returns false on first render
// → table renders server-side; hydration flips to cards on mobile. No flash — pattern is auth-gated.
export const Default: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    return (
      <MantineStoryShell>
        <MantineDataTableToCards
          {...makeArgs(l)}
          card={makeCardConfig(l)}
          emptyLabel={storyT(l, 'storybook.mantine.empty_title')}
        />
      </MantineStoryShell>
    )
  },
}
