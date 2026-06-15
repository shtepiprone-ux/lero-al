import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { AdminUserProfile } from '@/components/admin/AdminUserProfile'
import { hasPermission } from '@/lib/auth/permissions'

export const metadata = { title: 'Новий користувач — Admin' }

export default async function AdminUserNewPage() {
  const db = createAdminClient()
  const supabase = await createClient()

  const me = await getUser()
  const [
    { data: cities },
    { data: regions },
  ] = await Promise.all([
    db.from('locations').select('id, name_al, region_id').in('type', ['city', 'village']).order('name_al'),
    db.from('locations').select('id, name_al').eq('type', 'region').order('name_al'),
  ])

  let isAdmin = false
  if (me) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', me.id).single()
    isAdmin = profile?.role === 'admin'
  }
  const canClearHistory = await hasPermission('audit.clear_history').catch(() => false)

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <AdminUserProfile
        user={null}
        email=""
        cities={cities ?? []}
        regions={regions ?? []}
        changeLog={[]}
        statusHistory={[]}
        isAdmin={isAdmin}
        canClearHistory={canClearHistory}
      />
    </div>
  )
}
