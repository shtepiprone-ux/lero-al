'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { ROOMS_OPTIONS } from '@/modules/listings/constants'
import type { FieldRendererProps } from './fieldRegistry'

export function RoomsSelectorField({ formValues, onChange }: FieldRendererProps) {
  const t = useTranslations('listing')

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">{t('rooms')}</Label>
      <div className="flex gap-2 flex-wrap">
        {ROOMS_OPTIONS.map(r => (
          <button
            key={r}
            type="button"
            onClick={() => onChange({ rooms: formValues.rooms === r ? undefined : r })}
            className={cn(
              'h-9 w-9 rounded-xl border text-sm font-medium transition-colors',
              formValues.rooms === r
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary/40',
            )}
          >
            {r === 5 ? '5+' : r}
          </button>
        ))}
      </div>
    </div>
  )
}
