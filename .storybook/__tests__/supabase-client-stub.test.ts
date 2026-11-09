// Task 939 AC1 — the Storybook stub of the browser Supabase client is inert, and Storybook resolves `@/lib/supabase/client` to it.
//
// Storybook is built without Supabase configuration, so the real browser client (`@/lib/supabase/client`) throws when a Story's component calls
// `createClient()` (`useFavoritesRealtime`). The stub answers every call the Stories make and opens no connection.
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import config from '../main'
import { createClient } from '../stubs/supabase-client'
// The product's own auth wrappers, run against the stub exactly as their callers run them against the real client (Vitest swaps only the module they import).
import * as authBrowser from '@/lib/auth/browser'

vi.mock('@/lib/supabase/client', async () => await import('../stubs/supabase-client'))

const SETTLED = { data: null, error: null }
const SIGNED_OUT = { data: { user: null, session: null }, error: null }

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Storybook Supabase client stub', () => {
  it('answers channel().on().subscribe() and removeChannel() without any network call', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const webSocketSpy = vi.fn()
    vi.stubGlobal('WebSocket', webSocketSpy)

    const client = createClient()
    const channel = client.channel('favorites:user:1')
    expect(channel.on('postgres_changes', { event: '*' }, () => undefined)).toBe(channel)
    expect(channel.subscribe()).toBe(channel)
    await expect(client.removeChannel(channel)).resolves.toBeUndefined()

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(webSocketSpy).not.toHaveBeenCalled()
  })

  it('resolves a from() query chain to { data: null, error: null }', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const client = createClient()

    await expect(client.from('listings').select('*').eq('id', 'x').neq('status', 'archived').maybeSingle()).resolves.toEqual(SETTLED)
    await expect(client.from('favorites').insert({ listing_id: 'x' })).resolves.toEqual(SETTLED)

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('answers getUser, getSession and onAuthStateChange in the real signed-out shape, destructured as callers do', async () => {
    const client = createClient()
    const { data: { user }, error: userError } = await client.auth.getUser()
    const { data: { session }, error: sessionError } = await client.auth.getSession()
    const { data: { subscription } } = client.auth.onAuthStateChange(() => undefined)

    expect(user).toBeNull()
    expect(userError).toBeNull()
    expect(session).toBeNull()
    expect(sessionError).toBeNull()
    expect(() => subscription.unsubscribe()).not.toThrow()
  })

  it('answers every auth method src/lib/auth/browser.ts calls, destructured the way its caller does', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    // signIn (AuthSheet), signInWithGoogleIdToken (googleSignIn, ProfileTab), signUp, updatePassword and verifyOtp (ResetPasswordClient): { data: { user, session }, error }
    for (const call of [
      () => authBrowser.signIn('a@example.com', 'pw', 'captcha'),
      () => authBrowser.signInWithGoogleIdToken('token', 'nonce'),
      () => authBrowser.signUp('a@example.com', 'pw', { emailRedirectTo: 'http://localhost/' }),
      () => authBrowser.updatePassword('pw'),
      () => authBrowser.verifyOtp({ token_hash: 'h', type: 'recovery' }),
      () => authBrowser.refreshSession(),
    ]) {
      const { data: { user, session }, error } = await call()
      expect(user).toBeNull()
      expect(session).toBeNull()
      expect(error).toBeNull()
    }
    await expect(authBrowser.verifyOtp({ token_hash: 'h', type: 'recovery' })).resolves.toEqual(SIGNED_OUT)

    // requestPasswordReset resolves to { data, error } with no user in it.
    const { error: resetError } = await authBrowser.requestPasswordReset('a@example.com', 'http://localhost/')
    expect(resetError).toBeNull()

    // getSession (ResetPasswordClient): { data: { session } }
    const { data: { session } } = await authBrowser.getSession()
    expect(session).toBeNull()

    // signOut (AdminSidebar, CabinetPasswordSection): { error }
    const { error: signOutError } = await authBrowser.signOut()
    const { error: signOutLocalError } = await authBrowser.signOut('local')
    expect(signOutError).toBeNull()
    expect(signOutLocalError).toBeNull()

    // onAuthStateChange (controller): { data: { subscription } }
    const { data: { subscription } } = authBrowser.onAuthStateChange(() => undefined)
    expect(() => subscription.unsubscribe()).not.toThrow()

    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('Storybook Vite alias for the browser Supabase client', () => {
  it('maps @/lib/supabase/client to the stub, before the generic @ alias (first match wins)', async () => {
    const resolved = await config.viteFinal!({}, { configType: 'PRODUCTION' } as never)
    const alias = resolved.resolve?.alias as Record<string, string>
    const keys = Object.keys(alias)

    expect(alias['@/lib/supabase/client']).toBe(path.resolve(__dirname, '../stubs/supabase-client.ts'))
    expect(keys.indexOf('@/lib/supabase/client')).toBeGreaterThanOrEqual(0)
    expect(keys.indexOf('@/lib/supabase/client')).toBeLessThan(keys.indexOf('@'))
  })
})
