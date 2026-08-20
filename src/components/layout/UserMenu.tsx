'use client'

import { useTranslations } from 'next-intl'
import { Button, Avatar, Text } from '@mantine/core'
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

  const items: DropdownMenuItemDef[] = [
    { label: t('profile'), icon: <User size={16} />, onClick: () => onNavigate(`/${locale}/cabinet`) },
    { label: t('my_listings'), icon: <LayoutList size={16} />, onClick: () => onNavigate(`/${locale}/cabinet?tab=listings`) },
    { label: t('add_listing'), icon: <ListPlus size={16} />, onClick: () => onNavigate(`/${locale}/listings/create`), separator: true },
    ...(user.role === 'admin' || user.role === 'moderator'
      ? [{
          label: <span style={{ fontWeight: 500 }}>{t('admin_dashboard')}</span>,
          icon: <LayoutDashboard size={16} />,
          color: 'brand',
          onClick: onOpenAdmin,
          separator: true,
        }]
      : []),
    { label: t('logout'), icon: <LogOut size={16} />, color: 'red', onClick: onLogout, separator: true },
  ]

  return (
    <MantineDropdownMenu
      trigger={
        <Button
          variant="default"
          leftSection={<Avatar src={user.avatar_url ?? undefined} name={user.name ?? undefined} color="brand" size={28} />}
          rightSection={<ChevronDown size={12} />}
        >
          <Text component="span" truncate inherit maw={120}>{user.name}</Text>
        </Button>
      }
      items={items}
    />
  )
}
