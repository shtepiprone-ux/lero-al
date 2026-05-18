'use client'

import { useTranslations } from 'next-intl'
import { AdminCurrenciesManager } from '@/components/admin/AdminCurrenciesManager'
import { AdminExchangeProvidersManager } from '@/components/admin/AdminExchangeProvidersManager'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { DBCurrency, DBExchangeProvider } from '@/types/database'

interface Props {
  currencies: DBCurrency[]
  providers: DBExchangeProvider[]
}

export function AdminCurrencyTabs({ currencies, providers }: Props) {
  const t = useTranslations('admin.currency')

  return (
    <Tabs defaultValue="currencies" className="flex flex-col gap-6">
      <TabsList variant="line" className="w-fit">
        <TabsTrigger value="currencies">{t('tab_currencies')}</TabsTrigger>
        <TabsTrigger value="providers">{t('tab_providers')}</TabsTrigger>
      </TabsList>

      <TabsContent value="currencies">
        <AdminCurrenciesManager initialCurrencies={currencies} />
      </TabsContent>
      <TabsContent value="providers">
        <AdminExchangeProvidersManager initialProviders={providers} />
      </TabsContent>
    </Tabs>
  )
}
