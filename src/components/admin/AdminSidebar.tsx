'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard, ListChecks, Users, MessageSquare,
  MapPin, FileText, Settings, LogOut, ExternalLink, X, ChevronRight, Building2, CircleDollarSign, Briefcase, Flag, Mail, Star, ShieldCheck, LifeBuoy, TrendingUp, PanelBottom,
} from 'lucide-react'
import { signOut } from '@/lib/auth/browser'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { AdminLocaleSwitcher } from '@/components/admin/AdminLocaleSwitcher'

function NavItem({ href, label, icon: Icon, active, onClick }: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {active && <ChevronRight className="h-3 w-3 opacity-60" />}
    </Link>
  )
}

function SidebarContent({ onClose, siteName }: { onClose?: () => void; siteName: string }) {
  const t = useTranslations('admin.sidebar')
  const pathname = usePathname()
  const router = useRouter()

  const GROUPS = [
    {
      label: t('group_overview'),
      items: [
        { href: '/admin',           label: t('item_dashboard'), icon: LayoutDashboard },
      ],
    },
    {
      label: t('group_management'),
      items: [
        { href: '/admin/listings',  label: t('item_listings'),  icon: ListChecks },
        { href: '/admin/users',     label: t('item_users'),     icon: Users },
        { href: '/admin/support',            label: t('item_support'),            icon: MessageSquare },
        { href: '/admin/inquiries/support', label: t('item_inquiries_support'), icon: LifeBuoy },
        { href: '/admin/inquiries/sales',   label: t('item_inquiries_sales'),   icon: TrendingUp },
        { href: '/admin/reports',           label: t('item_reports'),           icon: Flag },
      ],
    },
    {
      label: t('group_content'),
      items: [
        { href: '/admin/locations',           label: t('item_locations'),           icon: MapPin },
        { href: '/admin/popular-locations',  label: t('item_popular_locations'),  icon: Star },
        { href: '/admin/companies',         label: t('item_companies'),         icon: Briefcase },
        { href: '/admin/pages',             label: t('item_pages'),             icon: FileText },
        { href: '/admin/property-types',    label: t('item_property_types'),    icon: Building2 },
        { href: '/admin/currency',          label: t('item_currency'),          icon: CircleDollarSign },
        { href: '/admin/email-templates',   label: t('item_email_templates'),   icon: Mail },
        { href: '/admin/footer',            label: t('item_footer'),            icon: PanelBottom },
      ],
    },
    {
      label: t('group_system'),
      items: [
        { href: '/admin/settings',     label: t('item_settings'),     icon: Settings },
        { href: '/admin/permissions',  label: t('item_permissions'),  icon: ShieldCheck },
      ],
    },
  ]

  function isActive(href: string) {
    return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
  }

  async function handleLogout() {
    try {
      await signOut()
    } catch {
      // Local session is cleared by the Supabase client even on API failure.
    }
    router.push('/')
  }

  return (
    <div className="admin-sidebar-content flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b shrink-0">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-base" onClick={onClose}>
          <span className="text-primary">{siteName.split('.')[0]}</span>
          <span className="text-foreground">.{siteName.split('.').slice(1).join('.')}</span>
          <span className="bg-primary/10 text-primary text-2xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md">
            Admin
          </span>
        </Link>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={t('aria_close')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
        {GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-2xs font-semibold text-muted-foreground/60 uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map(item => (
                <NavItem
                  key={item.href}
                  {...item}
                  active={isActive(item.href)}
                  onClick={onClose}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t shrink-0 flex flex-col gap-3">
        <AdminLocaleSwitcher />
        <div className="flex flex-col gap-0.5">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {t('open_site')}
          </Link>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors w-full justify-start h-auto"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t('logout')}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface AdminSidebarProps {
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
  siteName?: string
}

export function AdminSidebar({ mobileOpen = false, onMobileOpenChange, siteName = 'Lero.al' }: AdminSidebarProps) {
  return (
    <div data-testid="admin-sidebar">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 border-r h-screen sticky top-0">
        <SidebarContent siteName={siteName} />
      </aside>

      {/* Mobile drawer — state is lifted to AdminShell */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" showCloseButton={false} className="w-64 p-0">
          <SidebarContent siteName={siteName} onClose={() => onMobileOpenChange?.(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
