'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Stack, Text } from '@mantine/core'
import { setAccountLocale } from '@/modules/admin/actions/locale'
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
    // Task 988: the account language first (the proxy sends every page in another language back to it), then the same admin page and query under the new slug
    const { pathname, search } = window.location
    startTransition(async () => {
      try { await setAccountLocale(locale) } catch { /* the navigation still runs: the page opens in the language the proxy decides */ }
      router.push(`/${locale}${pathname.replace(/^\/(sq|en|uk|it)(?=\/|$)/, '')}${search}`)
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
