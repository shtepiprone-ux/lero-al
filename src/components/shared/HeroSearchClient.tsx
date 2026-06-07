'use client'

import dynamic from 'next/dynamic'

const HeroSearchDynamic = dynamic(
  () => import('@/components/shared/HeroSearch').then(m => ({ default: m.HeroSearch })),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full max-w-3xl mx-auto h-[76px] rounded-2xl bg-background/10 animate-pulse" // design-tokens-allow: h-[76px] — hero search bar skeleton fixed height; off-scale (no spacing token = 76px)
      />
    ),
  }
)

export function HeroSearchClient() {
  return <HeroSearchDynamic />
}
