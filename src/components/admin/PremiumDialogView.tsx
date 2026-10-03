'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Star, Trash2 } from 'lucide-react'
import { Button, Group, Radio, Stack, Text, useMantineTheme } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineDetailList } from '@/design-system/mantine/patterns/MantineDetailList'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
import { RangeDatePicker, type DateRange } from '@/design-system/mantine/patterns/RangeDatePicker'
import { formatListingDate } from '@/lib/formatters'

/** A quick preset (`days` from now). */
export interface PremiumPreset {
  label: string
  days: number
}

/** The `Radio.Group` value of the custom-date option; a preset's value is its `days` as a string. */
export const PREMIUM_CUSTOM_CHOICE = 'custom'

export interface PremiumDialogViewProps {
  listingTitle: string
  isPremium: boolean
  /** When the current premium ends (ISO), or null. A premium listing with no end date reads as "Not premium". */
  premiumUntil: string | null
  presets: PremiumPreset[]
  /** The chosen option: a preset's `days` as a string, `PREMIUM_CUSTOM_CHOICE`, or empty when none is chosen. */
  choice: string
  /** The picked custom day as `YYYY-MM-DD`, or empty when none is picked. */
  customDate: string
  /** A save is in flight: every action disables and Save shows a spinner. */
  saving: boolean
  onChoiceChange: (choice: string) => void
  onCustomDateChange: (date: string) => void
  onSave: () => void
  onRemove: () => void
  onClose: () => void
}

/**
 * Presentational View of the premium dialog (Task 857, Container/Presentational split of `AdminListingsTable`),
 * built only from the canonical dialog anatomy (`docs/mantine-responsive-design-system.md` §23.7): a structured
 * `MantineModal` with a star tile, the listing title as its description, and sections — the current premium state as
 * `MantineDetailList`, the duration as `Radio.Card`s (a choice is a control, §23.6) whose custom card reveals the
 * canonical `RangeDatePicker` (`selectionMode="single"`, past days disabled), and the lone destructive text button
 * "Remove premium" — plus a `MantineDialogFooter` pair: Cancel (secondary) and Save (the one primary, disabled until
 * a choice is made). `useTranslations` / `useLocale` / `useMantineTheme` only: no state, no server action, no toast.
 */
export function PremiumDialogView({
  listingTitle,
  isPremium,
  premiumUntil,
  presets,
  choice,
  customDate,
  saving,
  onChoiceChange,
  onCustomDateChange,
  onSave,
  onRemove,
  onClose,
}: PremiumDialogViewProps) {
  const t = useTranslations('admin.listings')
  const tc = useTranslations('common')
  const locale = useLocale()
  const theme = useMantineTheme()
  const iconSize = theme.other.iconSize.standard

  const pickerValue: DateRange = customDate ? { from: customDate, to: customDate } : { from: undefined, to: undefined }
  const isCustom = choice === PREMIUM_CUSTOM_CHOICE
  const canSave = isCustom ? Boolean(customDate) : choice !== ''
  const premiumState = isPremium && premiumUntil
    ? t('premium_active_until', { date: formatListingDate(premiumUntil, locale) })
    : t('premium_inactive')

  const choiceCard = (value: string, label: string) => (
    <Radio.Card key={value} value={value} disabled={saving}>
      <Group wrap="nowrap" gap="sm">
        <Radio.Indicator disabled={saving} />
        <Text component="span" fz="sm" fw={500}>{label}</Text>
      </Group>
    </Radio.Card>
  )

  const footer = (
    <MantineDialogFooter
      secondary={
        <Button type="button" variant="default" disabled={saving} onClick={onClose}>
          {tc('cancel')}
        </Button>
      }
      primary={
        <Button type="button" loading={saving} disabled={!canSave || saving} onClick={onSave}>
          {tc('save')}
        </Button>
      }
    />
  )

  return (
    <MantineModal
      opened
      onClose={onClose}
      structured
      size="md"
      icon={<Star size={iconSize} />}
      title={t('premium_dialog_title')}
      description={listingTitle}
      footer={footer}
    >
      <MantineDialogSections>
        {isPremium && (
          <MantineDialogSection>
            <MantineDetailList items={[{ label: t('premium_badge'), value: premiumState }]} />
          </MantineDialogSection>
        )}
        <MantineDialogSection title={t('premium_quick_label')}>
          <Radio.Group value={choice} onChange={onChoiceChange}>
            <Stack gap="xs">
              {presets.map(p => choiceCard(String(p.days), p.label))}
              {choiceCard(PREMIUM_CUSTOM_CHOICE, t('premium_custom_date'))}
            </Stack>
          </Radio.Group>
          {isCustom && (
            <RangeDatePicker
              selectionMode="single"
              disablePastDates
              value={pickerValue}
              onChange={next => onCustomDateChange(next.from ?? '')}
            />
          )}
        </MantineDialogSection>
        {isPremium && (
          <MantineDialogSection>
            <Group>
              <Button
                type="button"
                variant="subtle"
                color="red"
                leftSection={<Trash2 size={iconSize} />}
                disabled={saving}
                onClick={onRemove}
              >
                {t('premium_remove')}
              </Button>
            </Group>
          </MantineDialogSection>
        )}
      </MantineDialogSections>
    </MantineModal>
  )
}
