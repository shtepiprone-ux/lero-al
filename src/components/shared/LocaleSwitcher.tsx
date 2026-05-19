'use client'

import { Globe, ChevronDown, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const LOCALES = [
  { code: 'sq', flag: '🇦🇱' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'uk', flag: '🇺🇦' },
  { code: 'it', flag: '🇮🇹' },
] as const

export type LocaleCode = typeof LOCALES[number]['code']

interface LocaleSwitcherProps {
  onSwitch: (locale: string) => void
  isPending?: boolean
  showLabel?: boolean
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function LocaleSwitcher({
  onSwitch,
  isPending = false,
  showLabel = false,
  align = 'end',
  side = 'bottom',
  className,
}: LocaleSwitcherProps) {
  const currentLocale = useLocale()
  const t = useTranslations('nav')
  const current = LOCALES.find(l => l.code === currentLocale)

  const langLabels: Record<LocaleCode, string> = {
    sq: t('lang_sq'),
    en: t('lang_en'),
    uk: t('lang_uk'),
    it: t('lang_it'),
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'gap-1 px-2',
          className,
        )}
      >
        <Globe className="h-4 w-4 shrink-0" />
        <span className="text-sm">{current?.flag}</span>
        {showLabel && (
          <span className="text-sm flex-1 text-left truncate">{langLabels[currentLocale as LocaleCode]}</span>
        )}
        {isPending
          ? <Loader2 className="h-3 w-3 animate-spin opacity-60 shrink-0" />
          : <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
        }
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className="w-44">
        {LOCALES.map(loc => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => onSwitch(loc.code)}
            className={currentLocale === loc.code ? 'font-semibold' : ''}
          >
            <span className="mr-2">{loc.flag}</span>
            {langLabels[loc.code]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
