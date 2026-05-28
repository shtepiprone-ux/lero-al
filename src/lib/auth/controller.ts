'use client'

/**
 * auth-core / controller
 *
 * Central Auth State Machine — the single source of truth for all client auth state.
 *
 * All auth flows (SSR bootstrap, Supabase events, tab restore, sign-out) route
 * through this controller. No component, hook, or event handler may mutate
 * auth state directly.
 *
 * State machine transitions:
 *   initializing  → authenticated | unauthenticated   (SSR bootstrap — handled by constructor)
 *   authenticated → refreshing                         (sync triggered)
 *   authenticated → signing_out                        (sign-out initiated)
 *   unauthenticated → refreshing                       (SIGNED_IN event)
 *   refreshing    → authenticated | unauthenticated    (server response resolved)
 *   signing_out   → unauthenticated                    (sign-out complete)
 *   any           → error                              (unrecoverable server failure)
 *
 * Guarantees:
 *   • /api/auth/me is never called concurrently — previous request is aborted.
 *   • Stale responses are rejected via monotonic version counter.
 *   • UI state is never mutated directly by event handlers.
 *   • Tab restore never resets state — it transitions into refreshing and back.
 *   • SSR snapshot equals initial client state — no hydration flicker.
 */

import { onAuthStateChange, signOut as coreSignOut } from './browser'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import type { User } from '@/types/database'

// ── State model ───────────────────────────────────────────────────────────────

export type AuthStatus =
  | 'initializing'
  | 'authenticated'
  | 'unauthenticated'
  | 'refreshing'
  | 'signing_out'
  | 'error'

export interface AuthState {
  status: AuthStatus
  user: User | null
}

// Listener type for useSyncExternalStore subscribe parameter.
type Listener = () => void

// ── Internal: single-flight server fetch ──────────────────────────────────────

async function fetchServerUser(signal: AbortSignal): Promise<User | null> {
  const res = await fetch('/api/auth/me', { cache: 'no-store', signal })
  if (!res.ok) return null
  const body = await res.json() as { user: User | null }
  return body.user ?? null
}

// ── Auth Controller ───────────────────────────────────────────────────────────

export class AuthController {
  private state: AuthState

  // Subscribers notified on every state transition (useSyncExternalStore API).
  private listeners = new Set<Listener>()

  // Monotonically-increasing counter. Every syncFromServer() call captures the
  // version at start. If it has advanced by the time the response arrives, a
  // newer operation has superseded this one and the response is discarded.
  private version = 0

  // AbortController for the in-flight /api/auth/me request, if any.
  private inflight: AbortController | null = null

  // Timestamp of the last visibility-triggered sync. Auth events (SIGNED_IN,
  // SIGNED_OUT) bypass this interval and always sync immediately. Only the
  // tab-restore path is rate-limited to prevent /api/auth/me spam when the
  // user switches tabs rapidly or has multiple monitors.
  private lastVisibilitySync = 0
  private static readonly VISIBILITY_SYNC_MIN_MS = 30_000

  // ── Constructor ─────────────────────────────────────────────────────────────
  //
  // Accepts the initial state derived from the SSR snapshot so that the first
  // call to getState() (during client hydration) returns the same value the
  // server produced — guaranteeing hydration consistency with no flicker.

  constructor(initial: AuthState) {
    this.state = initial
  }

  // ── Store interface (useSyncExternalStore-compatible) ─────────────────────

  getState(): AuthState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // ── Internal: commit a new state and notify subscribers ───────────────────

  private commit(next: AuthState): void {
    this.state = next
    this.listeners.forEach(l => l())
  }

  // ── Internal: single-flight server sync ───────────────────────────────────
  //
  // The ONLY place /api/auth/me is ever fetched. Cancels any prior in-flight
  // request (AbortController), captures the current version, and rejects the
  // response if a newer operation started before it resolved.
  //
  // Preserves the current user in state during the refreshing phase so the UI
  // never flickers to a logged-out state while re-validating.

