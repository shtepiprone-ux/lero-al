'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { AdminExchangeProvidersView } from '@/components/admin/AdminExchangeProvidersView'
import { ProviderFormDialogView, type ProviderFormValues } from '@/components/admin/ProviderFormDialogView'
import {
  createExchangeProvider,
  updateExchangeProvider,
  deleteExchangeProvider,
  toggleExchangeProviderEnabled,
  type ExchangeProviderInput,
} from '@/modules/admin/actions/exchangeProviders'
import type { DBExchangeProvider } from '@/types/database'

// ── Form dialog ───────────────────────────────────────────────────────────────

export interface ProviderFormDialogProps {
  initial?: DBExchangeProvider | null
  onClose: () => void
  onSaved: (p: DBExchangeProvider) => void
}

type FormDialogProps = ProviderFormDialogProps

export function ProviderFormDialog({ initial, onClose, onSaved }: FormDialogProps) {
  const t = useTranslations('admin.currency.providers')
  const [isPending, startTransition] = useTransition()

  const [name, setName]           = useState(initial?.name ?? '')
  const [endpoint, setEndpoint]   = useState(initial?.endpoint_url ?? '')
  const [apiKey, setApiKey]       = useState(initial?.api_key ?? '')
  const [interval, setInterval]   = useState(initial?.refresh_interval_min ?? 60)
  const [priority, setPriority]   = useState(initial?.priority ?? 10)
  const [mode, setMode]           = useState<'auto' | 'manual' | 'hybrid'>(initial?.mode ?? 'auto')
  const [notes, setNotes]         = useState(initial?.notes ?? '')
  const [apiKeyVisible, setApiKeyVisible] = useState(false)

  function handleSubmit() {
    if (!name.trim()) { toast.error(t('error_name_required')); return }
    if (!endpoint.trim()) { toast.error(t('error_endpoint_required')); return }

    const input: ExchangeProviderInput = {
      name,
      endpoint_url: endpoint,
      api_key: apiKey || undefined,
      refresh_interval_min: interval,
      priority,
      mode,
      notes: notes || undefined,
    }

    startTransition(async () => {
      const result = initial
        ? await updateExchangeProvider(initial.id, input)
        : await createExchangeProvider(input)

      if (result.error) {
        if (result.code === 'duplicate_name') toast.error(t('error_name_required'))
        else toast.error(result.error)
        return
      }
      toast.success(initial ? t('success_updated') : t('success_created'))
      onSaved({
        id:                   (result as { id?: number }).id ?? initial?.id ?? 0,
        name,
        endpoint_url:         endpoint,
        api_key:              apiKey || null,
        refresh_interval_min: interval,
        priority,
        mode,
        is_enabled:           initial?.is_enabled ?? true,
        notes:                notes || null,
        created_at:           initial?.created_at ?? new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      })
    })
  }

  const values: ProviderFormValues = { name, endpoint, apiKey, interval, priority, mode, notes }

  function handleFieldChange<K extends keyof ProviderFormValues>(field: K, value: ProviderFormValues[K]) {
    switch (field) {
      case 'name': setName(value as string); break
      case 'endpoint': setEndpoint(value as string); break
      case 'apiKey': setApiKey(value as string); break
      case 'interval': setInterval(value as number); break
      case 'priority': setPriority(value as number); break
      case 'mode': setMode(value as ProviderFormValues['mode']); break
      case 'notes': setNotes(value as string); break
    }
  }

  return (
    <ProviderFormDialogView
      opened
      isEdit={!!initial}
      values={values}
      onFieldChange={handleFieldChange}
      apiKeyVisible={apiKeyVisible}
      onApiKeyVisibilityChange={setApiKeyVisible}
      submitting={isPending}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  )
}

// ── Main manager ──────────────────────────────────────────────────────────────

interface Props {
  initialProviders: DBExchangeProvider[]
}

export function AdminExchangeProvidersManager({ initialProviders }: Props) {
  const t = useTranslations('admin.currency.providers')
  const [providers, setProviders] = useState<DBExchangeProvider[]>(initialProviders)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DBExchangeProvider | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DBExchangeProvider | null>(null)
  const [isPending, startTransition] = useTransition()

  function openNew() { setEditing(null); setDialogOpen(true) }
  function openEdit(p: DBExchangeProvider) { setEditing(p); setDialogOpen(true) }

  function handleSaved(saved: DBExchangeProvider) {
    setProviders(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [...prev, saved]
    })
    setDialogOpen(false)
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteExchangeProvider(deleteTarget.id)
      if (result.error) { toast.error(result.error); return }
      toast.success(t('success_deleted'))
      setProviders(prev => prev.filter(x => x.id !== deleteTarget!.id))
      setDeleteTarget(null)
    })
  }

  function handleToggle(p: DBExchangeProvider) {
    startTransition(async () => {
      const result = await toggleExchangeProviderEnabled(p.id, !p.is_enabled)
      if (result.error) { toast.error(result.error); return }
      toast.success(p.is_enabled ? t('success_disabled') : t('success_enabled'))
      setProviders(prev => prev.map(x => x.id === p.id ? { ...x, is_enabled: !p.is_enabled } : x))
    })
  }

  return (
    <AdminExchangeProvidersView
      providers={providers}
      isPending={isPending}
      deleteTarget={deleteTarget}
      onNew={openNew}
      onEdit={openEdit}
      onToggle={handleToggle}
      onRequestDelete={setDeleteTarget}
      onCancelDelete={() => setDeleteTarget(null)}
      onConfirmDelete={handleDelete}
      formSlot={dialogOpen ? (
        <ProviderFormDialog
          initial={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={handleSaved}
        />
      ) : null}
    />
  )
}
