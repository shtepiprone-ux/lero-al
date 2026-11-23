'use client'

import { useTranslations } from 'next-intl'
import { SimpleGrid } from '@mantine/core'
import type { FieldRendererProps } from './fieldRegistry'
import { NumberTextInput } from './NumberTextInput'

export function AreaPairField({ formValues, onChange, disabled }: FieldRendererProps) {
  const t = useTranslations('listing')

  return (
    // one row per input below 640px, the pair side by side from 640px (Task 957 Review 2 F15)
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      <NumberTextInput
        id="area_gross"
        label={t('area_gross_label')}
        value={formValues.area_gross}
        min={1}
        placeholder="m²"
        disabled={disabled}
        onChange={v => onChange({ area_gross: v })}
      />
      <NumberTextInput
        id="area_net"
        label={t('area_net')}
        value={formValues.area_net}
        min={1}
        placeholder="m²"
        disabled={disabled}
        onChange={v => onChange({ area_net: v })}
      />
    </SimpleGrid>
  )
}
