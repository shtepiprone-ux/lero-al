'use client'

import { useTranslations } from 'next-intl'
import { Pencil, Star, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { Badge, Box, Button, Flex, Group, SimpleGrid, Stack, Text, useMantineTheme } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns'
import type { DBCurrency } from '@/types/database'

export interface CurrencyDetailDialogViewProps {
  currency: DBCurrency
  onClose: () => void
  onEdit: () => void
  onToggleActive: () => void
  onSetDefault: () => void
  onDelete: () => void
}

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <Box>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" c="gray.7">{value}</Text>
    </Box>
  )
}

/**
 * Presentational View for the currency detail dialog (Task 877, Container/Presentational split of
 * `AdminCurrenciesManager`; was the internal `CurrencyDetailDialog`). No server action, no `toast`: every
 * transition is a callback the container owns. Renders in the canonical `MantineModal`; the badges follow
 * TailAdmin §6 (`light`, `sm`): default = brand, active/inactive = green/gray.
 */
export function CurrencyDetailDialogView({
  currency,
  onClose,
  onEdit,
  onToggleActive,
  onSetDefault,
  onDelete,
}: CurrencyDetailDialogViewProps) {
  const t = useTranslations('admin.currency.currencies')
  const theme = useMantineTheme()
  const iconSize = theme.other.iconSize.compact

  return (
    <MantineModal
      opened
      onClose={onClose}
      title={<Text component="span" ff="monospace" fw={600} inherit>{currency.code}</Text>}
      footer={
        // Revision 5 (O78-6b return): the footer keeps ONLY "Edit". The dialog still closes with the header ✕,
        // Escape and an overlay tap (a bottom sheet's own dismissal below 640px); "Close" is gone.
        <Flex justify={{ base: 'stretch', sm: 'flex-end' }}>
          <Button w={{ base: '100%', sm: 'auto' }} leftSection={<Pencil size={iconSize} />} onClick={onEdit}>
            {t('edit')}
          </Button>
        </Flex>
      }
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">{currency.name_en || currency.name_sq}</Text>
        {/* Revision 3 (O78-6 return): all six fields in ONE two-column grid, so both columns are filled. */}
        <SimpleGrid cols={2} spacing="md">
          <Field label={t('symbol')} value={currency.symbol} />
          <Field label={t('decimals')} value={currency.decimals} />
          <Field label={t('name_sq')} value={currency.name_sq} />
          <Field label={t('name_en')} value={currency.name_en} />
          <Field label={t('name_uk')} value={currency.name_uk} />
          <Field label={t('name_it')} value={currency.name_it} />
        </SimpleGrid>
        <Group gap="xs">
          {currency.is_default && <Badge size="sm" variant="light" color="brand">{t('default_badge')}</Badge>}
          <Badge size="sm" variant="light" color={currency.is_active ? 'green' : 'gray'}>
            {currency.is_active ? t('is_active') : t('deactivate')}
          </Badge>
        </Group>
        {/* Revisions 5–6: the three state actions are transparent text buttons with an icon (TailAdmin §6a-link) in a
            vertical list directly below the badges, ONE BUTTON PER LINE, left-aligned, each as wide as its own
            label. The toggle always renders, so the list always does. */}
        <Stack gap={0} align="flex-start">
          {!currency.is_default && currency.is_active && (
            <Button
              variant="transparent"
              mih={theme.other.touchTarget}
              leftSection={<Star size={iconSize} />}
              onClick={onSetDefault}
            >
              {t('set_default')}
            </Button>
          )}
          <Button
            variant="transparent"
            mih={theme.other.touchTarget}
            leftSection={currency.is_active ? <ToggleLeft size={iconSize} /> : <ToggleRight size={iconSize} />}
            onClick={onToggleActive}
          >
            {currency.is_active ? t('deactivate') : t('activate')}
          </Button>
          {!currency.is_default && (
            <Button
              variant="transparent"
              color="red"
              mih={theme.other.touchTarget}
              leftSection={<Trash2 size={iconSize} />}
              onClick={onDelete}
            >
              {t('delete')}
            </Button>
          )}
        </Stack>
      </Stack>
    </MantineModal>
  )
}
