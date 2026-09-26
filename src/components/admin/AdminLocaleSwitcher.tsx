'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Stack, Text } from '@mantine/core'
import { setAdminLocale } from '@/modules/admin/actions/locale'
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'

interface AdminLocaleSwitcherProps {
  /**
   * Forces the pending visual without invoking the real transition (Task 852, R7 —
   * `handleSwitch`'s own `useTransition` cannot be reached from a Storybook story: it runs a
   * real `'use server'` action). Never passed in production; only the canonical Story sets it.
   */
  pendingOverride?: boolean
}

export function AdminLocaleSwitcher({ pendingOverride }: AdminLocaleSwitcherProps = {}) {
  const currentLocale = useLocale()
  const router = useRouter()
  const t = useTranslations('admin.sidebar')
  const [isPending, startTransition] = useTransition()

  function handleSwitch(locale: string) {
    if (locale === currentLocale || isPending) return
    startTransition(async () => {
      await setAdminLocale(locale)
      router.refresh()
    })
  }

  return (
    <Stack data-testid="admin-locale-switcher" gap="xs">
      <Text size="xs" fw={600} c="gray.5" tt="uppercase">
        {t('language')}
      </Text>
      <LocaleSwitcher
        onSwitch={handleSwitch}
        isPending={pendingOverride ?? isPending}
        showLabel
        fullWidth
      />
    </Stack>
  )
}
