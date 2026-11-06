import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin'

import { SECURITY_HEADERS } from './src/lib/security/headers'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig = {
  allowedDevOrigins: ['192.168.20.252'],
  // No images config needed — AppImage delivers via direct Cloudinary URLs (no next/image proxy).
  // Task 923 R72 (g): lint also runs during the build (`eslint.ignoreDuringBuilds` stays unset), so a Vercel build stops on a lint error even
  // outside CI; `.github/workflows/ci.yml` runs `npm run lint` as its own gate.
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