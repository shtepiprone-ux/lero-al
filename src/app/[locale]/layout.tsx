import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { resolveSession } from '@/lib/auth/server'
import { AuthProvider } from '@/modules/auth/context/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'
import { WebVitalsReporter } from '@/components/shared/WebVitalsReporter'
import { PerformanceStoreInit } from '@/components/shared/PerformanceStoreInit'
import { PerfDevOverlay } from '@/components/shared/PerfDevOverlay'
import { Toaster } from '@/components/ui/sonner'

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

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()

  // resolveSession is the single SSR entry point for auth state.
  // It never throws — on any error it returns { user: null } so the layout
  // always renders and AuthProvider simply starts with no authenticated user.
  const { user: initialUser } = await resolveSession()

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider initialUser={initialUser}>
        <div lang={locale}>
          <Header />
          <main className="min-h-[calc(100vh-4rem)] pb-14 md:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
          <WebVitalsReporter />
          <PerformanceStoreInit />
          <PerfDevOverlay />
          <Toaster />
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  )
}
