'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { enUS, it, uk, sq } from 'date-fns/locale'
import type { Locale as DfLocale } from 'date-fns'
import { Anchor, Box, Group, Text } from '@mantine/core'
import { cn } from '@/lib/utils'
import { formatCount } from '@/lib/formatters'
import styles from './NotificationItem.module.css'

const DF_LOCALE_MAP: Record<string, DfLocale> = { sq, en: enUS, uk, it }
import { markNotificationRead } from '@/modules/notifications/lib/mutations'
import { getListingStatusLabel } from '@/lib/i18n/listingStatusLabel'
import type { Notification, NotificationType } from '@/types/database'

const TYPE_ICON: Record<NotificationType, string> = {
  new_message:            '💬',
  listing_status_change:  '🏠',
  saved_search_match:     '🔔',
  support_reply:          '🎧',
  listing_expires_soon:   '⏰',
  agent_verified:         '✅',
  marketing:              '📢',
  report_outcome:         '🛡️',
  price_change:           '💰',
}

interface Props {
  notification: Notification
  onRead: () => void
}

/**
 * Safely resolve a `notifications.*` template key. Returns `null` (never a raw
 * key string) if the key is missing in the current locale or resolution throws —
 * callers fall back to the stored sq-fallback `title`/`body` column (Task 319).
 */
function safeT(
  t: ReturnType<typeof useTranslations<'notifications'>>,
  key: string,
  params?: Record<string, string | number>,
): string | null {
  try {
    if (!t.has(key as Parameters<typeof t.has>[0])) return null
    return t(key as Parameters<typeof t>[0], params as never)
  } catch {
    return null
  }
}

/** Title params for `template_id`-driven titles — only some templates take params. */
function resolveTitleParams(templateId: string, params: Record<string, unknown>): Record<string, string> | undefined {
  switch (templateId) {
    case 'saved_search_match':
      return { searchName: typeof params.searchName === 'string' ? params.searchName : '' }
    case 'price_change': {
      const listingName = typeof params.listingName === 'string' && params.listingName
        ? params.listingName
        : typeof params.listingId === 'string' ? params.listingId : ''
      return { listingName }
    }
    default:
      return undefined
  }
}

/**
 * Resolve the `price_change` body: formats `oldPrice`/`newPrice` with the deterministic,
 * hydration-safe `formatCount(viewerLocale)` (Owner decision 3, Task 319; routed through
 * Task 563's ICU-independent formatter, not a raw `Intl.NumberFormat` call). Returns
 * `null` (→ sq-fallback body) if the numeric params are missing/malformed.
 */
function resolvePriceChangeBody(
  t: ReturnType<typeof useTranslations<'notifications'>>,
  params: Record<string, unknown>,
  locale: string,
): string | null {
  const { oldPrice, newPrice, currency } = params
  if (
    typeof oldPrice !== 'number' || !Number.isFinite(oldPrice) ||
    typeof newPrice !== 'number' || !Number.isFinite(newPrice) ||
    typeof currency !== 'string' || !currency
  ) {
    return null
  }
  return safeT(t, 'price_change_body', {
    oldPrice: `${formatCount(oldPrice, locale)} ${currency}`,
    newPrice: `${formatCount(newPrice, locale)} ${currency}`,
  })
}

/**
 * Resolve the display body for a notification, localizing structured payloads.
 *
 * `listing_status_change` stores two formats:
 *   NEW    — JSON `{"from":"pending","to":"active"}` (written by Task 288+)
 *   LEGACY — plain string `"pending → active"` (written before Task 288)
 * Both are resolved to localized labels at render time using the canonical
 * getListingStatusLabel() helper from src/lib/i18n/listingStatusLabel.ts.
 */
function resolveStatusBody(body: string, tl: ReturnType<typeof useTranslations<'listing'>>): string {
  const label = (code: string) => getListingStatusLabel(code, s => tl(s as Parameters<typeof tl>[0]))

  // Try NEW JSON format: {"from":"X","to":"Y"}
  try {
    const parsed = JSON.parse(body) as { from?: string; to?: string }
    if (parsed && typeof parsed.from === 'string' && typeof parsed.to === 'string') {
      return `${label(parsed.from)} → ${label(parsed.to)}`
    }
  } catch {
    // not JSON — fall through to legacy parser
  }

  // Legacy format: "pending → active" (rows written before Task 288)
  const legacyMatch = body.match(/^(\w+)\s*→\s*(\w+)$/)
  if (legacyMatch) {
    return `${label(legacyMatch[1])} → ${label(legacyMatch[2])}`
  }

  // Unknown format — show as-is (safe fallback)
  return body
}

