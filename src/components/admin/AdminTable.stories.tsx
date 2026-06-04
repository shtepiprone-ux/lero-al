'use client'

import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { AdminTable, type AdminTableColumn } from './AdminTable'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ArrowUpDown, ArrowUp, ArrowDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Localized story-level labels (not in messages/*.json — Storybook-only) ────
const LABELS: Record<string, Record<string, string>> = {
  en: {
    colName: 'Name', colStatus: 'Status', colRole: 'Role', colEmail: 'Email',
    colPhone: 'Phone', colLocation: 'City', colCreated: 'Created',
    sortAZ: 'Sort A→Z', sortZA: 'Sort Z→A',
    newestFirst: 'Newest first', oldestFirst: 'Oldest first',
    lowHigh: 'Sort low→high', highLow: 'Sort high→low',
    hideColumn: 'Hide column', columns: 'Columns',
    searchPlaceholder: 'Search…',
    noResults: 'No records match the search.', noData: 'No records.',
    active: 'Active', inactive: 'Inactive',
    agent: 'Agent', user: 'User', moderator: 'Moderator',
    selectedRecord: 'Selected record',
    clickARow: 'Click a row — or focus it and press Enter / Space — to see the selected state.',
    mobileSort: 'Sort',
    sortBy: 'Sort by',
    showColumn: 'Show',
    hiddenSuffix: '(hidden)',
    lockedSuffix: '(locked)',
  },
  sq: {
    colName: 'Emri', colStatus: 'Gjendja', colRole: 'Roli', colEmail: 'Email',
    colPhone: 'Telefon', colLocation: 'Qyteti', colCreated: 'Krijuar',
    sortAZ: 'Rendit A→Z', sortZA: 'Rendit Z→A',
    newestFirst: 'Nga më i riu', oldestFirst: 'Nga më i vjetri',
    lowHigh: 'Nga i ulëti', highLow: 'Nga i larti',
    hideColumn: 'Fshih kolonën', columns: 'Kolonat',
    searchPlaceholder: 'Kërko…',
    noResults: 'Nuk u gjet asnjë rekord.', noData: 'Nuk ka rekorde.',
    active: 'Aktiv', inactive: 'Joaktiv',
    agent: 'Agjent', user: 'Përdorues', moderator: 'Moderator',
    selectedRecord: 'Rekordi i zgjedhur',
    clickARow: 'Klikoni një rresht ose shtypni Enter / Space për të parë gjendjen.',
    mobileSort: 'Rendito', sortBy: 'Rendito sipas',
    showColumn: 'Shfaq', hiddenSuffix: '(fshehur)', lockedSuffix: '(i bllokuar)',
  },
  uk: {
    colName: 'Ім\'я', colStatus: 'Статус', colRole: 'Роль', colEmail: 'Email',
    colPhone: 'Телефон', colLocation: 'Місто', colCreated: 'Створено',
    sortAZ: 'Сортувати A→Z', sortZA: 'Сортувати Z→A',
    newestFirst: 'Від найновіших', oldestFirst: 'Від найстаріших',
    lowHigh: 'Від найменшого', highLow: 'Від найбільшого',
    hideColumn: 'Приховати стовпець', columns: 'Стовпці',
    searchPlaceholder: 'Пошук…',
    noResults: 'Записів не знайдено.', noData: 'Немає записів.',
    active: 'Активний', inactive: 'Неактивний',
    agent: 'Агент', user: 'Користувач', moderator: 'Модератор',
    selectedRecord: 'Вибраний запис',
    clickARow: 'Натисніть рядок або сфокусуйте його й натисніть Enter / Space, щоб побачити вибраний стан.',
    mobileSort: 'Сортувати', sortBy: 'Сортувати за',
    showColumn: 'Показати', hiddenSuffix: '(приховано)', lockedSuffix: '(зафіксовано)',
  },
  it: {
    colName: 'Nome', colStatus: 'Stato', colRole: 'Ruolo', colEmail: 'Email',
    colPhone: 'Telefono', colLocation: 'Città', colCreated: 'Creato',
    sortAZ: 'Ordina A→Z', sortZA: 'Ordina Z→A',
    newestFirst: 'Più recenti', oldestFirst: 'Più vecchi',
    lowHigh: 'Da basso ad alto', highLow: 'Da alto a basso',
    hideColumn: 'Nascondi colonna', columns: 'Colonne',
    searchPlaceholder: 'Cerca…',
    noResults: 'Nessun record trovato.', noData: 'Nessun record.',
    active: 'Attivo', inactive: 'Inattivo',
    agent: 'Agente', user: 'Utente', moderator: 'Moderatore',
    selectedRecord: 'Record selezionato',
    clickARow: 'Fai clic su una riga oppure mettila a fuoco e premi Enter / Space per vedere lo stato.',
    mobileSort: 'Ordina', sortBy: 'Ordina per',
    showColumn: 'Mostra', hiddenSuffix: '(nascosta)', lockedSuffix: '(bloccata)',
  },
}

// ── Types + fixture data ──────────────────────────────────────────────────────

type SampleRow = {
  id: string; name: string; state: 'on' | 'off'; role: string
  created: string; email: string; phone: string; location: string
}

const ROWS: SampleRow[] = [
  { id: '1', name: 'Arben Krasniqi',  state: 'on',  role: 'Agent',     created: '2026-01-15', email: 'arben@example.com',  phone: '+355 69 123 4567', location: 'Tirana' },
  { id: '2', name: 'Oksana Petrenko', state: 'off', role: 'User',      created: '2026-02-20', email: 'oksana@example.com', phone: '+380 50 987 6543', location: 'Kyiv'   },
  { id: '3', name: 'Marco Rossi',     state: 'on',  role: 'Moderator', created: '2026-03-01', email: 'marco@example.com',  phone: '+39 02 1234 5678', location: 'Milan'  },
]

// Long Ukrainian listing titles — locale/layout stress
// statusCode drives the badge variant (§18: never key variant off a localized label string).
type UkRow = { id: string; name: string; status: string; statusCode: 'in_progress' | 'active' | 'pending' }
const UK_ROWS: UkRow[] = [
  { id: '1', name: 'Оголошення про продаж квартири в центрі міста — довга назва для перевірки обрізання тексту', status: 'В обробці', statusCode: 'in_progress' },
  { id: '2', name: 'Оренда офісного приміщення поруч з метро — ще одна довга назва', status: 'Активне', statusCode: 'active' },
  { id: '3', name: 'Продаж будинку з ділянкою в передмісті', status: 'Очікує', statusCode: 'pending' },
]

// Variant is derived from the status CODE, not the localized label — identical across all locales (§18).
function ukStatusVariant(code: UkRow['statusCode']): 'info' | 'success' | 'warning' {
  if (code === 'active')      return 'success'
  if (code === 'in_progress') return 'info'
  return 'warning'
}

// ── Column definition metadata (used by demo wrapper) ────────────────────────
type ColDef = {
  key: string
  labelKey: keyof typeof LABELS.en
  sortType?: 'text' | 'numeric' | 'date'
  hideable: boolean
  visibility?: 'always' | 'sm' | 'md' | 'lg' | 'xl'
}

const COL_DEFS: ColDef[] = [
  { key: 'name',     labelKey: 'colName',     sortType: 'text', hideable: false,       },
  { key: 'state',    labelKey: 'colStatus',   sortType: 'text', hideable: true,        },
  { key: 'role',     labelKey: 'colRole',     sortType: 'text', hideable: true, visibility: 'sm'  },
  { key: 'email',    labelKey: 'colEmail',                      hideable: true, visibility: 'md'  },
  { key: 'phone',    labelKey: 'colPhone',                      hideable: true, visibility: 'lg'  },
  { key: 'location', labelKey: 'colLocation', sortType: 'text', hideable: true, visibility: 'lg'  },
  { key: 'created',  labelKey: 'colCreated',  sortType: 'date', hideable: true, visibility: 'xl'  },
]

// ── Card row factory for AdminCardList (card mode <1024px) ────────────────────
function makeCardRow(locale: string) {
  const L = LABELS[locale] ?? LABELS.en
  return (r: SampleRow) => ({
    title: <span className="font-medium">{r.name}</span>,
    subtitle: (
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <Badge variant={r.state === 'on' ? 'success' : 'neutral'} className="text-xs">
          {r.state === 'on' ? L.active : L.inactive}
        </Badge>
        <span className="text-xs text-muted-foreground">{L[r.role.toLowerCase() as keyof typeof LABELS.en] ?? r.role}</span>
      </div>
    ),
    meta: (
      <div className="flex flex-col gap-0.5 mt-1">
        <span className="text-xs text-muted-foreground">{r.email}</span>
        <span className="text-xs text-muted-foreground">{r.location}</span>
      </div>
    ),
  })
}

// ── Columns manager (Popover with toggle list, stays open while toggling) ────
function ColumnsManager({
  colDefs, hidden, onToggle, locale,
}: {
  colDefs: ColDef[]
  hidden: Set<string>
  onToggle: (key: string) => void
  locale: string
}) {
  const L = LABELS[locale] ?? LABELS.en
  return (
    <Popover>
      <PopoverTrigger
        className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-transparent text-sm font-medium hover:bg-muted transition-colors cursor-pointer max-sm:w-full max-sm:justify-center"
      >
        {L.columns}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2 space-y-0.5">
        {colDefs.map(col => {
          const isHidden  = hidden.has(col.key)
          const isLocked  = !col.hideable
          const label     = L[col.labelKey]
          return (
            <div
              key={col.key}
              role="checkbox"
              aria-checked={!isHidden}
              tabIndex={isLocked ? -1 : 0}
              className={cn(
                'flex items-center gap-2.5 px-2 py-1.5 rounded text-sm select-none',
                isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer',
              )}
              onClick={() => !isLocked && onToggle(col.key)}
              onKeyDown={e => {
                if (!isLocked && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onToggle(col.key)
                }
              }}
            >
              <span
                className={cn(
                  'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                  !isHidden ? 'bg-primary border-primary text-primary-foreground' : 'border-border',
                )}
                aria-hidden="true"
              >
                {!isHidden && <Check className="h-2.5 w-2.5" />}
              </span>
              <span className="flex-1 truncate">{label}</span>
              {isLocked && (
                <span className="text-xs text-muted-foreground shrink-0">{L.lockedSuffix}</span>
              )}
            </div>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

// ── Mobile sort control (card mode: one button → dropdown of sortable fields) ─
function MobileSortControl({
  colDefs, sort, onSort, locale,
}: {
  colDefs: ColDef[]
  sort: { key: string | null; dir: 'asc' | 'desc' | null }
  onSort: (key: string, dir: 'asc' | 'desc') => void
  locale: string
}) {
  const L = LABELS[locale] ?? LABELS.en
  const sortable = colDefs.filter(c => c.sortType)
  const activeCol = sortable.find(c => c.key === sort.key)
  const activeLabel = activeCol
    ? `${L[activeCol.labelKey]} ${sort.dir === 'asc' ? '↑' : '↓'}`
    : L.mobileSort

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-transparent text-sm font-medium hover:bg-muted transition-colors cursor-pointer max-sm:w-full max-sm:justify-center"
      >
        <ArrowUpDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {activeLabel}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        {sortable.map(col => {
          const label = L[col.labelKey]
          const sortLabelsAsc  = col.sortType === 'date' ? L.newestFirst : L.sortAZ
          const sortLabelsDesc = col.sortType === 'date' ? L.oldestFirst : L.sortZA
          return [
            <DropdownMenuItem key={`${col.key}-asc`} onClick={() => onSort(col.key, 'asc')}>
              <ArrowUp className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}: {sortLabelsAsc}
              {sort.key === col.key && sort.dir === 'asc' && (
                <Check className="h-3.5 w-3.5 ml-auto shrink-0 text-primary" />
              )}
            </DropdownMenuItem>,
            <DropdownMenuItem key={`${col.key}-desc`} onClick={() => onSort(col.key, 'desc')}>
              <ArrowDown className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}: {sortLabelsDesc}
              {sort.key === col.key && sort.dir === 'desc' && (
                <Check className="h-3.5 w-3.5 ml-auto shrink-0 text-primary" />
              )}
            </DropdownMenuItem>,
            <DropdownMenuSeparator key={`${col.key}-sep`} />,
          ]
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── AdminTableDemo — the canonical demo wrapper ───────────────────────────────
// Manages: global search, sort state, column visibility (Columns manager), row interaction.
// Desktop (≥1024px): ⇅ column-header dropdown menus (sort + hide) + "Columns" manager.
// Mobile (<1024px): compact Sort control above the cards + "Columns" manager button.
// NO row-filter chips. Global search is the ONLY data-narrowing control.
function AdminTableDemo({
  locale = 'en',
  interactive = false,
  initialHidden = [] as string[],
}: {
  locale?: string
  interactive?: boolean
  initialHidden?: string[]
}) {
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState<{ key: string | null; dir: 'asc' | 'desc' | null }>({ key: null, dir: null })
  const [hidden, setHidden]   = useState<Set<string>>(new Set(initialHidden))
  const [selected, setSelected] = useState<SampleRow | null>(null)

  const L = LABELS[locale] ?? LABELS.en

  function handleSort(key: string, dir: 'asc' | 'desc') {
    setSort({ key, dir })
  }
  function handleHide(key: string) {
    setHidden(prev => new Set([...prev, key]))
  }
  function toggleColumn(key: string) {
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Global search
  const searched = ROWS.filter(row => {
    if (!search) return true
    const q = search.toLowerCase()
    return row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q)
  })

  // Sort
  const sortedRows: SampleRow[] = sort.key && sort.dir
    ? [...searched].sort((a, b) => {
        const k = sort.key as keyof SampleRow
        return sort.dir === 'asc'
          ? String(a[k]).localeCompare(String(b[k]))
          : String(b[k]).localeCompare(String(a[k]))
      })
    : searched

  // Build visible columns
  const visibleColDefs = COL_DEFS.filter(cd => !hidden.has(cd.key))

  const cols: AdminTableColumn<SampleRow>[] = visibleColDefs.map(cd => {
    const label = L[cd.labelKey]
    const sortLabels = cd.sortType ? {
      asc:  cd.sortType === 'date' ? L.newestFirst : L.sortAZ,
      desc: cd.sortType === 'date' ? L.oldestFirst : L.sortZA,
      hide: L.hideColumn,
    } : undefined

    const col: AdminTableColumn<SampleRow> = {
      key: cd.key,
      header: label,
      visibility: cd.visibility,
      sortable: !!cd.sortType,
      sortType: cd.sortType,
      sortDirection: sort.key === cd.key ? sort.dir : null,
      onSort: cd.sortType ? (dir) => handleSort(cd.key, dir) : undefined,
      hideable: cd.hideable,
      onHideColumn: cd.hideable ? () => handleHide(cd.key) : undefined,
      sortLabels,
      cell: r => {
        if (cd.key === 'name')     return <span className="font-medium">{r.name}</span>
        if (cd.key === 'state')    return <Badge variant={r.state === 'on' ? 'success' : 'neutral'}>{r.state === 'on' ? L.active : L.inactive}</Badge>
        if (cd.key === 'role')     return r.role
        if (cd.key === 'email')    return r.email
        if (cd.key === 'phone')    return r.phone
        if (cd.key === 'location') return r.location
        if (cd.key === 'created')  return r.created
        return null
      },
    }
    return col
  })

  const emptyMessage = search ? L.noResults : L.noData

  return (
    <div className="space-y-3">
      {/* ── Toolbar: global search + Columns manager ─────────────────────────── */}
      {/* max-sm:flex-col [&>*]:max-sm:w-full: at <640px stacks vertically, each control
          full-width (§12b mobile contract). Desktop: inline row, flex-1 search. */}
      <div className="flex items-center gap-2 flex-wrap max-sm:flex-col [&>*]:max-sm:w-full">
        <Input
          type="search"
          className="h-9 flex-1 min-w-[180px]"
          placeholder={L.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <ColumnsManager colDefs={COL_DEFS} hidden={hidden} onToggle={toggleColumn} locale={locale} />
      </div>

      {/* ── Mobile sort control — only below lg: (no column headers in card mode) */}
      {/* max-sm:w-full: full-width at <640px per §12b mobile contract. */}
      <div className="lg:hidden max-sm:w-full">
        <MobileSortControl colDefs={COL_DEFS} sort={sort} onSort={handleSort} locale={locale} />
      </div>

      <AdminTable
        rows={sortedRows}
        columns={cols}
        rowKey={r => r.id}
        emptyState={emptyMessage}
        cardRow={makeCardRow(locale)}
        onRowClick={interactive ? setSelected : undefined}
      />

      {/* ── Interactive: selected row feedback ───────────────────────────────── */}
      {interactive && !selected && (
        <p className="text-xs text-muted-foreground italic px-1">{L.clickARow}</p>
      )}
      {interactive && selected && (
        <div className="rounded-xl border bg-card p-4 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {L.selectedRecord}
          </p>
          <p className="text-sm font-medium">{selected.name}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={selected.state === 'on' ? 'success' : 'neutral'} className="text-xs">
              {selected.state === 'on' ? L.active : L.inactive}
            </Badge>
            <span className="text-xs text-muted-foreground">{selected.role}</span>
            <span className="text-xs text-muted-foreground">{selected.email}</span>
            <span className="text-xs text-muted-foreground">{selected.location}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Admin/AdminTable',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Canonical admin table — sort + hide column menus + Columns manager + global search.\n\n' +
          '**Desktop (≥1024px — table mode):** sortable/hideable column headers show a small ' +
          '`ArrowUpDown` icon (`h-3 w-3`, 12px — strictly smaller than the `text-sm` 14px header). ' +
          'Clicking opens a DropdownMenu with type-correct sort items (A→Z/Z→A for text, ' +
          'Newest/Oldest for dates) and a "Hide column" item (EyeOff). ' +
          'A "Columns" button opens a Popover checklist for showing/hiding all columns. ' +
          'A single global search input is the ONLY data-narrowing control — no filter chips.\n\n' +
          '**Mobile (<1024px — card mode):** auto-switches to AdminCardList cards. ' +
          'A compact Sort dropdown provides the same sort model. ' +
          'The "Columns" manager is available above the cards.\n\n' +
          '**Forbidden icons:** Funnel, Sliders, SlidersHorizontal, Tune, Settings, Settings2, ' +
          'ListFilter, Filter. Allowed: ArrowUpDown (header trigger), ArrowUp, ArrowDown (menu), ' +
          'EyeOff (hide column), Check (active indicator), ChevronRight (interactive row).\n\n' +
          '**Story taxonomy:** use the **viewport toolbar** to check any story at all 14 canonical ' +
          'DS widths (320–2560). Use the **locale toolbar** to verify sq/en/uk/it. ' +
          'Stories are scenario-named — no per-width exports.',
      },
    },
  },
}

