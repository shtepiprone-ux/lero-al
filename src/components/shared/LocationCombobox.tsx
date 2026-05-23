'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/shared/Combobox'
import { cn } from '@/lib/utils'

export interface LocationOption {
  id: number
  name_al: string
  type?: string
  region_id?: number | null
}

export interface RegionOption {
  id: number
  name_al: string
}

interface Props {
  locations: LocationOption[]
  value: string
  onChange: (id: string | null) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  placeholder?: string
  className?: string
  /** Validation error message (shown below the input) */
  error?: string
  /** When provided together with onAddLocation, shows "+ Додати населений пункт" button */
  regions?: RegionOption[]
  /** Admin callback to persist a new city; receives name + region_id, returns the new id */
  onAddLocation?: (data: { name_al: string; region_id: number }) => Promise<{ id?: number; error?: string }>
  /** Render dropdown via portal into document.body. Use inside overflow:hidden/auto containers. */
  portal?: boolean
  /** Control height — passed through to Combobox. 'default' = h-11 | 'sm' = h-9 | 'xs' = h-8 */
  size?: 'default' | 'sm' | 'xs'
}

export function LocationCombobox({
  locations, value, onChange, onKeyDown, placeholder, className, error,
  regions, onAddLocation, portal = false, size,
}: Props) {
  const tc = useTranslations('common')
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRegionId, setAddRegionId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const options = useMemo(
    () => locations.map(l => ({ value: String(l.id), label: l.name_al, description: l.type || undefined })),
    [locations],
  )

  async function handleAdd() {
    if (!addName.trim() || !addRegionId || !onAddLocation) return
    setAdding(true)
    const result = await onAddLocation({ name_al: addName.trim(), region_id: addRegionId })
    setAdding(false)
    if (result.id) {
      onChange(String(result.id))
      setShowAdd(false)
      setAddName('')
      setAddRegionId(null)
    }
  }

  const canAdd = !!(regions && regions.length > 0 && onAddLocation)

  return (
    <div className={cn('location-combobox', className)}>
      <Combobox
        options={options}
        value={value}
        onChange={v => onChange(v || null)}
        clearLabel={tc('all_locations')}
        icon={<MapPin className="h-4 w-4" />}
        placeholder={placeholder ?? tc('all_locations')}
        portal={portal}
        error={error}
        size={size}
        onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLInputElement> | undefined}
      />

      {canAdd && (
        <>
          <button
            type="button"
            className="text-xs text-primary hover:underline w-fit mt-1"
            onClick={() => setShowAdd(v => !v)}
          >
            + {tc('add_location')}
          </button>
          {showAdd && (
            <div className="border rounded-xl p-3 flex flex-col gap-2 bg-muted/30 mt-1">
              <p className="text-xs font-semibold">{tc('new_location')}</p>
              <Input
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="Nazva (alb.)"
                className="h-9 rounded-xl text-sm"
              />
              <Combobox
                options={regions!.map(r => ({ value: r.id.toString(), label: r.name_al }))}
                value={addRegionId?.toString() ?? ''}
                onChange={v => setAddRegionId(v ? Number(v) : null)}
                variant="button"
                size="sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button" size="sm" className="h-8 rounded-xl"
                  onClick={handleAdd} disabled={adding || !addName.trim() || !addRegionId}
                >
                  {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : tc('add')}
                </Button>
                <Button
                  type="button" variant="ghost" size="sm" className="h-8 rounded-xl"
                  onClick={() => setShowAdd(false)}
                >
                  {tc('cancel')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
