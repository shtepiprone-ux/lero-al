import { getTranslations } from 'next-intl/server'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { getAllCurrenciesAdmin } from '@/modules/admin/actions/currencies'
import { getAllExchangeProvidersAdmin } from '@/modules/admin/actions/exchangeProviders'
import { AdminCurrencyTabs } from '@/components/admin/AdminCurrencyTabs'
import { AdminCurrenciesManager } from '@/components/admin/AdminCurrenciesManager'
import { AdminExchangeProvidersManager } from '@/components/admin/AdminExchangeProvidersManager'

export const metadata = { title: 'Currency — Admin' }

export default async function AdminCurrencyPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.currency')
  const [currencies, providers] = await Promise.all([
    getAllCurrenciesAdmin(),
    getAllExchangeProvidersAdmin(),
  ])

  return (
    <AdminPageFrame width="page">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <AdminCurrencyTabs
        currencies={<AdminCurrenciesManager initialCurrencies={currencies} />}
        providers={<AdminExchangeProvidersManager initialProviders={providers} />}
      />
    </AdminPageFrame>
  )
}
