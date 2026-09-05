import type { Metadata } from 'next'
import { Box } from '@mantine/core'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { resolveSession } from '@/lib/auth/server'
import { AuthProvider } from '@/modules/auth/context/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WebVitalsReporter } from '@/components/shared/WebVitalsReporter'
import { PerformanceStoreInit } from '@/components/shared/PerformanceStoreInit'
import { PerfDevOverlay } from '@/components/shared/PerfDevOverlay'

export const metadata: Metadata = {
  title: 'Lero.al — Real estate marketplace in Albania',
  description: 'Gjeni shtëpinë tuaj të ëndrrave në Shqipëri',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound()
  }

  // Tell next-intl which locale to use for this request tree.
  // Required when running without createMiddleware locale routing.
  setRequestLocale(locale)

  const messages = await getMessages()

  // resolveSession is the single SSR entry point for auth state.
  // It never throws — on any error it returns { user: null } so the layout
  // always renders and AuthProvider simply starts with no authenticated user.
  const { user: initialUser } = await resolveSession()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider initialUser={initialUser}>
        <>
          <Header />
          {/* Task 787 — the fixed mobile bottom bar is deleted (burger-menu-only mobile nav), so
              <main> no longer reserves 56px of bottom clearance for it (was --homepage-runtime-space-14,
              Task 770). */}
          <Box component="main" mih="calc(100vh - 4rem)">
            {children}
          </Box>
          <Footer />
          <WebVitalsReporter />
          <PerformanceStoreInit />
          <PerfDevOverlay />
        </>
      </AuthProvider>
    </NextIntlClientProvider>
  )
}
