'use client'

import { Group, Button, Box } from '@mantine/core'

export interface FooterAction {
  label: string
  onClick?: () => void
  variant?: 'filled' | 'outline' | 'light' | 'subtle' | 'default'
  color?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export interface MantineResponsiveActionFooterProps {
  actions: FooterAction[]
  sticky?: boolean
  borderTop?: boolean
}

/**
 * Canonical sticky action footer pattern.
 *
 * Mobile (<sm / 640px): buttons are full-width, stacked in a column.
 * Desktop (sm+): buttons auto-size and group at the end of the row.
 *
 * Responsive API:
 *   - `direction={{ base: 'column', sm: 'row' }}` on the Group
 *   - Each Button `fullWidth` at base, auto at sm+
 *   - The footer is sticky at the bottom of the viewport.
 *
 * P0 mobile gate: every action button spans full width below 640px.
 */
export function MantineResponsiveActionFooter({
  actions,
  sticky = false,
  borderTop = true,
}: MantineResponsiveActionFooterProps) {
  return (
    <Box
      style={{
        ...(sticky ? { position: 'sticky', bottom: 0, zIndex: 100 } : {}),
        backgroundColor: 'var(--mantine-color-body)',
        ...(borderTop ? { borderTop: '1px solid var(--mantine-color-gray-3)' } : {}),
        padding: 'var(--mantine-spacing-md)',
      }}
    >
      <Group
        justify="flex-end"
        gap="sm"
        style={{ flexDirection: 'column' }}
        styles={{
          root: {
            '@media (min-width: 40em)': {
              flexDirection: 'row',
            },
          },
        }}
      >
        {actions.map((action, i) => (
          <Button
            key={i}
            type={action.type ?? 'button'}
            variant={action.variant ?? (i === actions.length - 1 ? 'filled' : 'outline')}
            color={action.color ?? (i === actions.length - 1 ? 'brand' : 'gray')}
            onClick={action.onClick}
            disabled={action.disabled}
            fullWidth
            styles={{
              root: {
                '@media (min-width: 40em)': {
                  width: 'auto',
                },
              },
            }}
          >
            {action.label}
          </Button>
        ))}
      </Group>
    </Box>
  )
}
