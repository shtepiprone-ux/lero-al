'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs } from '@mantine/core'

interface Props {
  /** The currencies tab body (the container, passed by the page). */
  currencies: ReactNode
  /** The exchange-providers tab body (the container, passed by the page). */
  providers: ReactNode
}

/**
 * Presentational tab frame of `/admin/currency` (Task 877): Mantine `Tabs` (TailAdmin §6c through the
 * theme) around two slots. It renders no data of its own — the page passes the two containers in.
 */
export function AdminCurrencyTabs({ currencies, providers }: Props) {
  const t = useTranslations('admin.currency')

  return (
    <Tabs defaultValue="currencies">
      <Tabs.List>
        <Tabs.Tab value="currencies">{t('tab_currencies')}</Tabs.Tab>
        <Tabs.Tab value="providers">{t('tab_providers')}</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="currencies" pt="xl">
        {currencies}
      </Tabs.Panel>
      <Tabs.Panel value="providers" pt="xl">
        {providers}
      </Tabs.Panel>
    </Tabs>
  )
}
