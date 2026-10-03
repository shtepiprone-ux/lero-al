import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Badge, Group, Text, useMantineTheme } from '@mantine/core'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { getListingStatusLabel } from '@/lib/i18n/listingStatusLabel'
import { storyT } from '@/stories/_storyI18n'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { FIXTURE_CURRENCIES, FIXTURE_LISTINGS } from '@/stories/fixtures/admin.fixtures'
import type { DBCurrency } from '@/types/database'

// Task 877 — the shared admin data list, a thin adapter over the canonical `MantineDataTableToCards`
// (GR-3a: CREATE — the legacy `Admin/AdminTable` Story was deleted with the legacy card list). Cards below 640px,
// the TailAdmin §6b table above, and the legacy props (`cardRow`, `visibility`, `onRowClick`, …) kept so the
// five admin managers need no edit. Rows are labelled fixture data (`FIXTURE_CURRENCIES`); labels come from the
// real `admin.currency.currencies` messages. Viewport and locale come from the Storybook toolbar.
const meta: Meta<typeof AdminTable> = {
  title: 'Patterns/Mantine/AdminTable',
  component: AdminTable,
  parameters: {
    skipCanvas: true,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Adapter over `MantineDataTableToCards`: `header`/`cell`/`visibility` map to `label`/`render`/`visibleFrom`, `cardRow` to `CardConfig`. Without `cardRow` the card is synthesized from the columns.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AdminTable>

function localeOf(context: { globals?: Record<string, unknown> } | undefined): string {
  return (context?.globals?.locale as string) ?? 'en'
}

function columnsFor(l: string): AdminTableColumn<DBCurrency>[] {
  const t = (key: string) => storyT(l, `admin.currency.currencies.${key}`)
  return [
    { key: 'code', header: t('code'), cell: c => <Text size="sm" fw={600} ff="monospace">{c.code}</Text> },
    { key: 'symbol', header: t('symbol'), cell: c => <Text size="sm" c="gray.7">{c.symbol}</Text> },
    { key: 'name', header: t('name_en'), cell: c => <Text size="sm" c="gray.7">{c.name_en || c.name_sq}</Text> },
    {
      key: 'is_active',
      header: t('is_active'),
      cell: c => (
        <Group gap="xs" wrap="nowrap">
          {c.is_default && <Badge size="sm" variant="light" color="brand">{t('default_badge')}</Badge>}
          <Badge size="sm" variant="light" color={c.is_active ? 'green' : 'gray'}>
            {c.is_active ? t('is_active') : t('deactivate')}
          </Badge>
        </Group>
      ),
    },
    { key: 'decimals', header: t('decimals'), visibility: 'lg', cell: c => <Text size="sm" c="gray.7">{c.decimals}</Text> },
  ]
}

function cardFor(l: string) {
  const t = (key: string) => storyT(l, `admin.currency.currencies.${key}`)
  return (c: DBCurrency) => ({
    title: <Text size="sm" fw={600} ff="monospace" component="span">{c.code}</Text>,
    subtitle: <Text size="sm" c="dimmed" component="span">{c.symbol} · {c.name_en || c.name_sq}</Text>,
    meta: (
      <Group gap="xs" wrap="wrap">
        {c.is_default && <Badge size="sm" variant="light" color="brand">{t('default_badge')}</Badge>}
        <Badge size="sm" variant="light" color={c.is_active ? 'green' : 'gray'}>
          {c.is_active ? t('is_active') : t('deactivate')}
        </Badge>
      </Group>
    ),
  })
}

export const Default: Story = {
  render: (_, context) => {
    const l = localeOf(context)
    return (
      <StoryPageGutter>
        <AdminTable
          rows={FIXTURE_CURRENCIES}
          columns={columnsFor(l)}
          rowKey={c => String(c.id)}
          cardRow={cardFor(l)}
          emptyState={storyT(l, 'admin.currency.currencies.empty')}
        />
      </StoryPageGutter>
    )
  },
}

// No `cardRow`: the column-0 cell is the card title, the first two always-visible columns the subtitle,
// the remaining ones the detail row (the legacy `synthesizeCard` rule).
export const Synthesized: Story = {
  render: (_, context) => {
    const l = localeOf(context)
    return (
      <StoryPageGutter>
        <AdminTable
          rows={FIXTURE_CURRENCIES}
          columns={columnsFor(l)}
          rowKey={c => String(c.id)}
          emptyState={storyT(l, 'admin.currency.currencies.empty')}
        />
      </StoryPageGutter>
    )
  },
}

export const Empty: Story = {
  render: (_, context) => {
    const l = localeOf(context)
    return (
      <StoryPageGutter>
        <AdminTable
          rows={[]}
          columns={columnsFor(l)}
          rowKey={c => String(c.id)}
          emptyState={storyT(l, 'admin.currency.currencies.empty')}
        />
      </StoryPageGutter>
    )
  },
}

// `onRowClick` + `ariaLabel`: the row (and the card) is focusable with Enter/Space; the trailing chevron is
// the automatic one because this `cardRow` passes no `trailing`.
export const RowClick: Story = {
  render: (_, context) => {
    const l = localeOf(context)
    return (
      <StoryPageGutter>
        <AdminTable
          rows={FIXTURE_CURRENCIES}
          columns={columnsFor(l)}
          rowKey={c => String(c.id)}
          cardRow={cardFor(l)}
          onRowClick={() => {}}
          ariaLabel={storyT(l, 'admin.currency.currencies.code')}
          emptyState={storyT(l, 'admin.currency.currencies.empty')}
        />
      </StoryPageGutter>
    )
  },
}

// Task 857 R15 — a long title in its own `wrap` + `width` column: it clamps to two lines instead of setting the
// table width, so the right-hand columns and the row chevron stay inside the card. Rows are labelled fixture data.
interface WrappedTitleRow {
  id: string
  title: string
  status: string
  agent: string
}

// Rows come from `FIXTURE_LISTINGS`; the first title joins three of them so one row is far longer than its column.
const [FIRST, SECOND, THIRD] = FIXTURE_LISTINGS
const WRAPPED_TITLE_ROWS: WrappedTitleRow[] = [FIRST, SECOND, THIRD].map((l, i) => ({
  id: l.id,
  title: i === 0 ? [FIRST, SECOND, THIRD].map(x => x.title).join(' · ') : l.title,
  status: l.status,
  agent: l.owner?.name ?? '—',
}))

export const WrappedTitleColumn: Story = {
  render: (_, context) => {
    const l = localeOf(context)
    const theme = useMantineTheme()
    const t = (key: string) => storyT(l, `admin.listings.${key}`)
    // The container resolves the status label the same way: `getListingStatusLabel` with the `cabinet` translator.
    const statusLabel = (code: string) => getListingStatusLabel(code, k => storyT(l, `cabinet.${k}`))
    const columns: AdminTableColumn<WrappedTitleRow>[] = [
      {
        key: 'title',
        header: t('col_listing'),
        width: theme.other.layout.tableTitleColumnWidth,
        wrap: true,
        cell: r => <Text size="sm" fw={500} lineClamp={2}>{r.title}</Text>,
      },
      { key: 'status', header: t('col_status'), cell: r => <Badge size="sm" variant="light" color="gray">{statusLabel(r.status)}</Badge> },
      { key: 'agent', header: t('col_agent'), visibility: 'lg', cell: r => <Text size="xs" c="dimmed">{r.agent}</Text> },
    ]
    return (
      <StoryPageGutter>
        <AdminTable
          rows={WRAPPED_TITLE_ROWS}
          columns={columns}
          rowKey={r => r.id}
          onRowClick={() => {}}
          ariaLabel={t('col_listing')}
          cardRow={r => ({
            title: <Text size="sm" fw={500} lineClamp={2}>{r.title}</Text>,
            subtitle: <Badge size="sm" variant="light" color="gray">{statusLabel(r.status)}</Badge>,
            meta: <Text size="xs" c="dimmed">{r.agent}</Text>,
          })}
          emptyState={t('empty')}
        />
      </StoryPageGutter>
    )
  },
}
