'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { clearRecentlyViewed } from '../actions/recentlyViewedActions'

export function ClearRecentlyViewedButton() {
  const t = useTranslations('listing')
  const tc = useTranslations('common')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function handleConfirm() {
    setClearing(true)
    try {
      await clearRecentlyViewed()
      setOpen(false)
      toast.success(t('recently_viewed_cleared'))
      router.refresh()
    } catch {
      toast.error(t('recently_viewed_clear_error'))
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4 shrink-0" />
        {t('recently_viewed_clear')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('recently_viewed_clear_title')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('recently_viewed_clear_body')}</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={clearing}
            >
              {tc('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={clearing}
              className="gap-1.5"
            >
              {clearing && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('recently_viewed_clear_confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
