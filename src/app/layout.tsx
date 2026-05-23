import type { Viewport } from 'next'
import { Geist } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { headers, cookies } from 'next/headers'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const geist = Geist({ subsets: ['latin'] })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [headersList, jar] = await Promise.all([headers(), cookies()])
  // next-intl middleware sets X-NEXT-INTL-LOCALE on every locale-prefixed route.
  // Admin routes (excluded from middleware) fall back to the admin-locale cookie.
  const locale = headersList.get('X-NEXT-INTL-LOCALE') ?? jar.get('admin-locale')?.value ?? 'sq'

  return (
    <html lang={locale} suppressHydrationWarning className={geist.className} data-scroll-behavior="smooth">
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
