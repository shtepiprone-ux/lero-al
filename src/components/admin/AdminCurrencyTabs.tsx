'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { AdminCurrenciesManager } from '@/components/admin/AdminCurrenciesManager'
import { AdminExchangeProvidersManager } from '@/components/admin/AdminExchangeProvidersManager'
import { cn } from '@/lib/utils'
import type { DBCurrency, DBExchangeProvider } from '@/types/database'

interface Props {
  currencies: DBCurrency[]
  providers: DBExchangeProvider[]
}

export function AdminCurrencyTabs({ currencies, providers }: Props) {
  const t = useTranslations('admin.currency')
  const [tab, setTab] = useState<'currencies' | 'providers'>('currencies')

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {(['currencies', 'providers'] as const).map(id => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t(`tab_${id}`)}
          </button>
        ))}
      </div>

      {tab === 'currencies' && (
        <AdminCurrenciesManager initialCurrencies={currencies} />
      )}
      {tab === 'providers' && (
        <AdminExchangeProvidersManager initialProviders={providers} />
      )}
    </div>
  )
}
