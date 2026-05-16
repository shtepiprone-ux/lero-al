'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/admin':              'Dashboard',
  '/admin/listings':     'Оголошення',
  '/admin/users':        'Користувачі',
  '/admin/support':      'Support',
  '/admin/locations':    'Населені пункти',
  '/admin/legal':        'Правові документи',
  '/admin/settings':     'Налаштування',
  '/admin/pages-admin':  'Сторінки',
}

interface Props {
  onOpen: () => void
}

export function AdminMobileHeader({ onOpen }: Props) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? 'Admin'

  return (
    <header className="admin-mobile-header lg:hidden sticky top-0 z-30 h-14 bg-card border-b flex items-center gap-3 px-4 shrink-0">
      <button
        type="button"
        onClick={onOpen}
        className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Відкрити меню"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1.5 font-bold text-sm">
        <span className="text-primary">Shtepi</span>
        <span className="text-foreground">.al</span>
        <span className="bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md">
          Admin
        </span>
      </div>

      <span className="ml-auto text-sm font-medium text-muted-foreground truncate">{title}</span>
    </header>
  )
}
