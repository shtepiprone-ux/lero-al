'use client'

import { useState, useTransition, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { AdminCurrenciesView } from '@/components/admin/AdminCurrenciesView'
import { CurrencyFormDialogView, type CurrencyFormValues } from '@/components/admin/CurrencyFormDialogView'
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

export interface CurrencyFormDialogProps {
  initial?: DBCurrency | null
  onClose: () => void
  onSaved: (c: DBCurrency) => void
}

type FormDialogProps = CurrencyFormDialogProps

export function CurrencyFormDialog({ initial, onClose, onSaved }: FormDialogProps) {
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

  const values: CurrencyFormValues = { code, symbol, nameSq, nameEn, nameUk, nameIt, decimals }

  function handleFieldChange<K extends keyof CurrencyFormValues>(field: K, value: CurrencyFormValues[K]) {
    switch (field) {
      case 'code': setCode((value as string).toUpperCase()); break
      case 'symbol': setSymbol(value as string); break
      case 'nameSq': setNameSq(value as string); break
      case 'nameEn': setNameEn(value as string); break
      case 'nameUk': setNameUk(value as string); break
      case 'nameIt': setNameIt(value as string); break
      case 'decimals': setDecimals(value as number); break
    }
  }

  return (
    <CurrencyFormDialogView
      opened
      isEdit={!!initial}
      values={values}
      onFieldChange={handleFieldChange}
      submitting={isPending}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
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
    <AdminCurrenciesView
      currencies={filtered}
      query={query}
      onQueryChange={setQuery}
      isPending={isPending}
      onNew={openNew}
      detailTarget={detailTarget}
      onOpenDetail={setDetailTarget}
      onCloseDetail={() => setDetailTarget(null)}
      onDetailEdit={() => { setDetailTarget(null); openEdit(detailTarget!) }}
      onDetailToggleActive={() => { handleToggleActive(detailTarget!); setDetailTarget(null) }}
      onDetailSetDefault={() => { handleSetDefault(detailTarget!); setDetailTarget(null) }}
      onDetailDelete={() => { setDeleteTarget(detailTarget!); setDetailTarget(null) }}
      deleteTarget={deleteTarget}
      onCancelDelete={() => setDeleteTarget(null)}
      onConfirmDelete={handleDelete}
      formSlot={dialogOpen ? (
        <CurrencyFormDialog
          initial={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={handleSaved}
        />
      ) : null}
    />
  )
}
