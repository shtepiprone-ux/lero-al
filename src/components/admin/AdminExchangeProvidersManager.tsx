'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Badge } from '@/components/ui/badge'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
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

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? t('edit') : t('new')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('name')}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-9 rounded-xl" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('endpoint')}</Label>
            <Input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="https://" className="h-9 rounded-xl font-mono text-sm" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('api_key')}</Label>
            <PasswordInput value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="(optional)" className="h-9 rounded-xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{t('refresh_interval')}</Label>
              <Input type="number" min={1} value={interval} onChange={e => setInterval(Number(e.target.value))} className="h-9 rounded-xl" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">{t('priority')}</Label>
              <Input type="number" min={1} value={priority} onChange={e => setPriority(Number(e.target.value))} className="h-9 rounded-xl" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('mode')}</Label>
            <div className="flex rounded-xl border overflow-hidden">
              {(['auto', 'manual', 'hybrid'] as const).map(m => (
                <Button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  size="lg"
                  variant={mode === m ? 'default' : 'ghost'}
                  className="flex-1 rounded-none text-xs"
                >
                  {t(`mode_${m}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">{t('notes')}</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} className="h-9 rounded-xl" />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isPending} className="rounded-xl">{t('cancel')}</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="rounded-xl min-w-20">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  const tc = useTranslations('common')
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

  const columns: AdminTableColumn<DBExchangeProvider>[] = [
    {
      key: 'name',
      header: t('name'),
      cell: p => (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); openEdit(p) }}
          className="font-medium text-left hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
        >
          {p.name}
        </button>
      ),
    },
    {
      key: 'endpoint',
      header: t('endpoint'),
      visibility: 'md',
      cell: p => <span className="text-xs text-muted-foreground max-w-50 truncate font-mono block">{p.endpoint_url}</span>,
    },
    {
      key: 'priority',
      header: t('priority'),
      cell: p => <span className="text-sm">{p.priority}</span>,
    },
    {
      key: 'mode',
      header: t('mode'),
      cell: p => <Badge variant="outline" className="text-2xs">{t(`mode_${p.mode}`)}</Badge>,
    },
    {
      key: 'is_enabled',
      header: t('is_enabled'),
      cell: p => (
        <Badge variant={p.is_enabled ? 'default' : 'secondary'} className="text-2xs px-1.5 py-0">
          {p.is_enabled ? t('is_enabled') : t('disable')}
        </Badge>
      ),
    },
    {
      key: 'notes',
      header: t('notes'),
      visibility: 'lg',
      cell: p => <span className="text-xs text-muted-foreground max-w-40 truncate block">{p.notes ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: p => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            title={p.is_enabled ? t('disable') : t('enable')}
            onClick={e => { e.stopPropagation(); handleToggle(p) }}
          >
            {p.is_enabled
              ? <ToggleRight className="h-3.5 w-3.5 text-status-success" />
              : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
            }
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title={t('edit')}
            onClick={e => { e.stopPropagation(); openEdit(p) }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            title={t('delete')}
            onClick={e => { e.stopPropagation(); setDeleteTarget(p) }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
    {deleteTarget && (
      <Dialog open onOpenChange={v => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('delete_confirm')}</DialogTitle>
            <DialogDescription>{deleteTarget.name}</DialogDescription>
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
    <div className="flex flex-col gap-4">
      <div className="flex sm:justify-end">
        <Button onClick={openNew} size="sm" className="rounded-xl gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {t('new')}
        </Button>
      </div>

      <AdminTable
        rows={providers}
        columns={columns}
        rowKey={p => String(p.id)}
        onRowClick={openEdit}
        emptyState={t('empty')}
        ariaLabel={t('name')}
        cardRow={p => ({
          title: (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); openEdit(p) }}
              className="font-medium text-left hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
            >
              {p.name}
            </button>
          ),
          subtitle: (
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge variant="outline" className="text-2xs">{t(`mode_${p.mode}`)}</Badge>
              <Badge variant={p.is_enabled ? 'default' : 'secondary'} className="text-2xs px-1.5 py-0">
                {p.is_enabled ? t('is_enabled') : t('disable')}
              </Badge>
            </div>
          ),
          meta: (
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
              <span>{t('priority')}: {p.priority}</span>
              {p.endpoint_url && <span className="font-mono truncate max-w-50">{p.endpoint_url}</span>}
              {p.notes && <span className="truncate max-w-40">{p.notes}</span>}
            </div>
          ),
          trailing: (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                title={p.is_enabled ? t('disable') : t('enable')}
                onClick={e => { e.stopPropagation(); handleToggle(p) }}
              >
                {p.is_enabled
                  ? <ToggleRight className="h-3.5 w-3.5 text-status-success" />
                  : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
                }
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                title={t('delete')}
                onClick={e => { e.stopPropagation(); setDeleteTarget(p) }}
                aria-label={tc('delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" aria-hidden="true" />
            </div>
          ),
        })}
      />

      {dialogOpen && (
        <ProviderFormDialog
          initial={editing}
          onClose={() => setDialogOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
    </>
  )
}