export default meta
type Story = StoryObj

// ════════════════════════════════════════════════════════════════════════════════
// ── Default ───────────────────────────────────────────────────────────────────
// The Docs/autodocs primary. Static canonical table: ⇅ sort menus on sortable
// columns, global search, Columns manager, no row interaction.
// Use the viewport + locale toolbars to check all widths and languages.
// ════════════════════════════════════════════════════════════════════════════════

export const Default: Story = {
  parameters: {
    viewport: { defaultViewport: 'canonical1200' },
    docs: {
      description: {
        story:
          'Static canonical table at 1200px. Sortable headers show small ⇅ (h-3 w-3) icons. ' +
          'Click a ⇅ to open the sort/hide menu. "Columns" button opens the visibility manager. ' +
          'Global search narrows rows. No filter chips. No row interaction (no chevron).',
      },
    },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminTableDemo locale={locale} />
  },
}

// ════════════════════════════════════════════════════════════════════════════════
// ── ColumnMenu ────────────────────────────────────────────────────────────────
// Shows the canonical column ⇅ dropdown menu in action.
// Name column: Sort A→Z / Sort Z→A + Hide column.
// Created column: Newest first / Oldest first + Hide column (date sort type).
// Reviewer: click any column ⇅ icon to open its sort menu.
// ════════════════════════════════════════════════════════════════════════════════

