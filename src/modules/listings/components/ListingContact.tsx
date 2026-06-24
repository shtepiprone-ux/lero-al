'use client'

import { useState } from 'react'
import { getListingOwnerContact } from '@/modules/listings/actions/getListingOwnerContact'
import { useTranslations, useLocale } from 'next-intl'
import { formatPrice } from '@/lib/formatters'
import { Phone, MessageCircle, Share2, CheckCircle, UserX, LogIn, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isListingClosed, isListingArchived } from '@/modules/listings/domain'
import { FavoriteButton } from '@/modules/listings/components/FavoriteButton'
import { SaveToCollectionButton } from '@/modules/listings/components/SaveToCollectionButton'
import { ListingReportDialog } from '@/modules/listings/components/ListingReportDialog'
import { ListingInquiryDialog } from '@/modules/listings/components/ListingInquiryDialog'
import { trackListingContactEvent } from '@/modules/listings/actions/contactEvents'
import { openAuthSheet } from '@/lib/auth/authSheet'
import type { ListingStatus } from '@/types/database'

interface Owner {
  id: string
  name: string | null
  /** True when the owner has a phone number — digits fetched on click via RPC (Task 266). */
  has_phone: boolean
  /** True when the owner has a whatsapp number — digits fetched on click via RPC (Task 266). */
  has_whatsapp: boolean
  avatar_url: string | null
  user_type: string
  is_verified: boolean
  company_name?: string | null
  deleted_at?: string | null
}

interface ListingContactProps {
  owner: Owner
  /** True when the viewer is unauthenticated. Keeps viewer state separate from owner account status. */
  isGuest?: boolean
  listingTitle: string
  listingUrl: string
  price: number
  currency: string
  /** Pre-formatted original price string shown when price is converted */
  originalPrice?: string
  originalPriceLabel?: string
  listingStatus?: ListingStatus
  /** Listing ID required to enable the favorite action. */
  listingId?: string
  /** SSR-hydrated initial favorite state. */
  isFavorited?: boolean
  /** True when the viewer is authenticated and is NOT the listing owner. */
  canReport?: boolean
  /** Real listing ID — always available (unlike `listingId`, which is gated to authenticated viewers). Used for the inquiry dialog. */
  inquiryListingId: string
  /** Real listing ID for phone/WhatsApp contact actions. Always listing.id — never gated by preview or auth state. */
  contactListingId: string
  /** False only when the viewer is signed in AND is the listing owner (self-inquiry guard). */
  canSendInquiry?: boolean
  /** Prefill values for signed-in viewers. */
  inquirerName?: string
  inquirerEmail?: string
}

