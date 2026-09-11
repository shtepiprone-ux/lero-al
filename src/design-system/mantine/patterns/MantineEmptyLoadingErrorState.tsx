'use client'

import type { ReactNode } from 'react'
import { Stack, Text, Loader, Alert, Center, ThemeIcon, useMantineTheme } from '@mantine/core'

export type StateType = 'empty' | 'loading' | 'error'

export interface MantineEmptyLoadingErrorStateProps {
  state: StateType
  title?: string
  description?: string
  /** Icon for the `empty`/`error` states. `empty` defaults to the pattern's own generic list
   * glyph when omitted; `error` renders no icon when omitted. */
  icon?: ReactNode
  /** Task 809 Revision 3 (owner rejection 2026-09-10) — a fully-formed action element, e.g.
   * `<Button component={Link} href="/x" color="brand" w={{base:'100%',sm:'auto'}}>Label</Button>`.
   * The pattern only PLACES this element (inside its own layout, with the correct alignment for
   * the current state) — it never assigns a variant, color, or width. The caller decides whether
   * an action is primary, secondary, or destructive, and whether it is full-width on mobile; the
   * pattern has no way to know that and must not guess it. Omit for no action.
   *
   * Replaces the retired `actionLabel`/`onAction`/`actionHref` props, which hardcoded
   * `color="brand"` for every `empty` action and `variant="light" color="red"` for every `error`
   * action regardless of what the action actually meant — so two semantically different actions
   * sharing the same `state` (a primary CTA and a secondary filter-reset, both `state="empty"` on
   * `/favorites`) rendered identically, and a neutral retry was forced into a red/destructive
   * look. Verified zero other production consumers before removing them (`grep -rln
   * "MantineEmptyLoadingErrorState" src/` outside stories/tests → only `CollectionsSection.tsx`,
   * which passes no action, and `FavoritesShell.tsx`, which now builds its own three buttons). */
  action?: ReactNode
}

/**
 * Canonical empty / loading / error state pattern.
 *
 * Renders one of three states:
 *   - empty: icon + title + description + optional `action`
 *   - loading: centered Mantine Loader
 *   - error: Alert with error message + optional `action`
 *
 * Responsive API:
 *   - Center component handles centering at all breakpoints.
 *   - `action` alignment is set by this pattern's own Stack (`align="center"` for empty,
 *     `align="flex-start"` for error) so any caller-supplied action aligns correctly regardless of
 *     its own width — the pattern owns layout, never the action's own chrome.
 *
 * Current production consumers (checked 2026-09-10, Task 809 Revision 3): `CollectionsSection.tsx`
 * (empty state, no action) and `FavoritesShell.tsx` (all three states, each with its own `action`).
 */
export function MantineEmptyLoadingErrorState({
  state,
  title,
  description,
  icon,
  action,
}: MantineEmptyLoadingErrorStateProps) {
  const theme = useMantineTheme()
  if (state === 'loading') {
    return (
      <Center py="xl" style={{ minHeight: theme.other.layout.emptyStateMinBlockSize }}>
        <Stack align="center" gap="md">
          <Loader color="brand" size="lg" />
          {title && (
            <Text size="sm" c="dimmed">
              {title}
            </Text>
          )}
        </Stack>
      </Center>
    )
  }

  if (state === 'error') {
    return (
      <Alert
        color="red"
        title={title}
        variant="light"
        radius="md"
        icon={icon}
      >
        <Stack gap="sm" align="flex-start">
          {description && <Text size="sm">{description}</Text>}
          {action}
        </Stack>
      </Alert>
    )
  }

  // empty state
  return (
    <Center py="xl" style={{ minHeight: theme.other.layout.emptyStateMinBlockSize }}>
      <Stack align="center" gap="md" maw={theme.other.boxSize.emptyState}>
        <ThemeIcon size="hero" radius="xl" color="gray" variant="light">
          {icon ?? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          )}
        </ThemeIcon>
        {title && (
          <Text fw={600} size="lg" ta="center">
            {title}
          </Text>
        )}
        {description && (
          <Text size="sm" c="dimmed" ta="center">
            {description}
          </Text>
        )}
        {action}
      </Stack>
    </Center>
  )
}
