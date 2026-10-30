'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useUser } from '@/modules/auth/hooks/useUser'
import { toast } from '@/lib/toast'
import { useGoogleOneTap } from '@/lib/auth/useGoogleOneTap'
import { forgetRememberedGoogleAccount, readRememberedGoogleAccount, type RememberedGoogleAccount } from '@/lib/auth/rememberedGoogleAccount'
import { completeGoogleSignIn, openStoredDestination } from '@/modules/auth/lib/googleSignIn'
import { setAdminLocale } from '@/modules/admin/actions/locale'
import { HeaderView } from '@/components/layout/HeaderView'
import { AuthSheet, type AuthView } from '@/modules/auth/components/AuthSheet'
import { AUTH_SHEET_EVENT, AUTH_SHEET_CLOSED_EVENT } from '@/lib/auth/authSheet'
import { NotificationBell } from '@/modules/notifications/components/NotificationBell'
import { resolvePostSignOutPath } from '@/lib/auth/postSignOut'

export function Header() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const t = useTranslations('auth')

  const { user, status, signOut, isSigningOut } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authView, setAuthView] = useState<AuthView>('login')
  // The Google account this device remembers (Task 927 Amendment 5): read on every opening, so the sheet shows Welcome back for a returning person.
  const [googleAccount, setGoogleAccount] = useState<RememberedGoogleAccount | null>(null)

  // One Tap for a guest, never over the open sheet. A sign-in through it opens the stored destination; a refusal is a toast and nothing else.
  async function handleOneTap(result: { credential: string; nonce: string }) {
    const errorKey = await completeGoogleSignIn(result)
    if (errorKey) {
      toast.error(t(errorKey as Parameters<typeof t>[0]))
      return
    }
    openStoredDestination(router)
  }
  useGoogleOneTap({
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    guest: status === 'unauthenticated',
    sheetOpen: authOpen,
    onCredential: handleOneTap,
  })

  // Hold the pre-sign-out user across the ~0.5s window between the auth-state commit and the
  // post-sign-out page arriving (Task 876, F4): "adjust state while rendering" (React-documented
  // pattern) — while isSigningOut, the header keeps rendering the last real user instead of
  // following `user` straight to null. Released the instant the sign-out transition commits.
  const [heldUser, setHeldUser] = useState(user)
  if (!isSigningOut && heldUser !== user) setHeldUser(user)
  const headerUser = isSigningOut ? heldUser : user

  function openAuthSheet(view: AuthView) {
    setGoogleAccount(readRememberedGoogleAccount())
    setAuthView(view)
    setAuthOpen(true)
  }

  // Global listener: any component can call openAuthSheet() from @/lib/auth/authSheet
  // to open this drawer without prop drilling or a context provider.
  useEffect(() => {
    function handleGlobalOpen(e: Event) {
      const view = (e as CustomEvent<{ view: AuthView }>).detail?.view ?? 'login'
      openAuthSheet(view)
    }
    window.addEventListener(AUTH_SHEET_EVENT, handleGlobalOpen)
    return () => window.removeEventListener(AUTH_SHEET_EVENT, handleGlobalOpen)
  }, [])

  function switchLocale(newLocale: string) {
    const currentPath = window.location.pathname
    const pathWithoutLocale = currentPath.replace(/^\/(sq|en|uk|it)(?=\/|$)/, '') || '/'
    // Sync admin-locale cookie so admin panel stays in the same locale.
    setAdminLocale(newLocale)
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  function handleLogout() {
    signOut(() => {
      const target = resolvePostSignOutPath(pathname, locale)
      if (target) router.push(target)
      else router.refresh()
    })
  }

  return (
    <HeaderView
      isAuthenticated={!!headerUser}
      user={headerUser}
      locale={locale}
      onOpenAuth={openAuthSheet}
      onSwitchLocale={switchLocale}
      onNavigate={(path) => router.push(path)}
      onOpenAdmin={() => window.open('/admin', '_blank', 'noopener,noreferrer')}
      onLogout={handleLogout}
      isSigningOut={!!isSigningOut}
      mobileOpen={mobileOpen}
      onOpenMobile={() => setMobileOpen(true)}
      onCloseMobile={() => setMobileOpen(false)}
      notificationSlot={headerUser ? <NotificationBell /> : undefined}
      authSheetSlot={
        <AuthSheet
          open={authOpen}
          onOpenChange={(open) => {
            setAuthOpen(open)
            if (!open) window.dispatchEvent(new CustomEvent(AUTH_SHEET_CLOSED_EVENT))
          }}
          initialView={authView}
          googleAccount={googleAccount}
          onForgetGoogleAccount={() => {
            forgetRememberedGoogleAccount()
            setGoogleAccount(null)
          }}
        />
      }
    />
  )
}
