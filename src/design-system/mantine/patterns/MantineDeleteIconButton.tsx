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
}

/**
 * Canonical delete icon action (Task 957 Revision 2, R2-8; Review 2 F13): one look for the delete control that sits as an icon in a row, card or tile. It is Mantine's `ActionIcon`
 * `variant="subtle"` in the theme's red, with the trash glyph at `theme.other.iconSize.compact` and at least the theme's touch target (`theme.other.touchTarget`), as the admin pages' and the
 * collections' delete controls were before this owner existed (`AdminPagesView.tsx`, `CollectionsSection.tsx`); over an image (`onMedia`, Revision 3, R3-6) it is `filled`. A consumer passes the
 * name, the handler, the state and whether it sits over an image: no variant, colour or size, so the consumers cannot drift apart. A delete that needs a confirmation opens it from `onClick`
 * (`MantineDeleteConfirmModal`); this component never confirms.
 */
export function MantineDeleteIconButton({ label, onClick, disabled, loading, onMedia }: MantineDeleteIconButtonProps) {
  const theme = useMantineTheme()
  return (
    <ActionIcon
      type="button"
      variant={onMedia ? 'filled' : 'subtle'}
      color="red"
      size="lg"
      mih={theme.other.touchTarget}
      miw={theme.other.touchTarget}
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
