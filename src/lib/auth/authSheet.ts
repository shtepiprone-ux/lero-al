/**
 * openAuthSheet — global trigger for the AuthSheet side drawer.
 *
 * Dispatches a custom DOM event that Header.tsx (which owns AuthSheet state)
 * listens to. Any client component can call this instead of redirecting to
 * /auth/login, ensuring the drawer is used consistently across the entire app.
 *
 * Usage:
 *   import { openAuthSheet } from '@/lib/auth/authSheet'
 *   openAuthSheet('login')        // default
 *   openAuthSheet('register')
 *   openAuthSheet('register-agent')
 */

export type AuthSheetView = 'login' | 'register' | 'register-agent' | 'forgot-password'

export const AUTH_SHEET_EVENT = 'lero:open-auth-sheet'
/** Fired by Header whenever the AuthSheet closes (login success OR dismiss/cancel). */
export const AUTH_SHEET_CLOSED_EVENT = 'lero:auth-sheet-closed'

export function openAuthSheet(view: AuthSheetView = 'login'): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<{ view: AuthSheetView }>(AUTH_SHEET_EVENT, { detail: { view } }),
  )
}
