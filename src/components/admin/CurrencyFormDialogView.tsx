'use client'

import { useTranslations } from 'next-intl'
import { Button, Flex, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns'

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
 * `CurrencyFormDialog`). No hooks beyond `useTranslations`, no server action, no `toast`: the container owns
 * every value (including the upper-casing of `code`) and the submit. Renders in the canonical `MantineModal`
 * (centred from 640px, bottom sheet below).
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
      title={isEdit ? t('edit') : t('new')}
      footer={
        <Flex direction={{ base: 'column-reverse', sm: 'row' }} gap="sm" justify={{ base: 'stretch', sm: 'flex-end' }}>
          <Button variant="outline" color="gray" w={{ base: '100%', sm: 'auto' }} disabled={submitting} onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button color="brand" w={{ base: '100%', sm: 'auto' }} loading={submitting} onClick={onSubmit}>
            {t('save')}
          </Button>
        </Flex>
      }
    >
      <Stack gap="md">
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
        <TextInput label={t('name_sq')} value={values.nameSq} onChange={e => onFieldChange('nameSq', e.target.value)} />
        <TextInput label={t('name_en')} value={values.nameEn} onChange={e => onFieldChange('nameEn', e.target.value)} />
        <TextInput label={t('name_uk')} value={values.nameUk} onChange={e => onFieldChange('nameUk', e.target.value)} />
        <TextInput label={t('name_it')} value={values.nameIt} onChange={e => onFieldChange('nameIt', e.target.value)} />
        <TextInput
          type="number"
          min={0}
          max={8}
          label={t('decimals')}
          value={values.decimals}
          onChange={e => onFieldChange('decimals', Number(e.target.value))}
        />
      </Stack>
    </MantineModal>
  )
}
