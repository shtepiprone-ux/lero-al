'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Globe, ChevronDown, Loader2 } from 'lucide-react'
import { setAdminLocale } from '@/modules/admin/actions/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

  const current = LOCALES.find(l => l.code === currentLocale)

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
      <div className="px-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isPending}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'gap-1.5 px-2 w-full justify-start',
            )}
            aria-label={t('language')}
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span className="text-sm">{current?.flag}</span>
            <span className="text-sm flex-1 text-left truncate">{current?.label}</span>
            {isPending
              ? <Loader2 className="h-3 w-3 animate-spin opacity-60 shrink-0" />
              : <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
            }
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-44">
            {LOCALES.map(loc => (
              <DropdownMenuItem
                key={loc.code}
                onClick={() => handleSwitch(loc.code)}
                className={currentLocale === loc.code ? 'font-semibold' : ''}
              >
                <span className="mr-2">{loc.flag}</span>
                {loc.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
