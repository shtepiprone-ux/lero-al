import { withSentryConfig } from '@sentry/nextjs/config';
import createNextIntlPlugin from 'next-intl/plugin'

import { usesSentryBuild } from './src/lib/build/sentryBuild'
import { SECURITY_HEADERS } from './src/lib/security/headers'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig = {
  allowedDevOrigins: ['192.168.20.252'],
  // No images config needed — AppImage delivers via direct Cloudinary URLs (no next/image proxy).
  // Task 923 R72 (g), changed by Task 952: Next 16 no longer runs ESLint in `next build` (and removed the `eslint` option), so the stop on a lint error is the `build` script itself,
  // `npm run lint && next build` (guarded by scripts/quality/build-lints.test.mjs); a Vercel build therefore stops on a lint error outside CI too.
  // `.github/workflows/ci.yml` still runs `npm run lint` as its own gate.
  // Security response headers on every route (Task 923 Revision 7, S7): no framing, no sniffing, no referrer leak, HTTPS only.
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}

const baseConfig = withNextIntl(nextConfig)

// Task 952 R1: Sentry (release and source-map upload) is used only on Vercel with a token, so a local `npm run build` with `.env.local` uploads nothing.
export default usesSentryBuild(process.env)
  ? withSentryConfig(baseConfig, {
      org: "lero-al",
      project: "lero-al",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      // Next 16 builds with Turbopack (Task 952), so only Turbopack-capable Sentry options are set:
      //  - `automaticVercelMonitors` (cron monitors for the five jobs of vercel.json) has its Turbopack form in `_experimental.vercelCronsMonitoring`;
      //  - `treeshake.removeDebugLogging` (`__SENTRY_DEBUG__ = false`) is dropped: it has no Turbopack form, and the `compiler.define` stand-in measured 152 bytes of 5.86 MB.
      _experimental: {
        vercelCronsMonitoring: true,
      },
    })
  : baseConfig;