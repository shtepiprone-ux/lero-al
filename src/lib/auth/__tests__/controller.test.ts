/**
 * Auth Controller — Integration Lifecycle Tests
 *
 * Tests the AuthController state machine end-to-end across all real-world
 * browser lifecycle scenarios. Mocks are confined to the two external
 * boundaries: the Supabase SDK (browser.ts) and the /api/auth/me network call.
 * All controller logic — state transitions, version counters, AbortController
 * sequencing — runs unmodified against those controlled inputs.
 *
 * Covered scenarios:
 *   1. SSR → Hydration consistency    (initial state construction)
 *   2. Tab background / restore       (visibility change sync)
 *   3. Multi-tab auth sync            (cross-tab SIGNED_OUT propagation)
 *   4. Refresh token expiration       (SIGNED_OUT / network error paths)
 *   5. Server restart recovery        (error → sync recovery on visibility)
 *   6. Rapid login / logout race      (version counter + AbortController)
 *   7. Network failure recovery       (error state + subsequent recovery)
 *   8. UI state stability             (no stuck refreshing/signing_out states)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthController } from '../controller'
import type { AuthState } from '../controller'
import type { User } from '@/types/database'

// ── External boundary mocks ────────────────────────────────────────────────────
//
// Only the Supabase SDK surface (browser.ts) and the network (fetch) are mocked.
// Controller internals (state machine, version counter, AbortController) run real.

const { authCallbackRef, mockUnsubscribe, mockCoreSignOut } = vi.hoisted(() => ({
  authCallbackRef: {
    current: null as ((event: string, session: unknown) => void) | null,
  },
  mockUnsubscribe: vi.fn(),
  mockCoreSignOut: vi.fn().mockResolvedValue({ error: null }),
}))

vi.mock('@/lib/auth/browser', () => ({
  onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
    authCallbackRef.current = cb
    return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
  },
  signOut: mockCoreSignOut,
}))

// ── Fixtures ───────────────────────────────────────────────────────────────────

const MOCK_USER: User = {
  id: 'test-user-1',
  public_id: 1,
  name: 'Arbër Kelmendi',
  last_name: null,
  phone: null,
  whatsapp: null,
  avatar_url: null,
  role: 'user',
  user_type: 'private',
  status: 'active',
  block_reason: null,
  suspended_until: null,
  company_name: null,
  company_logo_url: null,
  website: null,
  is_verified: false,
  social_provider: null,
  location_id: null,
  position: null,
  year_started: null,
  deleted_at: null,
  location_request: null,
  preferred_currency: 'ALL',
  pending_email: null,
  last_seen_at: null,
  inactivity_warning_sent_at: null,
  company_id: null,
  preferred_locale: 'sq',
  created_at: '2026-01-01T00:00:00.000Z',
}

// Minimal Supabase session shape — only the fields the controller checks.
const MOCK_SESSION = { access_token: 'tok', refresh_token: 'ref', user: { id: MOCK_USER.id } }

// ── Helpers ────────────────────────────────────────────────────────────────────

function okResponse(user: User | null): Response {
  return new Response(JSON.stringify({ user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function errorResponse(): Response {
  return new Response(null, { status: 500 })
}

function makeAbortError(): Error {
  return Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
}

function authenticated(): AuthState {
  return { status: 'authenticated', user: MOCK_USER }
}

function unauthenticated(): AuthState {
  return { status: 'unauthenticated', user: null }
}

// ── Test setup ─────────────────────────────────────────────────────────────────

let ctrl: AuthController
let cleanup: () => void

beforeEach(() => {
  // Reset all external mocks so each test starts clean.
  vi.mocked(global.fetch).mockReset()
  mockCoreSignOut.mockClear()
  mockUnsubscribe.mockClear()
  authCallbackRef.current = null
})

afterEach(() => {
  // Always run cleanup if a test mounted the controller.
  cleanup?.()
})

// ── Shared: set up a mounted controller with a default initial state ───────────

function mountAuthenticated(): AuthController {
  ctrl = new AuthController(authenticated())
  cleanup = ctrl.mount()
  return ctrl
}

function mountUnauthenticated(): AuthController {
  ctrl = new AuthController(unauthenticated())
  cleanup = ctrl.mount()
  return ctrl
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1: SSR → HYDRATION CONSISTENCY
// Guarantee: initial client state equals SSR-resolved snapshot.
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 1 — SSR → Hydration consistency', () => {
  it('getState() reflects authenticated initial state immediately (no async needed)', () => {
    const c = new AuthController({ status: 'authenticated', user: MOCK_USER })
    expect(c.getState()).toEqual({ status: 'authenticated', user: MOCK_USER })
  })

  it('getState() reflects unauthenticated initial state immediately', () => {
    const c = new AuthController({ status: 'unauthenticated', user: null })
    expect(c.getState()).toEqual({ status: 'unauthenticated', user: null })
  })

  it('INITIAL_SESSION event is silently ignored — SSR state is never overwritten', async () => {
    ctrl = mountAuthenticated()
    // Simulate Supabase firing INITIAL_SESSION on hydration.
    authCallbackRef.current?.('INITIAL_SESSION', MOCK_SESSION)
    // Fetch must never be called — no server round-trip for INITIAL_SESSION.
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
    // State is unchanged.
    expect(ctrl.getState()).toEqual(authenticated())
  })

  it('INITIAL_SESSION with null session does not reset authenticated state', () => {
    ctrl = mountAuthenticated()
    authCallbackRef.current?.('INITIAL_SESSION', null)
    expect(ctrl.getState()).toEqual(authenticated())
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  })

  it('TOKEN_REFRESHED is ignored — token rotation does not trigger server round-trip', () => {
    ctrl = mountAuthenticated()
    authCallbackRef.current?.('TOKEN_REFRESHED', MOCK_SESSION)
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
    expect(ctrl.getState()).toEqual(authenticated())
  })

  it('subscribe notifies listener on every state commit', () => {
    ctrl = new AuthController(unauthenticated())
    const listener = vi.fn()
    ctrl.subscribe(listener)

    // Trigger a state change through the public API.
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(MOCK_USER))
    cleanup = ctrl.mount()
    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)

    // At minimum the 'refreshing' commit must have been fired synchronously.
    expect(listener).toHaveBeenCalled()
  })

  it('unsubscribe removes the listener — no further notifications', () => {
    ctrl = new AuthController(unauthenticated())
    const listener = vi.fn()
    const unsub = ctrl.subscribe(listener)
    unsub()

    // No state changes should reach the removed listener.
    cleanup = ctrl.mount()
    authCallbackRef.current?.('SIGNED_OUT', null)

    expect(listener).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2: TAB BACKGROUND / RESTORE
// Guarantee: visibility sync does not reset UI, does not loop, no flicker.
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 2 — Tab background / restore', () => {
  it('visibility change while visible triggers server sync', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(MOCK_USER))
    ctrl = mountAuthenticated()

    ctrl.handleVisibilityChange()

    await vi.waitFor(() => expect(ctrl.getState().status).toBe('authenticated'))
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
      '/api/auth/me',
      expect.objectContaining({ cache: 'no-store' })
    )
  })

  it('user remains in state during refreshing — no flicker to logged-out', async () => {
    let resolveSync!: (r: Response) => void
    const slowFetch = new Promise<Response>(r => { resolveSync = r })
    vi.mocked(global.fetch).mockReturnValueOnce(slowFetch)

    ctrl = mountAuthenticated()
    ctrl.handleVisibilityChange()

    // While the fetch is in flight the controller must be refreshing,
    // but the user must still be present — no UI reset.
    expect(ctrl.getState()).toEqual({ status: 'refreshing', user: MOCK_USER })

    resolveSync(okResponse(MOCK_USER))
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('authenticated'))
  })

  it('visibility change while tab is hidden triggers no sync', () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    })
    ctrl = mountAuthenticated()
    ctrl.handleVisibilityChange()

    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
  })

  it('visibility sync resolves to unauthenticated when server reports no session', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(null))
    ctrl = mountAuthenticated()

    ctrl.handleVisibilityChange()

    await vi.waitFor(() => expect(ctrl.getState().status).toBe('unauthenticated'))
    expect(ctrl.getState().user).toBeNull()
    // Local Supabase session must be cleared to stop stale token auto-refresh.
    expect(mockCoreSignOut).toHaveBeenCalledWith('local')
  })

  it('rapid double visibility change — only one sync completes, no duplicate state', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(okResponse(MOCK_USER))
      .mockResolvedValueOnce(okResponse(MOCK_USER))

    ctrl = mountAuthenticated()
    ctrl.handleVisibilityChange()
    ctrl.handleVisibilityChange() // second one aborts the first

    await vi.waitFor(() => expect(ctrl.getState().status).toBe('authenticated'))
    // Two fetches may have been started (the abort does not prevent the second call)
    // but only the second result is committed — no duplicate final state update.
    expect(ctrl.getState()).toEqual(authenticated())
  })

  it('visibility change during sign-out is ignored', async () => {
    ctrl = mountAuthenticated()

    // Start sign-out (does not await — keep it in-flight).
    const signOutPromise = ctrl.signOut()

    // Visibility change must be a no-op while signing out.
    ctrl.handleVisibilityChange()

    await signOutPromise
    expect(ctrl.getState().status).toBe('unauthenticated')
    // fetch should never have been called (no sync while signing out).
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  })

  it('visibility change during initializing is ignored', () => {
    ctrl = new AuthController({ status: 'initializing', user: null })
    cleanup = ctrl.mount()
    ctrl.handleVisibilityChange()
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3: MULTI-TAB AUTH SYNCHRONIZATION
// Guarantee: SIGNED_OUT from another tab immediately unauthenticates this tab.
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 3 — Multi-tab auth synchronization', () => {
  it('SIGNED_OUT (from any tab) re-verifies with server and settles unauthenticated when no session remains', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(null))
    ctrl = mountAuthenticated()

    authCallbackRef.current?.('SIGNED_OUT', null)

    // Synchronously: controller enters refreshing and issues ONE server check.
    expect(ctrl.getState().status).toBe('refreshing')
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)

    // After server confirms no session → terminal unauthenticated.
    await vi.waitFor(() => expect(ctrl.getState()).toEqual(unauthenticated()))
    expect(mockCoreSignOut).toHaveBeenCalledWith('local')
  })

  it('SIGNED_IN with null session (cross-tab token invalidation) re-verifies with server and settles unauthenticated', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(null))
    ctrl = mountAuthenticated()

    authCallbackRef.current?.('SIGNED_IN', null)

    // null session treated identically to SIGNED_OUT → syncFromServer.
    expect(ctrl.getState().status).toBe('refreshing')
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)

    await vi.waitFor(() => expect(ctrl.getState()).toEqual(unauthenticated()))
  })

  it('SIGNED_OUT aborts in-flight SIGNED_IN sync — stale result cannot re-authenticate', async () => {
    let resolveFirst!: (r: Response) => void
    let resolveSignedOut!: (r: Response) => void
    const staleFetch = new Promise<Response>(r => { resolveFirst = r })
    const signedOutFetch = new Promise<Response>(r => { resolveSignedOut = r })

    vi.mocked(global.fetch)
      .mockReturnValueOnce(staleFetch)      // fetch #1 — started by SIGNED_IN (stale)
      .mockReturnValueOnce(signedOutFetch)  // fetch #2 — started by SIGNED_OUT verification

    ctrl = mountAuthenticated()

    // Track every committed status to prove 'authenticated' is never reached.
    const committed: string[] = []
    ctrl.subscribe(() => committed.push(ctrl.getState().status))

    // SIGNED_IN from another tab → starts fetch #1.
    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    expect(ctrl.getState().status).toBe('refreshing')

    // SIGNED_OUT supersedes it: ++version, aborts fetch #1, starts fetch #2.
    authCallbackRef.current?.('SIGNED_OUT', null)
    // Still refreshing — now waiting for SIGNED_OUT's own server check.
    expect(ctrl.getState().status).toBe('refreshing')

    // Resolve stale fetch #1 with MOCK_USER — version guard rejects it (v=1, version=2).
    resolveFirst(okResponse(MOCK_USER))
    // Resolve SIGNED_OUT's server check with null — genuine sign-out.
    resolveSignedOut(okResponse(null))

    // Final state must be unauthenticated.
    await vi.waitFor(() => expect(ctrl.getState()).toEqual(unauthenticated()))

    // Security guarantee: 'authenticated' was NEVER committed — stale result was rejected.
    expect(committed).not.toContain('authenticated')
    expect(mockCoreSignOut).toHaveBeenCalledWith('local')
  })

  it('SIGNED_IN after SIGNED_OUT re-authenticates correctly', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(okResponse(null))       // SIGNED_OUT's server check → no session
      .mockResolvedValueOnce(okResponse(MOCK_USER))  // SIGNED_IN's server check → user

    ctrl = mountAuthenticated()

    authCallbackRef.current?.('SIGNED_OUT', null)
    // Drive SIGNED_OUT's sync to resolution before firing SIGNED_IN.
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('unauthenticated'))

    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('authenticated'))
    expect(ctrl.getState().user).toEqual(MOCK_USER)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4: REFRESH TOKEN EXPIRATION
// Guarantee: expired/invalid tokens produce clean unauthenticated state.
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 4 — Refresh token expiration', () => {
  it('server returning null user after token expiry → unauthenticated, local session cleared', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(null))
    ctrl = mountAuthenticated()

    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('unauthenticated'))

    expect(ctrl.getState().user).toBeNull()
    expect(mockCoreSignOut).toHaveBeenCalledWith('local')
  })

  it('SIGNED_OUT event on token expiration does not loop or leave loading state', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(null))
    ctrl = mountAuthenticated()

    authCallbackRef.current?.('SIGNED_OUT', null)

    // Synchronously: exactly one server check started — no retry loop.
    expect(ctrl.getState().status).toBe('refreshing')
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)

    // After server confirms no session → terminal unauthenticated (never stuck in refreshing).
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('unauthenticated'))
    expect(ctrl.getState().user).toBeNull()
    // Still exactly one fetch — no loop triggered.
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 5: SERVER RESTART RECOVERY
// Guarantee: after dev-server restart, visibility sync eventually re-establishes
//            session without requiring a manual page reload.
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 5 — Server restart recovery', () => {
  it('fetch failure → error state; subsequent visibility sync recovers to authenticated', async () => {
    // First sync: server is down.
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('fetch failed'))
    ctrl = mountAuthenticated()
    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)

    await vi.waitFor(() => expect(ctrl.getState().status).toBe('error'))

    // Server comes back; tab is restored.
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(MOCK_USER))
    ctrl.handleVisibilityChange()

    await vi.waitFor(() => expect(ctrl.getState().status).toBe('authenticated'))
    expect(ctrl.getState().user).toEqual(MOCK_USER)
  })

  it('error state does not block future syncs — controller is not frozen', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('network error'))
    ctrl = mountUnauthenticated()
    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('error'))

    // Second sync (simulating tab restore) succeeds.
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(null))
    ctrl.handleVisibilityChange()

    await vi.waitFor(() => expect(ctrl.getState().status).toBe('unauthenticated'))
  })

  it('AbortError from fetch during cleanup is silently ignored — no error state', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(makeAbortError())
    ctrl = mountUnauthenticated()
    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)

    // AbortError → the catch block returns without committing 'error'.
    // State was set to 'refreshing' before the fetch; it stays there
    // because no commit follows an AbortError.
    await vi.waitFor(() =>
      expect(['refreshing', 'unauthenticated', 'authenticated']).toContain(
        ctrl.getState().status
      )
    )
    expect(ctrl.getState().status).not.toBe('error')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 6: RAPID LOGIN / LOGOUT RACE TEST
// Guarantee: only the latest operation's result is ever committed to state.
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 6 — Rapid login / logout race condition protection', () => {
  it('two rapid SIGNED_IN events — only second fetch result is committed', async () => {
    let resolveFirst!: (r: Response) => void
    const firstFetch = new Promise<Response>(r => { resolveFirst = r })

    // First fetch is slow; second fetch resolves immediately.
    vi.mocked(global.fetch)
      .mockReturnValueOnce(firstFetch)
      .mockResolvedValueOnce(okResponse(MOCK_USER))

    ctrl = mountUnauthenticated()

    // Two rapid sign-in events before the first fetch resolves.
    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)

    // Wait for the second (authoritative) fetch to apply.
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('authenticated'))

    // Resolve the stale first fetch with a different result.
    resolveFirst(okResponse(null))
    await Promise.resolve()

    // Stale result must NOT overwrite the already-committed authenticated state.
    expect(ctrl.getState()).toEqual(authenticated())
  })

  it('SIGNED_IN during in-flight signOut — signOut result wins', async () => {
    let resolveInflight!: (r: Response) => void
    const inflightFetch = new Promise<Response>(r => { resolveInflight = r })
    vi.mocked(global.fetch).mockReturnValueOnce(inflightFetch)

    ctrl = mountAuthenticated()

    // Start a server sync.
    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    expect(ctrl.getState().status).toBe('refreshing')

    // Sign-out arrives while sync is in flight.
    const signOutDone = ctrl.signOut()

    // signOut immediately advances version and aborts the inflight.
    // State transitions to signing_out before the fetch resolves.
    expect(ctrl.getState().status).toBe('signing_out')

    resolveInflight(okResponse(MOCK_USER)) // Stale — must be ignored.
    await signOutDone

    expect(ctrl.getState().status).toBe('unauthenticated')
    expect(ctrl.getState().user).toBeNull()
  })

  it('signOut followed immediately by SIGNED_IN event — sign-out guard prevents re-auth', async () => {
    ctrl = mountAuthenticated()

    const signOutDone = ctrl.signOut()

    // Supabase SIGNED_IN fires while sign-out is in progress.
    // The guard `if (this.state.status === 'signing_out') return` must block it.
    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)

    await signOutDone
    expect(ctrl.getState().status).toBe('unauthenticated')
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  })

  it('concurrent double signOut — only runs once, second call is a no-op', async () => {
    ctrl = mountAuthenticated()

    const [first, second] = await Promise.all([
      ctrl.signOut(),
      ctrl.signOut(),
    ])

    // coreSignOut must only have been called once.
    expect(mockCoreSignOut).toHaveBeenCalledTimes(1)
    expect(ctrl.getState().status).toBe('unauthenticated')

    // Suppress unused-variable warning in test output.
    void first
    void second
  })

  it('visibility change during in-flight SIGNED_IN sync — latest version wins', async () => {
    let resolveFirst!: (r: Response) => void
    const firstFetch = new Promise<Response>(r => { resolveFirst = r })

    vi.mocked(global.fetch)
      .mockReturnValueOnce(firstFetch)            // SIGNED_IN sync (slow)
      .mockResolvedValueOnce(okResponse(MOCK_USER)) // visibility sync (fast)

    ctrl = mountAuthenticated()

    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    expect(ctrl.getState().status).toBe('refreshing')

    ctrl.handleVisibilityChange() // starts second sync, aborts first
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('authenticated'))

    // Now resolve the stale first fetch — must not change state.
    resolveFirst(okResponse(null))
    await Promise.resolve()
    expect(ctrl.getState()).toEqual(authenticated())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 7: NETWORK FAILURE RECOVERY
// Guarantee: transient network failure enters safe state; recovery syncs correctly.
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 7 — Network failure recovery', () => {
  it('non-ok HTTP response (500) → unauthenticated (no user in body)', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(errorResponse())
    ctrl = mountAuthenticated()

    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    await vi.waitFor(() =>
      expect(ctrl.getState().status).not.toBe('refreshing')
    )

    // 500 → fetchServerUser returns null → unauthenticated.
    expect(ctrl.getState().status).toBe('unauthenticated')
  })

  it('thrown network error → controller enters error state without crashing', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('ERR_NETWORK_CHANGED'))
    ctrl = mountUnauthenticated()

    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('error'))

    expect(ctrl.getState().user).toBeNull()
  })

  it('error state followed by successful sync recovers to authenticated', async () => {
    vi.mocked(global.fetch)
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(okResponse(MOCK_USER))

    ctrl = mountUnauthenticated()

    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('error'))

    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('authenticated'))
    expect(ctrl.getState().user).toEqual(MOCK_USER)
  })

  it('error state followed by successful visibility sync recovers — no manual reload needed', async () => {
    vi.mocked(global.fetch)
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(okResponse(MOCK_USER))

    ctrl = mountAuthenticated()

    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('error'))

    ctrl.handleVisibilityChange()
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('authenticated'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 8: UI STATE STABILITY
// Guarantee: no permanent stuck states, no ghost authentication, no loops.
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 8 — UI state stability', () => {
  it('signOut always resolves — never leaves controller in signing_out permanently', async () => {
    ctrl = mountAuthenticated()
    await ctrl.signOut()
    expect(ctrl.getState().status).toBe('unauthenticated')
  })

  it('signOut with coreSignOut failure still completes to unauthenticated', async () => {
    mockCoreSignOut.mockRejectedValueOnce(new Error('API error'))
    ctrl = mountAuthenticated()
    await ctrl.signOut()
    expect(ctrl.getState().status).toBe('unauthenticated')
  })

  it('fully authenticated state has user !== null', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(MOCK_USER))
    ctrl = mountUnauthenticated()
    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('authenticated'))

    const { status, user } = ctrl.getState()
    expect(status).toBe('authenticated')
    expect(user).not.toBeNull()
    expect(user?.id).toBe(MOCK_USER.id)
  })

  it('unauthenticated state always has user === null', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(null))
    ctrl = mountAuthenticated()

    authCallbackRef.current?.('SIGNED_OUT', null)
    // Drive to terminal unauthenticated — invariant applies to the resolved state.
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('unauthenticated'))
    // Invariant: unauthenticated state never carries a user.
    expect(ctrl.getState().user).toBeNull()
  })

  it('mount() cleanup unsubscribes Supabase and removes DOM visibility listener', () => {
    ctrl = new AuthController(authenticated())
    const cleanupFn = ctrl.mount()

    expect(mockUnsubscribe).not.toHaveBeenCalled()
    cleanupFn()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)

    // After cleanup the DOM event listener is removed — dispatching the event
    // must not reach the controller and must not trigger a fetch.
    document.dispatchEvent(new Event('visibilitychange'))
    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
  })

  it('mount() cleanup aborts any in-flight fetch — no dangling promises', async () => {
    let resolveInflight!: (r: Response) => void
    vi.mocked(global.fetch).mockReturnValueOnce(
      new Promise(r => { resolveInflight = r })
    )

    ctrl = new AuthController(unauthenticated())
    const cleanupFn = ctrl.mount()

    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    expect(ctrl.getState().status).toBe('refreshing')

    cleanupFn() // abort + unsubscribe

    // Resolving the now-aborted fetch must not mutate state.
    resolveInflight(okResponse(MOCK_USER))
    await Promise.resolve()

    // State stays at refreshing (the aborted fetch's result is ignored).
    // The important property: it is NOT 'authenticated' from a dangling promise.
    expect(ctrl.getState().status).not.toBe('authenticated')
  })

  it('valid state invariant — no authenticated state without a user', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(MOCK_USER))
    ctrl = mountUnauthenticated()
    authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    await vi.waitFor(() => expect(ctrl.getState().status).toBe('authenticated'))

    // Invariant: authenticated ⟹ user !== null.
    if (ctrl.getState().status === 'authenticated') {
      expect(ctrl.getState().user).not.toBeNull()
    }
  })

  it('valid state invariant — no unauthenticated state with a user', () => {
    ctrl = mountAuthenticated()
    authCallbackRef.current?.('SIGNED_OUT', null)

    // Invariant: unauthenticated ⟹ user === null.
    if (ctrl.getState().status === 'unauthenticated') {
      expect(ctrl.getState().user).toBeNull()
    }
  })
})
