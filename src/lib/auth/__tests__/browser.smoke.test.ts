/**
 * Guard smoke — signIn (login) + signOut (logout) browser auth functions (Task 441 / Epic RS Slice 2).
 *
 * Covers registry P0 auth lifecycle rows:
 *   - Login (email/password): happy path + wrong-creds failure
 *   - Logout: session cleared
 *
 * These are thin wrappers around createClient().auth.*. The smoke asserts:
 *   1. The correct Supabase method is called with the correct arguments.
 *   2. On success, the session/data is returned (not swallowed).
 *   3. On failure, the error is propagated (not silently dropped).
 *
 * Planted-violation proof:
 *   In the "wrong creds" test, stub mockSignInWithPassword to return success
 *   instead of { data: { session: null }, error: { message: '...' } }
 *   → expect(result.data.session).toBeNull() FAILS. Revert → PASS.
 *
 * Command: npx vitest run src/lib/auth/__tests__/browser.smoke.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockSignInWithIdToken = vi.fn()
const mockGetChannels = vi.fn()
const mockRemoveChannel = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    getChannels: (...args: unknown[]) => mockGetChannels(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      signInWithIdToken: (...args: unknown[]) => mockSignInWithIdToken(...args),
    },
  }),
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('browser auth — signIn / signOut smoke tests (Guard, Task 441)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetChannels.mockReset()
    mockGetChannels.mockReturnValue([])
    mockRemoveChannel.mockReset()
    mockSignOut.mockReset()
  })

  // ── Login (email/password) ─────────────────────────────────────────────────

  it('login happy path: valid creds → session returned, error null', async () => {
    const fakeSession = { user: { id: 'user-1', email: 'valid@example.com' }, access_token: 'tok' }
    mockSignInWithPassword.mockResolvedValue({ data: { session: fakeSession }, error: null })

    const { signIn } = await import('@/lib/auth/browser')
    const result = await signIn('valid@example.com', 'correct-pass', 'zz-captcha-token')

    expect(result.error).toBeNull()
    expect(result.data.session).toMatchObject({ user: { id: 'user-1' } })
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'valid@example.com', password: 'correct-pass', options: { captchaToken: 'zz-captcha-token' } })
  })

  it('login wrong creds: error propagated, session is null (no false success)', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials', status: 400 },
    })

    const { signIn } = await import('@/lib/auth/browser')
    const result = await signIn('wrong@example.com', 'bad-pass', 'zz-captcha-token')

    // Guard: error must NOT be swallowed — callers rely on error.message for localized UI
    expect(result.error).not.toBeNull()
    expect(result.error?.message).toContain('Invalid login credentials')
    expect(result.data.session).toBeNull()
  })

  // ── Logout ─────────────────────────────────────────────────────────────────

  it('logout: signOut called and returns cleanly', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const { signOut } = await import('@/lib/auth/browser')
    const result = await signOut()

    expect(result.error).toBeNull()
    expect(mockSignOut).toHaveBeenCalledOnce()
  })

  it('logout with global scope: passes scope to Supabase', async () => {
    mockSignOut.mockResolvedValue({ error: null })

    const { signOut } = await import('@/lib/auth/browser')
    await signOut('global')

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'global' })
  })

  // ── Task 1033 AC1: the Realtime channels are removed before the session ends ─
  // Supabase pushes the anonymous key to every joined channel on a sign-out, and Realtime then checks the
  // notifications filter as `anon`, which may not read `notifications.user_id`.
  // Revision 1: the channels are removed one by one (`removeChannel`), not with `removeAllChannels()`, which always closes the socket and leaves a 10 s timer.

  const channelA = { topic: 'channel-a' }
  const channelB = { topic: 'channel-b' }

  it('signOut() removes each Realtime channel before auth.signOut (call order recorded)', async () => {
    const order: string[] = []
    mockGetChannels.mockReturnValue([channelA, channelB])
    mockRemoveChannel.mockImplementation(async (channel: { topic: string }) => { order.push(`removeChannel:${channel.topic}`); return 'ok' })
    mockSignOut.mockImplementation(async () => { order.push('auth.signOut'); return { error: null } })

    const { signOut } = await import('@/lib/auth/browser')
    const result = await signOut()

    expect(mockRemoveChannel).toHaveBeenCalledTimes(2)
    expect(mockRemoveChannel).toHaveBeenCalledWith(channelA)
    expect(mockRemoveChannel).toHaveBeenCalledWith(channelB)
    expect(order).toEqual(['removeChannel:channel-a', 'removeChannel:channel-b', 'auth.signOut'])
    expect(mockSignOut).toHaveBeenCalledWith(undefined)
    expect(result).toEqual({ error: null })
  })

  it("signOut('local') removes each Realtime channel before auth.signOut (call order recorded)", async () => {
    const order: string[] = []
    mockGetChannels.mockReturnValue([channelA, channelB])
    mockRemoveChannel.mockImplementation(async (channel: { topic: string }) => { order.push(`removeChannel:${channel.topic}`); return 'ok' })
    mockSignOut.mockImplementation(async () => { order.push('auth.signOut'); return { error: null } })

    const { signOut } = await import('@/lib/auth/browser')
    const result = await signOut('local')

    expect(mockRemoveChannel).toHaveBeenCalledTimes(2)
    expect(order).toEqual(['removeChannel:channel-a', 'removeChannel:channel-b', 'auth.signOut'])
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' })
    expect(result).toEqual({ error: null })
  })

  it('with no channel no removeChannel call is made and auth.signOut still runs', async () => {
    mockGetChannels.mockReturnValue([])
    mockSignOut.mockResolvedValue({ error: null })

    const { signOut } = await import('@/lib/auth/browser')
    const result = await signOut()

    expect(mockGetChannels).toHaveBeenCalledOnce()
    expect(mockRemoveChannel).not.toHaveBeenCalled()
    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(result).toEqual({ error: null })
  })

  it('a rejecting removeChannel still ends the session and returns the auth.signOut result', async () => {
    const authResult = { error: { message: 'logout request failed' } }
    mockGetChannels.mockReturnValue([channelA, channelB])
    mockRemoveChannel.mockRejectedValue(new Error('channel already closed'))
    mockSignOut.mockResolvedValue(authResult)

    const { signOut } = await import('@/lib/auth/browser')
    const result = await signOut()

    expect(mockRemoveChannel).toHaveBeenCalled()
    expect(mockSignOut).toHaveBeenCalledOnce()
    expect(result).toBe(authResult)
  })
})
