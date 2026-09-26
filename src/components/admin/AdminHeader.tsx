'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Burger, Group, Text, Badge } from '@mantine/core'

interface Props {
  opened: boolean
  onOpen: () => void
  siteName?: string
}

export function AdminHeader({ opened, onOpen, siteName = 'Lero.al' }: Props) {
  const t = useTranslations('admin.sidebar')
  const tm = useTranslations('admin.mobile_header')
  const pathname = usePathname()

  const PAGE_TITLES: Record<string, string> = {
    '/admin':             t('item_dashboard'),
    '/admin/listings':    t('item_listings'),
    '/admin/users':       t('item_users'),
    '/admin/support':     t('item_support'),
    '/admin/locations':   t('item_locations'),
    '/admin/companies':   t('item_companies'),
    '/admin/reports':     t('item_reports'),
    '/admin/legal':       t('item_legal'),
    '/admin/settings':    t('item_settings'),
    '/admin/pages-admin':       t('item_pages'),
    '/admin/property-types':    t('item_property_types'),
    '/admin/currency':          t('item_currency'),
    '/admin/email-templates':    t('item_email_templates'),
    '/admin/popular-locations':  t('item_popular_locations'),
  }

  const title = PAGE_TITLES[pathname] ?? 'Admin'
  const [brand, tld] = siteName.includes('.')
    ? [siteName.split('.')[0], '.' + siteName.split('.').slice(1).join('.')]
    : [siteName, '']

  return (
    <Group data-testid="admin-header" h="100%" px="md" justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <Burger
          opened={opened}
          onClick={onOpen}
          hiddenFrom="lg"
          size="sm"
          aria-label={tm('aria_open')}
        />
        <Group gap="tight" hiddenFrom="lg" wrap="nowrap">
          <Text fw={700} size="sm" c="brand">{brand}</Text>
          <Text fw={700} size="sm">{tld}</Text>
          <Badge size="xs" variant="light" color="brand" radius="sm">Admin</Badge>
        </Group>
      </Group>
      <Text size="sm" fw={500} c="gray.5" truncate="end" title={title} ta="right">
        {title}
      </Text>
    </Group>
  )
}
