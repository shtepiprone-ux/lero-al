'use client'

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { SimpleGrid, useMantineTheme, type ButtonProps } from '@mantine/core'

export interface MantineDialogFooterProps {
  /** The filled action the dialog exists for (right). */
  primary: ReactNode
  /** The `variant="default"` action (left): Cancel, or a resting destructive action. */
  secondary?: ReactNode
}

/**
 * Footer of a dialog on the canonical anatomy (Task 857 R48, §23.7 "Footer"): at most two buttons of equal width at
 * every width, secondary on the left and primary on the right; a lone button spans the full width. This footer
 * forces `fullWidth` and the 44px touch height (`theme.other.touchTarget`) onto the buttons it receives, so a caller
 * cannot break the pair. The divider above the footer belongs to `MantineModal`.
 */
export function MantineDialogFooter({ primary, secondary }: MantineDialogFooterProps) {
  const theme = useMantineTheme()
  const fill = (node: ReactNode) =>
    isValidElement(node)
      ? cloneElement(node as ReactElement<ButtonProps>, { fullWidth: true, mih: theme.other.touchTarget })
      : node
  return (
    <SimpleGrid cols={secondary ? 2 : 1} spacing="sm">
      {secondary && fill(secondary)}
      {fill(primary)}
    </SimpleGrid>
  )
}
