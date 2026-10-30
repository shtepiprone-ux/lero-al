'use client'

import { useEffect, useRef } from 'react'
import styles from './Map.module.css'

interface MapProps {
  lat: number
  lng: number
  title: string
}

export function Map({ lat, lng, title }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<{ remove(): void } | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

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

      // The pin is a 44px target (the 25x41 image alone is below the touch token): a divIcon holds the same image at the bottom centre.
      // The popup keeps Leaflet's 300px maximum but is never wider than its map (that overflowed a 246px map at 320px): its text wraps inside the map width.
      const pin = L.divIcon({
        className: styles.pin,
        html: '<img src="https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png" width="25" height="41" alt="" />',
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -40],
      })
      const popupMaxWidth = Math.min(300, Math.max(120, containerRef.current!.clientWidth - 2 * 44)) // 300 is Leaflet's own default maximum
      const marker = L.marker([lat, lng], { icon: pin }).addTo(map).bindPopup(title, { maxWidth: popupMaxWidth })
      // Leaflet measures the popup, and pans the map to bring it into view, at the moment it opens. Its stylesheet is loaded from unpkg and may
      // not have been applied yet (an unstyled popup measured then is placed 1px outside the map), so the popup opens once the map pane has
      // its stylesheet position. The container size changes are passed to the map.
      let frames = 0
      const openWhenStyled = () => {
        if (!mapRef.current) return
        const styled = getComputedStyle(map.getPane('mapPane')!).position === 'absolute'
        if (styled || frames++ > 120) {
          map.invalidateSize()
          marker.openPopup()
        } else {
          requestAnimationFrame(openWhenStyled)
        }
      }
      requestAnimationFrame(openWhenStyled)
      observerRef.current = new ResizeObserver(() => map.invalidateSize())
      observerRef.current.observe(containerRef.current!)

      mapRef.current = map
    })

    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lng, title])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} className={`listing-map ${styles.map} h-64 md:h-80 w-full rounded-2xl overflow-hidden z-0`} />
    </>
  )
}
