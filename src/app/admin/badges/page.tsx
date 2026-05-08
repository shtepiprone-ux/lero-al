import { createAdminClient } from '@/lib/supabase/admin'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminBadgesTable } from '@/components/admin/AdminBadgesTable'

export const metadata = { title: 'Бейджі — Admin' }

export default async function AdminBadgesPage() {
  const db = createAdminClient()

  // Users with premium/verified status to manage
  const { data: premiumListings } = await db
    .from('listings')
    .select('id, slug, title, is_premium, price, currency, created_at, owner:users!listings_user_id_fkey(id, name)')
    .eq('is_premium', true)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: verifiedUsers } = await db
    .from('users')
    .select('id, name, user_type, role, is_verified, company_name, created_at')
    .eq('is_verified', true)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title="Бейджі"
        subtitle="Управління преміум статусом оголошень та верифікацією агентів"
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-2xl border shadow-sm p-5">
          <p className="text-3xl font-bold text-badge-premium">{premiumListings?.length ?? 0}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Преміум оголошень</p>
        </div>
        <div className="bg-card rounded-2xl border shadow-sm p-5">
          <p className="text-3xl font-bold text-status-success">{verifiedUsers?.length ?? 0}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Верифікованих агентів</p>
        </div>
      </div>

      <AdminBadgesTable
        premiumListings={premiumListings ?? []}
        verifiedUsers={verifiedUsers ?? []}
      />
    </div>
  )
}
