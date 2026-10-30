'use client'

import type { ReactNode } from 'react'
import { Group, Radio, Stack, Text } from '@mantine/core'

export interface MantineRadioCardOptionProps {
  /** The option's value inside its `Radio.Group`. */
  value: string
  /** The option's label (already localized). */
  label: ReactNode
  /** An optional dimmed line under the label. */
  description?: ReactNode
  disabled?: boolean
}

export interface MantineRadioCardGroupProps {
  /** The checked option's value (controlled). */
  value?: string
  /** The initially checked option's value (uncontrolled). */
  defaultValue?: string
  onChange?: (value: string) => void
  /** `MantineRadioCardOption` elements. */
  children: ReactNode
}

/**
 * The one owner of a set of choice cards (Task 859 Revision 10, R65, GR-12): a `Radio.Group` that stacks its
 * `MantineRadioCardOption`s at the theme `xs` gap (8px, the spacing the production dialogs render). Every consumer
 * (`TicketDetailDialogView`, `PremiumDialogView` and the `Radio` / `Modal` / `RadioCardOption` Stories) renders a set of
 * choices through it, so "a set of choices" has one spacing and no consumer picks its own.
 *
 * Width contract (Task 859 Revision 11, R67, GR-12): the group fills the width of its container, like a form field.
 * A flex row, a wrapping `Group` or a column `Stack` therefore all give the same width, and no Story or consumer
 * passes one.
 */
export function MantineRadioCardGroup({ value, defaultValue, onChange, children }: MantineRadioCardGroupProps) {
  return (
    <Radio.Group value={value} defaultValue={defaultValue} onChange={onChange} w="100%">
      <Stack gap="xs">{children}</Stack>
    </Radio.Group>
  )
}

/**
 * The one owner of a `Radio.Card` option's content (Task 859 Revision 9, R63, GR-12): the card (radius, border, padding
 * and the checked tint come from the theme `RadioCard` entry and `input-chrome.css`), the canonical radio circle
 * (`RadioIndicator`, 20px with a 10px dot, GR-3f) and the label (14px / 500) with its optional dimmed description (12px).
 * `TicketDetailDialogView`, `PremiumDialogView` and the `Radio` / `Modal` Stories render every option through it, so
 * "a choice in a detail dialog" has one look (§23.7 "A choice"). It must sit inside a `MantineRadioCardGroup`.
 */
export function MantineRadioCardOption({ value, label, description, disabled }: MantineRadioCardOptionProps) {
  const labelText = (
    <Text component="span" fz="sm" fw={500}>
      {label}
    </Text>
  )
  return (
    <Radio.Card value={value} disabled={disabled}>
      <Group wrap="nowrap" gap="sm" align={description ? 'flex-start' : undefined}>
        <Radio.Indicator disabled={disabled} />
        {description ? (
          <Stack gap="tight">
            {labelText}
            <Text component="span" fz="xs" c="dimmed">
              {description}
            </Text>
          </Stack>
        ) : (
          labelText
        )}
      </Group>
    </Radio.Card>
  )
}
