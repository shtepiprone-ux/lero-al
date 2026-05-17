'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { setAdminLocale } from '@/modules/admin/actions/locale'

const LOCALES = [
  { code: 'sq', label: 'Shqip',      flag: '🇦🇱' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
] as const

export function AdminLocaleSwitcher() {
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
      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-3">
        {t('language')}
      </p>
      <div className="flex flex-wrap gap-1 px-1">
        {LOCALES.map(loc => (
          <button
            key={loc.code}
            onClick={() => handleSwitch(loc.code)}
            disabled={isPending}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-60 ${
              currentLocale === loc.code
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
            title={loc.label}
          >
            <span>{loc.flag}</span>
            <span className="uppercase">{loc.code}</span>
            {isPending && currentLocale !== loc.code && false}
          </button>
        ))}
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground self-center ml-1" />}
      </div>
    </div>
  )
}
