'use client'

import { Stack, Text, Button, Loader, Alert, Center, ThemeIcon, useMantineTheme } from '@mantine/core'

export type StateType = 'empty' | 'loading' | 'error'

export interface MantineEmptyLoadingErrorStateProps {
  state: StateType
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

/**
 * Canonical empty / loading / error state pattern.
 *
 * Renders one of three states:
 *   - empty: icon + title + description + optional action
 *   - loading: centered Mantine Loader
 *   - error: Alert with error message + optional retry action
 *
 * Responsive API:
 *   - Center component handles centering at all breakpoints.
 *   - Action button is full-width on mobile (mw="100%" at base, auto at sm+).
 *
 * All three variants are used across product surfaces (listings, admin, cabinet).
 */
export function MantineEmptyLoadingErrorState({
  state,
  title,
  description,
  actionLabel,
  onAction,
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
      >
        <Stack gap="sm">
          {description && <Text size="sm">{description}</Text>}
          {actionLabel && onAction && (
            // Task 785 (site 10): `alignSelf: 'flex-start'` is required here — Stack's own default
            // align is `stretch`, which stretches a flex item even when that item's own `width` is
            // `auto` (an explicit non-auto width is what a stretch parent respects, not `auto`).
            // Scoped to this Button only (not the whole Stack) so the sibling description Text keeps
            // its existing full-width wrapping behavior. Without this, the Button's
            // `w={{base:'100%',sm:'auto'}}` below would render full-width at every breakpoint
            // regardless of the media query firing correctly — discovered via this task's AC2
            // rendered-DOM check, not visible from source alone.
            <Button
              variant="light"
              color="red"
              size="sm"
              onClick={onAction}
              w={{ base: '100%', sm: 'auto' }}
              style={{ alignSelf: 'flex-start' }}
            >
              {actionLabel}
            </Button>
          )}
        </Stack>
      </Alert>
    )
  }

  // empty state
  return (
    <Center py="xl" style={{ minHeight: theme.other.layout.emptyStateMinBlockSize }}>
      <Stack align="center" gap="md" maw={theme.other.boxSize.emptyState}>
        <ThemeIcon size="hero" radius="xl" color="gray" variant="light">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7h18M3 12h18M3 17h18" />
          </svg>
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
        {actionLabel && onAction && (
          <Button
            color="brand"
            onClick={onAction}
            w={{ base: '100%', sm: 'auto' }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Center>
  )
}
