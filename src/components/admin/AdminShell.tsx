'use client'

import { useMantineTheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useTranslations } from 'next-intl'
import { usePresence } from '@/hooks/usePresence'
import { useAdminPageFreshness } from '@/hooks/useAdminPageFreshness'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { MantineAppShellFoundation } from '@/design-system/mantine/patterns/MantineAppShellFoundation'

export function AdminShell({ children, siteName }: { children: React.ReactNode; siteName?: string; locale?: string }) {
  usePresence()
  useAdminPageFreshness()
  const theme = useMantineTheme()
  const t = useTranslations('admin.sidebar')
  const [opened, { toggle, close }] = useDisclosure()

  return (
    <MantineAppShellFoundation
      siteName={siteName ?? 'Lero.al'}
      headerHeight={theme.other.layout.adminTopBarHeight}
      navbarBreakpoint="lg"
      opened={opened}
      onToggle={toggle}
      headerContent={<AdminHeader opened={opened} onOpen={toggle} siteName={siteName} />}
      navbarContent={<AdminSidebar onNavigate={close} siteName={siteName} />}
      mainBg="gray.0"
      padding={0}
      drawerCloseLabel={t('aria_close')}
    >
      {children}
    </MantineAppShellFoundation>
  )
}
