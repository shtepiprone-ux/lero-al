'use client'

import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { revealListingContact } from '@/modules/listings/actions/contactGateway'
import { CONTACT_ACTIONS } from '@/modules/listings/lib/contactActions'
import { CaptchaWidget, type CaptchaWidgetHandle } from '@/components/auth/CaptchaWidget'
import { useTranslations, useLocale } from 'next-intl'
import { formatPrice } from '@/lib/formatters'
import { MessageCircle } from 'lucide-react'
import { Button, useMantineTheme } from '@mantine/core'
import { toast } from '@/lib/toast'
import { isListingClosed, isListingArchived } from '@/modules/listings/domain'
import { SaveToCollectionButton } from '@/modules/listings/components/SaveToCollectionButton'
import { ListingReportDialog } from '@/modules/listings/components/ListingReportDialog'
import { ListingInquiryDialog } from '@/modules/listings/components/ListingInquiryDialog'
import { openAuthSheet } from '@/lib/auth/authSheet'
import {
  MantineListingContactPattern,
  type MantineListingContactAgent,
  type MantineListingContactLabels,
  type MantineListingContactState,
} from '@/design-system/mantine/patterns'
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
  price: number
  currency: string
  /** Already in `currency`; passed only when the owner lowered the price. */
  priceOld?: number
  /** Pre-formatted original price string shown when price is converted */
  originalPrice?: string
  originalPriceLabel?: string
  listingStatus?: ListingStatus
  /** Listing ID required to enable Save-to-collection and Report. */
  listingId?: string
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

/**
 * Task 793 — leaves Tailwind onto the canonical `MantineListingContactPattern`. Renders in normal
 * document flow at every width (the pattern's own `pos: {base:'static', lg:'sticky'}`) — the
 * legacy `hidden lg:block` desktop wrapper and the `lg:hidden fixed` mobile bar are both deleted;
 * favorite and share left this card entirely for `MantineListingDetailPattern`'s badges row
 * (rendered directly by `ListingDetailView.tsx`, a Server Component — see `ListingShareButton.tsx`
 * for why share needed its own `'use client'` split, kickoff §3.1/§3.4).
 */
