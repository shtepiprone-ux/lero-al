'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import {
  Plus, Loader2, ChevronRight, Clock, User, ShieldAlert,
  CheckCircle2, XCircle, AlertCircle, Circle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/formatters'
import { createSupportTicket, updateTicketStatus } from '@/modules/admin/actions'
import type { TicketStatus } from '@/types/database'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SupportTicketRow {
  id: string
  subject: string
  status: TicketStatus
  ticket_type: 'support' | 'user_complaint'
  reason: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  reporter: { id: string; name: string | null } | null
  reported: { id: string; name: string | null } | null
  created_by_admin: { id: string; name: string | null } | null
}

export interface SupportTicketEventRow {
  id: string
  ticket_id: string
  actor_user_id: string | null
  actor_role: string | null
  event_type: string
  old_status: string | null
  new_status: string | null
  note: string | null
  created_at: string
  actor: { name: string | null } | null
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'neutral'

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  open: 'warning', in_progress: 'info', resolved: 'success', closed: 'neutral',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  open:        <Circle className="h-3 w-3" />,
  in_progress: <AlertCircle className="h-3 w-3" />,
  resolved:    <CheckCircle2 className="h-3 w-3" />,
  closed:      <XCircle className="h-3 w-3" />,
}

const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed']

// ── Sub-components ────────────────────────────────────────────────────────────

function UserLink({ user, label }: { user: { id: string; name: string | null } | null; label: string }) {
  if (!user) return <span className="text-muted-foreground/60 text-xs">{label}</span>
  return (
    <Link
      href={`/admin/users/${user.id}`}
      className="text-xs font-medium hover:text-primary transition-colors truncate max-w-[120px] block"
    >
      {user.name ?? user.id.slice(0, 8) + '…'}
    </Link>
  )
}

// ── Detail dialog ─────────────────────────────────────────────────────────────

