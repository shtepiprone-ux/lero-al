'use client'

import { useState } from 'react'
import { UnstyledButton } from '@mantine/core'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
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
      className={cn(
        styles.copyId,
        'font-mono text-2xs text-muted-foreground/70 hover:text-muted-foreground transition-colors inline-flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded',
      )}
    >
      {label}
      {copied
        ? <Check className="h-2.5 w-2.5 shrink-0 text-status-success" />
        : <Copy className="h-2.5 w-2.5 shrink-0 opacity-50" />
      }
    </UnstyledButton>
  )
}
