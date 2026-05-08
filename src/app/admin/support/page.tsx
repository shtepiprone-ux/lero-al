import { createAdminClient } from '@/lib/supabase/admin'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Badge } from '@/components/ui/badge'
import { RelativeTime } from '@/components/shared/RelativeTime'
import Link from 'next/link'

export const metadata = { title: 'Support — Admin' }

const STATUS_VARIANT: Record<string, any> = {
  open:        'warning',
  in_progress: 'info',
  resolved:    'success',
  closed:      'neutral',
}

export default async function AdminSupportPage() {
  const db = createAdminClient()
  const { data: tickets } = await db
    .from('support_tickets')
    .select('id, subject, status, created_at, user:users!support_tickets_user_id_fkey(name, phone)')
    .order('created_at', { ascending: false })
    .limit(50)

  const grouped = {
    open:        tickets?.filter(t => t.status === 'open') ?? [],
    in_progress: tickets?.filter(t => t.status === 'in_progress') ?? [],
    resolved:    tickets?.filter(t => t.status === 'resolved' || t.status === 'closed') ?? [],
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title="Support"
        subtitle="Тікети звернень від користувачів"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        {Object.entries({ 'Відкриті': grouped.open, 'В роботі': grouped.in_progress, 'Вирішені': grouped.resolved }).map(([label, items]) => (
          <div key={label} className="bg-card rounded-2xl border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold">{items.length}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Всі тікети</h2>
        </div>
        <div className="divide-y">
          {!tickets?.length ? (
            <p className="px-6 py-12 text-center text-muted-foreground">Тікетів немає</p>
          ) : tickets.map((t: any) => (
            <div key={t.id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.user?.name ?? '—'}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={STATUS_VARIANT[t.status] ?? 'neutral'} className="text-xs capitalize">
                  {t.status}
                </Badge>
                <RelativeTime date={t.created_at} className="text-xs text-muted-foreground hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
