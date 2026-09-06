'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Share2, Check } from 'lucide-react'
import { ActionIcon, Tooltip, useMantineTheme } from '@mantine/core'

interface ListingShareButtonProps {
  listingTitle: string
  listingUrl: string
}

/**
 * Task 793 (owner instruction, 2026-09-06) — share moved out of `ListingContact`'s card into
 * `MantineListingDetailPattern`'s badges row, next to `FavoriteButton`. `handleShare` and its
 * `copied` state are the same logic `ListingContact.tsx` used to own; this is its own
 * `'use client'` component so the Server Component `ListingDetailView` can render it as a slot
 * without a function prop crossing the Server/Client boundary (kickoff §3.1/§3.4, R10). Always
 * enabled — never gated by listing status (R11: share stays live on archived/expired listings).
 */
export function ListingShareButton({ listingTitle, listingUrl }: ListingShareButtonProps) {
  const t = useTranslations('listing')
  const theme = useMantineTheme()
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: listingTitle, url: listingUrl }).catch(() => {})
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(listingUrl).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Tooltip label={copied ? t('link_copied') : t('share')} withArrow>
      <ActionIcon
        type="button"
        onClick={handleShare}
        variant="subtle"
        size={theme.other.iconSize.prominent}
        radius="pill"
        aria-label={t('share_listing')}
      >
        {copied ? <Check size={theme.other.iconSize.standard} /> : <Share2 size={theme.other.iconSize.standard} />}
      </ActionIcon>
    </Tooltip>
  )
}
