'use client'

import { useState, useTransition, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, Star, ToggleLeft, ToggleRight, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
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

// ── Form dialog (create / edit) ───────────────────────────────────────────────

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
      <div className="absolute inset-0 bg-overlay/40 backdrop-blur-sm" onClick={onClose} />
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

// ── Detail dialog (§11 — row click → preview + actions) ───────────────────────

interface DetailDialogProps {
  currency: DBCurrency
  onClose: () => void
  onEdit: () => void
  onToggleActive: () => void
  onSetDefault: () => void
  onDelete: () => void
}

function CurrencyDetailDialog({ currency, onClose, onEdit, onToggleActive, onSetDefault, onDelete }: DetailDialogProps) {
  const t = useTranslations('admin.currency.currencies')
  const tc = useTranslations('common')

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-lg">{currency.code}</DialogTitle>
          <DialogDescription>{currency.name_en || currency.name_sq}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm py-2">
          <div>
            <span className="text-muted-foreground text-xs">{t('symbol')}</span>
            <p className="font-medium">{currency.symbol}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">{t('decimals')}</span>
            <p className="font-medium">{currency.decimals}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground text-xs">{t('name_sq')}</span>
            <p>{currency.name_sq}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground text-xs">{t('name_en')}</span>
            <p>{currency.name_en}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground text-xs">{t('name_uk')}</span>
            <p>{currency.name_uk}</p>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground text-xs">{t('name_it')}</span>
            <p>{currency.name_it}</p>
          </div>
          <div className="col-span-2 flex gap-2 pt-1">
            {currency.is_default && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-badge-premium text-primary-foreground">
                {t('default_badge')}
              </Badge>
            )}
            <Badge variant={currency.is_active ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
              {currency.is_active ? t('is_active') : t('deactivate')}
            </Badge>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:gap-2 sm:flex-wrap">
          {!currency.is_default && currency.is_active && (
            <Button variant="outline" size="sm" onClick={onSetDefault} className="rounded-xl gap-1.5">
              <Star className="h-3.5 w-3.5" />
              {t('set_default')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onToggleActive} className="rounded-xl gap-1.5">
            {currency.is_active
              ? <ToggleLeft className="h-3.5 w-3.5" />
              : <ToggleRight className="h-3.5 w-3.5" />
            }
            {currency.is_active ? t('deactivate') : t('activate')}
          </Button>
          <Button size="sm" onClick={onEdit} className="rounded-xl gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            {t('edit')}
          </Button>
          {!currency.is_default && (
            <Button variant="destructive" size="sm" onClick={onDelete} className="rounded-xl gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              {t('delete')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">{tc('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const tc = useTranslations('common')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DBCurrency | null>(null)
  const [detailTarget, setDetailTarget] = useState<DBCurrency | null>(null)
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

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteCurrency(deleteTarget.id)
      if (result.error) {
        if (result.code === 'default_currency') toast.error(t('delete_blocked'))
        else toast.error(result.error)
        return
      }
      toast.success(t('success_deleted'))
      setCurrencies(prev => prev.filter(x => x.id !== deleteTarget!.id))
      setDeleteTarget(null)
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
    <>
    {/* Delete confirmation dialog */}
    {deleteTarget && (
      <Dialog open onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('delete_confirm')}</DialogTitle>
            <DialogDescription>{deleteTarget.code} — {deleteTarget.name_en || deleteTarget.name_sq}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>{tc('cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending} className="gap-1.5">
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
              {tc('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}

    {/* §11 detail dialog — opens on code cell click */}
    {detailTarget && (
      <CurrencyDetailDialog
        currency={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={() => { setDetailTarget(null); openEdit(detailTarget!) }}
        onToggleActive={() => { handleToggleActive(detailTarget!); setDetailTarget(null) }}
        onSetDefault={() => { handleSetDefault(detailTarget!); setDetailTarget(null) }}
        onDelete={() => { setDeleteTarget(detailTarget!); setDetailTarget(null) }}
      />
    )}

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

      {/* Table — §11: code is the only click target; no Actions column */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('code')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('symbol')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('name_en')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('is_active')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('last_updated')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">{t('empty')}</td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDetailTarget(c)}
                      className="font-mono text-sm font-semibold hover:text-primary transition-colors"
                    >
                      {c.code}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{c.symbol}</td>
                  <td className="px-4 py-3 text-sm">{c.name_en || c.name_sq}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {c.is_default && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-badge-premium text-primary-foreground">
                          {t('default_badge')}
                        </Badge>
                      )}
                      <Badge
                        variant={c.is_active ? 'default' : 'secondary'}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {c.is_active ? t('is_active') : t('deactivate')}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <RelativeTime date={c.updated_at} />
                  </td>
                </tr>
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
    </>
  )
}
