'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Stack, Group, UnstyledButton, Text, Skeleton, Button, Divider, useMantineTheme } from '@mantine/core'
import { ChevronRight } from 'lucide-react'
import { MantineEmptyLoadingErrorState } from './MantineEmptyLoadingErrorState'
import { MantineBadge, type MantineBadgeMeaning } from './MantineBadge'
import type { BadgeSemanticTone } from '../badgeTones'

export interface DashboardWorkListRow {
  id: string
  href: string
  primary: ReactNode
  /** Meta items (author, age, …), rendered by the caller — e.g. a `RelativeTime`. Review G2
   * (2026-09-18): every row here is already inside its own link — a caller passing a
   * `RelativeTime` with `absoluteLabel` set MUST also pass `focusable={false}` on it, or the
   * row gets a second, separately focusable tab stop inside its own `<a>` (spec §17.1's "no
   * nested competing clickable" rule). `absoluteLabel`'s `aria-label` still reaches assistive
   * tech either way. */
  meta?: ReactNode[]
  /** What the row's badge means. A caller passes either a bare semantic `tone` or, when the badge is a registered status
   * of an entity (a ticket, a report, ...), its `meaning` (R57, Task 859: `{ variant: 'status', entity, value }`), so the
   * badge carries the same colour it has everywhere else (text only, no icon: D78-29). The label is the caller's localized text. */
  status?: { label: string } & ({ tone: BadgeSemanticTone; meaning?: never } | { meaning: MantineBadgeMeaning; tone?: never })
  ctaLabel: string
}

export interface MantineDashboardWorkListProps {
  rows: DashboardWorkListRow[]
  /** Rows never truncate silently past this count (default 5, spec §17.4) — the caller's
   * `footer` link is what carries "see the rest", never an implicit "load more". */
  maxRows?: number
  footer?: { label: string; href: string }
  state: 'ready' | 'loading' | 'empty' | 'error'
  emptyIcon?: ReactNode
  emptyText?: ReactNode
  errorText?: string
  retryLabel?: string
  onRetry?: () => void
  loadingAriaLabel?: string
}

/** The row's status badge: a registered `meaning` when the caller has one, otherwise the bare semantic `tone`. */
function WorkListBadge({ status }: { status: NonNullable<DashboardWorkListRow['status']> }) {
  if (status.meaning) {
    return (
      <MantineBadge {...status.meaning}>
        {status.label}
      </MantineBadge>
    )
  }
  return (
    <MantineBadge variant="tone" tone={status.tone}>
      {status.label}
    </MantineBadge>
  )
}

/**
 * Canonical compact "work list" both dashboards use (spec v3.3 §16.2 third row, §17.2 ADM-01/
 * ADM-02/ADM-06). Each row is one `next/link` anchor (`UnstyledButton component={Link}`, spec
 * §17.1 — no nested competing clickable) with a primary line (wrapped in full, never clamped: Task 859 D6, GR-3j,
 * GR-3i), optional meta
 * items, a status `Badge` (colour is never the only carrier — always paired with `label` text)
 * and a trailing CTA affordance (label + chevron). The footer is `Button variant="transparent"`
 * — the canonical `Mantine/Primitives/Button` story's own tertiary/link chrome ("transparent, no
 * border, no hover fill"), right-aligned at every width via the wrapping `Group justify="flex-end"`.
 * Owner correction 2026-09-18: the existing `ViewAllLink` (`src/components/shared/ViewAllLink.tsx`)
 * was tried first (it is the site's other "view all" link, consumed by `FeaturedListingsView`/
 * `SimilarListings`/`SimilarListingsView`), but its own `w={{base:'100%', sm:'auto'}}` +
 * `justifyContent:'center'` — correct for those three, where it sits beside a section `Title`
 * that stacks above it into a full-width secondary CTA on mobile — forces a full-width,
 * horizontally-centered button here too, defeating `justify="flex-end"` and centering "Уся
 * черга" instead of right-aligning it. This footer has no sibling title in its own row, so a
 * plain, naturally-sized tertiary Button (the same primitive `ViewAllLink` itself is built from,
 * without its full-width override) is the correct fit, not a parallel invention.
 *
 * States: `ready`, `loading` (3 skeleton rows, no digits/names), `empty` (caller's icon + text,
 * no list chrome), `error` (message + `Button variant="default"` Retry, never inside a row link
 * — the canonical `Mantine/Primitives/Button` "Cancel" chrome, same as the 843 patterns).
 *
 * Production consumers: 853, 854 (not wired in this task).
 */
