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
      <Center py="xl" style={{ minHeight: 200 }}>
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
            <Button
              variant="light"
              color="red"
              size="sm"
              onClick={onAction}
              styles={{
                root: {
                  width: '100%',
                  '@media (min-width: 40em)': { width: 'auto' },
                },
              }}
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
    <Center py="xl" style={{ minHeight: 200 }}>
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
            styles={{
              root: {
                width: '100%',
                '@media (min-width: 40em)': { width: 'auto' },
              },
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Center>
  )
}