export const ColumnMenu: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: {
      description: {
        story:
          'Column sort/hide menus. Click the ⇅ on "Name" → Sort A→Z / Sort Z→A + Hide column. ' +
          'Click the ⇅ on "Created" → Newest first / Oldest first (date labels). ' +
          'After sorting, the active column shows a Check indicator and the ⇅ icon turns primary. ' +
          'After hiding a column, restore it via the Columns manager.',
      },
    },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminTableDemo locale={locale} />
  },
}

// ════════════════════════════════════════════════════════════════════════════════
// ── ManageColumns ─────────────────────────────────────────────────────────────
// Shows the Columns manager with one column pre-hidden (Email).
// Reviewer: click "Columns" to open the checklist; re-check "Email" to restore it.
// The first column (Name) is locked — its checkbox is disabled.
// ════════════════════════════════════════════════════════════════════════════════

export const ManageColumns: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: {
      description: {
        story:
          'Columns manager — "Email" is pre-hidden. Click "Columns" to open the checklist. ' +
          'Re-check "Email" to restore the column. ' +
          '"Name" (first/sticky column) is locked — cannot be hidden to prevent all-columns-hidden state.',
      },
    },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminTableDemo locale={locale} initialHidden={['email']} />
  },
}

// ════════════════════════════════════════════════════════════════════════════════
// ── CardMode ──────────────────────────────────────────────────────────────────
// Mobile/card mode — static (no row interaction, no chevron).
// Cards with Sort control above. No column headers → no ⇅ in card mode.
// Use the viewport toolbar to resize below 1024px to see card mode.
// ════════════════════════════════════════════════════════════════════════════════

