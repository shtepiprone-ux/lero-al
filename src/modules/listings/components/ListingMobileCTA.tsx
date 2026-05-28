'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Phone, MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { getListingOwnerContact } from '@/modules/listings/actions/getListingOwnerContact'

interface Props {
  price: string
  hasPhone: boolean
  hasWhatsapp: boolean
  listingId: string
  listingTitle: string
}

export function ListingMobileCTA({ price, hasPhone, hasWhatsapp, listingId, listingTitle }: Props) {
  const t = useTranslations('listing')
  const [loading, setLoading] = useState(false)

  if (!hasPhone && !hasWhatsapp) return null

  const waText = encodeURIComponent(`Pershendetje! Jam i interesuar për: ${listingTitle}`)

  async function handleContactClick(type: 'call' | 'whatsapp') {
    if (loading) return
    setLoading(true)
    try {
      const result = await getListingOwnerContact(listingId)
      if (result.error || (!result.phone && !result.whatsapp)) {
        toast.error(t('contact_load_failed'))
        return
      }
      const digits = (type === 'whatsapp' ? result.whatsapp : result.phone)?.replace(/\D/g, '') ?? ''
      if (!digits) { toast.error(t('contact_load_failed')); return }
      if (type === 'whatsapp') {
        window.open(`https://wa.me/${digits}?text=${waText}`, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = `tel:${digits}`
      }
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
          onClick={() => handleContactClick('call')}
          disabled={loading}
          className={cn(buttonVariants({ size: 'xl', variant: 'outline' }), 'shrink-0')}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
          <span className="hidden sm:inline">{t('call')}</span>
        </button>
      )}

      {hasWhatsapp && (
        <button
          type="button"
          onClick={() => handleContactClick('whatsapp')}
          disabled={loading}
          className={cn(buttonVariants({ size: 'xl', variant: 'default' }), 'bg-whatsapp hover:bg-whatsapp/90 shrink-0')}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
          WhatsApp
        </button>
      )}
    </div>
  )
}
