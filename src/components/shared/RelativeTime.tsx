'use client'

import { useLocale } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { enUS, it, uk, sq } from 'date-fns/locale'
import type { Locale } from 'date-fns'

const LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  sq: sq,
  uk: uk,
  it: it,
}

interface Props {
  date: string | Date
  className?: string
}

export function RelativeTime({ date, className }: Props) {
  const locale = useLocale()
  const dfLocale = LOCALE_MAP[locale] ?? enUS

  return (
    <span className={className}>
      {formatDistanceToNow(new Date(date), { addSuffix: true, locale: dfLocale })}
    </span>
  )
}
