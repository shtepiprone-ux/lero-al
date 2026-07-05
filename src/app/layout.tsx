import type { Viewport } from 'next'
import { Open_Sans } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ColorSchemeScript } from '@mantine/core'
import { headers, cookies } from 'next/headers'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@/design-system/mantine/input-chrome.css'
import '@/design-system/mantine/pagination-chrome.css'
import '@/design-system/mantine/skeleton-chrome.css'
import '@/design-system/mantine/scrollarea-chrome.css'
import '@/design-system/mantine/slider-chrome.css'
import '@/design-system/mantine/notification-chrome.css'
import './globals.css'
import { MantineRootProvider } from '@/design-system/mantine/MantineRootProvider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

// Open Sans: the single project font (Outfit retired 2026-06-27 — no Cyrillic glyphs; Task 506).
// Full Latin + Cyrillic + Cyrillic-ext subsets ensure uk (Ukrainian) text renders at the correct
// weight (fw500 labels visible) instead of falling back to a system font with no medium glyph.
// Exposed as --font-open-sans; globals.css wires it to --font-sans/--font-heading for app + Mantine.
const sans = Open_Sans({ subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'], variable: '--font-open-sans', display: 'swap' })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [headersList, jar] = await Promise.all([headers(), cookies()])
  // next-intl middleware sets X-NEXT-INTL-LOCALE on every locale-prefixed route.
  // Admin routes (excluded from middleware) fall back to the admin-locale cookie.
  const locale = headersList.get('X-NEXT-INTL-LOCALE') ?? jar.get('admin-locale')?.value ?? 'sq'

  return (
    <html lang={locale} suppressHydrationWarning className={sans.variable} data-scroll-behavior="smooth">
      <head>
        {/* Mantine color-scheme script — prevents flash of wrong color scheme (FOUC).
            Must be the first script in <head>, before any CSS or body content. */}
        <ColorSchemeScript defaultColorScheme="light" />
        {/* Cloudinary CDN preconnect — eliminates DNS+TCP+TLS overhead before
            the browser encounters the first Cloudinary image URL in the body.
            Most critical for the gallery LCP candidate on listing detail pages.
            Placed in explicit <head> so it appears in raw HTML before any JS. */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body>
        <MantineRootProvider>
          {children}
        </MantineRootProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
