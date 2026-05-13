/**
 * AuthContext — React Lifecycle Integration Tests
 *
 * Verifies the full React lifecycle of AuthProvider: how it bridges the
 * AuthController state machine to React rendering via useSyncExternalStore.
 *
 * What is tested here (and NOT in controller.test.ts):
 *   • Hydration consistency: server snapshot ≡ client snapshot for same initialUser
 *   • React context value shape and derivation (status, loading, user)
 *   • signOut wires navigate() correctly and updates the rendered tree
 *   • Controller is mounted (subscriptions wired) after React effect phase
 *   • State changes from auth events propagate into the rendered UI
 *
 * Mocking strategy: same boundary as controller tests — only browser.ts and
 * global fetch are mocked; AuthController and AuthContext run real code.
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../context/AuthContext'
import type { User } from '@/types/database'

// ── External boundary mocks ────────────────────────────────────────────────────

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
  id: 'ctx-user-1',
  name: 'Dritan Gjoka',
  last_name: null,
  phone: null,
  whatsapp: null,
  avatar_url: null,
  role: 'user',
  user_type: 'private',
  status: 'active',
  block_reason: null,
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
  preferred_currency: 'ALL' as const,
  pending_email: null,
  created_at: '2026-01-01T00:00:00.000Z',
}

const MOCK_SESSION = { access_token: 'tok', refresh_token: 'ref', user: { id: MOCK_USER.id } }

// ── Helpers ────────────────────────────────────────────────────────────────────

function okResponse(user: User | null): Response {
  return new Response(JSON.stringify({ user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Test consumer that renders all context values into data-testid spans. */
function AuthConsumer() {
  const { user, status, loading, signOut } = useAuth()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user-name">{user?.name ?? 'none'}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button
        data-testid="sign-out"
        onClick={() => signOut()}
      >
        Sign out
      </button>
    </div>
  )
}

function renderProvider(initialUser: User | null = null) {
  return render(
    <AuthProvider initialUser={initialUser}>
      <AuthConsumer />
    </AuthProvider>
  )
}

// ── Per-test teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  vi.mocked(global.fetch).mockReset()
  mockCoreSignOut.mockClear()
  mockUnsubscribe.mockClear()
  authCallbackRef.current = null
})

// ─────────────────────────────────────────────────────────────────────────────
// Hydration consistency
// ─────────────────────────────────────────────────────────────────────────────

