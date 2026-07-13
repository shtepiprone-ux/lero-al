'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useUser } from '@/modules/auth/hooks/useUser'
import { setAdminLocale } from '@/modules/admin/actions/locale'
import dynamic from 'next/dynamic'
import { HeaderView } from '@/components/layout/HeaderView'
import { AuthSheet, type AuthView } from '@/modules/auth/components/AuthSheet'
import { AUTH_SHEET_EVENT, AUTH_SHEET_CLOSED_EVENT } from '@/lib/auth/authSheet'

const NotificationBell = dynamic(
  () => import('@/modules/notifications/components/NotificationBell').then(m => m.NotificationBell),
  { ssr: false },
)

export function Header() {
  const locale = useLocale()
  const router = useRouter()

  const { user, signOut } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authView, setAuthView] = useState<AuthView>('login')

  function openAuthSheet(view: AuthView) {
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
    const pathWithoutLocale = currentPath.replace(/^\/(sq|en|uk|it)/, '') || '/'
    // Sync admin-locale cookie so admin panel stays in the same locale.
    setAdminLocale(newLocale)
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  function handleLogout() {
    signOut(() => router.push(`/${locale}`))
  }

  return (
    <HeaderView
      isAuthenticated={!!user}
      user={user}
      locale={locale}
      onOpenAuth={openAuthSheet}
      onSwitchLocale={switchLocale}
      onNavigate={(path) => router.push(path)}
      onOpenAdmin={() => window.open('/admin', '_blank', 'noopener,noreferrer')}
      onLogout={handleLogout}
      mobileOpen={mobileOpen}
      onOpenMobile={() => setMobileOpen(true)}
      onCloseMobile={() => setMobileOpen(false)}
      notificationSlot={user ? <NotificationBell /> : undefined}
      authSheetSlot={
        <AuthSheet
          open={authOpen}
          onOpenChange={(open) => {
            setAuthOpen(open)
            if (!open) window.dispatchEvent(new CustomEvent(AUTH_SHEET_CLOSED_EVENT))
          }}
          initialView={authView}
        />
      }
    />
  )
}