export function NotificationItem({ notification, onRead }: Props) {
  const t = useTranslations('notifications')
  const tl = useTranslations('listing')
  const locale = useLocale()
  const dfLocale = DF_LOCALE_MAP[locale] ?? enUS
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (notification.is_read) return
    startTransition(async () => {
      await markNotificationRead(notification.id)
      onRead()
    })
  }

  // ── Title/body resolution (Task 319: render-time locale binding) ────────────
  // `template_id` present → resolve `t(<template_id>_title/_body, params)` in the
  // viewer's current locale. `template_id` NULL (legacy row) → verbatim title/body
  // + the two pre-existing special-cases. Missing-key/param resolution falls back
  // to the stored sq-fallback `title`/`body` columns — never a wrong locale.
  const templateId = notification.template_id
  const templateParams = (notification.template_params ?? {}) as Record<string, unknown>

  let displayTitle: string
  let displayBody: string

  if (templateId) {
    displayTitle = safeT(t, `${templateId}_title`, resolveTitleParams(templateId, templateParams)) ?? notification.title

    if (notification.type === 'saved_search_match') {
      const count = typeof templateParams.count === 'number' ? templateParams.count : parseInt(notification.body) || 1
      displayBody = t('saved_search_match_body', { count })
    } else if (templateId === 'price_change') {
      displayBody = resolvePriceChangeBody(t, templateParams, locale) ?? notification.body
    } else {
      displayBody = safeT(t, `${templateId}_body`) ?? notification.body
    }
  } else {
    displayTitle = notification.title
    displayBody = notification.type === 'saved_search_match'
      ? t('saved_search_match_body', { count: parseInt(notification.body) || 1 })
      : notification.type === 'listing_status_change'
        ? resolveStatusBody(notification.body, tl)
        : notification.body
  }

  const content = (
    <Group
      wrap="nowrap"
      align="flex-start"
      gap="sm"
      px="md"
      py="sm"
      className={cn(
        styles.root,
        !notification.is_read && styles.unread,
        !notification.is_read && !isPending && styles.interactive,
        isPending && styles.pending,
      )}
      onClick={handleClick}
      role={!notification.is_read ? 'button' : undefined}
      tabIndex={!notification.is_read ? 0 : undefined}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
    >
      {/* text-base has no explicit leading-* class -> falls back to the `p{}`/`span{}` browser
          default (24px, text-base's own paired line-height; no globals.css base rule targets
          `span`), reproduced explicitly since Mantine Text's own default would otherwise differ. */}
      <Text
        component="span"
        fz="1rem"
        lh="1.5rem"
        style={{ flexShrink: 0, marginTop: '0.125rem' }} // design-tokens-allow: : '0.125rem' — reproduces the original mt-0.5 (2px) icon offset, px-equal literal per Task 752/753 precedent
        aria-hidden
      >
        {TYPE_ICON[notification.type] ?? '🔔'}
      </Text>
      <Box style={{ flex: '1 1 0%', minWidth: 0 }}>
        {/* lh=1.375 (leading-snug) — this <p> keeps its explicit leading-snug class pre-migration,
            so text-sm's own paired 20px line-height never applied; reproduced exactly. */}
        <Text
          size="sm"
          fw={!notification.is_read ? 500 : undefined}
          lh={1.375}
          style={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}
        >
          {displayTitle}
        </Text>
        {/* lh=1.625 (leading-relaxed) — no explicit leading-* class pre-migration, so globals.css's
            `p { @apply leading-relaxed }` base rule won over text-xs's own paired 16px line-height
            (see Task 753 finding); reproduced exactly, not approximated. */}
        <Text
          size="xs"
          c="var(--muted-foreground)"
          lh={1.625}
          lineClamp={2}
          mt={2}
          style={{ whiteSpace: 'normal', overflowWrap: 'break-word' }}
        >
          {displayBody}
        </Text>
        {/* text-2xs = 10px (globals.css --text-2xs, no Mantine token — D28 raw-literal exemption).
            text-muted-foreground/60 is an opacity-modified token (D35): reproduced as the exact
            color-mix() Tailwind itself compiles to (verified in the built CSS), not aliased to a
            bare var() and not approximated to a flat color. */}
        <Text
          fz="0.625rem"
          c="color-mix(in oklab, var(--muted-foreground) 60%, transparent)"
          lh={1.625}
          mt="0.25rem"
        >
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: dfLocale })}
        </Text>
      </Box>
      {!notification.is_read && (
        <Box
          h={8}
          w={8}
          bdrs="pill"
          bg="var(--primary)"
          mt={6}
          style={{ flexShrink: 0 }}
          aria-label={t('unread_count', { count: 1 })}
        />
      )}
    </Group>
  )

  if (notification.link) {
    return (
      // c="inherit" — the original <a> relied on Tailwind Preflight's `a { color: inherit }`;
      // Mantine's Anchor defaults to its own link color otherwise, which leaked into the
      // (unstyled) title text through normal CSS inheritance. Measured and fixed (Task 754).
      <Anchor href={notification.link} display="block" underline="never" c="inherit" onClick={handleClick}>
        {content}
      </Anchor>
    )
  }

  return content
}
