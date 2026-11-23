'use client'

import { ActionIcon, useMantineTheme } from '@mantine/core'
import { Trash2 } from 'lucide-react'

export interface MantineDeleteIconButtonProps {
  /** The accessible name and the title: what is deleted (for example "Remove photo 2"). */
  label: string
  onClick: () => void
  disabled?: boolean
  /** The delete is running: Mantine's loading state. */
  loading?: boolean
  /**
   * The control sits over an image (a photo tile): filled red with a white glyph, as the photo delete control of `main` was, so it does not merge with the photo (owner decision O957-7,
   * 2026-11-21). Without it the control is the `subtle` one of a row or a card.
   */
  onMedia?: boolean
  /**
   * The row is in its touch layout (a card on a phone): the control takes the theme's touch target, together with the other icons of the row. Without it a row control is the row size.
   * Ignored with `onMedia`, which always takes the touch target.
   */
  touch?: boolean
}

/**
 * Canonical delete icon action (Task 957 Revision 2, R2-8; Review 2 F13; Revision 9, R9-2, Review 9 F47): one look for the delete control that sits as an icon in a row, card or tile. It is Mantine's
 * `ActionIcon` `variant="subtle"` in the theme's red, with the trash glyph at `theme.other.iconSize.compact`. In a row it is the row size, `size="sm"`, as the icons beside it. On `main` all the icons of a
 * row (open, edit, delete in `AdminPagesView.tsx`) took the theme's touch target (`theme.other.touchTarget`) together and only in the touch layout, so a consumer in its touch layout passes `touch`.
 * Over an image (`onMedia`, Revision 3, R3-6) it is `filled`, `lg` and always at the touch target. A consumer passes the name, the handler, the state, whether it sits over an image and whether the row is
 * in its touch layout: no variant, colour or size, so the consumers cannot drift apart. A delete that needs a confirmation opens it from `onClick` (`MantineDeleteConfirmModal`); this component never confirms.
 */
export function MantineDeleteIconButton({ label, onClick, disabled, loading, onMedia, touch }: MantineDeleteIconButtonProps) {
  const theme = useMantineTheme()
  const touchTarget = onMedia || touch ? theme.other.touchTarget : undefined
  return (
    <ActionIcon
      type="button"
      variant={onMedia ? 'filled' : 'subtle'}
      color="red"
      size={onMedia ? 'lg' : 'sm'}
      mih={touchTarget}
      miw={touchTarget}
      aria-label={label}
      title={label}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
    >
      <Trash2 size={theme.other.iconSize.compact} />
    </ActionIcon>
  )
}
