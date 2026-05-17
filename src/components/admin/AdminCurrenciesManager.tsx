'use client'

import { useState, useTransition, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, Star, ToggleLeft, ToggleRight, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RelativeTime } from '@/components/shared/RelativeTime'
import {
  createCurrency,
  updateCurrency,
  deleteCurrency,
  toggleCurrencyActive,
  setDefaultCurrency,
  type CurrencyInput,
} from '@/modules/admin/actions/currencies'
import type { DBCurrency } from '@/types/database'

// ── Form dialog ───────────────────────────────────────────────────────────────

interface FormDialogProps {
  initial?: DBCurrency | null
  onClose: () => void
  onSaved: (c: DBCurrency) => void
}

function CurrencyFormDialog({ initial, onClose, onSaved }: FormDialogProps) {
  const t = useTranslations('admin.currency.currencies')
  const [isPending, startTransition] = useTransition()

  const [code, setCode]       = useState(initial?.code ?? '')
  const [symbol, setSymbol]   = useState(initial?.symbol ?? '')
  const [nameSq, setNameSq]   = useState(initial?.name_sq ?? '')
  const [nameEn, setNameEn]   = useState(initial?.name_en ?? '')
  const [nameUk, setNameUk]   = useState(initial?.name_uk ?? '')
  const [nameIt, setNameIt]   = useState(initial?.name_it ?? '')
  const [decimals, setDecimals] = useState(initial?.decimals ?? 0)

  function handleSubmit() {
    if (!code.trim()) { toast.error(t('error_code_required')); return }
    if (!symbol.trim()) { toast.error(t('error_symbol_required')); return }

    const input: CurrencyInput = {
      code, symbol, name_sq: nameSq, name_en: nameEn, name_uk: nameUk, name_it: nameIt, decimals,
    }

    startTransition(async () => {
      const result = initial
        ? await updateCurrency(initial.id, input)
        : await createCurrency(input)

      if (result.error) {
        if (result.code === 'duplicate_code') toast.error(t('error_code_duplicate'))
        else toast.error(result.error)
        return
      }
      toast.success(initial ? t('success_updated') : t('success_created'))
      onSaved({
        id:         (result as { id?: number }).id ?? initial?.id ?? 0,
        code:       code.toUpperCase(),
        symbol,
        name_sq:    nameSq,
        name_en:    nameEn,
        name_uk:    nameUk,
        name_it:    nameIt,
        is_active:  initial?.is_active ?? true,
        is_default: initial?.is_default ?? false,
        decimals,
        created_at: initial?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl border w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
        <h2 className="font-semibold text-base">{initial ? t('edit') : t('new')}</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('code')}</Label>
            <Input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="EUR"
              maxLength={10}
              disabled={!!initial}
              className="h-9 rounded-xl font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('symbol')}</Label>
            <Input
              value={symbol}
              onChange={e => setSymbol(e.target.value)}
              placeholder="€"
              maxLength={10}
              className="h-9 rounded-xl"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t('name_sq')}</Label>
          <Input value={nameSq} onChange={e => setNameSq(e.target.value)} className="h-9 rounded-xl" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t('name_en')}</Label>
          <Input value={nameEn} onChange={e => setNameEn(e.target.value)} className="h-9 rounded-xl" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t('name_uk')}</Label>
          <Input value={nameUk} onChange={e => setNameUk(e.target.value)} className="h-9 rounded-xl" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t('name_it')}</Label>
          <Input value={nameIt} onChange={e => setNameIt(e.target.value)} className="h-9 rounded-xl" />
        </div>

        <div className="flex flex-col gap-1.5 max-w-[120px]">
          <Label className="text-xs">{t('decimals')}</Label>
          <Input
            type="number"
            min={0}
            max={8}
            value={decimals}
            onChange={e => setDecimals(Number(e.target.value))}
            className="h-9 rounded-xl"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="rounded-xl">{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="rounded-xl min-w-[80px]">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────

interface RowProps {
  currency: DBCurrency
  onEdit: (c: DBCurrency) => void
  onDelete: (c: DBCurrency) => void
  onToggleActive: (c: DBCurrency) => void
  onSetDefault: (c: DBCurrency) => void
}

function CurrencyRow({ currency, onEdit, onDelete, onToggleActive, onSetDefault }: RowProps) {
  const t = useTranslations('admin.currency.currencies')
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-mono text-sm font-semibold">{currency.code}</td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{currency.symbol}</td>
      <td className="px-4 py-3 text-sm">{currency.name_en || currency.name_sq}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {currency.is_default && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-badge-premium text-primary-foreground">
              {t('default_badge')}
            </Badge>
          )}
          <Badge
            variant={currency.is_active ? 'default' : 'secondary'}
            className="text-[10px] px-1.5 py-0"
          >
            {currency.is_active ? t('is_active') : t('deactivate')}
          </Badge>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        <RelativeTime date={currency.updated_at} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          {!currency.is_default && currency.is_active && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              title={t('set_default')}
              onClick={() => onSetDefault(currency)}
            >
              <Star className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            title={currency.is_active ? t('deactivate') : t('activate')}
            onClick={() => onToggleActive(currency)}
          >
            {currency.is_active
              ? <ToggleRight className="h-3.5 w-3.5 text-status-success" />
              : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            title={t('edit')}
            onClick={() => onEdit(currency)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {!currency.is_default && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
              title={t('delete')}
              onClick={() => onDelete(currency)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Main manager ──────────────────────────────────────────────────────────────

interface Props {
  initialCurrencies: DBCurrency[]
}

export function AdminCurrenciesManager({ initialCurrencies }: Props) {
  const t = useTranslations('admin.currency.currencies')
  const [currencies, setCurrencies] = useState<DBCurrency[]>(initialCurrencies)
  const [query, setQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DBCurrency | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    if (!query.trim()) return currencies
    const q = query.toLowerCase()
    return currencies.filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name_en.toLowerCase().includes(q) ||
      c.name_sq.toLowerCase().includes(q)
    )
  }, [currencies, query])

  function openNew() { setEditing(null); setDialogOpen(true) }
  function openEdit(c: DBCurrency) { setEditing(c); setDialogOpen(true) }

  function handleSaved(saved: DBCurrency) {
    setCurrencies(prev => {
      const idx = prev.findIndex(c => c.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [...prev, saved]
    })
    setDialogOpen(false)
  }

  function handleDelete(c: DBCurrency) {
    if (!confirm(t('delete_confirm'))) return
    startTransition(async () => {
      const result = await deleteCurrency(c.id)
      if (result.error) {
        if (result.code === 'default_currency') toast.error(t('delete_blocked'))
        else toast.error(result.error)
        return
      }
      toast.success(t('success_deleted'))
      setCurrencies(prev => prev.filter(x => x.id !== c.id))
    })
  }

  function handleToggleActive(c: DBCurrency) {
    startTransition(async () => {
      const result = await toggleCurrencyActive(c.id, !c.is_active)
      if (result.error) {
        if (result.code === 'default_currency') toast.error(t('error_default_required'))
        else toast.error(result.error)
        return
      }
      toast.success(c.is_active ? t('success_deactivated') : t('success_activated'))
      setCurrencies(prev => prev.map(x => x.id === c.id ? { ...x, is_active: !c.is_active } : x))
    })
  }

  function handleSetDefault(c: DBCurrency) {
    startTransition(async () => {
      const result = await setDefaultCurrency(c.id)
      if (result.error) { toast.error(result.error); return }
      toast.success(t('success_default_set'))
      setCurrencies(prev => prev.map(x => ({ ...x, is_default: x.id === c.id })))
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="EUR, ALL…"
            className="pl-9 h-9 rounded-xl text-sm"
          />
        </div>
        <Button onClick={openNew} size="sm" className="rounded-xl gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {t('new')}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('code')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('symbol')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('name_en')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('is_active')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('last_updated')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">{t('empty')}</td>
              </tr>
            ) : (
              filtered.map(c => (
                <CurrencyRow
                  key={c.id}
                  currency={c}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onSetDefault={handleSetDefault}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <CurrencyFormDialog
          initial={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
