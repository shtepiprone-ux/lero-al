'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ScrollArea, Tabs } from '@mantine/core'

export function ListingsStatusTabs() {
  const t = useTranslations('listing')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') === 'closed' ? 'closed' : 'active'

  function switchTab(tab: string | null) {
    if (!tab) return
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
      onChange={switchTab}
      className="listings-status-tabs"
    >
      {/* Tabs always in a single horizontal row — no wrap (owner P0, theme.ts Tabs.styles.list
          flexWrap='nowrap'). ScrollArea scrollbarSize={0} enables swipe-scroll on overflow with
          no visible scrollbar track, matching the canonical Mantine/Primitives/Tabs story
          (Task 781R — long sq/uk labels overflowed the nowrap list at 320px without this). */}
      <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
        <Tabs.List>
          <Tabs.Tab value="active">{t('tab_active')}</Tabs.Tab>
          <Tabs.Tab value="closed">{t('tab_closed')}</Tabs.Tab>
        </Tabs.List>
      </ScrollArea>
    </Tabs>
  )
}
