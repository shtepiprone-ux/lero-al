import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig = {
  allowedDevOrigins: ['192.168.20.252'],
  // No images config needed — AppImage delivers via direct Cloudinary URLs (no next/image proxy).
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