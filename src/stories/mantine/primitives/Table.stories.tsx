import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { Badge, Avatar, ActionIcon, Group, Text } from '@mantine/core'
import { ShieldOff, ChevronRight } from 'lucide-react'
import { storyT } from '../../_storyI18n'
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s header comment).
import { MantineDataTableToCards, type CardConfig } from '@/design-system/mantine/patterns/MantineDataTableToCards'
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
      // Stress-test: compound surname — should push avatar+name below badge at narrow widths.
      // Task 624: was 'Arben RichardsonMontgomery' — a malformed concatenated fixture value
      // (two English-looking surnames jammed together with no space); replaced with a real
      // hyphenated compound Albanian surname that still stress-tests the same wrap behavior.
      id: '104',
      name: 'Arben Krasniqi-Marashi',
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
      <MantineStoryShell width="constrained">
        <MantineDataTableToCards
          {...makeArgs(l)}
          card={makeCardConfig(l)}
          emptyLabel={storyT(l, 'storybook.mantine.empty_title')}
        />
      </MantineStoryShell>
    )
  },
}

// Task 854 (R6/AC7, GR-3a EXTEND): `cardsBelow="md"` — the CSS `hiddenFrom`/`visibleFrom` switch at
// 768px, instead of the default `useMediaQuery` 640px path above. Both trees render; only one is
// visible at a given viewport (checked at 700/800px — AC7).
//
// Task 891 (R12/AC10, GR-3a EXTEND — no new export or string): the existing `date` column gets
// `wrap: true` here only (not in `Default`), proving `TableColumn.wrap`'s desktop `Table.Th`/
// `Table.Td` render `white-space: normal` while every other column keeps `nowrap`.
export const CardsBelowMd: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    const args = makeArgs(l)
    const columns = args.columns.map((col) => (col.key === 'date' ? { ...col, wrap: true } : col))
    return (
      <MantineStoryShell width="constrained">
        <MantineDataTableToCards
          {...args}
          columns={columns}
          card={makeCardConfig(l)}
          emptyLabel={storyT(l, 'storybook.mantine.empty_title')}
          cardsBelow="md"
        />
      </MantineStoryShell>
    )
  },
}

// Task 857 (R32, GR-3a EXTEND): `cardsBelow="lg"` — the same CSS switch at 1024px, for a table that cannot fit
// before 1024 (cards at 1000px, the table at 1024px). Same fixture as `CardsBelowMd`.
export const CardsBelowLg: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    const args = makeArgs(l)
    return (
      <MantineStoryShell width="constrained">
        <MantineDataTableToCards
          {...args}
          card={makeCardConfig(l)}
          emptyLabel={storyT(l, 'storybook.mantine.empty_title')}
          cardsBelow="lg"
        />
      </MantineStoryShell>
    )
  },
}

// Task 877 (R1, GR-3a EXTEND — the four exports below prove the additive props on the SAME real pattern;
// no parallel Story). `onRowClick` / `visibleFrom` / `stickyColumnIndex` / `CardConfig.detail` are all
// optional, so `Default` above renders unchanged. Fixtures reuse the labelled rows and `storyT` strings above.

// Row + card become interactive: `tabIndex=0`, Enter/Space, hover highlight and a trailing chevron
// (cards: the automatic chevron, because this fixture's `actions` return an element only in `Default`).
export const RowClick: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    const { actions: _actions, ...cardWithoutActions } = makeCardConfig(l)
    void _actions
    return (
      <MantineStoryShell width="constrained">
        <MantineDataTableToCards
          {...makeArgs(l)}
          card={cardWithoutActions}
          emptyLabel={storyT(l, 'storybook.mantine.empty_title')}
          onRowClick={() => {}}
        />
      </MantineStoryShell>
    )
  },
  parameters: { throwPlayFunctionExceptions: true },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('[tabindex="0"]')).not.toBeNull()
  },
}

// `TableColumn.visibleFrom`: the role column appears from `md`, the date column from `lg`.
export const ResponsiveColumns: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    const args = makeArgs(l)
    const columns = args.columns.map((col) =>
      col.key === 'role'
        ? { ...col, visibleFrom: 'md' as const }
        : col.key === 'date'
          ? { ...col, visibleFrom: 'lg' as const }
          : col,
    )
    return (
      <MantineStoryShell width="constrained">
        <MantineDataTableToCards
          {...args}
          columns={columns}
          card={makeCardConfig(l)}
          emptyLabel={storyT(l, 'storybook.mantine.empty_title')}
        />
      </MantineStoryShell>
    )
  },
}

// `stickyColumnIndex`: the first column keeps its place while the wide table scrolls sideways. The column
// set is the same labelled columns repeated (no fixed widths), so the nowrap content exceeds the viewport.
export const StickyColumn: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    const args = makeArgs(l)
    const wide = [1, 2, 3].flatMap((n) =>
      args.columns.map((col) => ({ ...col, key: `${col.key}_${n}`, width: undefined })),
    )
    return (
      <MantineStoryShell width="constrained">
        <MantineDataTableToCards
          {...args}
          columns={wide}
          card={makeCardConfig(l)}
          emptyLabel={storyT(l, 'storybook.mantine.empty_title')}
          stickyColumnIndex={0}
        />
      </MantineStoryShell>
    )
  },
}

// `CardConfig.detail`: a free-form region below ONE divider where `meta[]` is absent.
export const CardDetail: Story = {
  render: (_, context) => {
    const l = (context?.globals?.locale as string) ?? 'en'
    const { meta: _meta, ...cardWithoutMeta } = makeCardConfig(l)
    void _meta
    const card: CardConfig<StoryRow> = {
      ...cardWithoutMeta,
      detail: (row) => (
        <Group gap="xs" wrap="wrap">
          <Badge color="gray" variant="light" size="sm">{storyT(l, 'storybook.mantine.admin_table_col_role')}</Badge>
          <Text size="sm" c="gray.7">{row.date}</Text>
        </Group>
      ),
    }
    return (
      <MantineStoryShell width="constrained">
        <MantineDataTableToCards
          {...makeArgs(l)}
          card={card}
          emptyLabel={storyT(l, 'storybook.mantine.empty_title')}
        />
      </MantineStoryShell>
    )
  },
}
