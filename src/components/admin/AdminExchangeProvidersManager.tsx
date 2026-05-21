'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  createExchangeProvider,
  updateExchangeProvider,
  deleteExchangeProvider,
  toggleExchangeProviderEnabled,
  type ExchangeProviderInput,
} from '@/modules/admin/actions/exchangeProviders'
import type { DBExchangeProvider } from '@/types/database'

// ── Form dialog ───────────────────────────────────────────────────────────────

interface FormDialogProps {
  initial?: DBExchangeProvider | null
  onClose: () => void
  onSaved: (p: DBExchangeProvider) => void
}

function ProviderFormDialog({ initial, onClose, onSaved }: FormDialogProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-overlay/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl border w-full max-w-lg p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold text-base">{initial ? t('edit') : t('new')}</h2>

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
          <Input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" placeholder="(optional)" className="h-9 rounded-xl" />
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
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 h-9 text-xs font-medium transition-colors ${mode === m ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              >
                {t(`mode_${m}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">{t('notes')}</Label>
          <Input value={notes} onChange={e => setNotes(e.target.value)} className="h-9 rounded-xl" />
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
      <div className="flex justify-end">
        <Button onClick={openNew} size="sm" className="rounded-xl gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {t('new')}
        </Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('name')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t('endpoint')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('priority')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('mode')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('is_enabled')}</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">{t('notes')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">{t('empty')}</td>
              </tr>
            ) : (
              providers.map(p => (
                <tr key={p.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate font-mono">{p.endpoint_url}</td>
                  <td className="px-4 py-3 text-sm text-center">{p.priority}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px]">{t(`mode_${p.mode}`)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={p.is_enabled ? 'default' : 'secondary'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {p.is_enabled ? t('is_enabled') : t('disable')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell max-w-[160px] truncate">{p.notes ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        title={p.is_enabled ? t('disable') : t('enable')}
                        onClick={() => handleToggle(p)}
                      >
                        {p.is_enabled
                          ? <ToggleRight className="h-3.5 w-3.5 text-status-success" />
                          : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        title={t('edit')}
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        title={t('delete')}
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
