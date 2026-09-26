'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard, ListChecks, Users, MessageSquare,
  MapPin, FileText, Settings, LogOut, ExternalLink, Building2, CircleDollarSign, Briefcase, Flag, Mail, Star, ShieldCheck, LifeBuoy, TrendingUp, PanelBottom,
} from 'lucide-react'
import { Stack, Text, NavLink, Badge, Group, Anchor, ScrollArea, useMantineTheme } from '@mantine/core'
import { signOut } from '@/lib/auth/browser'
import { AdminLocaleSwitcher } from '@/components/admin/AdminLocaleSwitcher'

interface AdminSidebarProps {
  /** Called after a nav item is activated (Task 852 — closes the AppShell drawer below `lg`). */
  onNavigate?: () => void
  siteName?: string
}

export function AdminSidebar({ onNavigate, siteName = 'Lero.al' }: AdminSidebarProps) {
  const t = useTranslations('admin.sidebar')
  const pathname = usePathname()
  const router = useRouter()
  const theme = useMantineTheme()

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
    onNavigate?.()
    router.push('/')
  }

  const [brand, tld] = siteName.split('.').length > 1
    ? [siteName.split('.')[0], '.' + siteName.split('.').slice(1).join('.')]
    : [siteName, '']

  return (
    <Stack data-testid="admin-sidebar" h="100%" gap={0}>
      <ScrollArea flex={1} mih={0} type="auto">
        <Stack gap="lg">
          <Group gap="xs" px="xs" wrap="nowrap">
            <Anchor component={Link} href="/admin" underline="never" fw={700} size="md" c="brand" onClick={onNavigate}>
              {brand}
            </Anchor>
            <Text fw={700} size="md">{tld}</Text>
            <Badge size="xs" variant="light" color="brand" radius="sm">Admin</Badge>
          </Group>

          <Stack gap="md">
            {GROUPS.map(group => (
              <Stack key={group.label} gap="tight">
                <Text size="xs" fw={600} c="gray.5" tt="uppercase" px="xs">
                  {group.label}
                </Text>
                {group.items.map(item => (
                  <NavLink
                    key={item.href}
                    component={Link}
                    href={item.href}
                    active={isActive(item.href)}
                    color="brand"
                    label={<Text size="sm" fw={500} truncate="end">{item.label}</Text>}
                    leftSection={<item.icon size={theme.other.iconSize.standard} />}
                    onClick={onNavigate}
                    styles={{ root: { minHeight: theme.other.touchTarget } }}
                  />
                ))}
              </Stack>
            ))}
          </Stack>
        </Stack>
      </ScrollArea>

      <Stack gap="sm" py="sm">
        <AdminLocaleSwitcher />
        <NavLink
          component="a"
          href="/"
          target="_blank"
          label={t('open_site')}
          leftSection={<ExternalLink size={theme.other.iconSize.standard} />}
          styles={{ root: { minHeight: theme.other.touchTarget } }}
        />
        <NavLink
          component="button"
          type="button"
          onClick={handleLogout}
          label={t('logout')}
          leftSection={<LogOut size={theme.other.iconSize.standard} />}
          color="red"
          styles={{ root: { minHeight: theme.other.touchTarget } }}
        />
      </Stack>
    </Stack>
  )
}
