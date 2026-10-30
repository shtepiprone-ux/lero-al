'use client'

import { cloneElement, useRef, useState, useTransition } from 'react'
import type { MouseEvent, ReactElement } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from '@/lib/toast'
import { openAuthSheet } from '@/lib/auth/authSheet'
import { CaptchaWidget, type CaptchaWidgetHandle } from '@/components/auth/CaptchaWidget'
import { submitListingInquiry } from '@/modules/listings/actions/submitListingInquiry'
import { CONTACT_ACTIONS } from '@/modules/listings/lib/contactActions'
import { ListingInquiryDialogView } from '@/modules/listings/components/ListingInquiryDialogView'

interface Props {
  listingId: string
  listingTitle: string
  defaultName?: string
  defaultEmail?: string
  trigger: ReactElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void }>
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * The message dialog of the listing contact card (container of `ListingInquiryDialogView`, Task 923 R41 / R42). It owns the typed values and
 * the action call, and gives every answer of `submitListingInquiry` exactly one outcome: a success toast appears only for no error and for
 * `email_transient`; every other answer is an error toast. An ended session (`unauthenticated`) closes the dialog, keeps what was typed and
 * opens the sign-in sheet, so only one sheet is open at a time; the next opening shows the kept values.
 * Task 923 R113 (e), R86: a send first asks the human check (the interaction-only `CaptchaWidget`) for a fresh token and passes it to the action; a failed check (the
 * widget's rejection or the action's `bot_check_failed`) shows its own error toast and keeps the dialog open with every typed value.
 */
export function ListingInquiryDialog({ listingId, defaultName, defaultEmail, trigger }: Props) {
  const t = useTranslations('listing')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(defaultName ?? '')
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  // Set when the dialog closed because the session ended: the next opening keeps the typed values.
  const keepDraft = useRef(false)
  // The human check inside the dialog: invisible until Cloudflare asks for interaction; every send gets one fresh token.
  const humanCheckRef = useRef<CaptchaWidgetHandle>(null)

  const canSubmit = name.trim().length > 0
    && EMAIL_PATTERN.test(email.trim())
    && message.trim().length >= 20

  function handleOpen() {
    if (keepDraft.current) {
      keepDraft.current = false
      setName(current => current.trim() ? current : (defaultName ?? ''))
      setEmail(current => current.trim() ? current : (defaultEmail ?? ''))
    } else {
      setName(defaultName ?? '')
      setEmail(defaultEmail ?? '')
      setMessage('')
    }
    setOpen(true)
  }

  function handleSubmit() {
    if (!canSubmit || isPending) return
    // The token is requested here, in the click handler, and awaited inside the transition below. `getToken()` starts the widget, which shows its challenge through a state
    // update of its own; started inside `startTransition(async …)` that update would wait for the whole transition, and the challenge would stay hidden while the person has
    // to solve it (measured on the running site, Task 923 R114 (h)).
    const check = humanCheckRef.current
    const tokenRequest = check?.getToken()
    startTransition(async () => {
      let captchaToken: string
      try {
        captchaToken = (await tokenRequest) ?? ''
      } catch {
        // the challenge timed out or failed: nothing is sent, the dialog stays open with what was typed
        toast.error(t('contact_bot_check_failed'))
        check?.reset()
        return
      }
      let result: Awaited<ReturnType<typeof submitListingInquiry>>
      try {
        result = await submitListingInquiry({ listingId, name, email, message, captchaToken })
      } finally {
        // a Turnstile token is single-use: the next send asks for a new one
        check?.reset()
      }

      switch (result.error) {
        case undefined:
          toast.success(t('inquiry_success'))
          setMessage('')
          setOpen(false)
          return
        case 'email_transient':
          // Row is already persisted — treat as partial success, not a retryable
          // error (resubmitting would create a duplicate inquiry; no dedup guard).
          toast.success(t('inquiry_success_email_pending'))
          setOpen(false)
          return
        case 'bot_check_failed':
          toast.error(t('contact_bot_check_failed'))
          return
        case 'rate_limited':
          toast.error(t('inquiry_error_rate_limited'))
          return
        case 'validation':
          toast.error(t('inquiry_error_validation'))
          return
        case 'not_found':
          toast.error(t('inquiry_error_not_found'))
          return
        case 'owner_unavailable':
          toast.error(t('inquiry_error_owner_unavailable'))
          return
        case 'unauthenticated':
          // The session ended: one sheet at a time (Apple HIG) — close this dialog, keep the text, then ask to sign in.
          toast.error(t('inquiry_error_unauthenticated'))
          keepDraft.current = true
          setOpen(false)
          openAuthSheet('login')
          return
        default:
          // `save_failed` and any answer this dialog does not know: never shown as a sent message.
          toast.error(t('inquiry_error_save_failed'))
      }
    })
  }

  return (
    <>
      {cloneElement(trigger, {
        onClick: (event: MouseEvent<HTMLElement>) => {
          trigger.props.onClick?.(event)
          handleOpen()
        },
      })}
      <ListingInquiryDialogView
        opened={open}
        name={name}
        email={email}
        message={message}
        onNameChange={setName}
        onEmailChange={setEmail}
        onMessageChange={setMessage}
        canSubmit={canSubmit}
        pending={isPending}
        humanCheck={<CaptchaWidget ref={humanCheckRef} appearance="interaction-only" action={CONTACT_ACTIONS.inquiry} />}
        onSubmit={handleSubmit}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
