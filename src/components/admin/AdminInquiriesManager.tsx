'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { toast } from 'sonner'
import {
  Circle, AlertCircle, CheckCircle2,
  Mail, Send, ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Combobox, type ComboboxOption } from '@/components/shared/Combobox'
import { formatDate } from '@/lib/formatters'
import { updateInquiryStatus, sendInquiryReply } from '@/modules/contacts/actions'
import type { ContactStatus } from '@/types/database'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InquiryRow {
  id: string
  created_at: string
  topic: string
  custom_subject: string | null
  name: string
  email: string
  message: string
  target_mailbox: string
  status: ContactStatus
  reply_count: number
  handled_at: string | null
}

export interface ReplyRow {
  id: string
  inquiry_id: string
  body: string
  created_at: string
  replied_by: string
  replier: { name: string | null } | null
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'neutral'

const STATUS_VARIANT: Record<ContactStatus, BadgeVariant> = {
  new:         'warning',
  in_progress: 'info',
  closed:      'neutral',
}

const STATUS_ICON: Record<ContactStatus, React.ReactNode> = {
  new:         <Circle className="h-3 w-3" />,
  in_progress: <AlertCircle className="h-3 w-3" />,
  closed:      <CheckCircle2 className="h-3 w-3" />,
}

const CONTACT_STATUSES: ContactStatus[] = ['new', 'in_progress', 'closed']

const KNOWN_TOPICS = ['general', 'sales', 'support', 'partnership', 'press', 'other'] as const
type KnownTopic = typeof KNOWN_TOPICS[number]

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  inquiries: InquiryRow[]
  replies: ReplyRow[]
  /** When set, the route IS the filter — hides the mailbox filter bar (Note 21 relocation). */
  mailboxScope?: 'support' | 'sales'
}

