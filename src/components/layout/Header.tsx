'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, ChevronDown, User, ListPlus, Heart, LogOut, LayoutList, LayoutDashboard } from 'lucide-react'
import { useUser } from '@/modules/auth/hooks/useUser'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { setAdminLocale } from '@/modules/admin/actions/locale'
import dynamic from 'next/dynamic'
import { LocaleSwitcher, LOCALES, type LocaleCode } from '@/components/shared/LocaleSwitcher'
import { Combobox, type ComboboxOption } from '@/components/shared/Combobox'
import { AuthSheet, type AuthView } from '@/modules/auth/components/AuthSheet'

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

  const localeOptions: ComboboxOption[] = LOCALES.map(loc => ({
    value: loc.code,
    label: `${loc.flag} ${loc.code.toUpperCase()}`,
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

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <header className="site-header sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

          {/* Favorites — visible beside language selector on sm+ */}
          <Link
            href={user ? `/${locale}/favorites` : `/${locale}/auth/login`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1 px-2 hidden sm:flex')}
            aria-label={t('favorites')}
          >
            <Heart className="h-4 w-4" />
          </Link>

          {/* Mobile locale switcher — canonical Combobox visible at 320–639px */}
          <Combobox
            variant="button"
            size="default"
            options={localeOptions}
            value={locale}
            onChange={switchLocale}
            className="w-24 sm:hidden"
            portal
          />

          {/* Notification bell — authenticated users only */}
          {user && <NotificationBell />}

          {/* Auth / user menu — desktop */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-2 px-2')}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Link href={`/${locale}/cabinet`} className="flex items-center gap-2 w-full">
                      <User className="h-4 w-4" />
                      {t('profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href={`/${locale}/cabinet?tab=listings`} className="flex items-center gap-2 w-full">
                      <LayoutList className="h-4 w-4" />
                      {t('my_listings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href={`/${locale}/listings/create`} className="flex items-center gap-2 w-full">
                      <ListPlus className="h-4 w-4" />
                      {t('add_listing')}
                    </Link>
                  </DropdownMenuItem>
                  {(user.role === 'admin' || user.role === 'moderator') && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Link href="/admin" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full text-primary font-medium">
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => openAuthSheet('login')}>
                  {t('login')}
                </Button>
                <Button size="sm" onClick={() => openAuthSheet('register')}>
                  {t('register')}
                </Button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'md:hidden')}
              aria-label={tc('aria_open_menu')}
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <div className="flex flex-col gap-6 pt-6">
                {/* Mobile user info */}
                {user && (
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url ?? undefined} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
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
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AuthSheet open={authOpen} onOpenChange={setAuthOpen} initialView={authView} />
    </header>
  )
}
