'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { formatPrice } from '@/lib/formatters'
import { Phone, MessageCircle, Heart, Share2, CheckCircle } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Owner {
  id: string
  name: string | null
  phone: string | null
  whatsapp: string | null
  avatar_url: string | null
  user_type: string
  is_verified: boolean
  company_name?: string | null
}

interface ListingContactProps {
  owner: Owner
  listingTitle: string
  listingUrl: string
  price: number
  currency: string
}

export function ListingContact({ owner, listingTitle, listingUrl, price, currency }: ListingContactProps) {
  const t = useTranslations('listing')
  const locale = useLocale()
  const [favorited, setFavorited] = useState(false)
  const [copied, setCopied] = useState(false)

  const initials = owner.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  const whatsappMsg = encodeURIComponent(`Përshëndetje, jam i interesuar për: ${listingTitle} — ${listingUrl}`)
  const whatsappNumber = (owner.whatsapp || owner.phone || '').replace(/\D/g, '')

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({ title: listingTitle, url: listingUrl }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(listingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const ContactCard = () => (
    <div className="flex flex-col gap-4">
      {/* Owner info */}
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border-2 border-border">
          <AvatarImage src={owner.avatar_url ?? undefined} />
          <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm truncate">{owner.name ?? 'N/A'}</p>
            {owner.is_verified && (
              <CheckCircle className="h-4 w-4 text-verified shrink-0" aria-label={t('verified_agent')} />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {owner.user_type === 'agent'
              ? owner.company_name || t('agent_label')
              : t('private_person')}
          </p>
        </div>
      </div>

      {/* Price (mobile sidebar) */}
      <div className="hidden lg:block py-3 border-y">
        <p className="text-2xl font-bold text-primary">{formatPrice(price, currency, locale)}</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-11 rounded-xl bg-whatsapp hover:bg-whatsapp/90 text-primary-foreground font-semibold text-sm transition-colors"
            data-track="whatsapp_click"
          >
            <MessageCircle className="h-5 w-5" />
            {t('whatsapp')}
          </a>
        )}
        {owner.phone && (
          <a
            href={`tel:${owner.phone}`}
            className="flex items-center justify-center gap-2 h-11 rounded-xl border border-border hover:bg-muted font-semibold text-sm transition-colors"
            data-track="contact_owner"
          >
            <Phone className="h-5 w-5" />
            {t('call')}
          </a>
        )}
        <Link
          href={`/${locale}/messages/new?listing=${encodeURIComponent(listingTitle)}`}
          className="flex items-center justify-center gap-2 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors"
          data-track="contact_owner"
        >
          <MessageCircle className="h-5 w-5" />
          {t('send_message')}
        </Link>
      </div>

      {/* Secondary actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setFavorited(f => !f)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border text-sm transition-all',
            favorited ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'border-border hover:bg-muted'
          )}
          data-track={favorited ? 'remove_favorite' : 'add_favorite'}
          aria-label={t('add_favorite')}
        >
          <Heart className={cn('h-4 w-4', favorited && 'fill-destructive text-destructive')} />
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-border hover:bg-muted text-sm transition-colors"
          aria-label={t('share_listing')}
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">{copied ? t('link_copied') : t('share')}</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sticky sidebar */}
      <div className="listing-contact hidden lg:block sticky top-20">
        <div className="rounded-2xl border bg-card shadow-md p-5">
          <ContactCard />
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="listing-contact-mobile lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-lg px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-primary leading-none">{formatPrice(price, currency, locale)}</p>
            <p className="text-xs text-muted-foreground truncate">{owner.name}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-11 px-4 rounded-xl bg-whatsapp hover:bg-whatsapp/90 text-primary-foreground font-semibold text-sm flex items-center gap-1.5 transition-colors"
                data-track="whatsapp_click"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
            {owner.phone && (
              <a
                href={`tel:${owner.phone}`}
                className="h-11 w-11 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors"
                data-track="contact_owner"
              >
                <Phone className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
