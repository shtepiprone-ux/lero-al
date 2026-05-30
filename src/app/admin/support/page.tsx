import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminSupportManager, type SupportTicketRow, type SupportTicketEventRow } from '@/components/admin/AdminSupportManager'

export const metadata = { title: 'Support — Admin' }

export default async function AdminSupportPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const db = createAdminClient()

  // Fetch tickets with three user joins (reporter, reported, created_by_admin)
  const { data: rawTickets } = await db
    .from('support_tickets')
    .select(`
      id, subject, status, ticket_type, complaint_type, reason, assigned_to, created_at, updated_at,
      reporter:users!user_id(id, name),
      reported:users!reported_user_id(id, name),
      created_by_admin:users!created_by_admin_id(id, name)
    `)
    .order('updated_at', { ascending: false })
    .limit(100)

  const tickets = (rawTickets ?? []) as unknown as SupportTicketRow[]
  const ticketIds = tickets.map(tk => tk.id)

  // Fetch all events for loaded tickets in one query
  let events: SupportTicketEventRow[] = []
  if (ticketIds.length > 0) {
    const { data: rawEvents } = await db
      .from('support_ticket_events')
      .select('id, ticket_id, actor_user_id, actor_role, event_type, old_status, new_status, note, created_at, actor:users!actor_user_id(name)')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true })
    events = (rawEvents ?? []) as unknown as SupportTicketEventRow[]
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <AdminPageHeader
        title={t('support_title')}
        subtitle={t('support_subtitle')}
      />
      <AdminSupportManager tickets={tickets} events={events} />
    </div>
  )
}
