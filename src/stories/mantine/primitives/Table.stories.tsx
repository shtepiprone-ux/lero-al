import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { Avatar, ActionIcon, Group } from '@mantine/core'
import { ShieldOff, ChevronRight } from 'lucide-react'
import { storyT } from '../../_storyI18n'
// Direct file import (not the `patterns` barrel) — check:story-coverage resolves import specifiers
// to concrete file paths (Task 820 — same rationale as `Patterns/Mantine/FilterSection`'s header comment).
import { MantineDataTableToCards, type CardConfig } from '@/design-system/mantine/patterns/MantineDataTableToCards'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'
import type { ListingStatus } from '@/types/database'
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

// STATUS_VALUE: the fixture's localized status label -> the listing status it stands for. The badge look comes from the
// registry (`MantineBadge`), never from a colour written here (Task 859 R50, D78-26).
const STATUS_VALUE: Record<string, ListingStatus> = {
  Active: 'active', Pending: 'pending', Archived: 'archived',
  'Активний': 'active', 'На розгляді': 'pending', 'Архів': 'archived',
  Aktiv: 'active', 'Në pritë': 'pending', Arkivuar: 'archived',
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
  // Fix #2: radius="pill" (circular — §6b/Task 491 standard). Was radius="xl".
  avatar: (row) => (
    <Avatar radius="pill" size={40} color="brand">
      {row.name.slice(0, 2).toUpperCase()}
    </Avatar>
  ),
  // Fix #5: no truncate. Badge has its own row above; name takes full Stack width and wraps freely.
  title: (row) => row.name,
  subtitle: (row) => row.company,
  badge: (row) => (
    <MantineBadge variant="status" entity="listing" value={STATUS_VALUE[row.status] ?? 'archived'}>{row.status}</MantineBadge>
  ),
  // The role badge is the card's badges row (one rhythm step under the title), not a meta row (Task 859 R69(f), GR-3h).
  badges: () => <MantineBadge variant="status" entity="userRole" value="agent">{storyT(l, 'admin.users.role_agent')}</MantineBadge>,
  meta: [
    {
      label: storyT(l, 'storybook.mantine.admin_table_col_phone'),
      value: () => '+355 69 123 4567',
    },
    {
      // Fix #3: long-uk label "Дата реєстрації" (15 chars) wraps in card at 320; desktop Th is nowrap.
      label: storyT(l, 'storybook.mantine.admin_table_col_registered'),
      value: (row) => row.date,
    },
    {
      // A long field value (GR-3j): it wraps under its label and the field grows; nothing is cut.
      label: storyT(l, 'storybook.mantine.admin_table_col_name'),
      value: () => storyT(l, 'storybook.listing.apartment_long'),
    },
  ],
})

const makeArgs = (l = 'en') => ({
  // Task 923 R49: no percentage column shares, as in production — a share below its column's max-content divided by the card width makes the table scroll (uk at 768 / 769).
  columns: [
    {
      key: 'name',
      label: storyT(l, 'storybook.mantine.admin_table_col_name'),
      render: (row: StoryRow) => row.name,
    },
    {
      key: 'status',
      label: storyT(l, 'storybook.mantine.admin_table_col_status'),
      align: 'center' as const,
      render: (row: StoryRow) => (
        <MantineBadge variant="status" entity="listing" value={STATUS_VALUE[row.status] ?? 'archived'}>{row.status}</MantineBadge>
      ),
    },
    {
      key: 'role',
      // Fix #1: role column uses gray badge (on-palette), not blue.
      label: storyT(l, 'storybook.mantine.admin_table_col_role'),
      align: 'center' as const,
      render: () => <MantineBadge variant="status" entity="userRole" value="agent">{storyT(l, 'admin.users.role_agent')}</MantineBadge>,
    },
    {
      key: 'date',
      // Fix #3: long-uk desktop header "Дата реєстрації" — whiteSpace:nowrap (from theme) keeps it single-line.
      label: storyT(l, 'storybook.mantine.admin_table_col_registered'),
      align: 'right' as const,
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

// Both layouts render and Mantine's CSS `hiddenFrom`/`visibleFrom` shows one: the record cards below 768px, the table from 768px
// (Task 923 R47, D36). There is no media-query hook, so no first-paint flash.
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
// 768px, which is also the pattern's default (Task 923 R47, D36), so `Default` above switches at the same width. Both trees
// render; only one is visible at a given viewport (checked at 700/800px — AC7).
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
          <MantineBadge variant="tone" tone="neutral">{storyT(l, 'storybook.mantine.admin_table_col_role')}</MantineBadge>
          {row.date}
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
