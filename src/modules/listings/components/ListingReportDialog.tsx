'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Flag, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { reportListingAction } from '@/modules/listings/actions/reportListing'
import type { ReportReason } from '@/types/database'

const REASONS: ReportReason[] = [
  'spam', 'fraud', 'duplicate', 'wrong_category', 'offensive', 'other',
]

const REASON_KEY: Record<ReportReason, string> = {
  spam:           'report_reason_spam',
  fraud:          'report_reason_fraud',
  duplicate:      'report_reason_duplicate',
  wrong_category: 'report_reason_wrong_category',
  offensive:      'report_reason_offensive',
  other:          'report_reason_other',
}

interface Props {
  listingId: string
}

export function ListingReportDialog({ listingId }: Props) {
  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setReason(null)
    setComment('')
    setOpen(true)
  }

  function handleSubmit() {
    if (!reason) return
    startTransition(async () => {
      let result: { error?: string }
      try {
        result = await reportListingAction(listingId, reason, comment)
      } catch {
        toast.error(t('report_err_connection'))
        return
      }
      if (result.error === 'already_reported') {
        toast.info(t('report_already_reported'))
        setOpen(false)
        return
      }
      if (result.error === 'unauthorized') {
        toast.error(t('report_err_unauthorized'))
        return
      }
      if (result.error === 'account_blocked') {
        toast.error(t('report_err_restricted'))
        return
      }
      if (result.error === 'account_suspended') {
        toast.error(t('report_err_suspended'))
        return
      }
      if (result.error) {
        toast.error(t('report_err_server'))
        return
      }
      toast.success(t('report_success'))
      setOpen(false)
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="default"
        onClick={handleOpen}
        className="gap-1.5 text-muted-foreground hover:text-foreground text-xs"
      >
        <Flag className="h-3.5 w-3.5 shrink-0" />
        {t('report_listing')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('report_dialog_title')}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Reason selector */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">{t('report_reason_label')}</Label>
              <div className="flex flex-col gap-1.5">
                {REASONS.map(r => (
                  <Button
                    key={r}
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setReason(r)}
                    className={cn(
                      'px-3 rounded-xl text-sm justify-start',
                      reason === r
                        ? 'bg-primary/10 text-primary border-primary/40 font-medium hover:bg-primary/10 hover:text-primary'
                        : 'border-border hover:border-primary/40',
                    )}
                  >
                    {t(REASON_KEY[r] as Parameters<typeof t>[0])}
                  </Button>
                ))}
              </div>
            </div>

            {/* Optional comment */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm">{t('report_comment_label')}</Label>
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={t('report_comment_placeholder')}
                rows={3}
                maxLength={500}
                className="rounded-xl resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground text-right">{comment.length}/500</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {tc('cancel')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={!reason || isPending}
                className="gap-1.5"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />}
                {t('report_submit')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
