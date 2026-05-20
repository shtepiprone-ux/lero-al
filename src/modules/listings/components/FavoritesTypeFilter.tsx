'use client'

import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'

interface Props {
  typeCounts: Record<string, number>
  currentType?: string
}

export function FavoritesTypeFilter({ typeCounts, currentType }: Props) {
  const tf = useTranslations('favorites')
  const locale = useLocale()
  const router = useRouter()

  const { propertyTypes } = usePropertyTypes()
  const total = Object.values(typeCounts).reduce((a, b) => a + b, 0)
  const availableTypes = propertyTypes.filter(pt => (typeCounts[pt.value] ?? 0) > 0)

  if (availableTypes.length <= 1) return null

  function navigate(type?: string) {
    const url = type ? `/${locale}/favorites?type=${type}` : `/${locale}/favorites`
    router.push(url)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="group" aria-label={tf('filter_label')}>
      <Button
        type="button"
        variant={!currentType ? 'default' : 'secondary'}
        onClick={() => navigate(undefined)}
        className={cn(
          'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium h-auto whitespace-nowrap',
          !currentType ? 'shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
        )}
        aria-pressed={!currentType}
      >
        {tf('filter_all')} <span className="opacity-70">{total}</span>
      </Button>

      {availableTypes.map(pt => (
        <Button
          key={pt.value}
          type="button"
          variant={currentType === pt.value ? 'default' : 'secondary'}
          onClick={() => navigate(pt.value)}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium h-auto whitespace-nowrap',
            currentType === pt.value ? 'shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
          )}
          aria-pressed={currentType === pt.value}
        >
          {pt.label} <span className="opacity-70">{typeCounts[pt.value]}</span>
        </Button>
      ))}
    </div>
  )
}
