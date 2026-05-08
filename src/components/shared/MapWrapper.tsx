'use client'

import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/shared/Map').then(m => m.Map), {
  ssr: false,
  loading: () => <div className="listing-map h-64 md:h-80 rounded-2xl bg-muted animate-pulse" />,
})

export function MapWrapper(props: { lat: number; lng: number; title: string }) {
  return <Map {...props} />
}
