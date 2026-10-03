'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PremiumDialogView, PREMIUM_CUSTOM_CHOICE } from '@/components/admin/PremiumDialogView'
import type { AdminListing } from '@/components/admin/AdminListingsTable'
import { setListingPremium } from '@/modules/admin/actions'
import { toast } from '@/lib/toast'

interface Props {
  listing: AdminListing
  onClose: () => void
  onDone: () => void
}

/**
 * Container of the premium dialog (Task 857): the chosen option, custom-date and saving state, the
 * `setListingPremium` call and its toasts. Save applies the chosen preset (`until = now + days`) or the picked
 * custom day (`YYYY-MM-DD`, the same ISO `until` as before); choosing a preset alone calls nothing. The UI is `PremiumDialogView`.
 */
export function PremiumDialog({ listing, onClose, onDone }: Props) {
  const t = useTranslations('admin.listings')
  const [choice, setChoice] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [saving, setSaving] = useState(false)

  const presets = [
    { label: t('preset_1m'), days: 30 },
    { label: t('preset_3m'), days: 90 },
    { label: t('preset_6m'), days: 180 },
    { label: t('preset_1y'), days: 365 },
  ]

  function premiumErrToastKey(error: string) {
    if (error === 'db_missing_column') return 'premium_error_db_schema'
    return `premium_error_${error}`
  }

  async function apply(days?: number) {
    setSaving(true)
    let until: string | null = null
    if (days) {
      until = new Date(Date.now() + days * 86400000).toISOString()
    } else if (customDate) {
      try {
        until = new Date(customDate).toISOString()
      } catch {
        toast.error(t('premium_error_date_invalid'))
        setSaving(false)
        return
      }
    }
    const result = await setListingPremium(listing.id, true, until)
    setSaving(false)
    if ('error' in result) {
      toast.error(t(premiumErrToastKey(result.error) as Parameters<typeof t>[0]))
      return
    }
    toast.success(t('premium_success'))
    onDone()
  }

  function save() {
    if (choice === PREMIUM_CUSTOM_CHOICE) return apply()
    const days = Number(choice)
    if (days) return apply(days)
  }

  async function remove() {
    setSaving(true)
    const result = await setListingPremium(listing.id, false, null)
    setSaving(false)
    if ('error' in result) {
      toast.error(t(premiumErrToastKey(result.error) as Parameters<typeof t>[0]))
      return
    }
    toast.success(t('premium_removed_success'))
    onDone()
  }

  return (
    <PremiumDialogView
      listingTitle={listing.title}
      isPremium={listing.is_premium}
      premiumUntil={listing.premium_until ?? null}
      presets={presets}
      choice={choice}
      customDate={customDate}
      saving={saving}
      onChoiceChange={setChoice}
      onCustomDateChange={setCustomDate}
      onSave={save}
      onRemove={remove}
      onClose={onClose}
    />
  )
}
