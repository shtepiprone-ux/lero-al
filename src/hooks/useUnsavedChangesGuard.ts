'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Centralized navigation guard for unsaved-changes protection.
 *
 * Intercepts ALL navigation sources when `isDirty` is true:
 *  - Browser refresh / tab close       (beforeunload)
 *  - Sidebar / header / breadcrumb     (<a> click capture)
 *  - Browser back / forward button     (popstate)
 *  - Toolbar / programmatic router.push (via interceptHref)
 *
 * Returns `interceptHref` — call it before any router.push to respect the guard.
 * Returns `confirmAndNavigate` — helper that shows the dialog or navigates directly.
 */
export function useUnsavedChangesGuard(
  isDirty: boolean,
  onShowDialog: (href: string | null) => void,
) {
  const router = useRouter()
  // Ref to suppress the popstate event we fire ourselves in handleConfirmLeave
  const confirmingLeaveRef = useRef(false)

  // 1. Browser refresh / tab close / direct URL entry
  useEffect(() => {
    if (!isDirty) return
    const handle = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      console.log('[UnsavedChanges] navigation_blocked', { type: 'beforeunload' })
    }
    window.addEventListener('beforeunload', handle)
    return () => window.removeEventListener('beforeunload', handle)
  }, [isDirty])

  // 2. Sidebar / header / breadcrumb / Link clicks — capture phase intercepts
  //    before Next.js router or native browser handles the event
  useEffect(() => {
    if (!isDirty) return
    function intercept(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return
      try {
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return  // external — let browser handle
        if (url.pathname === window.location.pathname) return  // same page
      } catch { return }
      e.preventDefault()
      e.stopImmediatePropagation()
      console.log('[UnsavedChanges] route_change_attempt', { source: 'link_click', href })
      console.log('[UnsavedChanges] navigation_blocked', { type: 'link_click', href })
      onShowDialog(href)
    }
    document.addEventListener('click', intercept, true)
    return () => document.removeEventListener('click', intercept, true)
  }, [isDirty, onShowDialog])

  // 3. Browser back / forward button — fires popstate, not a click
  useEffect(() => {
    if (!isDirty) return
    function handlePopState() {
      if (confirmingLeaveRef.current) {
        confirmingLeaveRef.current = false
        return
      }
      // Re-push current state so URL appears unchanged while dialog is open
      window.history.pushState(null, document.title, window.location.href)
      console.log('[UnsavedChanges] route_change_attempt', { source: 'browser_back_forward' })
      console.log('[UnsavedChanges] navigation_blocked', { type: 'popstate' })
      onShowDialog(null)  // null = back/forward; confirmed by history.go(-2)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isDirty, onShowDialog])

  /**
   * Call before any programmatic navigation (toolbar buttons, router.push).
   * If dirty: shows dialog and returns false.
   * If clean: returns true (caller should proceed with navigation).
   */
  const interceptHref = useCallback((href: string) => {
    if (!isDirty) return true
    console.log('[UnsavedChanges] route_change_attempt', { source: 'toolbar_button', href })
    console.log('[UnsavedChanges] navigation_blocked', { type: 'toolbar_button', href })
    onShowDialog(href)
    return false
  }, [isDirty, onShowDialog])

  /**
   * Call from the dialog's "Leave without saving" handler.
   * href = null means back/forward (use history.go), string = router.push.
   */
  const confirmLeave = useCallback((href: string | null) => {
    console.log('[UnsavedChanges] navigation_confirmed', { href: href ?? '__back__' })
    if (href) {
      router.push(href)
    } else {
      // Undo our pushState sentinel + the original back navigation
      // history: [..., prev, current, sentinel]  →  go(-2)  →  [..., prev (current)]
      confirmingLeaveRef.current = true
      window.history.go(-2)
    }
  }, [router])

  return { interceptHref, confirmLeave }
}
