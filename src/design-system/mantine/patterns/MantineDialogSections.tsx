'use client'

import { Children, Fragment, isValidElement, type ReactNode } from 'react'
import { Box, Divider, Stack, Text } from '@mantine/core'

/**
 * Negative inline margin that lets a `Divider` run edge to edge inside a dialog body (Task 857 R45, §23.7).
 * `MantineModal` pads its body with Mantine's `--mb-padding` (`ModalBase.css`), and the bottom sheet's `SheetContent`
 * pads with the same `md` spacing key, so one formula bleeds in both. `MantineModal` uses it for its own dividers too.
 */
export const DIALOG_BLEED = 'calc(var(--mb-padding, var(--mantine-spacing-md)) * -1)'

export interface MantineDialogSectionProps {
  /** Optional section heading (16px / 500). */
  title?: ReactNode
  /** Optional muted line under the heading (14px). */
  description?: ReactNode
  /** The section's content; a heading-only section (a confirmation) passes none. */
  children?: ReactNode
}

/**
 * One section of a dialog on the canonical anatomy (§23.7): an optional title and description, then its content.
 * Spacing between sections and the dividers belong to `MantineDialogSections`.
 */
export function MantineDialogSection({ title, description, children }: MantineDialogSectionProps) {
  const hasHeading = Boolean(title) || Boolean(description)
  return (
    <Stack gap="sm">
      {hasHeading && (
        <Stack gap="tight">
          {title && <Text fz="md" fw={500}>{title}</Text>}
          {description && <Text fz="sm" c="dimmed">{description}</Text>}
        </Stack>
      )}
      {children}
    </Stack>
  )
}

export interface MantineDialogSectionsProps {
  /** `MantineDialogSection` elements (a falsy child renders nothing and gets no divider). */
  children: ReactNode
}

/**
 * Stacks a dialog's sections with a full-bleed divider between them (§23.7). Each section has `py="lg"` inside; no
 * divider is drawn before the first section or after the last one.
 */
export function MantineDialogSections({ children }: MantineDialogSectionsProps) {
  const sections = Children.toArray(children).filter(isValidElement)
  return (
    <Box>
      {sections.map((section, index) => (
        <Fragment key={section.key ?? index}>
          {index > 0 && <Divider mx={DIALOG_BLEED} />}
          <Box py="lg">{section}</Box>
        </Fragment>
      ))}
    </Box>
  )
}