export function ListingContact({ owner, isGuest = false, listingTitle, listingUrl, price, currency, originalPrice, originalPriceLabel, listingStatus, listingId, isFavorited = false, canReport = false, inquiryListingId, contactListingId, canSendInquiry = true, inquirerName, inquirerEmail }: ListingContactProps) {
  const t = useTranslations('listing')
  const locale = useLocale()
  const [copied, setCopied] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)

  const ownerDeleted = !!(owner.deleted_at)
  // owner.id is empty string in the fallback object — means no owner data was returned from DB.
  // For guests this is due to RLS, not because the owner deleted their account.
  const showGuestCTA = isGuest && !owner.id && !ownerDeleted
  // Authenticated viewer but owner row was genuinely null (e.g. orphaned listing).
  const ownerDataUnavailable = !isGuest && !owner.id && !ownerDeleted
  const listingClosed = listingStatus ? isListingClosed(listingStatus) : false
  const listingArchived = listingStatus ? isListingArchived(listingStatus) : false
  const closedLabel = listingClosed && listingStatus ? t(`action_disabled_${listingStatus}` as 'action_disabled_sold' | 'action_disabled_rented') : undefined
  const initials = owner.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  // Trigger hidden for owner-deleted, owner-profile-unavailable (genuinely orphaned listing,
  // not the guest-RLS case), closed listings, and self-inquiry.
  const showInquiryTrigger = !ownerDeleted && !ownerDataUnavailable && !listingClosed && canSendInquiry
  const hasContactButtons = !ownerDeleted && !showGuestCTA && (owner.has_whatsapp || owner.has_phone)

  async function handleContactClick(type: 'whatsapp' | 'call') {
    if (!contactListingId || contactLoading) return
    setContactLoading(true)
    try {
      const result = await getListingOwnerContact(contactListingId)
      if (result.error || (!result.phone && !result.whatsapp)) {
        toast.error(t('contact_load_failed'))
        return
      }
      const digits = (type === 'whatsapp' ? result.whatsapp : result.phone)?.replace(/\D/g, '') ?? ''
      if (!digits) { toast.error(t('contact_load_failed')); return }
      if (type === 'whatsapp') {
        void trackListingContactEvent({ listingId: contactListingId, listingOwnerId: owner.id, channel: 'whatsapp', source: 'listing_detail_contact_card', locale })
        const waText = encodeURIComponent(t('whatsapp_preset_message', { title: listingTitle }))
        window.open(`https://wa.me/${digits}?text=${waText}`, '_blank', 'noopener,noreferrer')
      } else {
        const a = document.createElement('a')
        a.href = `tel:${digits}`
        a.rel = 'noopener noreferrer'
        a.click()
      }
    } finally {
      setContactLoading(false)
    }
  }

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
    <>
      {/* Desktop sticky sidebar */}
      <div className="listing-contact hidden lg:block sticky top-20">
        <div className="rounded-2xl border bg-card shadow-md p-5">
          <div className="flex flex-col gap-4">
            {/* Owner info */}
            <div className={cn("flex items-center gap-3", (ownerDeleted || showGuestCTA || ownerDataUnavailable) && "opacity-50")}>
              <Avatar className="h-12 w-12 border-2 border-border">
                {!ownerDeleted && !showGuestCTA && <AvatarImage src={owner.avatar_url ?? undefined} />}
                <AvatarFallback className="font-semibold">
                  {ownerDeleted ? <UserX className="h-5 w-5" /> : initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm break-words">
                    {ownerDeleted
                      ? t('owner_deleted_label')
                      : ownerDataUnavailable
                        ? t('owner_name_unavailable')
                        : (owner.name ?? (owner.user_type === 'agent' && owner.company_name ? owner.company_name : t('owner_name_unavailable')))}
                  </p>
                  {!ownerDeleted && !showGuestCTA && owner.is_verified && (
                    <CheckCircle className="h-4 w-4 text-verified shrink-0" aria-label={t('verified_agent')} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {ownerDeleted || showGuestCTA || ownerDataUnavailable
                    ? '—'
                    : owner.user_type === 'agent'
                      ? owner.company_name || t('agent_label')
                      : t('private_person')}
                </p>
              </div>
            </div>

            {/* Price (desktop sidebar) */}
            <div className="hidden lg:block py-3 border-y">
              <p className="text-2xl font-bold text-primary">{formatPrice(price, currency, locale)}</p>
              {originalPrice && (
                <p className="text-xs text-muted-foreground mt-0.5">{originalPriceLabel}: {originalPrice}</p>
              )}
            </div>

            {/* Action buttons — owner-deleted notice — or guest sign-in CTA */}
            {ownerDeleted ? (
              <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-5 flex flex-col items-center gap-3 text-center">
                <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center">
                  <UserX className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground/80">{t('owner_deleted')}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t('owner_deleted_desc')}</p>
                </div>
              </div>
            ) : ownerDataUnavailable ? (
              <div className="rounded-xl border border-status-warning/40 bg-status-warning/5 px-4 py-5 flex flex-col items-center gap-3 text-center">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">{t('owner_name_unavailable')}</p>
                </div>
              </div>
            ) : showGuestCTA ? (
              <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-5 flex flex-col items-center gap-3 text-center">
                <div className="h-10 w-10 rounded-full bg-muted border border-border flex items-center justify-center">
                  <LogIn className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-foreground/80">{t('contact_guest_title')}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t('contact_guest_desc')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => openAuthSheet('login')}
                  className="flex items-center justify-center gap-2 h-10 w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-colors"
                >
                  {t('contact_guest_cta')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {owner.has_whatsapp && (
                  <button
                    type="button"
                    onClick={() => handleContactClick('whatsapp')}
                    disabled={contactLoading}
                    className={cn(buttonVariants({ size: 'xl', variant: 'default' }), 'bg-whatsapp hover:bg-whatsapp/90')}
                    data-track="whatsapp_click"
                    aria-label={t('whatsapp_aria_label')}
                  >
                    {contactLoading ? <Loader2 className="size-5 animate-spin" /> : <MessageCircle className="size-5" />}
                    {t('whatsapp_button_label')}
                  </button>
                )}
                {owner.has_phone && (
                  <button
                    type="button"
                    onClick={() => handleContactClick('call')}
                    disabled={contactLoading}
                    className={buttonVariants({ size: 'xl', variant: 'outline' })}
                    data-track="contact_owner"
                  >
                    {contactLoading ? <Loader2 className="size-5 animate-spin" /> : <Phone className="size-5" />}
                    {t('call')}
                  </button>
                )}
                {listingClosed ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="xl"
                    disabled
                    className="w-full rounded-xl bg-muted text-muted-foreground font-semibold cursor-not-allowed opacity-60 gap-2"
                    title={closedLabel}
                    aria-disabled="true"
                  >
                    <MessageCircle className="h-5 w-5 shrink-0" />
                    {t('send_message')}
                  </Button>
                ) : showInquiryTrigger ? (
                  <ListingInquiryDialog
                    listingId={inquiryListingId}
                    listingTitle={listingTitle}
                    defaultName={inquirerName}
                    defaultEmail={inquirerEmail}
                    trigger={
                      <button
                        type="button"
                        className={buttonVariants({ size: 'xl', variant: 'default' })}
                        data-track="contact_owner"
                      >
                        <MessageCircle className="size-5" />
                        {t('send_message')}
                      </button>
                    }
                  />
                ) : null}
                {listingClosed && closedLabel && (
                  <p className="text-xs text-muted-foreground text-center">{closedLabel}</p>
                )}
              </div>
            )}

            {/* Secondary actions */}
            <div className="flex flex-wrap gap-2">
              {listingId && (
                <>
                  <FavoriteButton
                    listingId={listingId}
                    isFavorited={isFavorited}
                    disabled={listingClosed}
                    disabledLabel={closedLabel}
                    shape="pill"
                    size="lg"
                    className="flex-1 rounded-xl border border-border"
                  />
                  <SaveToCollectionButton
                    listingId={listingId}
                    variant="default"
                    size="lg"
                    className="flex-1 rounded-xl border border-border"
                  />
                </>
              )}
              <Button
                variant="outline"
                onClick={handleShare}
                size="lg"
                className="flex-1 gap-1.5 rounded-xl border-border"
                aria-label={t('share_listing')}
              >
                <Share2 className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{copied ? t('link_copied') : t('share')}</span>
              </Button>
            </div>

            {/* Report listing — authenticated non-owner only */}
            {canReport && listingId && (
              <div className="flex justify-end">
                <ListingReportDialog listingId={listingId} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom bar — suppressed for archived listings (no active contact CTA on archived) */}
      {!listingArchived && <div
        className="listing-contact-mobile lg:hidden fixed bottom-14 md:bottom-0 left-0 right-0 z-40 bg-background border-t shadow-lg px-4 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <div className="flex flex-col gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-primary leading-none">{formatPrice(price, currency, locale)}</p>
              <p className="text-xs text-muted-foreground break-words">
                {ownerDeleted
                  ? t('owner_deleted')
                  : ownerDataUnavailable
                    ? t('owner_name_unavailable')
                    : owner.name ?? t('owner_name_unavailable')}
              </p>
            </div>
            {!ownerDeleted && !showGuestCTA && (
              <>
                {/* ≥640: WA + Phone icon side by side next to price */}
                <div className="hidden sm:flex gap-2 shrink-0">
                  {owner.has_whatsapp && (
                    <button
                      type="button"
                      onClick={() => handleContactClick('whatsapp')}
                      disabled={contactLoading}
                      className={cn(buttonVariants({ size: 'xl', variant: 'default' }), 'bg-whatsapp hover:bg-whatsapp/90')}
                      data-track="whatsapp_click"
                      aria-label={t('whatsapp_aria_label')}
                    >
                      {contactLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                      {t('whatsapp_button_label')}
                    </button>
                  )}
                  {owner.has_phone && (
                    <button
                      type="button"
                      onClick={() => handleContactClick('call')}
                      disabled={contactLoading}
                      className={buttonVariants({ size: 'icon-xl', variant: 'outline' })}
                      data-track="contact_owner"
                    >
                      {contactLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="size-5" />}
                    </button>
                  )}
                </div>
                {/* <640: only Phone icon in price row (icon-only, exempt from full-width); WA moves to own row below */}
                {owner.has_phone && (
                  <button
                    type="button"
                    onClick={() => handleContactClick('call')}
                    disabled={contactLoading}
                    className={cn(buttonVariants({ size: 'icon-xl', variant: 'outline' }), 'sm:hidden')}
                    data-track="contact_owner"
                  >
                    {contactLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="size-5" />}
                  </button>
                )}
              </>
            )}
            {ownerDeleted && (
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                <UserX className="h-3.5 w-3.5 shrink-0" />
                <span>{t('owner_deleted_label')}</span>
              </div>
            )}
            {showGuestCTA && (
              <button
                type="button"
                onClick={() => openAuthSheet('login')}
                className="shrink-0 h-11 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                {t('contact_guest_cta')}
              </button>
            )}
          </div>

          {/* <640: WA full-width below price row — avoids WA↔Phone overlap (Task 466) */}
          {!ownerDeleted && !showGuestCTA && owner.has_whatsapp && (
            <button
              type="button"
              onClick={() => handleContactClick('whatsapp')}
              disabled={contactLoading}
              className={cn(buttonVariants({ size: 'xl', variant: 'default' }), 'bg-whatsapp hover:bg-whatsapp/90 sm:hidden')}
              data-track="whatsapp_click"
              aria-label={t('whatsapp_aria_label')}
            >
              {contactLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              {t('whatsapp_button_label')}
            </button>
          )}

          {/* Message trigger — independent of has_phone/has_whatsapp */}
          {showInquiryTrigger && (
            <ListingInquiryDialog
              listingId={inquiryListingId}
              listingTitle={listingTitle}
              defaultName={inquirerName}
              defaultEmail={inquirerEmail}
              trigger={
                <button
                  type="button"
                  className={cn(buttonVariants({ size: 'xl', variant: hasContactButtons ? 'outline' : 'default' }), 'w-full')}
                  data-track="contact_owner"
                >
                  <MessageCircle className="size-5" />
                  {t('send_message')}
                </button>
              }
            />
          )}
        </div>
      </div>}
    </>
  )
}
