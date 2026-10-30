'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { TicketStatus, ComplaintType } from '@/types/database'
import { AdminSupportView } from '@/components/admin/AdminSupportView'
import { TicketDetailDialog } from '@/components/admin/TicketDetailDialog'
import { CreateTicketDialog } from '@/components/admin/CreateTicketDialog'
import {
  DEFAULT_SUPPORT_FILTERS,
  matchesSupportFilters,
  serializeSupportFilters,
  type SupportFilters,
} from '@/components/admin/supportFilters'

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

// ── Container ─────────────────────────────────────────────────────────────────

interface Props {
  tickets: SupportTicketRow[]
  events: SupportTicketEventRow[]
  /** Filters the list opens with (the page's parsed `?type=&status=&assigned=`). */
  initialFilters?: SupportFilters
}

/**
 * Container of `/admin/support` (Task 859): holds the loaded tickets and events, the filters (mirrored to the
 * URL) and the open dialogs; renders only `AdminSupportView` and, when open, the two dialog containers.
 */
export function AdminSupportManager({ tickets: init, events: initEvents, initialFilters = DEFAULT_SUPPORT_FILTERS }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [items, setItems] = useState(init)
  const [allEvents, setAllEvents] = useState(initEvents)
  useEffect(() => { setItems(init) }, [init])
  useEffect(() => { setAllEvents(initEvents) }, [initEvents])
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<SupportTicketRow | null>(null)
  const [filters, setFilters] = useState<SupportFilters>(initialFilters)

  const filtered = items.filter(tk => matchesSupportFilters(tk, filters))

  const counts = {
    open:        items.filter(t => t.status === 'open').length,
    in_progress: items.filter(t => t.status === 'in_progress').length,
    resolved:    items.filter(t => t.status === 'resolved' || t.status === 'closed').length,
  }

  function handleFiltersChange(next: SupportFilters) {
    setFilters(next)
    const query = serializeSupportFilters(next)
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
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

  return (
    <>
      <AdminSupportView
        tickets={filtered}
        counts={counts}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSelect={setSelected}
        onNew={() => setShowNew(true)}
      />
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
    </>
  )
}
