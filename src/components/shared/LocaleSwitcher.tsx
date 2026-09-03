'use client'

import { ChevronDown, Loader2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Button, useMantineTheme } from '@mantine/core'
import { MantineDropdownMenu, type DropdownMenuItemDef } from '@/design-system/mantine/patterns'
import styles from './LocaleSwitcher.module.css'

export const LOCALES = [
  { code: 'sq', abbr: 'SQ' },
  { code: 'en', abbr: 'EN' },
  { code: 'uk', abbr: 'UA' },
  { code: 'it', abbr: 'IT' },
] as const

export type LocaleCode = typeof LOCALES[number]['code']

interface LocaleSwitcherProps {
  onSwitch: (locale: string) => void
  isPending?: boolean
  showLabel?: boolean
  className?: string
}

export function LocaleSwitcher({
  onSwitch,
  isPending = false,
  showLabel = false,
  className,
}: LocaleSwitcherProps) {
  const currentLocale = useLocale()
  const t = useTranslations('nav')
  const theme = useMantineTheme()
  const current = LOCALES.find(l => l.code === currentLocale)

  const langLabels: Record<LocaleCode, string> = {
    sq: t('lang_sq'),
    en: t('lang_en'),
    uk: t('lang_uk'),
    it: t('lang_it'),
  }

  const items: DropdownMenuItemDef[] = LOCALES.map(loc => ({
    label: currentLocale === loc.code
      ? <span style={{ fontWeight: 600 }}>{loc.abbr} {langLabels[loc.code]}</span>
      : <>{loc.abbr} {langLabels[loc.code]}</>,
    onClick: () => onSwitch(loc.code),
  }))

  return (
    <MantineDropdownMenu
      trigger={
        <Button
          variant="default"
          className={className}
          disabled={isPending}
          rightSection={isPending ? <Loader2 size={theme.other.iconSize.badge} className={styles.pendingIcon} /> : <ChevronDown size={theme.other.iconSize.badge} />}
        >
          {current?.abbr}
          {showLabel && ` ${langLabels[currentLocale as LocaleCode]}`}
        </Button>
      }
      items={items}
    />
  )
}
