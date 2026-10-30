import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin'

import { SECURITY_HEADERS } from './src/lib/security/headers'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig = {
  allowedDevOrigins: ['192.168.20.252'],
  // No images config needed — AppImage delivers via direct Cloudinary URLs (no next/image proxy).
  // Task 923 R72 (g): lint runs during the build. `eslint.ignoreDuringBuilds: true` was removed because lint is NOT a step of any workflow in `.github/workflows`
  // (`governance-pr.yml`, `governance-scheduled.yml`), so the build was the only place a lint error could stop a release; `eslint .` now ends with 0 errors.
  // Security response headers on every route (Task 923 Revision 7, S7): no framing, no sniffing, no referrer leak, HTTPS only.
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}

const baseConfig = withNextIntl(nextConfig)

export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(baseConfig, {
      org: "lero-al",
      project: "lero-al",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      webpack: {
        automaticVercelMonitors: true,
        treeshake: {
          removeDebugLogging: true,
        },
      },
    })
  : baseConfig;