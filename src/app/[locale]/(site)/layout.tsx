import type { Metadata } from 'next'
import { Box } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { resolveSession } from '@/lib/auth/server'
import { AuthProvider } from '@/modules/auth/context/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { WebVitalsReporter } from '@/components/shared/WebVitalsReporter'
import { PerformanceStoreInit } from '@/components/shared/PerformanceStoreInit'
import { PerfDevOverlay } from '@/components/shared/PerfDevOverlay'

// Task 988 (owner decision O988-4): what only the site renders, moved unchanged out of `src/app/[locale]/layout.tsx` so the admin (`src/app/[locale]/admin`) can live
// under the same language slug without the site's header and footer. A route group adds no segment: the site's addresses do not change.
export const metadata: Metadata = {
  title: 'Lero.al — Real estate marketplace in Albania',
  description: 'Gjeni shtëpinë tuaj të ëndrrave në Shqipëri',
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // resolveSession is the single SSR entry point for auth state.
  // It never throws — on any error it returns { user: null } so the layout
  // always renders and AuthProvider simply starts with no authenticated user.
  const { user: initialUser } = await resolveSession()

  return (
    <AuthProvider initialUser={initialUser}>
      <>
        <Header />
        {/* Task 787 — the fixed mobile bottom bar is deleted (burger-menu-only mobile nav), so
            <main> no longer reserves 56px of bottom clearance for it (was --homepage-runtime-space-14,
            Task 770). */}
        <Box component="main" mih={`calc(100vh - ${theme.other!.boxSize!.mainViewportOffset})`}>
          {children}
        </Box>
        <Footer />
        <WebVitalsReporter />
        <PerformanceStoreInit />
        <PerfDevOverlay />
      </>
    </AuthProvider>
  )
}
