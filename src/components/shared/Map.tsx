'use client'

import { useEffect, useRef } from 'react'

interface MapProps {
  lat: number
  lng: number
  title: string
}

export function Map({ lat, lng, title }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<{ remove(): void } | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then(L => {
      // Fix default marker icons
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl']
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, { zoomControl: true, scrollWheelZoom: false })
        .setView([lat, lng], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      L.marker([lat, lng]).addTo(map).bindPopup(title).openPopup()

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lng, title])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} className="listing-map h-64 md:h-80 w-full rounded-2xl overflow-hidden z-0" />
    </>
  )
}
