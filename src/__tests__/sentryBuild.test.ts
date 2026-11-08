// @vitest-environment node
/**
 * Task 952 Revision 1 (AC8, AC10; findings F1, F3). A build talks to Sentry (release, source-map upload) only on Vercel:
 * a local `npm run build` with a live SENTRY_AUTH_TOKEN in `.env.local` must upload nothing. No Sentry option is left in
 * `next.config.ts` that Turbopack ignores.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { usesSentryBuild } from '@/lib/build/sentryBuild'

const NEXT_CONFIG = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8')

describe('usesSentryBuild (AC8)', () => {
  it('[SEC-F1-TOKEN-ALONE] a token without VERCEL is false: a local build uploads nothing', () => {
    expect(usesSentryBuild({ SENTRY_AUTH_TOKEN: 'sntrys_live_token' })).toBe(false)
  })

  it('[SEC-F1-EMPTY-TOKEN] an empty or missing token with VERCEL is false', () => {
    expect(usesSentryBuild({ SENTRY_AUTH_TOKEN: '', VERCEL: '1' })).toBe(false)
    expect(usesSentryBuild({ VERCEL: '1' })).toBe(false)
  })

  it('[SEC-F1-VERCEL-TOKEN] a token with VERCEL is true', () => {
    expect(usesSentryBuild({ SENTRY_AUTH_TOKEN: 'sntrys_live_token', VERCEL: '1' })).toBe(true)
  })

  it('[SEC-F1-EMPTY-VERCEL] an empty VERCEL is not set', () => {
    expect(usesSentryBuild({ SENTRY_AUTH_TOKEN: 'sntrys_live_token', VERCEL: '' })).toBe(false)
  })

  it('[SEC-F1-CONFIG-USES-GATE] next.config.ts calls usesSentryBuild and never tests the token directly', () => {
    expect(NEXT_CONFIG).toContain('usesSentryBuild(')
    expect(NEXT_CONFIG).not.toMatch(/process\.env\.SENTRY_AUTH_TOKEN/)
  })
})

describe('next.config.ts leaves no inactive Sentry option (AC10)', () => {
  it('[SEC-F3-NO-WEBPACK-OPTION] has no `webpack:` option and no removeDebugLogging key', () => {
    const code = NEXT_CONFIG.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
    expect(code).not.toMatch(/\bwebpack\s*:/)
    expect(code).not.toContain('removeDebugLogging')
  })
})
