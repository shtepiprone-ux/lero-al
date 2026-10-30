import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Group, useMantineTheme } from '@mantine/core'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import { getListingStatusLabel } from '@/lib/i18n/listingStatusLabel'
import { storyT } from '@/stories/_storyI18n'
import { StoryPageGutter } from '@/stories/_StoryPageGutter'
import { FIXTURE_CURRENCIES, FIXTURE_LISTINGS } from '@/stories/fixtures/admin.fixtures'
import type { DBCurrency, ListingStatus } from '@/types/database'

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
    { key: 'code', header: t('code'), cell: c => c.code },
    { key: 'symbol', header: t('symbol'), cell: c => c.symbol },
    { key: 'name', header: t('name_en'), cell: c => c.name_en || c.name_sq },
    {
      key: 'is_active',
      header: t('is_active'),
      cell: c => (
        <Group gap="xs" wrap="nowrap">
          {c.is_default && <MantineBadge variant="tone" tone="brand">{t('default_badge')}</MantineBadge>}
          <MantineBadge variant="status" entity="currency" value={c.is_active ? 'active' : 'inactive'}>
            {c.is_active ? t('is_active') : t('deactivate')}
          </MantineBadge>
        </Group>
      ),
    },
    { key: 'decimals', header: t('decimals'), visibility: 'lg', cell: c => c.decimals },
  ]
}

function cardFor(l: string) {
  const t = (key: string) => storyT(l, `admin.currency.currencies.${key}`)
  return (c: DBCurrency) => ({
    title: c.code,
    subtitle: `${c.symbol} · ${c.name_en || c.name_sq}`,
    meta: (
      <Group gap="xs" wrap="wrap">
        {c.is_default && <MantineBadge variant="tone" tone="brand">{t('default_badge')}</MantineBadge>}
        <MantineBadge variant="status" entity="currency" value={c.is_active ? 'active' : 'inactive'}>
          {c.is_active ? t('is_active') : t('deactivate')}
        </MantineBadge>
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
        cell: r => r.title,
      },
      { key: 'status', header: t('col_status'), cell: r => <MantineBadge variant="status" entity="listing" value={r.status as ListingStatus}>{statusLabel(r.status)}</MantineBadge> },
      { key: 'agent', header: t('col_agent'), visibility: 'lg', cell: r => r.agent },
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
            title: r.title,
            badges: <MantineBadge variant="status" entity="listing" value={r.status as ListingStatus}>{statusLabel(r.status)}</MantineBadge>,
            meta: r.agent,
          })}
          emptyState={t('empty')}
        />
      </StoryPageGutter>
    )
  },
}
