'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Phone, MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { getListingOwnerContact } from '@/modules/listings/actions/getListingOwnerContact'
import { trackListingContactEvent } from '@/modules/listings/actions/contactEvents'

interface Props {
  price: string
  hasPhone: boolean
  hasWhatsapp: boolean
  listingId: string
  listingTitle: string
  /** Owner's user ID for analytics self-click detection. */
  listingOwnerId: string
  locale: string
}

export function ListingMobileCTA({ price, hasPhone, hasWhatsapp, listingId, listingTitle, listingOwnerId, locale }: Props) {
  const t = useTranslations('listing')
  const [loading, setLoading] = useState(false)

  if (!hasPhone && !hasWhatsapp) return null

  async function handleCallClick() {
    if (loading) return
    setLoading(true)
    try {
      const result = await getListingOwnerContact(listingId)
      if (result.error || !result.phone) {
        toast.error(t('contact_load_failed'))
        return
      }
      const digits = result.phone.replace(/\D/g, '')
      if (!digits) { toast.error(t('contact_load_failed')); return }
      const a = document.createElement('a')
      a.href = `tel:${digits}`
      a.rel = 'noopener noreferrer'
      a.click()
    } finally {
      setLoading(false)
    }
  }

  async function handleWhatsAppClick() {
    if (loading) return
    setLoading(true)
    try {
      const result = await getListingOwnerContact(listingId)
      if (result.error || !result.whatsapp) {
        toast.error(t('contact_load_failed'))
        return
      }
      const digits = result.whatsapp.replace(/\D/g, '')
      if (!digits) { toast.error(t('contact_load_failed')); return }
      void trackListingContactEvent({ listingId, listingOwnerId, channel: 'whatsapp', source: 'listing_detail_contact_card', locale })
      const waText = encodeURIComponent(t('whatsapp_preset_message', { title: listingTitle }))
      window.open(`https://wa.me/${digits}?text=${waText}`, '_blank', 'noopener,noreferrer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="listing-mobile-cta fixed bottom-14 md:bottom-0 left-0 right-0 z-30 lg:hidden bg-card border-t shadow-[0_-2px_12px_rgba(0,0,0,0.10)] flex items-center gap-3 px-4 py-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <p className="flex-1 min-w-0 font-bold text-primary text-base leading-none truncate">
        {price}
      </p>

      {hasPhone && (
        <button
          type="button"
          onClick={handleCallClick}
          disabled={loading}
          className={cn(buttonVariants({ size: 'xl', variant: 'outline' }), 'shrink-0 max-sm:w-auto')}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
          <span className="hidden sm:inline">{t('call')}</span>
        </button>
      )}

      {hasWhatsapp && (
        <button
          type="button"
          onClick={handleWhatsAppClick}
          disabled={loading}
          className={cn(buttonVariants({ size: 'xl', variant: 'default' }), 'bg-whatsapp hover:bg-whatsapp/90 shrink-0 max-sm:w-auto')}
          aria-label={t('whatsapp_aria_label')}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
          {t('whatsapp_button_label')}
        </button>
      )}
    </div>
  )
}