export const CardMode: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile390' },
    docs: {
      description: {
        story:
          '390px — card mode (<1024px). Cards with compact Sort dropdown above. ' +
          'Sort model is the same as desktop; column hide/manage is table-mode only. ' +
          'No row chevron (static). Use viewport toolbar to check 320–960px range.',
      },
    },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminTableDemo locale={locale} />
  },
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Interactive ───────────────────────────────────────────────────────────────
// Desktop table mode + row click + trailing ChevronRight column + selected-row feedback.
// Sort menus and global search coexist with row interaction.
// ════════════════════════════════════════════════════════════════════════════════

export const Interactive: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: {
      description: {
        story:
          '1280px interactive. Trailing ChevronRight column on every data row. ' +
          'Click a row → "Selected record" panel. ' +
          'Sort menus, global search, and Columns manager coexist with row interaction. ' +
          'Compare Default (static, no chevron) to see identical sort/search/columns UI.',
      },
    },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminTableDemo locale={locale} interactive />
  },
}

// ════════════════════════════════════════════════════════════════════════════════
// ── InteractiveCardMode ───────────────────────────────────────────────────────
// Mobile card mode + row click + auto-chevron trailing.
// Sort dropdown + global search + Columns manager all present.
// ════════════════════════════════════════════════════════════════════════════════

