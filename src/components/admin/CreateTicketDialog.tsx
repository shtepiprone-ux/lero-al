'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { createSupportTicket } from '@/modules/admin/actions'
import type { ComplaintType } from '@/types/database'
import type { SupportTicketRow, PickerUser } from '@/components/admin/AdminSupportManager'
import { CreateTicketDialogView, type CreateTicketType } from '@/components/admin/CreateTicketDialogView'
import { UserPickerField } from '@/components/admin/UserPickerField'

function pickerUserName(user: PickerUser): string | null {
  return [user.name, user.last_name].filter(Boolean).join(' ') || null
}

interface Props {
  onClose: () => void
  onCreated: (ticket: SupportTicketRow) => void
}

/**
 * Container of the create-ticket dialog (Task 859): owns the form state, validation, the
 * `createSupportTicket` call and its error mapping; renders only `CreateTicketDialogView` (the user
 * pickers are passed as slots).
 */
export function CreateTicketDialog({ onClose, onCreated }: Props) {
  const t = useTranslations('admin.support')
  const [, startTransition] = useTransition()
  const [ticketType, setTicketType] = useState<CreateTicketType>('')
  const [requester, setRequester] = useState<PickerUser | null>(null)
  const [reported, setReported] = useState<PickerUser | null>(null)
  const [complaintType, setComplaintType] = useState<ComplaintType | ''>('')
  const [subject, setSubject] = useState('')
  const [reason, setReason] = useState('')
  const [creating, setCreating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sameUser = ticketType === 'user_complaint' && requester !== null && reported !== null && requester.id === reported.id

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
    <CreateTicketDialogView
      ticketType={ticketType}
      onTicketTypeChange={type => {
        setTicketType(type)
        setErrors(e => ({ ...e, ticketType: '' }))
        setRequester(null); setReported(null); setComplaintType('')
        setSubject(''); setReason('')
      }}
      requesterField={
        <UserPickerField
          label={ticketType === 'user_complaint' ? t('reporter_label') : t('requester_label')}
          icon="user"
          value={requester}
          onChange={u => { setRequester(u); setErrors(e => ({ ...e, requester: '' })) }}
          error={errors.requester}
          placeholder={ticketType === 'user_complaint' ? t('reporter_placeholder') : t('requester_placeholder')}
        />
      }
      reportedField={
        <UserPickerField
          label={t('reported_label')}
          icon="shield"
          value={reported}
          onChange={u => { setReported(u); setErrors(e => ({ ...e, reported: '' })) }}
          error={errors.reported}
          placeholder={t('reported_placeholder')}
        />
      }
      complaintType={complaintType}
      onComplaintTypeChange={ct => { setComplaintType(ct); setErrors(e => ({ ...e, complaintType: '' })) }}
      subject={subject}
      onSubjectChange={setSubject}
      reason={reason}
      onReasonChange={setReason}
      errors={errors}
      creating={creating}
      sameUser={sameUser}
      onCreate={handleCreate}
      onClose={onClose}
    />
  )
}
