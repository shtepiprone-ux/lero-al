'use client'

import { useTranslations } from 'next-intl'
import { Button, SimpleGrid, TextInput } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'

export interface CurrencyFormValues {
  code: string
  symbol: string
  nameSq: string
  nameEn: string
  nameUk: string
  nameIt: string
  decimals: number
}

export interface CurrencyFormDialogViewProps {
  opened: boolean
  isEdit: boolean
  values: CurrencyFormValues
  onFieldChange: <K extends keyof CurrencyFormValues>(field: K, value: CurrencyFormValues[K]) => void
  submitting: boolean
  onSubmit: () => void
  onClose: () => void
}

/**
 * Presentational View for the currency create/edit dialog (Task 877, Container/Presentational split of
 * `CurrencyFormDialog`; Task 859 Revision 2, R29). A structured `MantineModal` (centred from 640px, bottom sheet
 * below): the identity fields and the names in `MantineDialogSections`, and a `MantineDialogFooter` pair — Cancel
 * and Save (the one primary). No hooks beyond `useTranslations`, no server action, no `toast`: the container owns
 * every value (including the upper-casing of `code`) and the submit.
 */
export function CurrencyFormDialogView({
  opened,
  isEdit,
  values,
  onFieldChange,
  submitting,
  onSubmit,
  onClose,
}: CurrencyFormDialogViewProps) {
  const t = useTranslations('admin.currency.currencies')

  return (
    <MantineModal
      opened={opened}
      onClose={onClose}
      structured
      title={isEdit ? t('edit') : t('new')}
      footer={
        <MantineDialogFooter
          secondary={<Button type="button" variant="default" disabled={submitting} onClick={onClose}>{t('cancel')}</Button>}
          primary={<Button type="button" loading={submitting} onClick={onSubmit}>{t('save')}</Button>}
        />
      }
    >
      <MantineDialogSections>
        <MantineDialogSection>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label={t('code')}
              placeholder="EUR"
              maxLength={10}
              disabled={isEdit}
              value={values.code}
              onChange={e => onFieldChange('code', e.target.value)}
            />
            <TextInput
              label={t('symbol')}
              placeholder="€"
              maxLength={10}
              value={values.symbol}
              onChange={e => onFieldChange('symbol', e.target.value)}
            />
          </SimpleGrid>
          <TextInput
            type="number"
            min={0}
            max={8}
            label={t('decimals')}
            value={values.decimals}
            onChange={e => onFieldChange('decimals', Number(e.target.value))}
          />
        </MantineDialogSection>
        <MantineDialogSection>
          <TextInput label={t('name_sq')} value={values.nameSq} onChange={e => onFieldChange('nameSq', e.target.value)} />
          <TextInput label={t('name_en')} value={values.nameEn} onChange={e => onFieldChange('nameEn', e.target.value)} />
          <TextInput label={t('name_uk')} value={values.nameUk} onChange={e => onFieldChange('nameUk', e.target.value)} />
          <TextInput label={t('name_it')} value={values.nameIt} onChange={e => onFieldChange('nameIt', e.target.value)} />
        </MantineDialogSection>
      </MantineDialogSections>
    </MantineModal>
  )
}
