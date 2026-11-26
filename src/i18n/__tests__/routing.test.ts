// @vitest-environment node
/**
 * Task 988 AC2 (owner decision O988-1): next-intl's own language cookie `NEXT_LOCALE` stays a session cookie: `src/i18n/routing.ts` gives it no `maxAge`, so it never
 * outlives the browser session. next-intl's own code reads the routing (`receiveRoutingConfig`, the `localeCookie` defaults) and writes the cookie (`syncCookie`); both are
 * loaded by file path, because next-intl's ESM middleware imports `next/server` without an extension, which Node cannot load under Vitest.
 */
import { join } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { describe, expect, it } from 'vitest'
import { routing } from '@/i18n/routing'

const dist = join(process.cwd(), 'node_modules', 'next-intl', 'dist', 'esm', 'development')

describe('routing', () => {
  it('[AC2] NEXT_LOCALE is written without Max-Age and without Expires (a session cookie)', async () => {
    const { receiveRoutingConfig } = (await import(/* @vite-ignore */ join(dist, 'routing', 'config.js'))) as { receiveRoutingConfig: (c: unknown) => { localeCookie: false | Record<string, unknown> } }
    const { default: syncCookie } = (await import(/* @vite-ignore */ join(dist, 'middleware', 'syncCookie.js'))) as { default: (req: NextRequest, res: NextResponse, locale: string, routing: unknown) => void }
    const received = receiveRoutingConfig(routing)
    expect(received.localeCookie).not.toBe(false)
    expect((received.localeCookie as Record<string, unknown>).maxAge, 'no maxAge in the routing').toBeUndefined()

    const res = NextResponse.next()
    syncCookie(new NextRequest('https://lero.al/en/x'), res, 'en', received)
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith('NEXT_LOCALE='))
    expect(cookie).toBeDefined()
    expect(cookie).not.toMatch(/Max-Age=/i)
    expect(cookie).not.toMatch(/Expires=/i)
  })
})
