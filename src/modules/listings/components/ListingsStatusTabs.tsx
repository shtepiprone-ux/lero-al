'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function ListingsStatusTabs() {
  const t = useTranslations('listing')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') === 'closed' ? 'closed' : 'active'

  function switchTab(tab: 'active' | 'closed') {
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
    <div className="listings-status-tabs flex border-b">
      <TabButton
        label={t('tab_active')}
        active={activeTab === 'active'}
        onClick={() => switchTab('active')}
      />
      <TabButton
        label={t('tab_closed')}
        active={activeTab === 'closed'}
        onClick={() => switchTab('closed')}
      />
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'px-5 py-3 h-auto text-sm font-medium border-b-2 -mb-px rounded-none whitespace-nowrap',
        active
          ? 'border-primary text-primary hover:bg-transparent hover:text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border hover:bg-transparent',
      )}
    >
      {label}
    </Button>
  )
}
