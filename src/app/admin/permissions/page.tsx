import { getTranslations } from 'next-intl/server'
import { Box } from '@mantine/core'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { getModeratorPermissions, getPermissionEvents } from '@/modules/admin/actions/permissions'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPermissionsManager } from '@/components/admin/AdminPermissionsManager'
import { theme } from '@/design-system/mantine/theme'

export const metadata = { title: 'Permissions — Admin' }

// Server Component: the width token is read straight from the theme object (same precedent as
// `src/app/admin/currency/page.tsx`); `!` because `createTheme()`'s return type is deep-partial.
const layout = theme.other!.layout!

export default async function AdminPermissionsPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.permissions')
  const [permissions, events] = await Promise.all([
    getModeratorPermissions(),
    getPermissionEvents(),
  ])
  return (
    <Box p="xl" maw={layout.adminPagePanelMaxWidth}>
      <AdminPageHeader title={t('title')} subtitle={t('description')} />
      <AdminPermissionsManager permissions={permissions} events={events} />
    </Box>
  )
}