export function MantineDashboardWorkList({
  rows,
  maxRows = 5,
  footer,
  state,
  emptyIcon,
  emptyText,
  errorText,
  retryLabel,
  onRetry,
  loadingAriaLabel,
}: MantineDashboardWorkListProps) {
  const theme = useMantineTheme()

  if (state === 'loading') {
    return (
      <Stack gap="sm" aria-busy="true" aria-label={loadingAriaLabel}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={theme.other.touchTarget} />
        ))}
      </Stack>
    )
  }

  if (state === 'error') {
    // Review G1 (2026-09-18): matches 843's F3 exactly — compose the canonical
    // `MantineEmptyLoadingErrorState` error state instead of a component-local clone of
    // `Text`+`Button`. This branch had NOT actually been fixed despite the session log's claim
    // that it had; fixed here for real.
    return (
      <MantineEmptyLoadingErrorState
        state="error"
        description={errorText}
        action={
          retryLabel ? (
            <Button variant="default" onClick={onRetry}>
              {retryLabel}
            </Button>
          ) : undefined
        }
      />
    )
  }

  if (state === 'empty' || rows.length === 0) {
    return (
      <Group gap="xs" py="sm">
        {emptyIcon}
        <Text size="sm" c="gray.5">
          {emptyText}
        </Text>
      </Group>
    )
  }

  const visibleRows = rows.slice(0, maxRows)

  return (
    <Stack gap={0}>
      {visibleRows.map((row, i) => (
        <Stack key={row.id} gap={0}>
          <UnstyledButton
            component={Link}
            href={row.href}
            mih={theme.other.touchTarget}
            py="sm"
            display="block"
          >
            {/* <640 (owner correction 2026-09-18): the horizontal split below squeezed the
                title into roughly half the row width at 320px. Stacked instead, one item per
                line in the owner's specified order — badge, title, each meta item, then the CTA
                — never a horizontal split at this width. `align="flex-start"` keeps the Badge
                and the CTA row at their own natural width; `w="100%"` on the title/meta `Text`s
                is what still lets them wrap their own full row width under that alignment. */}
            <Stack gap={theme.spacing.xs} align="flex-start" hiddenFrom="sm">
              {row.status && <WorkListBadge status={row.status} />}
              <Text size="sm" fw={600} c="gray.8" w="100%">
                {row.primary}
              </Text>
              {row.meta?.map((item, mi) => (
                <Text key={mi} size="xs" c="gray.5" w="100%">
                  {item}
                </Text>
              ))}
              <Group gap={theme.spacing.micro} wrap="nowrap" align="center">
                <Text size="xs" fw={500} c="brand">
                  {row.ctaLabel}
                </Text>
                <ChevronRight size={theme.other.iconSize.compact} aria-hidden="true" />
              </Group>
            </Stack>

            {/* >=640: unchanged horizontal split (title+meta left, badge+CTA right). */}
            <Group justify="space-between" wrap="nowrap" gap="sm" align="flex-start" visibleFrom="sm">
              <Stack gap={theme.spacing.xs} flex={1} miw={0}>
                <Text size="sm" fw={600} c="gray.8">
                  {row.primary}
                </Text>
                {row.meta && row.meta.length > 0 && (
                  <Group gap="xs" wrap="wrap">
                    {row.meta.map((item, mi) => (
                      <Text key={mi} size="xs" c="gray.5">
                        {item}
                      </Text>
                    ))}
                  </Group>
                )}
              </Stack>
              <Group gap="xs" wrap="nowrap" align="center">
                {row.status && <WorkListBadge status={row.status} />}
                <Group gap={theme.spacing.micro} wrap="nowrap" align="center">
                  <Text size="xs" fw={500} c="brand">
                    {row.ctaLabel}
                  </Text>
                  <ChevronRight size={theme.other.iconSize.compact} aria-hidden="true" />
                </Group>
              </Group>
            </Group>
          </UnstyledButton>
          {i < visibleRows.length - 1 && <Divider />}
        </Stack>
      ))}
      {footer && (
        <>
          <Divider />
          <Group justify="flex-end" pt="sm">
            <Button component={Link} href={footer.href} variant="transparent" size="sm">
              {footer.label}
            </Button>
          </Group>
        </>
      )}
    </Stack>
  )
}
