import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/server'
import { AdminUserProfile } from '@/components/admin/AdminUserProfile'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createAdminClient()
  const { data } = await db.from('users').select('name, last_name').eq('id', id).single()
  const name = [data?.name, data?.last_name].filter(Boolean).join(' ') || 'Профіль'
  return { title: `${name} — Admin` }
}

export default async function AdminUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createAdminClient()

  // Simple select — no FK-name joins that break when constraints have different names
  const [
    { data: user, error: userError },
    { data: cities },
    { data: regions },
  ] = await Promise.all([
    db.from('users').select('*').eq('id', id).single(),
    db.from('locations').select('id, name_al, region_id').in('type', ['city', 'village']).order('name_al'),
    db.from('locations').select('id, name_al').eq('type', 'region').order('name_al'),
  ])

  if (userError) console.error('AdminUserProfilePage: user query failed', { error: userError, id })
  if (!user) notFound()

  // Soft-delete check: deleted_at column may not exist yet if migration is pending
  if ((user as any).deleted_at) notFound()

  // Change log — table may not exist yet; degrade gracefully
  let changeLog: any[] = []
  try {
    const { data: log } = await db
      .from('user_change_log')
      .select('*')
      .eq('user_id', id)
      .order('changed_at', { ascending: false })
      .limit(20)
    changeLog = log ?? []
  } catch {}

  // Email from auth
  let email = ''
  try {
    const { data: authUser } = await db.auth.admin.getUserById(id)
    email = authUser?.user?.email ?? ''
  } catch {}

  // Current viewer's role
  const me = await getUser()
  const supabase = await createClient()
  const { data: myProfile } = await supabase.from('users').select('role').eq('id', me!.id).single()
  const isAdmin = myProfile?.role === 'admin'

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <AdminUserProfile
        user={user as any}
        email={email}
        cities={cities ?? []}
        regions={regions ?? []}
        changeLog={changeLog}
        isAdmin={isAdmin}
      />
    </div>
  )
}
