'use client'

import { useLocale } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { enUS, it, uk, sq } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { Text } from '@mantine/core'
import { MantineTooltip } from '@/design-system/mantine/patterns/MantineTooltip'

const LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  sq: sq,
  uk: uk,
  it: it,
}

interface Props {
  date: string | Date
  /** Pass-through for the 12 pre-existing legacy consumers only (owner-accepted precedent,
   * Sprint 76 closure 2026-09-18: "PropertyTypeCombobox className:1 is a no-Tailwind
   * pass-through"). A new Mantine caller must not use it. */
  className?: string
  /** Caller-formatted absolute date-time (server-formatted, Europe/Tirane, by 846's `period.ts`
   * helper — this component never formats an absolute date itself, so no server/client timezone
   * mismatch can enter its markup, spec §17.4). Always folded into the `<time>` element's
   * `aria-label` when set — that alone satisfies §17.4's "accessible label" half, and reaches
   * assistive tech even with no tab stop of its own, because a link/button ancestor's computed
   * accessible name concatenates a non-focusable descendant's `aria-label` too. Omitted by every
   * existing legacy consumer, which keeps the exact prior render. */
  absoluteLabel?: string
  /** Gates only the `<time>` element's own `tabIndex={0}` — default `true`, so the standalone
   * AC5 path (spec §17.4's "tooltip" half) is unchanged. Review finding G2 (2026-09-18): pass
   * `false` whenever this component is nested inside an already-interactive ancestor (e.g.
   * `MantineDashboardWorkList`'s row `<a>`) — a second, separately focusable tab stop inside one
   * row link is exactly the "no nested competing clickable" spec §17.1 rule this project already
   * enforces for Cards/Rows. Review finding K2 (2026-09-18): this must NOT also remove the visual
   * hover `Tooltip` — a mouse user in a `focusable={false}` row still needs to see the absolute
   * time on hover; only the keyboard tab stop is suppressed. `absoluteLabel`'s `aria-label` and
   * the hover Tooltip stay in either case. */
  focusable?: boolean
}

export function RelativeTime({ date, absoluteLabel, focusable = true, ...rest }: Props) {
  const locale = useLocale()
  const dfLocale = LOCALE_MAP[locale] ?? enUS
  const relative = formatDistanceToNow(new Date(date), { addSuffix: true, locale: dfLocale })
  const hasAbsoluteLabel = Boolean(absoluteLabel)
  const showTabIndex = hasAbsoluteLabel && focusable

  const timeElement = (
    <Text
      component="time"
      inherit
      dateTime={new Date(date).toISOString()}
      // Focusable only when `focusable` allows it — a plain <time> is not focusable by default,
      // and the Tooltip's keyboard-focus path (spec §17.4) needs a real focusable target to open
      // on. When `focusable` is false, no tab stop is added, but the Tooltip below still opens on
      // hover (K2); the `aria-label` below still carries the absolute time to assistive tech
      // regardless.
      tabIndex={showTabIndex ? 0 : undefined}
      aria-label={absoluteLabel ? `${relative} (${absoluteLabel})` : undefined}
      {...rest}
    >
      {relative}
    </Text>
  )

  if (!hasAbsoluteLabel) {
    return timeElement
  }

  return <MantineTooltip label={absoluteLabel}>{timeElement}</MantineTooltip>
}
