'use client'

import { MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { normalizeNational } from '@/lib/phone'
import { trackListingContactEvent } from '@/modules/listings/actions/contactEvents'

interface Props {
  listingId: string
  listingOwnerId: string
  listingTitle: string
  /** Dial code with "+", e.g. "+355". */
  phoneCountryCode: string
  /** Local phone number (national part), e.g. "691234567". */
  phoneRaw: string
  locale: string
  className?: string
  /** 'default' = h-11 full-width; 'sm' = h-10 compact (mobile CTA bar). */
  size?: 'default' | 'sm'
}

export function WhatsAppContactButton({
  listingId,
  listingOwnerId,
  listingTitle,
  phoneCountryCode,
  phoneRaw,
  locale,
  className,
  size = 'default',
}: Props) {
  const t = useTranslations('listing')

  const normalized = normalizeNational(phoneRaw)
  // Require at least 7 digits after stripping visual separators.
  if (!normalized || !/^\d{7,15}$/.test(normalized)) return null

  const countryDigits = phoneCountryCode.replace(/\D/g, '')
  if (!countryDigits) return null

  const e164Digits = `${countryDigits}${normalized}`
  const presetText = encodeURIComponent(
    t('whatsapp_preset_message', { title: listingTitle })
  )
  const waUrl = `https://wa.me/${e164Digits}?text=${presetText}`

  function handleClick() {
    // Fire-and-forget: do not block navigation.
    void trackListingContactEvent({
      listingId,
      listingOwnerId,
      channel: 'whatsapp',
      source: 'listing_detail_contact_card',
      locale,
    })
  }

  const sizeClass = size === 'sm'
    ? cn(buttonVariants({ size: 'xl', variant: 'default' }), 'bg-whatsapp hover:bg-whatsapp/90 shrink-0')
    : cn(buttonVariants({ size: 'xl', variant: 'default' }), 'bg-whatsapp hover:bg-whatsapp/90 w-full')

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('whatsapp_aria_label')}
      onClick={handleClick}
      className={cn(sizeClass, className)}
    >
      <MessageCircle className="size-5 shrink-0" />
      {t('whatsapp_button_label')}
    </a>
  )
}
