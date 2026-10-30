'use client'

import type { ReactNode } from 'react'
import { Badge } from '@mantine/core'
import {
  BADGE_COUNT_EMPHASIS,
  BADGE_STATUS_REGISTRY,
  BADGE_TONES,
  type BadgeCountEmphasis,
  type BadgeSemanticTone,
  type BadgeStatusEntity,
} from '../badgeTones'

export type MantineBadgeSize = 'xs' | 'sm' | 'lg'

interface MantineBadgeBaseProps {
  /** Default `sm` (the 12px status pill, TailAdmin §6b). */
  size?: MantineBadgeSize
  /**
   * Outlined instead of solid: a neutral label that is not a status (the listing-detail type chip, the permissions
   * note). Kept because two production consumers use it (R49); a status never takes it.
   */
  outline?: boolean
  /** The localized label (the caller owns its namespace; the registry holds the key for the Story and tests). */
  children?: ReactNode
  'data-testid'?: string
}

type StatusBadgeProps = {
  [E in BadgeStatusEntity]: {
    variant: 'status'
    entity: E
    value: keyof (typeof BADGE_STATUS_REGISTRY)[E]
  }
}[BadgeStatusEntity]

interface ToneBadgeProps {
  variant: 'tone'
  tone: BadgeSemanticTone
}

interface CountBadgeProps {
  variant: 'count'
  /**
   * `brand` (default, solid brand), `onBrand` (white, inside a filled brand button) or `neutral` (the theme's light
   * tint, inside a light button or beside a tab label).
   */
  emphasis?: BadgeCountEmphasis
  /** Mantine's native round counter (width equals height). */
  circle?: boolean
}

/** What a badge means, without its label: the part a data prop (a card's badges, a work-list status) carries. */
export type MantineBadgeMeaning = StatusBadgeProps | ToneBadgeProps

export type MantineBadgeProps = MantineBadgeBaseProps & (StatusBadgeProps | ToneBadgeProps | CountBadgeProps)

/**
 * The only component that renders a Mantine `Badge` in production (Task 859 Revision 2, R25, owner decision D78-18).
 * Meaning comes from `badgeTones.ts` (entity + value, or one semantic tone); the one look of a status or tone badge
 * is the `Badge` theme entry (pill, solid fill at the colour's index-7 stop, white text, 12px/500; owner decision
 * D78-26, Revision 7), the same on every surface. It takes no `color`, `style`, `className`, `styles`, `variant`-look or
 * shape prop: a caller picks a meaning, never a colour or a corner. A badge is text only: it has no icon prop and the
 * registry stores no icon (owner decision D78-29, 2026-10-08). Variants: `status` (a registry entity and value), `tone`
 * (one semantic tone with children) and `count` (a number, optionally round).
 */
export function MantineBadge(props: MantineBadgeProps) {
  const { size = 'sm', outline = false, children } = props
  const testIdProps = props['data-testid'] ? { 'data-testid': props['data-testid'] } : {}

  if (props.variant === 'count') {
    // Colour and variant come from the registry (`BADGE_COUNT_EMPHASIS`, R59), never from a literal here.
    const { color, variant } = BADGE_COUNT_EMPHASIS[props.emphasis ?? 'brand']
    return (
      <Badge size={size} circle={props.circle} color={color} variant={variant} {...testIdProps}>
        {children}
      </Badge>
    )
  }

  if (props.variant === 'tone') {
    return (
      <Badge
        size={size}
        color={BADGE_TONES[props.tone]}
        variant={outline ? 'outline' : undefined}
        {...testIdProps}
      >
        {children}
      </Badge>
    )
  }

  const registry: Record<string, { color: string }> = BADGE_STATUS_REGISTRY[props.entity]
  const entry = registry[props.value as string]
  return (
    <Badge size={size} color={entry?.color ?? BADGE_TONES.neutral} {...testIdProps}>
      {children}
    </Badge>
  )
}
