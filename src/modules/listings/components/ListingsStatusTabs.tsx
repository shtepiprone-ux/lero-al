'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function ListingsStatusTabs() {
  const t = useTranslations('listing')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') === 'closed' ? 'closed' : 'active'

  function switchTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'active') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={switchTab}
      className="listings-status-tabs"
    >
      <TabsList>
        <TabsTrigger value="active">{t('tab_active')}</TabsTrigger>
        <TabsTrigger value="closed">{t('tab_closed')}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
