'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, ChevronDown, User, ListPlus, LogOut, LayoutList, LayoutDashboard } from 'lucide-react'
import { useUser } from '@/modules/auth/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Button as MantineButton, ActionIcon, Avatar } from '@mantine/core'
import {
  MantineDropdownMenu,
  MantineDrawer,
  MantineCombobox,
  type DropdownMenuItemDef,
  type MantineComboboxOption,
} from '@/design-system/mantine/patterns'
import { setAdminLocale } from '@/modules/admin/actions/locale'
import dynamic from 'next/dynamic'
import { LocaleSwitcher, LOCALES, type LocaleCode } from '@/components/shared/LocaleSwitcher'
import { HeaderActions } from '@/components/layout/HeaderActions'
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
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()

  const langLabels: Record<LocaleCode, string> = {
    sq: t('lang_sq'),
    en: t('lang_en'),
    uk: t('lang_uk'),
    it: t('lang_it'),
  }

  const localeOptions: MantineComboboxOption[] = LOCALES.map(loc => ({
    value: loc.code,
    label: loc.abbr,
    description: langLabels[loc.code],
  }))

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

  const userMenuItems: DropdownMenuItemDef[] = user
    ? [
        { label: t('profile'), icon: <User size={16} />, onClick: () => router.push(`/${locale}/cabinet`) },
        { label: t('my_listings'), icon: <LayoutList size={16} />, onClick: () => router.push(`/${locale}/cabinet?tab=listings`) },
        { label: t('add_listing'), icon: <ListPlus size={16} />, onClick: () => router.push(`/${locale}/listings/create`), separator: true },
        ...(user.role === 'admin' || user.role === 'moderator'
          ? [{
              label: <span style={{ fontWeight: 500 }}>{t('admin_dashboard')}</span>,
              icon: <LayoutDashboard size={16} />,
              color: 'brand',
              onClick: () => window.open('/admin', '_blank', 'noopener,noreferrer'),
              separator: true,
            }]
          : []),
        { label: t('logout'), icon: <LogOut size={16} />, color: 'red', onClick: handleLogout, separator: true },
      ]
    : []

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
          {/* Language switcher */}
          <LocaleSwitcher onSwitch={switchLocale} className="hidden sm:flex" />

          {/* Mobile locale switcher — canonical MantineCombobox visible at 320–639px.
              Compact w-24-equivalent trigger (triggerWidth override) — documented icon/compact
              exemption alongside the hamburger below (clause 11): this is an inline header
              control sitting next to other compact icon controls, not a full-row filter. */}
          <div className="sm:hidden">
            <MantineCombobox
              variant="button"
              options={localeOptions}
              value={locale}
              onChange={switchLocale}
              triggerWidth="6rem"
              triggerAriaLabel={tc('language')}
              noResultsLabel={tc('no_results')}
            />
          </div>

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
              <MantineDropdownMenu
                trigger={
                  <MantineButton
                    variant="default"
                    leftSection={
                      <Avatar src={user.avatar_url ?? undefined} name={user.name ?? undefined} color="brand" size={28} />
                    }
                    rightSection={<ChevronDown size={12} />}
                  >
                    <span className="max-w-30 truncate">{user.name}</span>
                  </MantineButton>
                }
                items={userMenuItems}
              />
            </div>
          )}

          {/* Mobile hamburger — icon-only trigger (clause-11 documented exemption), mirrors the
              canonical icon-only ActionIcon reference in DropdownMenu.stories.tsx block 3
              (variant="default", 2.75rem/44px min touch target) */}
          <ActionIcon
            variant="default"
            aria-label={tc('aria_open_menu')}
            className="md:hidden"
            mih="2.75rem"
            miw="2.75rem"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </ActionIcon>
          <MantineDrawer opened={mobileOpen} onClose={() => setMobileOpen(false)} side="right" size="xs">
            <div className="flex flex-col gap-6">
              {/* Mobile user info */}
              {user && (
                <div className="flex items-center gap-3 pb-4 border-b">
                  <Avatar src={user.avatar_url ?? undefined} name={user.name ?? undefined} color="brand" size={40} />
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                  </div>
                </div>
              )}

              {/* Mobile nav links */}
              <nav className="flex flex-col gap-4">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
                {user && (
                  <>
                    <Link
                      href={`/${locale}/cabinet`}
                      className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t('profile')}
                    </Link>
                    <Link
                      href={`/${locale}/cabinet?tab=listings`}
                      className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t('my_listings')}
                    </Link>
                    <Link
                      href={`/${locale}/favorites`}
                      className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t('favorites')}
                    </Link>
                    <Link
                      href={`/${locale}/listings/create`}
                      className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t('add_listing')}
                    </Link>
                  </>
                )}
              </nav>

              {/* Mobile auth buttons */}
              {!user && (
                <div className="border-t pt-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="xl"
                    className="w-full"
                    onClick={() => { setMobileOpen(false); openAuthSheet('login') }}
                  >
                    {t('login')}
                  </Button>
                  <Button
                    size="xl"
                    className="w-full"
                    onClick={() => { setMobileOpen(false); openAuthSheet('register') }}
                  >
                    {t('register')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="xl"
                    className="w-full"
                    onClick={() => { setMobileOpen(false); openAuthSheet('register-agent') }}
                  >
                    {t('register_agent')}
                  </Button>
                </div>
              )}

              {/* Mobile logout */}
              {user && (
                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    size="xl"
                    onClick={() => { handleLogout(); setMobileOpen(false) }}
                    className="w-full justify-start text-destructive hover:text-destructive/80 hover:bg-destructive/5"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </Button>
                </div>
              )}
            </div>
          </MantineDrawer>
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
