'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { submitListingInquiry } from '@/modules/listings/actions/submitListingInquiry'

interface Props {
  listingId: string
  listingTitle: string
  defaultName?: string
  defaultEmail?: string
  trigger: React.ReactElement
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ListingInquiryDialog({ listingId, defaultName, defaultEmail, trigger }: Props) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(defaultName ?? '')
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const canSubmit = name.trim().length > 0
    && EMAIL_PATTERN.test(email.trim())
    && message.trim().length >= 20

  function handleOpenChange(next: boolean) {
    if (next) {
      setName(defaultName ?? '')
      setEmail(defaultEmail ?? '')
      setMessage('')
    }
    setOpen(next)
  }

  function handleSubmit() {
    if (!canSubmit || isPending) return
    startTransition(async () => {
      const result = await submitListingInquiry({ listingId, name, email, message })

      if (result.error === 'rate_limited') {
        toast.error(t('inquiry_error_rate_limited'))
        return
      }
      if (result.error === 'validation') {
        toast.error(t('inquiry_error_validation'))
        return
      }
      if (result.error === 'not_found') {
        toast.error(t('inquiry_error_not_found'))
        return
      }
      if (result.error === 'owner_unavailable') {
        toast.error(t('inquiry_error_owner_unavailable'))
        return
      }
      if (result.error === 'save_failed') {
        toast.error(t('inquiry_error_save_failed'))
        return
      }
      if (result.error === 'email_transient') {
        // Row is already persisted — treat as partial success, not a retryable
        // error (resubmitting would create a duplicate inquiry; no dedup guard).
        toast.success(t('inquiry_success_email_pending'))
        setOpen(false)
        return
      }

      toast.success(t('inquiry_success'))
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('inquiry_dialog_title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inquiry-name">{t('inquiry_name_label')}</Label>
            <Input
              id="inquiry-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('inquiry_name_placeholder')}
              maxLength={200}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inquiry-email">{t('inquiry_email_label')}</Label>
            <Input
              id="inquiry-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('inquiry_email_placeholder')}
              maxLength={200}
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inquiry-message">{t('inquiry_message_label')}</Label>
            <Textarea
              id="inquiry-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('inquiry_message_placeholder')}
              rows={5}
              maxLength={5000}
              className="w-full resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="max-sm:w-full"
          >
            {tc('cancel')}
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className="gap-1.5 max-sm:w-full"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
            {t('inquiry_submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