export function ListingContact({ owner, isGuest = false, listingTitle, price, currency, priceOld, originalPrice, originalPriceLabel, listingStatus, listingId, canReport = false, inquiryListingId, contactListingId, canSendInquiry = true, inquirerName, inquirerEmail }: ListingContactProps) {
  const t = useTranslations('listing')
  const locale = useLocale()
  const theme = useMantineTheme()
  // The channel whose gateway request is running (Task 923 R116, owner D74): only the pressed button shows the pending state.
  const [contactLoading, setContactLoading] = useState<'call' | 'whatsapp' | null>(null)
  // The human check of Call and WhatsApp (Task 923 R113, R86): invisible until Cloudflare asks for interaction; every press gets one fresh token.
  const humanCheckRef = useRef<CaptchaWidgetHandle>(null)
  // What the gateway answered (Task 923 R119, owner D75, D78). Both stay while the same viewer is signed in: a later press of the link needs no new request. The page keys this card by the viewer (R131), so a sign-out or another account starts it empty.
  // The number shown on the first button, and the WhatsApp link with its note when the click's activation had expired before the number arrived.
  const [revealedPhone, setRevealedPhone] = useState<{ label: string; href: string } | null>(null)
  const [whatsappFallback, setWhatsappFallback] = useState<{ href: string; label: string; note: string } | null>(null)

  const ownerDeleted = !!(owner.deleted_at)
  // owner.id is empty string in the fallback object — means no owner data was returned from DB.
  // For guests this is due to RLS, not because the owner deleted their account. A guest is not served the contact card (Call, WhatsApp,
  // Send message): only the sign-in call to action (owner decision D9, Task 923).
  const showGuestCTA = isGuest && !owner.id && !ownerDeleted
  // Authenticated viewer but owner row was genuinely null (e.g. orphaned listing).
  const ownerDataUnavailable = !isGuest && !owner.id && !ownerDeleted
  const listingClosed = listingStatus ? isListingClosed(listingStatus) : false
  const listingArchived = listingStatus ? isListingArchived(listingStatus) : false
  // Task 793 A4 (owner instruction, 2026-09-06; reversible assumption) — `expired` is in neither
  // VISIBILITY_DB_STATUSES group, so there is no `isListingExpired` domain helper. Direct status
  // comparison follows the existing precedent at `ListingCard.tsx:103`.
  const listingExpired = listingStatus === 'expired'
  // R11 (owner instruction, 2026-09-06), extended by F2 (owner instruction, 2026-09-06): archived,
  // expired AND closed (sold/rented) listings all keep the card visible with Call/WhatsApp/
  // Send-message disabled. F2 superseded the original kickoff's §3.5b split, under which
  // sold/rented kept Call/WhatsApp active — the owner reported those buttons still active on a
  // sold listing and ruled the lockout must cover CLOSED too. Favorite (badges row) already
  // covered all four (`ListingDetailView.tsx`'s `favoriteDisabled`); share stays enabled in all
  // four (unaffected by this predicate — it isn't gated by it).
  const contactLifecycleDisabled = listingArchived || listingExpired || listingClosed
  // Single label source (F2 — merges the former `closedLabel`/`contactDisabledLabel` pair) for
  // both the pattern's `closedListing` headline and the disabled Call/WhatsApp/Send-message title.
  const contactDisabledLabel = listingArchived
    ? t('action_disabled_archived')
    : listingExpired
      ? t('action_disabled_expired')
      : listingClosed && listingStatus
        ? t(`action_disabled_${listingStatus}` as 'action_disabled_sold' | 'action_disabled_rented')
        : undefined
  const initials = owner.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  // Trigger hidden for owner-deleted, owner-profile-unavailable (genuinely orphaned listing,
  // not the guest-RLS case), closed/archived/expired listings (all folded into
  // `contactLifecycleDisabled` since F2), and self-inquiry.
  const showInquiryTrigger = !ownerDeleted && !ownerDataUnavailable && !contactLifecycleDisabled && canSendInquiry

  /**
   * The human check, then the contact gateway (Task 923 R113 (d)): one fresh token per press, and the widget is reset after every answer because a Turnstile token is
   * single-use. Returns the number of the pressed channel, or null after the refusal toast: the check's own text when the gateway or the widget says the check failed,
   * the reveal-limit text when the gateway says `rate_limited` (Task 923 R127), the usual "could not load" text for every other refusal.
   */
  async function requestNumber(channel: 'whatsapp' | 'call'): Promise<string | null> {
    const check = humanCheckRef.current
    let captchaToken: string
    try {
      captchaToken = (await check?.getToken()) ?? ''
    } catch {
      toast.error(t('contact_bot_check_failed'))
      check?.reset()
      return null
    }
    try {
      const result = await revealListingContact({ listingId: contactListingId, channel, captchaToken, locale })
      if (result.ok) return result.number
      toast.error(t(result.reason === 'bot_check_failed' ? 'contact_bot_check_failed' : result.reason === 'rate_limited' ? 'contact_rate_limited' : 'contact_load_failed'))
      return null
    } catch {
      toast.error(t('contact_load_failed'))
      return null
    } finally {
      check?.reset()
    }
  }

  async function handleContactClick(type: 'whatsapp' | 'call') {
    if (!contactListingId || contactLoading) return
    // The pressed action shows Mantine's `loading`, which disables it and drops the focus to `body`: the focus goes back to it when the
    // request is over and it is enabled again (WCAG 2.4.3; Task 923 R33, owner D6), unless the person has moved it elsewhere meanwhile.
    const pressed = document.activeElement instanceof HTMLElement ? document.activeElement : null
    // After a reveal the pressed button is replaced by a link at the same place in its parent (Task 923 R121, F25): the focus follows it, so a keyboard or screen-reader user keeps their place.
    const slot = pressed?.parentElement ?? null
    const slotIndex = slot && pressed ? Array.prototype.indexOf.call(slot.children, pressed) : -1
    setContactLoading(type)
    try {
      const number = await requestNumber(type)
      if (number === null) return
      const digits = number.replace(/\D/g, '')
      if (!digits) { toast.error(t('contact_load_failed')); return }
      if (type === 'whatsapp') {
        // the contact event is recorded by the gateway on the server: no client call writes it
        const waText = encodeURIComponent(t('whatsapp_preset_message', { title: listingTitle }))
        const href = `https://wa.me/${digits}?text=${waText}`
        // A browser lets a script open a window only while the click's activation lasts (5.5 s in Chromium), and the check and the gateway can take longer: then the card
        // shows a link and says why, instead of a window that is silently blocked.
        const activation = typeof navigator === 'undefined' ? undefined : navigator.userActivation
        if (activation && !activation.isActive) {
          // committed at once (R121): the focus return below runs in the next frame and must find the pressed button already replaced
          flushSync(() => setWhatsappFallback({ href, label: t('open_whatsapp'), note: t('whatsapp_retry_hint') }))
        } else {
          window.open(href, '_blank', 'noopener,noreferrer')
        }
      } else {
        // the number is shown on its button, as a link that dials; the visitor decides to call (no window, no activation needed)
        flushSync(() => setRevealedPhone({ label: number.trim(), href: `tel:${digits}` }))
      }
    } finally {
      setContactLoading(null)
      requestAnimationFrame(() => {
        const active = document.activeElement
        if (pressed && pressed.isConnected && (!active || active === document.body)) pressed.focus()
        else if (pressed && !pressed.isConnected && (!active || active === document.body) && slot?.isConnected) {
          const replacement = slot.children[slotIndex]
          if (replacement instanceof HTMLElement && replacement.isConnected) replacement.focus()
        }
      })
    }
  }

  const patternState: MantineListingContactState = ownerDeleted
    ? 'ownerDeleted'
    : ownerDataUnavailable
      ? 'ownerUnavailable'
      : showGuestCTA
        ? 'guestCta'
        // F2 — sold/rented now render the pattern's `closedListing` headline (the reason,
        // e.g. "This listing has been sold") in addition to, not instead of, the disabled
        // Call/WhatsApp/Send-message controls `contactDisabled` drives (composed, not swapped —
        // the pattern renders both for `normal` and `closedListing` states).
        : listingClosed
          ? 'closedListing'
          : 'normal'

  const agent: MantineListingContactAgent = ownerDeleted
    ? { name: t('owner_deleted_label'), isVerified: false }
    : ownerDataUnavailable
      ? { name: t('owner_name_unavailable'), isVerified: false }
      : showGuestCTA
        ? { name: '', isVerified: false }
        : {
            name: owner.name ?? (owner.user_type === 'agent' && owner.company_name ? owner.company_name : t('owner_name_unavailable')),
            avatarUrl: owner.avatar_url,
            initials,
            isVerified: owner.is_verified,
            subtitle: owner.user_type === 'agent' ? (owner.company_name || t('agent_label')) : t('private_person'),
          }

  const labels: MantineListingContactLabels = {
    verified: t('verified_agent'),
    call: t('show_number'),
    whatsapp: t('whatsapp_button_label'),
    inquiry: t('send_message'),
    report: t('report_listing'),
    loginCta: t('contact_guest_cta'),
    guestTitle: t('contact_guest_title'),
    guestDesc: t('contact_guest_desc'),
    deletedTitle: t('owner_deleted'),
    deletedDesc: t('owner_deleted_desc'),
    unavailableDesc: t('owner_name_unavailable'),
    closedLabel: contactDisabledLabel ?? '',
  }

  const inquiryNode = contactLifecycleDisabled ? (
    <Button
      type="button"
      fullWidth
      variant="light"
      color="gray"
      disabled
      aria-disabled="true"
      title={contactDisabledLabel}
      leftSection={<MessageCircle size={theme.other.iconSize.standard} />}
    >
      {t('send_message')}
    </Button>
  ) : showInquiryTrigger ? (
    <ListingInquiryDialog
      listingId={inquiryListingId}
      listingTitle={listingTitle}
      defaultName={inquirerName}
      defaultEmail={inquirerEmail}
      trigger={
        <Button type="button" fullWidth variant="filled" color="chat" leftSection={<MessageCircle size={theme.other.iconSize.standard} />} data-track="contact_owner">
          {t('send_message')}
        </Button>
      }
    />
  ) : undefined

  return (
    <MantineListingContactPattern
      state={patternState}
      agent={agent}
      price={{
        price: formatPrice(price, currency, locale),
        priceOld: priceOld != null ? formatPrice(priceOld, currency, locale) : undefined,
        originalPrice,
        originalPriceLabel,
      }}
      labels={labels}
      hasPhone={owner.has_phone}
      hasWhatsapp={owner.has_whatsapp}
      onCall={() => handleContactClick('call')}
      onWhatsApp={() => handleContactClick('whatsapp')}
      onLogin={() => openAuthSheet('login')}
      loading={contactLoading ?? undefined}
      revealedPhone={revealedPhone ?? undefined}
      whatsappFallback={whatsappFallback ?? undefined}
      humanCheck={<CaptchaWidget ref={humanCheckRef} appearance="interaction-only" action={CONTACT_ACTIONS.reveal} prefetch />}
      contactDisabled={contactLifecycleDisabled}
      contactDisabledLabel={contactDisabledLabel}
      inquiryTrigger={inquiryNode}
      saveTrigger={listingId ? <SaveToCollectionButton listingId={listingId} /> : undefined}
      reportTrigger={canReport && listingId ? <ListingReportDialog listingId={listingId} /> : undefined}
    />
  )
}
