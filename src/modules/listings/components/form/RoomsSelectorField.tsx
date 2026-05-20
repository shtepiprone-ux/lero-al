'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ROOMS_OPTIONS } from '@/modules/listings/constants'
import type { FieldRendererProps } from './fieldRegistry'

export function RoomsSelectorField({ formValues, onChange }: FieldRendererProps) {
  const t = useTranslations('listing')

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">{t('rooms')}</Label>
      <div className="flex gap-2 flex-wrap">
        {ROOMS_OPTIONS.map(r => (
          <Button
            key={r}
            type="button"
            variant="outline"
            onClick={() => onChange({ rooms: formValues.rooms === r ? undefined : r })}
            className={cn(
              'h-9 w-9 rounded-xl p-0 text-sm font-medium',
              formValues.rooms === r
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground'
                : 'border-border hover:border-primary/40',
            )}
          >
            {r === 5 ? '5+' : r}
          </Button>
        ))}
      </div>
    </div>
  )
}
