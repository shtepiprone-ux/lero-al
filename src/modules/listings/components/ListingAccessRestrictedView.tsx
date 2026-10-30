'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { MantineEmptyLoadingErrorState } from '@/design-system/mantine/patterns/MantineEmptyLoadingErrorState'
import { ListingsPageFrame } from '@/modules/listings/components/ListingsPageFrame'

// The caller of MantineEmptyLoadingErrorState states the action's width at its own call site (Task 809 Revision 3), as FavoritesShell does.
const FULL_BELOW_SM = { base: '100%', sm: 'auto' } as const

export interface ListingAccessRestrictedViewProps {
  homeHref: string
  homeLabel: string
  listingsHref: string
  listingsLabel: string
  currentLabel: string
  breadcrumbAriaLabel: string
  title: string
  description: string
  actionHref: string
  actionLabel: string
}

/**
 * Task 923 R103 (D72): the page a visitor sees at the address of a listing they may not open (a listing that is hidden, archived, pending, inactive or expired).
 * A COMPOSE of two canonical owners: the listings page frame (breadcrumb band and gutter) around the canonical empty state with one action. It receives strings and
 * hrefs only, never a listing field, so nothing about the hidden listing can reach it. It adds no style, class or value of its own.
 */
export function ListingAccessRestrictedView({
  homeHref,
  homeLabel,
  listingsHref,
  listingsLabel,
  currentLabel,
  breadcrumbAriaLabel,
  title,
  description,
  actionHref,
  actionLabel,
}: ListingAccessRestrictedViewProps) {
  return (
    <ListingsPageFrame
      homeHref={homeHref}
      homeLabel={homeLabel}
      intermediate={[{ label: listingsLabel, href: listingsHref }]}
      currentLabel={currentLabel}
      breadcrumbAriaLabel={breadcrumbAriaLabel}
    >
      <MantineEmptyLoadingErrorState
        state="empty"
        title={title}
        description={description}
        icon={<Lock size={theme.other!.iconSize!.decorative} />}
        action={
          <Button component={Link} href={actionHref} color="brand" w={FULL_BELOW_SM}>
            {actionLabel}
          </Button>
        }
      />
    </ListingsPageFrame>
  )
}
