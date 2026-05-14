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
}

// Strip combining diacritical marks (U+0300–U+036F) after NFD decomposition
// so "e" matches "ë", "c" matches "ç", etc.
const COMBINING = new RegExp('[\\u0300-\\u036f]', 'g')
function normalizeSearch(s: string) {
  return s.normalize('NFD').replace(COMBINING, '').toLowerCase()
}

export function LocationCombobox({
  locations, value, onChange, onKeyDown, placeholder, className, error,
  regions, onAddLocation,
}: Props) {
  const tc = useTranslations('common')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRegionId, setAddRegionId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)

  const selected = locations.find(l => String(l.id) === value)

  const filtered = useMemo(() => {
    if (!search) return locations.slice(0, 15)
    const q = normalizeSearch(search)
    return locations.filter(l => normalizeSearch(l.name_al).includes(q)).slice(0, 15)
  }, [locations, search])

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
    <div className={cn('location-combobox relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <input
          type="text"
          value={selected ? selected.name_al : search}
          onChange={e => {
            setSearch(e.target.value)
            onChange(null)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? tc('all_locations')}
          className="w-full h-11 pl-9 pr-3 text-sm text-foreground bg-muted border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {open && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover text-popover-foreground border rounded-xl shadow-lg max-h-56 overflow-y-auto">
            <Button
              variant="ghost"
              className="w-full px-3 py-2 h-auto text-sm justify-start rounded-none"
              onMouseDown={() => { onChange(null); setSearch(''); setOpen(false) }}
            >
              {tc('all_locations')}
            </Button>
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Нічого не знайдено</p>
            ) : filtered.map(loc => (
              <Button
                key={loc.id}
                variant="ghost"
                className={cn(
                  'w-full px-3 py-2 h-auto text-sm justify-between rounded-none',
                  value === String(loc.id) && 'bg-primary/10 text-primary'
                )}
                onMouseDown={() => { onChange(String(loc.id)); setSearch(''); setOpen(false) }}
              >
                <span>{loc.name_al}</span>
                {loc.type && (
                  <span className="text-xs text-muted-foreground capitalize ml-2">{loc.type}</span>
                )}
              </Button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

      {canAdd && (
        <>
          <button
            type="button"
            className="text-xs text-primary hover:underline w-fit mt-1"
            onClick={() => setShowAdd(v => !v)}
          >
            + Додати населений пункт
          </button>
          {showAdd && (
            <div className="border rounded-xl p-3 flex flex-col gap-2 bg-muted/30 mt-1">
              <p className="text-xs font-semibold">Новий населений пункт</p>
              <Input
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="Назва (алб.)"
                className="h-9 rounded-xl text-sm"
              />
              <Combobox
                options={regions!.map(r => ({ value: r.id.toString(), label: r.name_al }))}
                value={addRegionId?.toString() ?? ''}
                onChange={v => setAddRegionId(v ? Number(v) : null)}
                placeholder="Оберіть регіон"
                variant="button"
                size="sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button" size="sm" className="h-8 rounded-xl"
                  onClick={handleAdd} disabled={adding || !addName.trim() || !addRegionId}
                >
                  {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Додати'}
                </Button>
                <Button
                  type="button" variant="ghost" size="sm" className="h-8 rounded-xl"
                  onClick={() => setShowAdd(false)}
                >
                  Скасувати
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
