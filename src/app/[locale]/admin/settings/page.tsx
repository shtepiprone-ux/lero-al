import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { AdminSettings } from '@/components/admin/AdminSettings'
import type { AllSettings } from '@/components/admin/AdminSettings'
import { getAllSettings } from '@/modules/admin/lib/settings'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { ARCHIVED_NOINDEX_DAYS } from '@/modules/listings/constants'
import { SETTINGS_FORM_KEYS } from '@/modules/admin/lib/settingKeys'

// Task 988: the tab title is the page heading in the admin language; the viewer is checked first, as in the page (Task 923 R68 (a))
export async function generateMetadata() {
  await requireStaffPage({ page: 'page.settings' })
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  return { title: `${t('settings_title')} — Admin` }
}

// Task 989: one value per key of the settings form; a key without a stored row is empty, except these (an empty title or description gives the site's default text)
const DEFAULTS: AllSettings = {
  site_name:            'Lero.al',
  archived_noindex_days: String(ARCHIVED_NOINDEX_DAYS),
  default_locale:       'sq',
}

export default async function AdminSettingsPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage({ page: 'page.settings' })
  await getAdminLocale()
  const t = await getTranslations('admin.pages')
  const stored = await getAllSettings()

  const initialSettings: AllSettings = Object.fromEntries(SETTINGS_FORM_KEYS.map(key => [key, stored[key] ?? DEFAULTS[key] ?? '']))

  return (
    <AdminPageFrame>
      <AdminPageHeader
        title={t('settings_title')}
        subtitle={t('settings_subtitle')}
      />
      <AdminSettings initialSettings={initialSettings} />
    </AdminPageFrame>
  )
}
