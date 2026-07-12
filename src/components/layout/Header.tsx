'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { useUser } from '@/modules/auth/hooks/useUser'
import { ActionIcon } from '@mantine/core'
import { setAdminLocale } from '@/modules/admin/actions/locale'
import dynamic from 'next/dynamic'
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'
import { HeaderActions } from '@/components/layout/HeaderActions'
import { UserMenu } from '@/components/layout/UserMenu'
import { MobileNavDrawer } from '@/components/layout/MobileNavDrawer'
import { AuthSheet, type AuthView } from '@/modules/auth/components/AuthSheet'
import { AUTH_SHEET_EVENT, AUTH_SHEET_CLOSED_EVENT } from '@/lib/auth/authSheet'

const NotificationBell = dynamic(
  () => import('@/modules/notifications/components/NotificationBell').then(m => m.NotificationBell),
  { ssr: false },
)

// ── NavLinks ──────────────────────────────────────────────────────────────────
//
// Defined at module level (NOT inside Header's render body) so that React sees
// a stable component type across renders. Defining it inside the render body
// creates a new function reference on every render, causing React to see a
// different component type during hydration vs SSR — this shifts the fiber ID
// counter and breaks Base UI's useId()-generated IDs (hydration mismatch).
//
// onNavigate is provided for the mobile sheet usage (closes the drawer).
// Desktop nav omits it — setMobileOpen(false) is a no-op when sheet is closed.

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations('nav')
  const locale = useLocale()
  return (
    <>
      <Link
        href={`/${locale}`}
        className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        onClick={onNavigate}
      >
        {t('home')}
      </Link>
      <Link
        href={`/${locale}/listings`}
        className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
        onClick={onNavigate}
      >
        {t('listings')}
      </Link>
    </>
  )
}

export function Header() {
  const tc = useTranslations('common')
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
    <header className="site-header sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-wide flex h-16 items-center justify-between py-0">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-1 font-bold text-xl">
          <span className="text-primary">Lero</span>
          <span className="text-foreground">.al</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLinks />
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language switcher — the ONE canonical adaptive LocaleSwitcher at all breakpoints
              (Task 577): its MantineDropdownMenu is already adaptive (anchored menu ≥640,
              full-width bottom sheet <640), so the previous separate mobile combobox was a
              redundant parallel implementation — deleted. Compact `EN ⌄` trigger sits inline
              next to the other compact header controls (documented icon/compact exemption,
              clause 11 — unchanged from how the removed combobox trigger was exempted). */}
          <LocaleSwitcher onSwitch={switchLocale} />

          {/* Favorites + notification-bell slot + guest login/register — HeaderActions primitive
              (Task 575). NotificationBell stays container-owned (own hooks, dynamic ssr:false)
              and is passed as a slot — never hook-called inside the primitive. */}
          <HeaderActions
            isAuthenticated={!!user}
            favoritesHref={`/${locale}/favorites`}
            onOpenAuth={openAuthSheet}
            notificationSlot={user ? <NotificationBell /> : undefined}
          />

          {/* User menu — desktop, authenticated only (guest login/register live in HeaderActions) */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              <UserMenu
                user={user}
                locale={locale}
                onNavigate={(path) => router.push(path)}
                onOpenAdmin={() => window.open('/admin', '_blank', 'noopener,noreferrer')}
                onLogout={handleLogout}
              />
            </div>
          )}

          {/* Mobile hamburger — icon-only trigger (clause-11 documented exemption), mirrors the
              canonical icon-only ActionIcon reference in DropdownMenu.stories.tsx block 3
              (variant="default", 2.75rem/44px min touch target) */}
          <ActionIcon
            variant="default"
            aria-label={tc('aria_open_menu')}
            hiddenFrom="md"
            mih="2.75rem"
            miw="2.75rem"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </ActionIcon>
          <MobileNavDrawer
            opened={mobileOpen}
            onClose={() => setMobileOpen(false)}
            user={user}
            locale={locale}
            onNavigate={(path) => router.push(path)}
            onOpenAuth={openAuthSheet}
            onLogout={handleLogout}
          />
        </div>
      </div>

      <AuthSheet
        open={authOpen}
        onOpenChange={(open) => {
          setAuthOpen(open)
          if (!open) window.dispatchEvent(new CustomEvent(AUTH_SHEET_CLOSED_EVENT))
        }}
        initialView={authView}
      />
    </header>
  )
}
