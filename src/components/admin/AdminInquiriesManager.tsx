'use client'

import { useState, useTransition, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { AdminInquiriesView, type InquiryMailboxFilter, type InquiryStatusFilter } from '@/components/admin/AdminInquiriesView'
import { InquiryDetailDialogView } from '@/components/admin/InquiryDetailDialogView'
import type { StatusSelectOption } from '@/components/admin/StatusChangeSelect'
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

const CONTACT_STATUSES: ContactStatus[] = ['new', 'in_progress', 'closed']

const KNOWN_TOPICS = ['general', 'sales', 'support', 'partnership', 'press', 'other'] as const
type KnownTopic = typeof KNOWN_TOPICS[number]

// ── Container ─────────────────────────────────────────────────────────────────

interface Props {
  inquiries: InquiryRow[]
  replies: ReplyRow[]
  /** When set, the route IS the filter — hides the mailbox filter bar (Note 21 relocation). */
  mailboxScope?: 'support' | 'sales'
}

export function AdminInquiriesManager({ inquiries: initialInquiries, replies: initialReplies, mailboxScope }: Props) {
  const t = useTranslations('admin.inquiries')
  const tc = useTranslations('contact.topics')

  const [inquiries, setInquiries] = useState(initialInquiries)
  const [allReplies, setAllReplies] = useState<ReplyRow[]>(initialReplies)
  useEffect(() => { setInquiries(initialInquiries) }, [initialInquiries])
  useEffect(() => { setAllReplies(initialReplies) }, [initialReplies])
  const [selected, setSelected]   = useState<InquiryRow | null>(null)
  const [statusFilter, setStatusFilter] = useState<InquiryStatusFilter>('all')
  const [mailboxFilter, setMailboxFilter] = useState<InquiryMailboxFilter>('all')
  const [replyBody, setReplyBody] = useState('')
  const [isPending, startTransition] = useTransition()

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

  async function handleStatusChange({ toStatus }: { toStatus: ContactStatus; note: string | null }) {
    if (!selected) return
    const result = await updateInquiryStatus(selected.id, toStatus)
    if (result.error) throw new Error(result.error)
    setInquiries(prev =>
      prev.map(i => i.id === selected.id ? { ...i, status: toStatus } : i),
    )
    setSelected(prev => prev ? { ...prev, status: toStatus } : null)
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

  const inquiryStatusOptions: StatusSelectOption<ContactStatus>[] = CONTACT_STATUSES.map(s => ({
    code: s,
    labelKey: `status_${s}`,
  }))

  return (
    <>
      <AdminInquiriesView
        inquiries={filtered}
        statusFilter={statusFilter}
        mailboxFilter={mailboxFilter}
        showMailboxFilter={!mailboxScope}
        onStatusFilterChange={setStatusFilter}
        onMailboxFilterChange={setMailboxFilter}
        onSelect={openDetail}
        displaySubject={displaySubject}
      />

      {selected && (
        <InquiryDetailDialogView
          inquiry={selected}
          replies={selectedReplies}
          subject={displaySubject(selected)}
          statusOptions={inquiryStatusOptions}
          replyBody={replyBody}
          onReplyBodyChange={setReplyBody}
          isPending={isPending}
          onStatusSubmit={handleStatusChange}
          onSendReply={handleSendReply}
          onClose={closeDetail}
        />
      )}
    </>
  )
}