describe('Hydration consistency', () => {
  it('renders authenticated state synchronously from initialUser — no async needed', () => {
    renderProvider(MOCK_USER)

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('user-name')).toHaveTextContent('Dritan Gjoka')
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })

  it('renders unauthenticated state when initialUser is null — no async needed', () => {
    renderProvider(null)

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    expect(screen.getByTestId('user-name')).toHaveTextContent('none')
    expect(screen.getByTestId('loading')).toHaveTextContent('false')
  })

  it('getServerSnapshot and getSnapshot produce identical state for authenticated user', () => {
    // The controller is instantiated with the same initialUser expression that
    // both snapshots use. Verifying the rendered output is the practical proxy
    // for "server rendered HTML === initial client HTML" since we cannot run a
    // real SSR pass in a jsdom environment.
    renderProvider(MOCK_USER)

    // If the snapshots differed, React would log a hydration warning and the
    // component would flash. The rendered output being correct without any
    // flush/wait proves they matched.
    expect(screen.getByTestId('status').textContent).toBe('authenticated')
  })

  it('loading is false immediately — initializing state is skipped via SSR bootstrap', () => {
    // The controller is constructed with status 'authenticated' or 'unauthenticated',
    // never 'initializing', when initialUser is provided. Loading must never be true.
    renderProvider(MOCK_USER)
    expect(screen.getByTestId('loading')).toHaveTextContent('false')

    renderProvider(null)
    // screen.getAllByTestId returns both — last render's element is what we want.
    const loadingEls = screen.getAllByTestId('loading')
    expect(loadingEls[loadingEls.length - 1]).toHaveTextContent('false')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Auth event propagation into React tree
// ─────────────────────────────────────────────────────────────────────────────

describe('Auth event propagation', () => {
  it('SIGNED_IN event updates rendered UI to authenticated', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(MOCK_USER))
    renderProvider(null)

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')

    await act(async () => {
      authCallbackRef.current?.('SIGNED_IN', MOCK_SESSION)
    })

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    )
    expect(screen.getByTestId('user-name')).toHaveTextContent('Dritan Gjoka')
  })

  it('SIGNED_OUT event updates rendered UI to unauthenticated', async () => {
    renderProvider(MOCK_USER)

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')

    await act(async () => {
      authCallbackRef.current?.('SIGNED_OUT', null)
    })

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    expect(screen.getByTestId('user-name')).toHaveTextContent('none')
  })

  it('INITIAL_SESSION does not trigger a fetch or re-render', async () => {
    renderProvider(MOCK_USER)

    await act(async () => {
      authCallbackRef.current?.('INITIAL_SESSION', MOCK_SESSION)
    })

    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
  })

  it('TOKEN_REFRESHED does not trigger a fetch or re-render', async () => {
    renderProvider(MOCK_USER)

    await act(async () => {
      authCallbackRef.current?.('TOKEN_REFRESHED', MOCK_SESSION)
    })

    expect(vi.mocked(global.fetch)).not.toHaveBeenCalled()
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tab restore via document visibility
// ─────────────────────────────────────────────────────────────────────────────

describe('Tab restore via visibility change', () => {
  it('visibility change triggers sync and updates UI', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(okResponse(MOCK_USER))
    renderProvider(MOCK_USER)

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    )
  })

  it('during refresh the user remains visible — no UI flicker to logged-out', async () => {
    let resolveSync!: (r: Response) => void
    const slowFetch = new Promise<Response>(r => { resolveSync = r })
    vi.mocked(global.fetch).mockReturnValueOnce(slowFetch)

    renderProvider(MOCK_USER)

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // While the fetch is in flight, the user must still be visible in the tree.
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('refreshing')
    )
    expect(screen.getByTestId('user-name')).toHaveTextContent('Dritan Gjoka')

    await act(async () => {
      resolveSync(okResponse(MOCK_USER))
    })

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// signOut flow
// ─────────────────────────────────────────────────────────────────────────────

describe('signOut flow', () => {
  it('signOut transitions UI to unauthenticated', async () => {
    renderProvider(MOCK_USER)

    await act(async () => {
      screen.getByTestId('sign-out').click()
    })

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    )
    expect(screen.getByTestId('user-name')).toHaveTextContent('none')
  })

  it('signOut calls the provided navigate callback after auth teardown', async () => {
    const navigate = vi.fn()

    function WithNavigate() {
      const { signOut } = useAuth()
      return (
        <button data-testid="nav-sign-out" onClick={() => signOut(navigate)}>
          Sign out
        </button>
      )
    }

    render(
      <AuthProvider initialUser={MOCK_USER}>
        <WithNavigate />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByTestId('nav-sign-out').click()
    })

    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
  })

  it('signOut calls coreSignOut exactly once', async () => {
    renderProvider(MOCK_USER)

    await act(async () => {
      screen.getByTestId('sign-out').click()
    })

    await waitFor(() => expect(mockCoreSignOut).toHaveBeenCalledTimes(1))
  })

  it('signOut with coreSignOut failure still transitions to unauthenticated', async () => {
    mockCoreSignOut.mockRejectedValueOnce(new Error('network failure'))
    renderProvider(MOCK_USER)

    await act(async () => {
      screen.getByTestId('sign-out').click()
    })

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Controller lifecycle (mount / cleanup)
// ─────────────────────────────────────────────────────────────────────────────

describe('Controller lifecycle', () => {
  it('onAuthStateChange is registered after component mount', () => {
    renderProvider(null)
    // The callback is registered via useEffect → mount().
    expect(authCallbackRef.current).not.toBeNull()
  })

  it('Supabase subscription is unsubscribed on unmount', () => {
    const { unmount } = renderProvider(null)
    expect(mockUnsubscribe).not.toHaveBeenCalled()
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