export const InteractiveCardMode: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile390' },
    docs: {
      description: {
        story:
          '390px card mode — interactive. Auto-ChevronRight in card trailing (via AdminCardList). ' +
          'Click a card → "Selected record" panel. Sort dropdown + search + Columns manager all present.',
      },
    },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminTableDemo locale={locale} interactive />
  },
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Responsive ────────────────────────────────────────────────────────────────
// ONE story — use the viewport toolbar to drag across widths.
// Below 1024px: card mode + Sort dropdown.
// From 1024px: table mode + ⇅ column menus.
// Same component, same props, same sort model — just different rendering.
// ════════════════════════════════════════════════════════════════════════════════

export const Responsive: Story = {
  parameters: {
    viewport: { defaultViewport: 'tablet768' },
    docs: {
      description: {
        story:
          'Auto card↔table switch. Start at 768px (card mode). Use the viewport toolbar: ' +
          '< 1024px → card mode + Sort dropdown; ≥ 1024px → table mode + ⇅ column menus. ' +
          'Same component, same props, same sort model throughout.',
      },
    },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    return <AdminTableDemo locale={locale} />
  },
}

// ════════════════════════════════════════════════════════════════════════════════
// ── LocaleStress ──────────────────────────────────────────────────────────────
// Long Ukrainian listing-title stress test. Use the locale toolbar to switch sq/en/uk/it.
// Column sort labels, "Columns" manager, search placeholder — all localized via the locale toolbar.
// Long uk strings must wrap without overflow; ⇅ icon stays aligned.
// ════════════════════════════════════════════════════════════════════════════════

