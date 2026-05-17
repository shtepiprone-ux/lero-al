import { getTranslations } from 'next-intl/server'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { getAllCurrenciesAdmin } from '@/modules/admin/actions/currencies'
import { getAllExchangeProvidersAdmin } from '@/modules/admin/actions/exchangeProviders'
import { AdminCurrencyTabs } from '@/components/admin/AdminCurrencyTabs'

export const metadata = { title: 'Currency — Admin' }

export default async function AdminCurrencyPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.currency')
  const [currencies, providers] = await Promise.all([
    getAllCurrenciesAdmin(),
    getAllExchangeProvidersAdmin(),
  ])

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <AdminCurrencyTabs
        currencies={currencies}
        providers={providers}
      />
    </div>
  )
}
