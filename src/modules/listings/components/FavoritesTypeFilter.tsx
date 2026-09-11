'use client'

import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ScrollArea, SegmentedControl, Text, useMatches } from '@mantine/core'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'

const ALL_VALUE = '__all__'

interface Props {
  typeCounts: Record<string, number>
  currentType?: string
}

export function FavoritesTypeFilter({ typeCounts, currentType }: Props) {
  const tf = useTranslations('favorites')
  const locale = useLocale()
  const router = useRouter()
  // Task 809 Revision 1 — mobile adaptive pattern (owner decision 2026-06-25, same contract as
  // Mantine/Primitives/SegmentedControl): <640 stretches full-width when labels fit, swipe-scrolls
  // via ScrollArea when they overflow; >=640 stays content-width.
  const mobileMinWidth = useMatches({ base: '100%', sm: 'auto' })

  const { propertyTypes } = usePropertyTypes()
  const total = Object.values(typeCounts).reduce((a, b) => a + b, 0)
  const availableTypes = propertyTypes.filter(pt => (typeCounts[pt.value] ?? 0) > 0)

  if (availableTypes.length <= 1) return null

  function navigate(value: string) {
    const url = value === ALL_VALUE ? `/${locale}/favorites` : `/${locale}/favorites?type=${value}`
    router.push(url)
  }

  const data = [
    {
      value: ALL_VALUE,
      label: (
        <>
          {tf('filter_all')} <Text span opacity={0.7} inherit>{total}</Text>
        </>
      ),
    },
    ...availableTypes.map(pt => ({
      value: pt.value,
      label: (
        <>
          {pt.label} <Text span opacity={0.7} inherit>{typeCounts[pt.value]}</Text>
        </>
      ),
    })),
  ]

  return (
    <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>
      <SegmentedControl
        aria-label={tf('filter_label')}
        style={{ minWidth: mobileMinWidth }}
        value={currentType ?? ALL_VALUE}
        onChange={navigate}
        data={data}
      />
    </ScrollArea>
  )
}