export const LocaleStress: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: {
      description: {
        story:
          'uk@1280: long Ukrainian listing titles + interactive. ' +
          'Titles wrap with break-words; trailing chevron stays visible. ' +
          'Use the locale toolbar to check sq / it / en — all sort labels and "Columns" manager are localized. ' +
          'Use the viewport toolbar to check 320–2560px.',
      },
    },
  },
  render: () => {
    // Long-string interactive table (uses UK_ROWS dataset for extreme title length test)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selected, setSelected] = useState<UkRow | null>(null)
    const ukCols: AdminTableColumn<UkRow>[] = [
      {
        key: 'name',   header: 'Назва',  sortable: true, sortType: 'text',
        sortLabels: { asc: 'Сортувати A→Z', desc: 'Сортувати Z→A', hide: 'Приховати стовпець' },
        hideable: false,
        cell: r => <span className="font-medium break-words" title={r.name}>{r.name}</span>,
      },
      {
        key: 'status', header: 'Статус', sortable: false, hideable: true,
        sortLabels: { asc: 'A→Z', desc: 'Z→A', hide: 'Приховати стовпець' },
        onHideColumn: () => {},
        cell: r => <Badge variant={ukStatusVariant(r.statusCode)}>{r.status}</Badge>,
      },
    ]
    return (
      <div className="space-y-4">
        <AdminTable rows={UK_ROWS} columns={ukCols} rowKey={r => r.id}
          emptyState="Немає записів." ariaLabel="Таблиця оголошень" onRowClick={setSelected} />
        {selected ? (
          <div className="rounded-xl border bg-card p-4 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Вибраний запис</p>
            <p className="text-sm font-medium break-words">{selected.name}</p>
            <Badge variant={ukStatusVariant(selected.statusCode)} className="text-xs">{selected.status}</Badge>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic px-1">
            Натисніть рядок або сфокусуйте його й натисніть Enter / Space, щоб побачити вибраний стан.
          </p>
        )}
      </div>
    )
  },
}

