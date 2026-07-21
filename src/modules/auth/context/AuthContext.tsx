'use client'

/**
 * AuthContext — React adapter over AuthController.
 *
 * This is a thin binding layer. All auth logic, state transitions, and
 * sequencing live in AuthController (src/lib/auth/controller.ts).
 * This file only wires the controller to React's rendering model.
 *
 * Hydration guarantee: the controller is instantiated synchronously in the
 * render body with the SSR-resolved initialUser, so getState() returns the
 * same value the server used — React never sees a server/client mismatch.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  startTransition,
  useSyncExternalStore,
} from 'react'
import { AuthController, type AuthState, type AuthStatus } from '@/lib/auth/controller'
import type { User } from '@/types/database'

// ── Context shape ─────────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: User | null
  status: AuthStatus
  /** @deprecated — prefer `status`. Kept for backward-compatibility. */
  loading: boolean
  signOut: (navigate?: () => void) => void
  /** Re-syncs user state from the server. Call after profile updates so the header
   *  reflects the new name/avatar immediately without a full page reload. */
  refreshUser: () => void
}

/**
 * Exported (Task 656) so a Storybook story can mount the real `ListingCard` under a
 * mocked signed-in value via `<AuthContext.Provider value={...}>` — bypassing
 * `AuthProvider`'s `AuthController`/Supabase-subscription wiring entirely, per the
 * "no live Supabase client / no network calls in stories" governance rule.
 */
export const AuthContext = createContext<AuthContextValue>({
  user: null,
  status: 'initializing',
  loading: true,
  signOut: () => {},
  refreshUser: () => {},
})

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode
  initialUser: User | null
}

export function AuthProvider({ children, initialUser }: Props) {
  // Controller is created synchronously in the render body — not inside an
  // effect — so the initial state is available for both the server snapshot
  // (SSR rendering) and the client snapshot (hydration), guaranteeing they
  // are identical and hydration never mismatches.
  const controllerRef = useRef<AuthController | null>(null)
  if (controllerRef.current === null) {
    controllerRef.current = new AuthController({
      status: initialUser ? 'authenticated' : 'unauthenticated',
      user: initialUser,
    })
  }
  const controller = controllerRef.current

  // useSyncExternalStore ensures tear-safe subscriptions in concurrent mode.
  //
  // getSnapshot and getServerSnapshot use the same function: controller.getState().
  // This is the correct fix for "getServerSnapshot should be cached" — React calls
  // getServerSnapshot twice in the same render pass and checks Object.is(r1, r2).
  // A new object literal ({...}) allocates a different reference each call → fails.
  // controller.getState() returns this.state — the same object reference until
  // commit() is called, which only happens in async callbacks, never during render.
  // Both calls therefore return the identical reference → Object.is → true → no loop.
  const getSnap = useCallback(() => controller.getState(), [controller])
  const authState = useSyncExternalStore<AuthState>(
    useCallback(cb => controller.subscribe(cb), [controller]),
    getSnap,
    getSnap,
  )

  // Mount event listeners (Supabase subscription + visibility) after hydration.
  // useEffect never runs on the server, so subscriptions are client-only.
  // The returned cleanup is called on unmount (and by React Strict Mode).
  useEffect(() => {
    return controller.mount()
    // controller is a ref value — stable for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // signOut is a React 19 async action: wrapping controller.signOut() and the
  // caller's navigate() inside startTransition means the RSC payload fetch
  // triggered by router.push() is part of the same transition as the auth
  // state update — preventing "Failed to fetch RSC payload" race conditions.
  const signOut = useCallback(
    (navigate?: () => void): void => {
      startTransition(async () => {
        await controller.signOut()
        navigate?.()
      })
    },
    [controller]
  )

  const refreshUser = useCallback(
    (): void => { controller.refresh() },
    [controller]
  )

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        status: authState.status,
        loading: authState.status === 'initializing',
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