function TicketDetailDialog({
  ticket,
  events,
  onClose,
  onStatusUpdated,
}: {
  ticket: SupportTicketRow
  events: SupportTicketEventRow[]
  onClose: () => void
  onStatusUpdated: (ticketId: string, newStatus: TicketStatus) => void
}) {
  const t = useTranslations('admin.support')
  const locale = useLocale()
  const [, startTransition] = useTransition()
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status)
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)

  function handleStatusUpdate() {
    if (newStatus === ticket.status) return
    setUpdating(true)
    startTransition(async () => {
      const res = await updateTicketStatus(ticket.id, newStatus, note)
      setUpdating(false)
      if (res.error) {
        toast.error(t('status_update_error'))
      } else {
        toast.success(t('status_update_success'))
        onStatusUpdated(ticket.id, newStatus)
        setNote('')
      }
    })
  }

  const ticketEvents = events.filter(e => e.ticket_id === ticket.id)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold leading-tight pr-4">
            {ticket.subject}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{t('col_reporter')}</p>
              <UserLink user={ticket.reporter} label="—" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{t('col_reported')}</p>
              <UserLink user={ticket.reported} label="—" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{t('col_created_by')}</p>
              <UserLink user={ticket.created_by_admin} label="—" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{t('col_type')}</p>
              <Badge variant={ticket.ticket_type === 'user_complaint' ? 'destructive' : 'info'} className="text-xs h-5">
                {ticket.ticket_type === 'user_complaint' ? t('type_user_complaint') : t('type_support')}
              </Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{t('col_status')}</p>
              <Badge variant={STATUS_VARIANT[ticket.status] ?? 'neutral'} className="text-xs h-5 gap-1">
                {STATUS_ICON[ticket.status]}
                {ticket.status}
              </Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{t('col_created')}</p>
              <span className="text-xs">{formatDate(ticket.created_at, locale)}</span>
            </div>
          </div>

          {/* Reason */}
          {ticket.reason && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">{t('reason_section')}</p>
              <p className="text-sm bg-muted/40 rounded-lg px-3 py-2 leading-relaxed">{ticket.reason}</p>
            </div>
          )}

          {/* Status change */}
          <div className="border rounded-xl p-4 space-y-3 bg-muted/20">
            <p className="text-sm font-medium">{t('status_change_label')}</p>
            <div className="flex flex-wrap gap-2">
              {TICKET_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    newStatus === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {STATUS_ICON[s]}
                  {s}
                </button>
              ))}
            </div>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={t('note_placeholder')}
              className="min-h-[60px] text-sm resize-none"
            />
            <Button
              size="sm"
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === ticket.status}
            >
              {updating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              {t('update_status_btn')}
            </Button>
          </div>

          {/* Timeline */}
          {ticketEvents.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('timeline_title')}</p>
              <div className="space-y-2">
                {ticketEvents.map(ev => (
                  <div key={ev.id} className="flex items-start gap-2.5 text-xs">
                    <div className="mt-0.5 h-4 w-4 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">{ev.actor?.name ?? ev.actor_role ?? '—'}</span>
                        {ev.event_type === 'status_changed' && ev.old_status && ev.new_status && (
                          <span className="text-muted-foreground">
                            {ev.old_status} → {ev.new_status}
                          </span>
                        )}
                        {ev.event_type === 'created' && (
                          <span className="text-muted-foreground">{t('event_created')}</span>
                        )}
                        <span className="text-muted-foreground/60 ml-auto">{formatDate(ev.created_at, locale)}</span>
                      </div>
                      {ev.note && <p className="text-muted-foreground mt-0.5 leading-relaxed">{ev.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Create complaint dialog ───────────────────────────────────────────────────

function CreateComplaintDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (ticket: SupportTicketRow) => void
}) {
  const t = useTranslations('admin.support')
  const [, startTransition] = useTransition()
  const [reporterUserId, setReporterUserId] = useState('')
  const [reportedUserId, setReportedUserId] = useState('')
  const [subject, setSubject] = useState('')
  const [reason, setReason] = useState('')
  const [creating, setCreating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!reporterUserId.trim()) e.reporter = t('reporter_required')
    if (!reportedUserId.trim()) e.reported = t('reported_required')
    if (!subject.trim()) e.subject = t('subject_required')
    if (!reason.trim()) e.reason = t('reason_required')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleCreate() {
    if (!validate()) return
    setCreating(true)
    startTransition(async () => {
      const res = await createSupportTicket({
        reportedUserId: reportedUserId.trim(),
        reporterUserId: reporterUserId.trim(),
        subject: subject.trim(),
        reason: reason.trim(),
      })
      setCreating(false)
      if (res.error) {
        if (res.error === 'reported_not_found') setErrors(e => ({ ...e, reported: t('user_not_found') }))
        else if (res.error === 'reporter_not_found') setErrors(e => ({ ...e, reporter: t('user_not_found') }))
        else toast.error(t('create_error'))
      } else {
        toast.success(t('create_success'))
        // Build a minimal optimistic ticket row so the list updates immediately
        onCreated({
          id: res.id!,
          subject: subject.trim(),
          status: 'open',
          ticket_type: 'user_complaint',
          reason: reason.trim(),
          assigned_to: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reporter: { id: reporterUserId.trim(), name: null },
          reported: { id: reportedUserId.trim(), name: null },
          created_by_admin: null,
        })
        onClose()
      }
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('dialog_create_title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Reporter */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {t('reporter_label')}
            </label>
            <Input
              value={reporterUserId}
              onChange={e => setReporterUserId(e.target.value)}
              placeholder={t('reporter_placeholder')}
              className="font-mono text-xs"
            />
            {errors.reporter && <p className="text-xs text-destructive">{errors.reporter}</p>}
          </div>

          {/* Reported */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
              {t('reported_label')}
            </label>
            <Input
              value={reportedUserId}
              onChange={e => setReportedUserId(e.target.value)}
              placeholder={t('reported_placeholder')}
              className="font-mono text-xs"
            />
            {errors.reported && <p className="text-xs text-destructive">{errors.reported}</p>}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('subject_label')}</label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder={t('subject_placeholder')}
            />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('reason_label')}</label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={t('reason_placeholder')}
              className="min-h-[80px] resize-none"
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={creating}>
            {t('cancel_btn')}
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={creating}>
            {creating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {t('create_btn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  tickets: SupportTicketRow[]
  events: SupportTicketEventRow[]
}

export function AdminSupportManager({ tickets: init, events: initEvents }: Props) {
  const t = useTranslations('admin.support')
  const tp = useTranslations('admin.pages')
  const locale = useLocale()
  const [items, setItems] = useState(init)
  const [allEvents, setAllEvents] = useState(initEvents)
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<SupportTicketRow | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'support' | 'user_complaint'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const filtered = items.filter(tk => {
    if (typeFilter !== 'all' && tk.ticket_type !== typeFilter) return false
    if (statusFilter && tk.status !== statusFilter) return false
    return true
  })

  const counts = {
    open:        items.filter(t => t.status === 'open').length,
    in_progress: items.filter(t => t.status === 'in_progress').length,
    resolved:    items.filter(t => t.status === 'resolved' || t.status === 'closed').length,
  }

  function handleCreated(ticket: SupportTicketRow) {
    setItems(prev => [ticket, ...prev])
  }

  function handleStatusUpdated(ticketId: string, newStatus: TicketStatus) {
    setItems(prev => prev.map(tk => tk.id === ticketId ? { ...tk, status: newStatus, updated_at: new Date().toISOString() } : tk))
    if (selected?.id === ticketId) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
    // Add optimistic event
    setAllEvents(prev => [...prev, {
      id: Math.random().toString(),
      ticket_id: ticketId,
      actor_user_id: null,
      actor_role: null,
      event_type: 'status_changed',
      old_status: selected?.status ?? null,
      new_status: newStatus,
      note: null,
      created_at: new Date().toISOString(),
      actor: null,
    }])
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: tp('support_open'), count: counts.open },
          { label: tp('support_in_progress'), count: counts.in_progress },
          { label: tp('support_resolved'), count: counts.resolved },
        ].map(({ label, count }) => (
          <div key={label} className="bg-card rounded-2xl border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Type filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'support', 'user_complaint'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                typeFilter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? t('filter_all') : f === 'support' ? t('type_support') : t('type_user_complaint')}
            </button>
          ))}
        </div>
        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(['', ...TICKET_STATUSES] as const).map(s => (
            <button
              key={s || 'all-s'}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s || t('filter_all_status')}
            </button>
          ))}
        </div>
        <Button size="sm" className="ml-auto gap-1.5" onClick={() => setShowNew(true)}>
          <Plus className="h-3.5 w-3.5" />
          {t('new_complaint_btn')}
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('col_subject')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">{t('col_type')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t('col_reporter')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">{t('col_reported')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('col_status')}</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t('col_updated')}</th>
                <th className="px-4 py-3 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {tp('support_empty')}
                  </td>
                </tr>
              ) : filtered.map(tk => (
                <tr
                  key={tk.id}
                  className="hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => setSelected(tk)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[200px]">{tk.subject}</p>
                    {tk.reason && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">{tk.reason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge
                      variant={tk.ticket_type === 'user_complaint' ? 'destructive' : 'info'}
                      className="text-xs h-5"
                    >
                      {tk.ticket_type === 'user_complaint' ? t('type_user_complaint') : t('type_support')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <UserLink user={tk.reporter} label="—" />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <UserLink user={tk.reported} label="—" />
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[tk.status] ?? 'neutral'} className="text-xs h-5 gap-1">
                      {STATUS_ICON[tk.status]}
                      {tk.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {formatDate(tk.updated_at, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      {showNew && (
        <CreateComplaintDialog
          onClose={() => setShowNew(false)}
          onCreated={ticket => { handleCreated(ticket); setShowNew(false) }}
        />
      )}
      {selected && (
        <TicketDetailDialog
          ticket={selected}
          events={allEvents}
          onClose={() => setSelected(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  )
}
