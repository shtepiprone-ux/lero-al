'use client'

import { useState } from 'react'
import { UnstyledButton, useMantineTheme } from '@mantine/core'
import { Copy, Check } from 'lucide-react'
import styles from './MantineCopyIdButton.module.css'

export interface MantineCopyIdButtonProps {
  /** Value written to the clipboard on click. */
  id: string
  /** Display text rendered before the Copy/Check icon (e.g. `#1234`). */
  label: string
  /** Accessible name while resting. */
  copyLabel: string
  /** Accessible name for ~1500ms after a successful copy. */
  copiedLabel: string
}

/**
 * Canonical copy-ID footer-action button (Task 656) — owns the clipboard write, the
 * Copy↔Check copied-state toggle, and its own styling (moved verbatim from Task 655's
 * Homepage-only `ListingCard.module.css`). Extracted so `MantineListingCardPattern`
 * (the slot owner) never absorbs clipboard state (presentational-split gate). App
 * concerns — which id, the display label, and the aria copy/copied strings — are
 * props; this component has no i18n of its own.
 */
export function MantineCopyIdButton({ id, label, copyLabel, copiedLabel }: MantineCopyIdButtonProps) {
  const theme = useMantineTheme()
  const [copied, setCopied] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard?.writeText(id).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <UnstyledButton
      type="button"
      onClick={handleClick}
      title={id}
      aria-label={copied ? copiedLabel : copyLabel}
      data-copy-id
      className={styles.copyId}
    >
      {label}
      {copied
        ? <Check size={theme.other.iconSize.micro} className={styles.copiedIcon} />
        : <Copy size={theme.other.iconSize.micro} className={styles.notCopiedIcon} />
      }
    </UnstyledButton>
  )
}
