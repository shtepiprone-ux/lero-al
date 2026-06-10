'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { setAdminLocale } from '@/modules/admin/actions/locale'
import { LocaleSwitcher } from '@/components/shared/LocaleSwitcher'

interface AdminLocaleSwitcherProps {
  /** Render the menu open on mount (Storybook/QA evidence only — not for app usage). */
  defaultOpen?: boolean
}

export function AdminLocaleSwitcher({ defaultOpen }: AdminLocaleSwitcherProps = {}) {
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
    <div className="flex flex-col gap-2">
      <p className="text-2xs font-semibold text-muted-foreground/60 uppercase tracking-widest px-3">
        {t('language')}
      </p>
      <div className="px-1">
        <LocaleSwitcher
          onSwitch={handleSwitch}
          isPending={isPending}
          showLabel
          align="start"
          side="top"
          className="w-full justify-start gap-1.5"
          defaultOpen={defaultOpen}
        />
      </div>
    </div>
  )
}
