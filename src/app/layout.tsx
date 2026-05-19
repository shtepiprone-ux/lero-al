import type { Viewport } from 'next'
import { Geist } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const geist = Geist({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={geist.className} data-scroll-behavior="smooth">
      <head>
        {/* Cloudinary CDN preconnect — eliminates DNS+TCP+TLS overhead before
            the browser encounters the first Cloudinary image URL in the body.
            Most critical for the gallery LCP candidate on listing detail pages.
            Placed in explicit <head> so it appears in raw HTML before any JS. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
