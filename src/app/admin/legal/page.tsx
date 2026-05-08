import { createAdminClient } from '@/lib/supabase/admin'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminLegalManager } from '@/components/admin/AdminLegalManager'

export const metadata = { title: 'Правові документи — Admin' }

export default async function AdminLegalPage() {
  const db = createAdminClient()
  const { data: pages } = await db
    .from('pages')
    .select('id, title, slug, is_published, content, updated_at')
    .order('updated_at', { ascending: false })

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <AdminPageHeader
        title="Правові документи"
        subtitle="Публічні сторінки: Умови використання, Приватність тощо"
      />
      <AdminLegalManager pages={pages ?? []} />
    </div>
  )
}
