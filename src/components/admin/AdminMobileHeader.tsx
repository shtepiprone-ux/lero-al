'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Menu } from 'lucide-react'

interface Props {
  onOpen: () => void
  siteName?: string
}

export function AdminMobileHeader({ onOpen, siteName = 'Lero.al' }: Props) {
  const t = useTranslations('admin.sidebar')
  const tm = useTranslations('admin.mobile_header')
  const pathname = usePathname()

  const PAGE_TITLES: Record<string, string> = {
    '/admin':             t('item_dashboard'),
    '/admin/listings':    t('item_listings'),
    '/admin/users':       t('item_users'),
    '/admin/support':     t('item_support'),
    '/admin/locations':   t('item_locations'),
    '/admin/legal':       t('item_legal'),
    '/admin/settings':    t('item_settings'),
    '/admin/pages-admin':       t('item_pages'),
    '/admin/property-types':    t('item_property_types'),
    '/admin/currency':          t('item_currency'),
  }

  const title = PAGE_TITLES[pathname] ?? 'Admin'
  const [brand, tld] = siteName.includes('.')
    ? [siteName.split('.')[0], '.' + siteName.split('.').slice(1).join('.')]
    : [siteName, '']

  return (
    <header className="admin-mobile-header lg:hidden sticky top-0 z-30 h-14 bg-card border-b flex items-center gap-3 px-4 shrink-0">
      <button
        type="button"
        onClick={onOpen}
        className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label={tm('aria_open')}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-1.5 font-bold text-sm">
        <span className="text-primary">{brand}</span>
        <span className="text-foreground">{tld}</span>
        <span className="bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md">
          Admin
        </span>
      </div>

      <span className="ml-auto text-sm font-medium text-muted-foreground truncate">{title}</span>
    </header>
  )
}
