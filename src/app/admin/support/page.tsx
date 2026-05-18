import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Badge } from '@/components/ui/badge'
import { RelativeTime } from '@/components/shared/RelativeTime'

export const metadata = { title: 'Support — Admin' }

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'neutral'

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  open:        'warning',
  in_progress: 'info',
  resolved:    'success',
  closed:      'neutral',
}

interface AdminTicket {
  id: string
  subject: string
  status: string
  created_at: string
  user: { name: string | null } | null
}

export default async function AdminSupportPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.pages')

  const db = createAdminClient()
  const { data: rawTickets } = await db
    .from('support_tickets')
    .select('id, subject, status, created_at, user:users!support_tickets_user_id_fkey(name, phone)')
    .order('created_at', { ascending: false })
    .limit(50)

  const tickets = (rawTickets ?? []) as unknown as AdminTicket[]

  const STATUS_LABELS: Record<string, string> = {
    open:        t('support_status_open'),
    in_progress: t('support_status_in_progress'),
    resolved:    t('support_status_resolved'),
    closed:      t('support_status_closed'),
  }

  const grouped = [
    { label: t('support_open'),        items: tickets.filter(tk => tk.status === 'open') },
    { label: t('support_in_progress'), items: tickets.filter(tk => tk.status === 'in_progress') },
    { label: t('support_resolved'),    items: tickets.filter(tk => tk.status === 'resolved' || tk.status === 'closed') },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title={t('support_title')}
        subtitle={t('support_subtitle')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        {grouped.map(({ label, items }) => (
          <div key={label} className="bg-card rounded-2xl border shadow-sm p-4 text-center">
            <p className="text-2xl font-bold">{items.length}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">{t('support_all_tickets')}</h2>
        </div>
        <div className="divide-y">
          {!tickets?.length ? (
            <p className="px-6 py-12 text-center text-muted-foreground">{t('support_empty')}</p>
          ) : tickets.map((tk) => (
            <div key={tk.id} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tk.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tk.user?.name ?? '—'}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={STATUS_VARIANT[tk.status] ?? 'neutral'} className="text-xs">
                  {STATUS_LABELS[tk.status] ?? tk.status}
                </Badge>
                <RelativeTime date={tk.created_at} className="text-xs text-muted-foreground hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
