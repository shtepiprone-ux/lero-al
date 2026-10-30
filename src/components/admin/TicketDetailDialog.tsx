'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { updateTicketStatus } from '@/modules/admin/actions'
import type { TicketStatus } from '@/types/database'
import type { SupportTicketRow, SupportTicketEventRow } from '@/components/admin/AdminSupportManager'
import { TicketDetailDialogView } from '@/components/admin/TicketDetailDialogView'

interface Props {
  ticket: SupportTicketRow
  events: SupportTicketEventRow[]
  onClose: () => void
  onStatusUpdated: (ticketId: string, newStatus: TicketStatus) => void
}

/**
 * Container of the support ticket detail dialog (Task 859): owns the status/note state and the
 * `updateTicketStatus` call; renders only `TicketDetailDialogView`.
 */
export function TicketDetailDialog({ ticket, events, onClose, onStatusUpdated }: Props) {
  const t = useTranslations('admin.support')
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

  return (
    <TicketDetailDialogView
      ticket={ticket}
      events={events.filter(e => e.ticket_id === ticket.id)}
      newStatus={newStatus}
      onNewStatusChange={setNewStatus}
      note={note}
      onNoteChange={setNote}
      updating={updating}
      onUpdate={handleStatusUpdate}
      onClose={onClose}
    />
  )
}
