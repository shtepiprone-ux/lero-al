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
const mockSignInWithOAuth = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
    },
  }),
}))

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('browser auth — signIn / signOut smoke tests (Guard, Task 441)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Login (email/password) ─────────────────────────────────────────────────

  it('login happy path: valid creds → session returned, error null', async () => {
    const fakeSession = { user: { id: 'user-1', email: 'valid@example.com' }, access_token: 'tok' }
    mockSignInWithPassword.mockResolvedValue({ data: { session: fakeSession }, error: null })

    const { signIn } = await import('@/lib/auth/browser')
    const result = await signIn('valid@example.com', 'correct-pass')

    expect(result.error).toBeNull()
    expect(result.data.session).toMatchObject({ user: { id: 'user-1' } })
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'valid@example.com', password: 'correct-pass' })
  })

  it('login wrong creds: error propagated, session is null (no false success)', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials', status: 400 },
    })

    const { signIn } = await import('@/lib/auth/browser')
    const result = await signIn('wrong@example.com', 'bad-pass')

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
})
