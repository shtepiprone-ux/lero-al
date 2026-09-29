import { getTranslations } from 'next-intl/server'
import { Box } from '@mantine/core'
import { getAdminLocale } from '@/lib/admin/getAdminLocale'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { getAllCurrenciesAdmin } from '@/modules/admin/actions/currencies'
import { getAllExchangeProvidersAdmin } from '@/modules/admin/actions/exchangeProviders'
import { AdminCurrencyTabs } from '@/components/admin/AdminCurrencyTabs'
import { AdminCurrenciesManager } from '@/components/admin/AdminCurrenciesManager'
import { AdminExchangeProvidersManager } from '@/components/admin/AdminExchangeProvidersManager'
import { theme } from '@/design-system/mantine/theme'

export const metadata = { title: 'Currency — Admin' }

// Server Component: the width token is read straight from the theme object (same precedent as
// `src/app/[locale]/page.tsx`); `!` because `createTheme()`'s return type is deep-partial.
const layout = theme.other!.layout!

export default async function AdminCurrencyPage() {
  await getAdminLocale()
  const t = await getTranslations('admin.currency')
  const [currencies, providers] = await Promise.all([
    getAllCurrenciesAdmin(),
    getAllExchangeProvidersAdmin(),
  ])

  return (
    <Box p={{ base: 'xl', lg: '2xl' }} maw={layout.adminPageMaxWidth} mx="auto">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <AdminCurrencyTabs
        currencies={<AdminCurrenciesManager initialCurrencies={currencies} />}
        providers={<AdminExchangeProvidersManager initialProviders={providers} />}
      />
    </Box>
  )
}
