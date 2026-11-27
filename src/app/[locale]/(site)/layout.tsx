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
import { getSettings } from '@/modules/admin/lib/settings'
import { SITE_LOCALES } from '@/modules/admin/lib/settingKeys'
import { isBrandImageUrl } from '@/lib/uploads/imageUrl'

// Task 988 (owner decision O988-4): what only the site renders, moved unchanged out of `src/app/[locale]/layout.tsx` so the admin (`src/app/[locale]/admin`) can live
// under the same language slug without the site's header and footer. A route group adds no segment: the site's addresses do not change.
const DEFAULT_TITLE = 'Lero.al — Real estate marketplace in Albania'
const DEFAULT_DESCRIPTION = 'Gjeni shtëpinë tuaj të ëndrrave në Shqipëri'

/** the settings, or none when the read fails: every value then falls back to what `main` showed (Task 989, T4) */
async function readSettings(keys: string[]): Promise<Record<string, string>> {
  try {
    return await getSettings(keys)
  } catch {
    return {}
  }
}

/** a saved brand image, only when it is an image of the account's own Cloudinary (Task 989, `SEC-989-BRAND-URL-DENY`) */
function brandImage(value: string | undefined): string | null {
  return isBrandImageUrl(value) ? (value as string) : null
}

// Task 989: the default title and description of the page's language and the favicon come from the settings; an empty value gives today's text, a refused
// favicon gives no `icons`, and the fixed `src/app/favicon.ico` stays.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = (SITE_LOCALES as readonly string[]).includes(raw) ? raw : 'sq'
  const settings = await readSettings([`meta_title_${locale}`, `meta_desc_${locale}`, 'favicon_url'])
  const favicon = brandImage(settings.favicon_url)
  return {
    title: settings[`meta_title_${locale}`]?.trim() || DEFAULT_TITLE,
    description: settings[`meta_desc_${locale}`]?.trim() || DEFAULT_DESCRIPTION,
    ...(favicon ? { icons: { icon: favicon } } : {}),
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // resolveSession is the single SSR entry point for auth state.
  // It never throws — on any error it returns { user: null } so the layout
  // always renders and AuthProvider simply starts with no authenticated user.
  const [{ user: initialUser }, settings] = await Promise.all([resolveSession(), readSettings(['logo_url', 'site_name'])])

  return (
    <AuthProvider initialUser={initialUser}>
      <>
        <Header logoUrl={brandImage(settings.logo_url)} siteName={settings.site_name ?? 'Lero.al'} />
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
