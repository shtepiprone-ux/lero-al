import { getTranslations } from 'next-intl/server'
import { Box } from '@mantine/core'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPagesManager } from '@/components/admin/AdminPagesManager'
import { theme } from '@/design-system/mantine/theme'

export const metadata = { title: 'CMS Pages — Admin' }

// Server Component: the width token is read straight from the theme object (same precedent as
// `src/app/admin/currency/page.tsx`); `!` because `createTheme()`'s return type is deep-partial.
const layout = theme.other!.layout!

export default async function AdminPagesPage() {
  const locale = await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const db = createAdminClient()
  const { data: pages } = await db
    .from('pages')
    .select('id, title, slug, is_published, content, updated_by, updated_at')
    .order('updated_at', { ascending: false })

  return (
    <Box p={{ base: 'xl', lg: '2xl' }} maw={layout.adminPageNarrowMaxWidth} mx="auto">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <AdminPagesManager pages={pages ?? []} adminLocale={locale} />
    </Box>
  )
}
