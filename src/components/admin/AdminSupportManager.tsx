'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import {
  Plus, Loader2, Clock, User, ShieldAlert,
  CheckCircle2, XCircle, AlertCircle, Circle, Search, X,
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
import { createSupportTicket, updateTicketStatus, searchUsersForPicker } from '@/modules/admin/actions'
import type { TicketStatus, ComplaintType } from '@/types/database'
import { Combobox, type ComboboxOption } from '@/components/shared/Combobox'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SupportTicketRow {
  id: string
  subject: string
  status: TicketStatus
  ticket_type: 'support' | 'user_complaint'
  complaint_type: ComplaintType | null
  reason: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  reporter: { id: string; name: string | null } | null
  reported: { id: string; name: string | null } | null
  created_by_admin: { id: string; name: string | null } | null
}

const COMPLAINT_TYPES: ComplaintType[] = [
  'fraud_or_scam', 'fake_listing_or_profile', 'harassment_or_abuse',
  'inappropriate_content', 'spam', 'payment_or_deposit_issue',
  'duplicate_or_impersonation', 'other',
]

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

export interface PickerUser {
  id: string
  name: string | null
  last_name: string | null
  phone: string | null
  role: string
  status: string | null
  company_name: string | null
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

function pickerUserName(user: PickerUser): string | null {
  return [user.name, user.last_name].filter(Boolean).join(' ') || null
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UserLink({ user, label, showUuid }: { user: { id: string; name: string | null } | null; label: string; showUuid?: boolean }) {
  if (!user) return <span className="text-muted-foreground/60 text-xs">{label}</span>
  const displayName = user.name
  return (
    <div>
      <Link
        href={`/admin/users/${user.id}`}
        className="text-xs font-medium hover:text-primary transition-colors truncate max-w-30 block"
      >
        {displayName ?? user.id.slice(0, 8) + '…'}
      </Link>
      {showUuid && displayName && (
        <span className="text-2xs text-muted-foreground/50 font-mono block truncate max-w-30">
          {user.id.slice(0, 8)}…
        </span>
      )}
    </div>
  )
}

export function UserCard({ user, onClear }: { user: PickerUser; onClear: () => void }) {
  const t = useTranslations('admin.support')
  const tu = useTranslations('admin.users')
  const fullName = pickerUserName(user)
  const USER_STATUS_VARIANT: Record<string, BadgeVariant> = { active: 'success', blocked: 'destructive' }
  const statusVariant: BadgeVariant = USER_STATUS_VARIANT[user.status ?? ''] ?? 'neutral'
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg border bg-muted/30">
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium truncate">{fullName ?? '—'}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-2xs h-4 px-1">{t(`role_${user.role}` as `role_admin`)}</Badge>
          {user.status && (
            <Badge variant={statusVariant} className="text-2xs h-4 px-1">{tu(`user_status_${user.status}` as `user_status_active`)}</Badge>
          )}
          {user.phone && <span className="text-xs text-muted-foreground">{user.phone}</span>}
        </div>
        {user.company_name && (
          <p className="text-xs text-muted-foreground truncate">{user.company_name}</p>
        )}
        <p className="text-2xs text-muted-foreground/50 font-mono">{user.id.slice(0, 8)}…</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        onClick={onClear}
        className="shrink-0 h-auto p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
        aria-label={t('aria_clear_selection')}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function UserPickerField({
  label, icon, value, onChange, error, placeholder,
}: {
  label: string
  icon: React.ReactNode
  value: PickerUser | null
  onChange: (user: PickerUser | null) => void
  error?: string
  placeholder?: string
}) {
  const t = useTranslations('admin.support')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PickerUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setIsSearching(true)
    const timer = setTimeout(async () => {
      const res = await searchUsersForPicker(query)
      setResults(res)
      setIsSearching(false)
      setOpen(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(user: PickerUser) {
    onChange(user)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {value ? (
        <UserCard user={value} onClear={() => onChange(null)} />
      ) : (
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className="pl-8 text-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          {open && (
            <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border rounded-lg shadow-lg overflow-hidden">
              {results.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">{t('no_results')}</p>
              ) : results.map(u => {
                const fullName = pickerUserName(u)
                return (
                  <Button
                    key={u.id}
                    type="button"
                    variant="ghost"
                    onMouseDown={() => handleSelect(u)}
                    className="w-full justify-start text-left px-3 py-2 h-auto hover:bg-muted/50 transition-colors rounded-none border-t first:border-t-0"
                  >
                    <p className="text-sm font-medium truncate">{fullName ?? '—'}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <Badge variant="outline" className="text-2xs h-4 px-1">{t(`role_${u.role}` as `role_admin`)}</Badge>
                      {u.phone && <span className="text-xs text-muted-foreground">{u.phone}</span>}
                    </div>
                    <p className="text-2xs text-muted-foreground/50 font-mono mt-0.5">{u.id.slice(0, 8)}…</p>
                  </Button>
                )
              })}
            </div>
          )}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
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
              <p className="text-xs text-muted-foreground">
                {ticket.ticket_type === 'user_complaint' ? t('col_reporter') : t('col_requester')}
              </p>
              <UserLink user={ticket.reporter} label="—" showUuid />
            </div>
            {ticket.ticket_type === 'user_complaint' && (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{t('col_reported')}</p>
                <UserLink user={ticket.reported} label="—" showUuid />
              </div>
            )}
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
            {ticket.ticket_type === 'user_complaint' && ticket.complaint_type && (
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{t('complaint_type_label')}</p>
                <Badge variant="neutral" className="text-xs h-5">
                  {t(`complaint_type_${ticket.complaint_type}` as 'complaint_type_other')}
                </Badge>
              </div>
            )}
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{t('col_status')}</p>
              <Badge variant={STATUS_VARIANT[ticket.status] ?? 'neutral'} className="text-xs h-5 gap-1">
                {STATUS_ICON[ticket.status]}
                {t(`support_status_${ticket.status}` as `support_status_open`)}
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
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {TICKET_STATUSES.map(s => (
                <Button
                  key={s}
                  type="button"
                  variant="ghost"
                  onClick={() => setNewStatus(s)}
                  className={`px-3 py-1.5 h-auto transition-colors rounded-lg text-xs gap-1.5 ${
                    newStatus === s
                      ? 'bg-primary text-primary-foreground hover:bg-primary'
                      : 'border border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {STATUS_ICON[s]}
                  {t(`support_status_${s}` as `support_status_open`)}
                </Button>
              ))}
            </div>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={t('note_placeholder')}
              className="min-h-15 text-sm resize-none"
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

// ── Create ticket dialog (support or user_complaint) ─────────────────────────

function CreateTicketDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (ticket: SupportTicketRow) => void
}) {
  const t = useTranslations('admin.support')
  const [, startTransition] = useTransition()
  const [ticketType, setTicketType] = useState<'support' | 'user_complaint' | ''>('')
  const [requester, setRequester] = useState<PickerUser | null>(null)
  const [reported, setReported] = useState<PickerUser | null>(null)
  const [complaintType, setComplaintType] = useState<ComplaintType | ''>('')
  const [subject, setSubject] = useState('')
  const [reason, setReason] = useState('')
  const [creating, setCreating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sameUser = ticketType === 'user_complaint' && requester !== null && reported !== null && requester.id === reported.id

  const ticketTypeOptions: ComboboxOption[] = [
    { value: 'support', label: t('type_support') },
    { value: 'user_complaint', label: t('type_user_complaint') },
  ]

  const complaintTypeOptions: ComboboxOption[] = COMPLAINT_TYPES.map(ct => ({
    value: ct,
    label: t(`complaint_type_${ct}` as 'complaint_type_other'),
  }))

  function validate() {
    const e: Record<string, string> = {}
    if (!ticketType) {
      e.ticketType = t('ticket_type_required')
      setErrors(e)
      return false
    }
    if (!requester) e.requester = ticketType === 'user_complaint' ? t('reporter_required') : t('requester_required')
    if (ticketType === 'user_complaint') {
      if (!reported) e.reported = t('reported_required')
      if (!complaintType) e.complaintType = t('complaint_type_required')
    }
    if (!subject.trim()) e.subject = t('subject_required')
    if (!reason.trim()) e.reason = t('reason_required')
    setErrors(e)
    return Object.keys(e).length === 0 && !sameUser
  }

  function handleCreate() {
    if (!validate()) return
    setCreating(true)
    startTransition(async () => {
      const res = await createSupportTicket({
        ticketType,
        requesterUserId: requester!.id,
        reportedUserId: ticketType === 'user_complaint' ? reported!.id : undefined,
        complaintType: ticketType === 'user_complaint' ? (complaintType as ComplaintType) : undefined,
        subject: subject.trim(),
        reason: reason.trim(),
      })
      setCreating(false)
      if (res.error === 'ticket_type_required' || res.error === 'ticket_type_invalid') {
        toast.error(t('ticket_type_required'))
      } else if (res.error === 'requester_required' || res.error === 'requester_not_found') {
        toast.error(t('requester_required'))
      } else if (res.error === 'complaint_type_required') {
        toast.error(t('complaint_type_required'))
      } else if (res.error === 'complaint_type_invalid') {
        toast.error(t('complaint_type_invalid'))
      } else if (res.error) {
        toast.error(t('create_error'))
      } else {
        toast.success(t('create_success'))
        onCreated({
          id: res.id!,
          subject: subject.trim(),
          status: 'open',
          ticket_type: ticketType as 'support' | 'user_complaint',
          complaint_type: ticketType === 'user_complaint' ? (complaintType as ComplaintType) : null,
          reason: reason.trim(),
          assigned_to: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reporter: { id: requester!.id, name: pickerUserName(requester!) },
          reported: ticketType === 'user_complaint' && reported ? { id: reported.id, name: pickerUserName(reported) } : null,
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
          {/* Ticket type selector — always the first field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('ticket_type_label')}</label>
            <Combobox
              options={ticketTypeOptions}
              value={ticketType}
              onChange={v => {
                setTicketType(v as 'support' | 'user_complaint')
                setErrors(e => ({ ...e, ticketType: '' }))
                setRequester(null); setReported(null); setComplaintType('')
                setSubject(''); setReason('')
              }}
              placeholder={t('ticket_type_placeholder')}
              variant="button"
              error={errors.ticketType}
              disabled={creating}
            />
            {!ticketType && !errors.ticketType && (
              <p className="text-xs text-muted-foreground">{t('ticket_type_helper_empty')}</p>
            )}
          </div>

          {/* Support ticket fields */}
          {ticketType === 'support' && (
            <>
              <UserPickerField
                label={t('requester_label')}
                icon={<User className="h-3.5 w-3.5 text-muted-foreground" />}
                value={requester}
                onChange={u => { setRequester(u); setErrors(e => ({ ...e, requester: '' })) }}
                error={errors.requester}
                placeholder={t('requester_placeholder')}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('subject_label')}</label>
                <Input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={t('support_subject_placeholder')}
                />
                {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('support_details_label')}</label>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={t('support_details_placeholder')}
                  className="min-h-20 resize-none"
                />
                {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
              </div>
            </>
          )}

          {/* User complaint fields */}
          {ticketType === 'user_complaint' && (
            <>
              <UserPickerField
                label={t('reporter_label')}
                icon={<User className="h-3.5 w-3.5 text-muted-foreground" />}
                value={requester}
                onChange={u => { setRequester(u); setErrors(e => ({ ...e, requester: '' })) }}
                error={errors.requester}
                placeholder={t('reporter_placeholder')}
              />
              <UserPickerField
                label={t('reported_label')}
                icon={<ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />}
                value={reported}
                onChange={u => { setReported(u); setErrors(e => ({ ...e, reported: '' })) }}
                error={errors.reported}
                placeholder={t('reported_placeholder')}
              />
              {sameUser && (
                <p className="text-xs text-destructive">{t('same_user_warning')}</p>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('complaint_type_label')}</label>
                <Combobox
                  options={complaintTypeOptions}
                  value={complaintType}
                  onChange={v => { setComplaintType(v as ComplaintType); setErrors(e => ({ ...e, complaintType: '' })) }}
                  placeholder={t('complaint_type_placeholder')}
                  variant="button"
                  error={errors.complaintType}
                  disabled={creating}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('subject_label')}</label>
                <Input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder={t('subject_placeholder')}
                />
                {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('reason_label')}</label>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={t('reason_placeholder')}
                  className="min-h-20 resize-none"
                />
                {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={creating}>
            {t('cancel_btn')}
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={creating || sameUser}>
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

  const ticketColumns: AdminTableColumn<SupportTicketRow>[] = [
    {
      key: 'subject',
      header: t('col_subject'),
      cell: tk => (
        <div>
          <p className="font-medium truncate max-w-50">{tk.subject}</p>
          {tk.reason && (
            <p className="text-xs text-muted-foreground truncate max-w-50 mt-0.5">{tk.reason}</p>
          )}
          {tk.ticket_type === 'user_complaint' && tk.complaint_type && (
            <Badge variant="neutral" className="text-xs h-5 mt-1 w-fit">
              {t(`complaint_type_${tk.complaint_type}` as 'complaint_type_other')}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: t('col_type'),
      visibility: 'sm',
      cell: tk => (
        <Badge
          variant={tk.ticket_type === 'user_complaint' ? 'destructive' : 'info'}
          className="text-xs h-5"
        >
          {tk.ticket_type === 'user_complaint' ? t('type_user_complaint') : t('type_support')}
        </Badge>
      ),
    },
    {
      key: 'reporter',
      header: t('col_reporter'),
      visibility: 'md',
      cell: tk => <UserLink user={tk.reporter} label="—" />,
    },
    {
      key: 'reported',
      header: t('col_reported'),
      visibility: 'md',
      cell: tk => <UserLink user={tk.reported} label="—" />,
    },
    {
      key: 'status',
      header: t('col_status'),
      cell: tk => (
        <Badge variant={STATUS_VARIANT[tk.status] ?? 'neutral'} className="text-xs h-5 gap-1">
          {STATUS_ICON[tk.status]}
          {t(`support_status_${tk.status}` as `support_status_open`)}
        </Badge>
      ),
    },
    {
      key: 'updated',
      header: t('col_updated'),
      visibility: 'lg',
      cell: tk => <span className="text-xs text-muted-foreground">{formatDate(tk.updated_at, locale)}</span>,
    },
  ]

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:gap-3 [&>*]:max-sm:w-full">
        {/* Type filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'support', 'user_complaint'] as const).map(f => (
            <Button
              key={f}
              type="button"
              variant="ghost"
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 h-auto transition-colors rounded-lg text-xs ${
                typeFilter === f
                  ? 'bg-primary text-primary-foreground hover:bg-primary'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? t('filter_all') : f === 'support' ? t('type_support') : t('type_user_complaint')}
            </Button>
          ))}
        </div>
        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(['', ...TICKET_STATUSES] as const).map(s => (
            <Button
              key={s || 'all-s'}
              type="button"
              variant="ghost"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 h-auto transition-colors rounded-lg text-xs ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground hover:bg-primary'
                  : 'border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s ? t(`support_status_${s}` as 'support_status_open') : t('filter_all_status')}
            </Button>
          ))}
        </div>
        <Button size="sm" className="sm:ml-auto gap-1.5" onClick={() => setShowNew(true)}>
          <Plus className="h-3.5 w-3.5" />
          {t('new_ticket_btn')}
        </Button>
      </div>

      {/* Table (lg+) / Card (<lg) — tableAtLg pattern */}
      <AdminTable
        rows={filtered}
        columns={ticketColumns}
        rowKey={tk => tk.id}
        onRowClick={tk => setSelected(tk)}
        emptyState={tp('support_empty')}
        ariaLabel={t('col_subject')}
        cardRow={tk => ({
          title: (
            <div className="min-w-0">
              <p className="font-medium truncate">{tk.subject}</p>
              {tk.reason && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{tk.reason}</p>
              )}
              {tk.ticket_type === 'user_complaint' && tk.complaint_type && (
                <Badge variant="neutral" className="text-xs h-5 mt-1 w-fit">
                  {t(`complaint_type_${tk.complaint_type}` as 'complaint_type_other')}
                </Badge>
              )}
            </div>
          ),
          subtitle: (
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge variant={STATUS_VARIANT[tk.status] ?? 'neutral'} className="text-xs h-5 gap-1">
                {STATUS_ICON[tk.status]}
                {t(`support_status_${tk.status}` as `support_status_open`)}
              </Badge>
              <Badge
                variant={tk.ticket_type === 'user_complaint' ? 'destructive' : 'info'}
                className="text-xs h-5"
              >
                {tk.ticket_type === 'user_complaint' ? t('type_user_complaint') : t('type_support')}
              </Badge>
            </div>
          ),
          meta: (
            <div className="flex flex-col gap-1 mt-1">
              {(tk.reporter || tk.reported) && (
                <div className="flex items-center gap-3 flex-wrap">
                  {tk.reporter && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{t('col_reporter')}:</span>
                      <UserLink user={tk.reporter} label="—" />
                    </div>
                  )}
                  {tk.ticket_type === 'user_complaint' && tk.reported && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{t('col_reported')}:</span>
                      <UserLink user={tk.reported} label="—" />
                    </div>
                  )}
                </div>
              )}
              <span className="text-xs text-muted-foreground">{formatDate(tk.updated_at, locale)}</span>
            </div>
          ),
        })}
      />

      {/* Dialogs */}
      {showNew && (
        <CreateTicketDialog
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