  private async syncFromServer(): Promise<void> {
    const v = ++this.version

    this.inflight?.abort()
    const abort = new AbortController()
    this.inflight = abort

    // Enter refreshing. Preserve the current user so the UI has no flicker
    // while the server round-trip is in progress.
    this.commit({ status: 'refreshing', user: this.state.user })

    try {
      const user = await fetchServerUser(abort.signal)

      // Reject stale: a newer syncFromServer() or sign-out was triggered.
      if (v !== this.version || abort.signal.aborted) return

      this.inflight = null
      this.commit({ status: user ? 'authenticated' : 'unauthenticated', user })

      // No valid session on server — clear local Supabase state so the SDK's
      // auto-refresh timer stops trying to use a stale refresh token.
      if (!user) coreSignOut('local').catch(() => {})
    } catch (err: unknown) {
      // AbortError is expected when a newer request cancels this one.
      if ((err as Error)?.name === 'AbortError') return
      if (v !== this.version) return

      this.inflight = null
      console.error('AuthController: server sync failed', { error: err })
      this.commit({ status: 'error', user: null })
    }
  }

  // ── Public: Supabase auth event handler ───────────────────────────────────

  handleAuthEvent(event: AuthChangeEvent, session: Session | null): void {
    // INITIAL_SESSION: SSR snapshot already reflects this state. Reacting would
    // race with the hydrated initialUser and produce a flicker.
    if (event === 'INITIAL_SESSION') return

    // TOKEN_REFRESHED: the access token rotated but identity and profile are
    // unchanged. No server round-trip is needed.
    if (event === 'TOKEN_REFRESHED') return

    // sign-out flow manages its own transitions — do not allow external events
    // to interfere mid-flight.
    if (this.state.status === 'signing_out') return

    // SIGNED_OUT or missing session: truth is unambiguously null — no fetch needed.
    if (!session || event === 'SIGNED_OUT') {
      this.version++
      this.inflight?.abort()
      this.inflight = null
      this.commit({ status: 'unauthenticated', user: null })
      return
    }

    // SIGNED_IN, USER_UPDATED, PASSWORD_RECOVERY — verify identity with server.
    this.syncFromServer()
  }

  // ── Public: tab restore / visibility sync ─────────────────────────────────

  handleVisibilityChange(): void {
    if (document.visibilityState !== 'visible') return
    // Ignore events during active transitions that manage their own state.
    if (this.state.status === 'signing_out') return
    if (this.state.status === 'initializing') return

    // Rate-limit: visibility events fire on every tab switch. Without a minimum
    // interval, rapidly switching between tabs generates a chain of cancelled-
    // then-restarted /api/auth/me calls. 30 s is long enough to avoid spam but
    // short enough to catch a session that expired while the tab was in the
    // background. Real auth events (SIGNED_IN, SIGNED_OUT) always bypass this.
    const now = Date.now()
    if (now - this.lastVisibilitySync < AuthController.VISIBILITY_SYNC_MIN_MS) return
    this.lastVisibilitySync = now

    this.syncFromServer()
  }

  // ── Public: manual refresh ────────────────────────────────────────────────
  //
  // Triggers a server sync without a Supabase auth event — used after profile
  // updates (name, avatar, etc.) so client state reflects the new values
  // immediately without a full page reload. (Task 248 / FF.1)

  refresh(): void {
    this.syncFromServer()
  }

  // ── Public: sign-out ──────────────────────────────────────────────────────

  async signOut(): Promise<void> {
    // Guard: already signing out — do not run concurrently.
    if (this.state.status === 'signing_out') return

    // Cancel any in-flight sync so it cannot overwrite the signing_out state.
    this.version++
    this.inflight?.abort()
    this.inflight = null

    this.commit({ status: 'signing_out', user: null })

    try {
      await coreSignOut()
    } catch {
      // The Supabase client clears its local session regardless of API errors.
      // The user is effectively signed out from the browser's perspective.
    }

    this.commit({ status: 'unauthenticated', user: null })
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  //
  // Called once from useEffect after hydration. Registers the Supabase auth
  // state subscription and the visibility change listener. Returns a cleanup
  // function that tears both down on unmount.

  mount(): () => void {
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      this.handleAuthEvent(event, session)
    })

    const onVisibility = () => this.handleVisibilityChange()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisibility)
      this.inflight?.abort()
      this.inflight = null
    }
  }
}