// ════════════════════════════════════════════════════════════════════════════════
// ── EmptyState ────────────────────────────────────────────────────────────────
// Empty rows — no data. No misleading chevrons.
// Also proves: empty filtered result when search narrows to 0 rows.
// ════════════════════════════════════════════════════════════════════════════════

export const EmptyState: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: {
      description: {
        story:
          'Empty state. No rows → no chevrons, no sort affordances active. ' +
          'Type in the search box to trigger the "No records match the search" empty state.',
      },
    },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const L = LABELS[locale] ?? LABELS.en
    const cols: AdminTableColumn<SampleRow>[] = [
      { key: 'name',    header: L.colName,    sortable: true,  sortType: 'text', hideable: false, cell: r => r.name },
      { key: 'state',   header: L.colStatus,  sortable: true,  sortType: 'text', hideable: true, cell: r => r.state },
      { key: 'role',    header: L.colRole,    sortable: true,  sortType: 'text', hideable: true, visibility: 'sm', cell: r => r.role },
      { key: 'created', header: L.colCreated, sortable: true,  sortType: 'date', hideable: true, visibility: 'xl', cell: r => r.created },
    ]
    return <AdminTable rows={[]} columns={cols} rowKey={r => r.id} emptyState={L.noData} />
  },
}

// ════════════════════════════════════════════════════════════════════════════════
// ── LoadingState ──────────────────────────────────────────────────────────────
// Loading skeleton — animate-pulse rows. No active sort/search affordances.
// ════════════════════════════════════════════════════════════════════════════════

export const LoadingState: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop1280' },
    docs: {
      description: {
        story: 'Loading skeleton — animate-pulse rows. No active affordances.',
      },
    },
  },
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    const L = LABELS[locale] ?? LABELS.en
    const cols: AdminTableColumn<SampleRow>[] = [
      { key: 'name',    header: L.colName,   sortable: true, sortType: 'text', hideable: false, cell: r => r.name },
      { key: 'state',   header: L.colStatus, sortable: true, sortType: 'text', hideable: true,  cell: r => r.state },
      { key: 'role',    header: L.colRole,   sortable: true, sortType: 'text', hideable: true, visibility: 'sm', cell: r => r.role },
    ]
    return <AdminTable rows={[]} columns={cols} rowKey={r => r.id} emptyState={L.noData} loading />
  },
}
