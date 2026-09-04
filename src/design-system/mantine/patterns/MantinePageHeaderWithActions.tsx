'use client'

import { Group, Flex, Title, Button, Stack, Text } from '@mantine/core'

export interface PageHeaderAction {
  label: string
  onClick?: () => void
  variant?: 'filled' | 'outline' | 'light' | 'subtle'
  color?: string
}

export interface MantinePageHeaderWithActionsProps {
  title: string
  subtitle?: string
  breadcrumb?: string
  actions?: PageHeaderAction[]
}

/**
 * Canonical page header pattern with responsive action group.
 *
 * Mobile (<sm / 640px): title + actions stack vertically; each action is full-width.
 * Desktop (sm+): title + actions on one row (Group with justify="space-between").
 *
 * Responsive API: Stack on mobile via `hiddenFrom`/`visibleFrom` or responsive
 * style props. Buttons use `fullWidth` on mobile via responsive breakpoint check.
 */
export function MantinePageHeaderWithActions({
  title,
  subtitle,
  breadcrumb,
  actions = [],
}: MantinePageHeaderWithActionsProps) {
  return (
    <Stack gap="xs" mb="lg">
      {breadcrumb && (
        <Text size="sm" c="dimmed">
          {breadcrumb}
        </Text>
      )}
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Stack gap="tight">
          <Title order={1} size="h2">
            {title}
          </Title>
          {subtitle && (
            <Text size="sm" c="dimmed">
              {subtitle}
            </Text>
          )}
        </Stack>
        {actions.length > 0 && (
          // Task 785 (site 9): the inert `styles={{root:{'@media...'}}}` block never emitted CSS
          // (docs/sessions/evidence/task784/d69-19-browser/styles-prop-media-query-defect-proof.md)
          // — replaced with Flex's native `w`/`direction`/`align` responsive props, gated at `sm`
          // (theme.breakpoints.sm === theme.other.mobileGate, byte-identical). At <sm actions stack
          // vertically, full-width, each button stretched (P0 mobile gate, Task 724 — the missing
          // half of this component's own spec). At sm+ actions return to one row, auto-sized and
          // grouped right. `wrap="wrap"` preserves Group's own default wrap behavior.
          <Flex
            gap="sm"
            wrap="wrap"
            w={{ base: '100%', sm: 'auto' }}
            direction={{ base: 'column', sm: 'row' }}
            align={{ base: 'stretch', sm: 'center' }}
          >
            {actions.map((action, i) => (
              <Button
                key={i}
                variant={action.variant ?? (i === 0 ? 'filled' : 'outline')}
                color={action.color ?? 'brand'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </Flex>
        )}
      </Group>
    </Stack>
  )
}
