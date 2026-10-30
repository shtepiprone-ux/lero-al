import { getTranslations } from 'next-intl/server'
import { requireStaffPage } from '@/lib/auth/staff'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { getAllCurrenciesAdmin } from '@/modules/admin/actions/currencies'
import { AdminCurrenciesManager } from '@/components/admin/AdminCurrenciesManager'

export const metadata = { title: 'Currency — Admin' }

export default async function AdminCurrencyPage() {
  // Task 923 R68 (a): the viewer is checked before the first read of any kind: the layout is not a guard for the page below it
  await requireStaffPage()
  await getAdminLocale()
  const t = await getTranslations('admin.currency')
  const currencies = await getAllCurrenciesAdmin()

  // Task 923 R100 (R78 (a), owner decision D51): the providers screen is gone, so the currencies list stands alone under the header, with no tab frame
  return (
    <AdminPageFrame width="shell">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <AdminCurrenciesManager initialCurrencies={currencies} />
    </AdminPageFrame>
  )
}
