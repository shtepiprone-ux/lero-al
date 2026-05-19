import { useTranslations } from 'next-intl'
import { Phone, MessageCircle } from 'lucide-react'

interface Props {
  price: string
  phone: string | null
  whatsapp: string | null
  listingTitle: string
}

export function ListingMobileCTA({ price, phone, whatsapp, listingTitle }: Props) {
  const t = useTranslations('listing')

  if (!phone && !whatsapp) return null

  const cleanPhone   = phone?.replace(/\D/g, '') ?? ''
  const cleanWa      = whatsapp?.replace(/\D/g, '') ?? ''
  const waText       = encodeURIComponent(`Pershendetje! Jam i interesuar për: ${listingTitle}`)

  return (
    <div
      className="listing-mobile-cta fixed bottom-14 md:bottom-0 left-0 right-0 z-30 lg:hidden bg-card border-t shadow-[0_-2px_12px_rgba(0,0,0,0.10)] flex items-center gap-3 px-4 py-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <p className="flex-1 min-w-0 font-bold text-primary text-base leading-none truncate">
        {price}
      </p>

      {phone && (
        <a
          href={`tel:${cleanPhone}`}
          className="h-11 px-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors shrink-0"
        >
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">{t('call')}</span>
        </a>
      )}

      {whatsapp && (
        <a
          href={`https://wa.me/${cleanWa}?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-11 px-4 inline-flex items-center gap-2 rounded-xl bg-[color:var(--whatsapp)] text-white text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      )}
    </div>
  )
}
