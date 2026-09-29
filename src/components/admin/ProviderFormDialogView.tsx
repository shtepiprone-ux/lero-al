'use client'

import { useTranslations } from 'next-intl'
import { Button, Flex, Input, PasswordInput, SegmentedControl, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns'

export type ProviderMode = 'auto' | 'manual' | 'hybrid'

export interface ProviderFormValues {
  name: string
  endpoint: string
  apiKey: string
  interval: number
  priority: number
  mode: ProviderMode
  notes: string
}

export interface ProviderFormDialogViewProps {
  opened: boolean
  isEdit: boolean
  values: ProviderFormValues
  onFieldChange: <K extends keyof ProviderFormValues>(field: K, value: ProviderFormValues[K]) => void
  apiKeyVisible: boolean
  onApiKeyVisibilityChange: (visible: boolean) => void
  submitting: boolean
  onSubmit: () => void
  onClose: () => void
}

const MODES: ProviderMode[] = ['auto', 'manual', 'hybrid']

/**
 * Presentational View for the exchange-provider create/edit dialog (Task 874, Container/Presentational
 * split of `ProviderFormDialog`). No hooks beyond `useTranslations`, no server action, no `toast`:
 * every value and transition is decided by the container and handed down as props. Renders inside the
 * canonical `MantineModal` (centred from 640px, bottom sheet below); all visual values come from Mantine
 * props and the theme.
 */
export function ProviderFormDialogView({
  opened,
  isEdit,
  values,
  onFieldChange,
  apiKeyVisible,
  onApiKeyVisibilityChange,
  submitting,
  onSubmit,
  onClose,
}: ProviderFormDialogViewProps) {
  const t = useTranslations('admin.currency.providers')
  const tc = useTranslations('common')

  return (
    <MantineModal
      opened={opened}
      onClose={onClose}
      title={isEdit ? t('edit') : t('new')}
      footer={
        <Flex
          direction={{ base: 'column-reverse', sm: 'row' }}
          gap="sm"
          justify={{ base: 'stretch', sm: 'flex-end' }}
        >
          <Button
            variant="outline"
            color="gray"
            w={{ base: '100%', sm: 'auto' }}
            disabled={submitting}
            onClick={onClose}
          >
            {t('cancel')}
          </Button>
          <Button
            color="brand"
            w={{ base: '100%', sm: 'auto' }}
            loading={submitting}
            onClick={onSubmit}
          >
            {t('save')}
          </Button>
        </Flex>
      }
    >
      <Stack gap="md">
        <TextInput
          label={t('name')}
          value={values.name}
          onChange={e => onFieldChange('name', e.target.value)}
        />

        <TextInput
          label={t('endpoint')}
          placeholder="https://"
          value={values.endpoint}
          onChange={e => onFieldChange('endpoint', e.target.value)}
        />

        <PasswordInput
          label={t('api_key')}
          placeholder={t('api_key_placeholder')}
          value={values.apiKey}
          onChange={e => onFieldChange('apiKey', e.target.value)}
          visible={apiKeyVisible}
          onVisibilityChange={onApiKeyVisibilityChange}
          visibilityToggleButtonProps={{ 'aria-label': apiKeyVisible ? tc('hide_password') : tc('show_password') }}
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            type="number"
            min={1}
            label={t('refresh_interval')}
            value={values.interval}
            onChange={e => onFieldChange('interval', Number(e.target.value))}
          />
          <TextInput
            type="number"
            min={1}
            label={t('priority')}
            value={values.priority}
            onChange={e => onFieldChange('priority', Number(e.target.value))}
          />
        </SimpleGrid>

        <Input.Wrapper label={t('mode')}>
          <SegmentedControl
            fullWidth
            value={values.mode}
            onChange={value => onFieldChange('mode', value as ProviderMode)}
            data={MODES.map(m => ({ value: m, label: t(`mode_${m}`) }))}
          />
        </Input.Wrapper>

        <TextInput
          label={t('notes')}
          value={values.notes}
          onChange={e => onFieldChange('notes', e.target.value)}
        />
      </Stack>
    </MantineModal>
  )
}
