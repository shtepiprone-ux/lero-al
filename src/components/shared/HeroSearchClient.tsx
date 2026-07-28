'use client'

import dynamic from 'next/dynamic'
import { HeroSearchFallback } from '@/components/shared/HeroSearchFallback'

const HeroSearchDynamic = dynamic(
  () => import('@/components/shared/HeroSearch').then(m => ({ default: m.HeroSearch })),
  {
    ssr: false,
    loading: () => <HeroSearchFallback />,
  }
)

export function HeroSearchClient() {
  return <HeroSearchDynamic />
}
