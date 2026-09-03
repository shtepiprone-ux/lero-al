'use client'

import { useTranslations } from 'next-intl'
import { Button, Avatar, Text, useMantineTheme } from '@mantine/core'
import { ChevronDown, User, ListPlus, LogOut, LayoutList, LayoutDashboard } from 'lucide-react'
import { MantineDropdownMenu, type DropdownMenuItemDef } from '@/design-system/mantine/patterns'

export interface UserMenuProps {
  user: { name: string | null; avatar_url: string | null; role: string }
  locale: string
  onNavigate: (path: string) => void
  onOpenAdmin: () => void
  onLogout: () => void
}

export function UserMenu({ user, locale, onNavigate, onOpenAdmin, onLogout }: UserMenuProps) {
  const t = useTranslations('nav')
  const theme = useMantineTheme()

  const items: DropdownMenuItemDef[] = [
    { label: t('profile'), icon: <User size={theme.other.iconSize.standard} />, onClick: () => onNavigate(`/${locale}/cabinet`) },
    { label: t('my_listings'), icon: <LayoutList size={theme.other.iconSize.standard} />, onClick: () => onNavigate(`/${locale}/cabinet?tab=listings`) },
    { label: t('add_listing'), icon: <ListPlus size={theme.other.iconSize.standard} />, onClick: () => onNavigate(`/${locale}/listings/create`), separator: true },
    ...(user.role === 'admin' || user.role === 'moderator'
      ? [{
          label: <span style={{ fontWeight: 500 }}>{t('admin_dashboard')}</span>,
          icon: <LayoutDashboard size={theme.other.iconSize.standard} />,
          color: 'brand',
          onClick: onOpenAdmin,
          separator: true,
        }]
      : []),
    { label: t('logout'), icon: <LogOut size={theme.other.iconSize.standard} />, color: 'red', onClick: onLogout, separator: true },
  ]

  return (
    <MantineDropdownMenu
      trigger={
        <Button
          variant="default"
          leftSection={<Avatar src={user.avatar_url ?? undefined} name={user.name ?? undefined} color="brand" size={theme.other.iconSize.feature} />}
          rightSection={<ChevronDown size={theme.other.iconSize.badge} />}
        >
          <Text component="span" truncate inherit maw={theme.other.boxSize.truncateLabel}>{user.name}</Text>
        </Button>
      }
      items={items}
    />
  )
}