export function AdminInquiriesManager({ inquiries: initialInquiries, replies: initialReplies, mailboxScope }: Props) {
  const t = useTranslations('admin.inquiries')
  const tp = useTranslations('admin.pages')
  const tc = useTranslations('contact.topics')
  const locale = useLocale()

  const [inquiries, setInquiries] = useState(initialInquiries)
  const [allReplies, setAllReplies] = useState<ReplyRow[]>(initialReplies)
  const [selected, setSelected]   = useState<InquiryRow | null>(null)
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all')
  const [mailboxFilter, setMailboxFilter] = useState<'all' | 'support' | 'sales'>('all')
  const [replyBody, setReplyBody] = useState('')
  const [isPending, startTransition] = useTransition()

  // Derive unique mailboxes from inquiries for filter
  const mailboxes = Array.from(new Set(inquiries.map(i => i.target_mailbox))).sort()

  const filtered = inquiries.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false
    // When mailboxScope is set, data is pre-filtered server-side — skip client-side mailbox check.
    if (!mailboxScope && mailboxFilter !== 'all') {
      const isSales = i.target_mailbox.includes('sales')
      if (mailboxFilter === 'sales' && !isSales) return false
      if (mailboxFilter === 'support' && isSales) return false
    }
    return true
  })

  const selectedReplies = selected
    ? allReplies.filter(r => r.inquiry_id === selected.id)
    : []

  function openDetail(inquiry: InquiryRow) {
    setSelected(inquiry)
    setReplyBody('')
  }

  function closeDetail() {
    setSelected(null)
    setReplyBody('')
  }

  function displaySubject(inq: InquiryRow): string {
    if (inq.topic === 'other') {
      return inq.custom_subject ?? tc('other')
    }
    if ((KNOWN_TOPICS as readonly string[]).includes(inq.topic)) {
      return tc(inq.topic as KnownTopic)
    }
    // Unknown topic value — render raw but warn ops
    console.warn('[admin] unknown contact topic:', inq.topic)
    return inq.topic
  }

  function handleStatusChange(newStatus: string) {
    if (!selected) return
    startTransition(async () => {
      const result = await updateInquiryStatus(selected.id, newStatus)
      if (result.error) {
        toast.error(t('status_error'))
        return
      }
      const updatedStatus = newStatus as ContactStatus
      setInquiries(prev =>
        prev.map(i => i.id === selected.id ? { ...i, status: updatedStatus } : i),
      )
      setSelected(prev => prev ? { ...prev, status: updatedStatus } : null)
      toast.success(t('status_updated'))
    })
  }

  function handleSendReply() {
    if (!selected || !replyBody.trim()) return
    startTransition(async () => {
      const result = await sendInquiryReply(selected.id, replyBody)
      if (result.error === 'reply_email_failed') {
        // DB write succeeded but email delivery failed — update local state and append reply
        if (result.reply) setAllReplies(prev => [...prev, result.reply!])
        setInquiries(prev =>
          prev.map(i => i.id === selected.id
            ? { ...i, reply_count: i.reply_count + 1, status: i.status === 'new' ? 'in_progress' : i.status }
            : i),
        )
        setSelected(prev =>
          prev
            ? {
                ...prev,
                reply_count: prev.reply_count + 1,
                status: prev.status === 'new' ? 'in_progress' : prev.status,
              }
            : null,
        )
        setReplyBody('')
        toast.warning(t('reply_email_failed'))
        return
      }
      if (result.error) {
        toast.error(t('reply_error'))
        return
      }
      if (result.reply) setAllReplies(prev => [...prev, result.reply!])
      setInquiries(prev =>
        prev.map(i => i.id === selected.id
          ? { ...i, reply_count: i.reply_count + 1, status: i.status === 'new' ? 'in_progress' : i.status }
          : i),
      )
      setSelected(prev =>
        prev
          ? {
              ...prev,
              reply_count: prev.reply_count + 1,
              status: prev.status === 'new' ? 'in_progress' : prev.status,
            }
          : null,
      )
      setReplyBody('')
      toast.success(t('reply_success'))
    })
  }

  const statusOptions: ComboboxOption[] = CONTACT_STATUSES.map(s => ({
    value: s,
    label: t(`status_${s}` as 'status_new' | 'status_in_progress' | 'status_closed'),
  }))

  return (
    <>
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'new', 'in_progress', 'closed'] as const).map(s => (
          <Button
            key={s}
            size="lg"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? t('filter_all') : t(`filter_${s}` as 'filter_new' | 'filter_in_progress' | 'filter_closed')}
          </Button>
        ))}
        {/* Mailbox filter hidden when route IS the filter (mailboxScope set — Note 21 relocation). */}
        {!mailboxScope && (
          <div className="ml-auto flex gap-2">
            {(['all', 'support', 'sales'] as const).map(m => (
              <Button
                key={m}
                size="lg"
                variant={mailboxFilter === m ? 'secondary' : 'outline'}
                onClick={() => setMailboxFilter(m)}
              >
                {m === 'all' ? t('filter_mailbox_all') : t(`filter_mailbox_${m}` as 'filter_mailbox_support' | 'filter_mailbox_sales')}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12 text-center">{t('no_inquiries')}</p>
      ) : (
        <div className="divide-y rounded-xl border overflow-hidden">
          {filtered.map(inq => (
            <button
              key={inq.id}
              onClick={() => openDetail(inq)}
              className="w-full flex items-start gap-4 px-5 py-4 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant={STATUS_VARIANT[inq.status]} className="flex items-center gap-1">
                    {STATUS_ICON[inq.status]}
                    {t(`status_${inq.status}` as 'status_new' | 'status_in_progress' | 'status_closed')}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{inq.target_mailbox}</span>
                </div>
                <p className="font-medium text-sm truncate">{displaySubject(inq)}</p>
                <p className="text-xs text-muted-foreground truncate">{inq.name} · {inq.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">{formatDate(inq.created_at, locale)}</span>
                {inq.reply_count > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {inq.reply_count}
                  </span>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" />
            </button>
          ))}
        </div>
      )}

      {/* ── Detail dialog ── */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) closeDetail() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{t('detail_title')}</DialogTitle>
              </DialogHeader>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border rounded-lg p-4 bg-muted/30">
                <div>
                  <span className="text-xs text-muted-foreground block">{t('from_label')}</span>
                  <span className="font-medium">{selected.name}</span>
                  <span className="block text-xs text-muted-foreground">{selected.email}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">{t('topic_label')}</span>
                  <span className="font-medium">{displaySubject(selected)}</span>
                  <span className="block text-xs font-mono text-muted-foreground">{selected.target_mailbox}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">{t('received_label')}</span>
                  <span>{formatDate(selected.created_at, locale)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">{t('change_status')}</span>
                  <Combobox
                    options={statusOptions}
                    value={selected.status}
                    onChange={handleStatusChange}
                    variant="button"
                    size="sm"
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Original message */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  {t('detail_message')}
                </p>
                <div className="rounded-lg border bg-muted/20 p-4 text-sm whitespace-pre-line leading-relaxed">
                  {selected.message}
                </div>
              </div>

              {/* Reply history */}
              {selectedReplies.length === 0 && selected.reply_count > 0 ? (
                <div className="rounded-lg border border-status-warning/40 bg-status-warning/5 px-4 py-3 text-sm text-center text-muted-foreground">
                  {t('reply_history_load_failed')}
                </div>
              ) : selectedReplies.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    {t('detail_replies')}
                  </p>
                  <div className="flex flex-col gap-3">
                    {selectedReplies.map(r => (
                      <div key={r.id} className="rounded-lg border bg-card p-4 text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-xs">
                            {r.replier?.name ?? t('from_label')}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatDate(r.created_at, locale)}</span>
                        </div>
                        <p className="whitespace-pre-line leading-relaxed">{r.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Reply composer */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  {t('reply_label')}
                </p>
                <Textarea
                  rows={4}
                  className="resize-none mb-3"
                  placeholder={t('reply_placeholder')}
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  disabled={isPending}
                />
                <Button
                  size="lg"
                  onClick={handleSendReply}
                  disabled={isPending || replyBody.trim().length < 5}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isPending ? t('sending_reply') : t('send_reply')}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
