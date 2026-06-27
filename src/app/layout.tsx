import type { Viewport } from 'next'
import { Outfit } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { ColorSchemeScript } from '@mantine/core'
import { headers, cookies } from 'next/headers'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@/design-system/mantine/input-chrome.css'
import './globals.css'
import { MantineRootProvider } from '@/design-system/mantine/MantineRootProvider'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

// Outfit: the single project font (TailAdmin source of truth, owner decision 2026-06-26).
// Exposed as the --font-outfit CSS variable, which globals.css wires to --font-sans /
// --font-heading so the whole app (and Mantine) renders in Outfit. Geist fully removed.
const outfit = Outfit({ subsets: ['latin', 'latin-ext'], variable: '--font-outfit' })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [headersList, jar] = await Promise.all([headers(), cookies()])
  // next-intl middleware sets X-NEXT-INTL-LOCALE on every locale-prefixed route.
  // Admin routes (excluded from middleware) fall back to the admin-locale cookie.
  const locale = headersList.get('X-NEXT-INTL-LOCALE') ?? jar.get('admin-locale')?.value ?? 'sq'

  return (
    <html lang={locale} suppressHydrationWarning className={outfit.variable} data-scroll-behavior="smooth">
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
