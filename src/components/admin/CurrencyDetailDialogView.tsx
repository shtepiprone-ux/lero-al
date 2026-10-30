'use client'

import { useTranslations } from 'next-intl'
import { PauseCircleIcon, PenIcon, PlayCircleIcon, StarIcon, TrashBinTrashIcon } from '@solar-icons/react/broken'
import { Button, Group, useMantineTheme } from '@mantine/core'
import { MantineModal } from '@/design-system/mantine/patterns/MantineModal'
import { MantineDialogSections, MantineDialogSection } from '@/design-system/mantine/patterns/MantineDialogSections'
import { MantineDetailList } from '@/design-system/mantine/patterns/MantineDetailList'
import { MantineNavRowList, type MantineNavRow } from '@/design-system/mantine/patterns/MantineNavRowList'
import { MantineDialogFooter } from '@/design-system/mantine/patterns/MantineDialogFooter'
import type { DBCurrency } from '@/types/database'
import { MantineBadge } from '@/design-system/mantine/patterns/MantineBadge'

export interface CurrencyDetailDialogViewProps {
  currency: DBCurrency
  onClose: () => void
  onEdit: () => void
  onToggleActive: () => void
  onSetDefault: () => void
  onDelete: () => void
}

/**
 * Presentational View for the currency detail dialog (Task 877, Container/Presentational split of
 * `AdminCurrenciesManager`; Task 859 Revision 2, R29: the canonical dialog anatomy, §23.7). A structured
 * `MantineModal` (bottom sheet below 640px): the facts as `MantineDetailList`, the state actions (set default,
 * activate / deactivate) as `MantineNavRowList` rows, and a `MantineDialogFooter` pair: Delete (the resting
 * destructive action, secondary, only for a non-default currency) and Edit (the one primary). No server action, no
 * `toast`: every transition is a callback the container owns.
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
  const iconSize = theme.other.iconSize.standard

  const navRows: MantineNavRow[] = [
    ...(!currency.is_default && currency.is_active
      ? [{ key: 'default', icon: <StarIcon size={iconSize} aria-hidden="true" />, label: t('set_default'), onClick: onSetDefault }]
      : []),
    {
      key: 'toggle',
      icon: currency.is_active
        ? <PauseCircleIcon size={iconSize} aria-hidden="true" />
        : <PlayCircleIcon size={iconSize} aria-hidden="true" />,
      label: currency.is_active ? t('deactivate') : t('activate'),
      onClick: onToggleActive,
    },
  ]

  return (
    <MantineModal
      opened
      onClose={onClose}
      structured
      title={currency.code}
      description={currency.name_en || currency.name_sq}
      footer={
        <MantineDialogFooter
          secondary={
            currency.is_default ? undefined : (
              <Button
                type="button"
                variant="default"
                c="red.7"
                leftSection={<TrashBinTrashIcon size={iconSize} aria-hidden="true" />}
                onClick={onDelete}
              >
                {t('delete')}
              </Button>
            )
          }
          primary={
            <Button type="button" leftSection={<PenIcon size={iconSize} aria-hidden="true" />} onClick={onEdit}>
              {t('edit')}
            </Button>
          }
        />
      }
    >
      <MantineDialogSections>
        <MantineDialogSection>
          <MantineDetailList
            items={[
              { label: t('symbol'), value: currency.symbol },
              { label: t('decimals'), value: currency.decimals },
              { label: t('name_sq'), value: currency.name_sq },
              { label: t('name_en'), value: currency.name_en },
              { label: t('name_uk'), value: currency.name_uk },
              { label: t('name_it'), value: currency.name_it },
              {
                label: t('is_active'),
                value: (
                  <Group gap="xs" justify="flex-end">
                    {currency.is_default && <MantineBadge variant="tone" tone="brand">{t('default_badge')}</MantineBadge>}
                    <MantineBadge variant="status" entity="currency" value={currency.is_active ? 'active' : 'inactive'}>
                      {currency.is_active ? t('is_active') : t('status_inactive')}
                    </MantineBadge>
                  </Group>
                ),
              },
            ]}
          />
        </MantineDialogSection>
        <MantineDialogSection>
          <MantineNavRowList items={navRows} />
        </MantineDialogSection>
      </MantineDialogSections>
    </MantineModal>
  )
}
