'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface LocationOption {
  id: number
  name_al: string
  type?: string
}

interface Props {
  locations: LocationOption[]
  value: string
  onChange: (id: string | null) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  placeholder?: string
  className?: string
}

export function LocationCombobox({ locations, value, onChange, onKeyDown, placeholder, className }: Props) {
  const tc = useTranslations('common')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!value) setSearch('')
  }, [value])

  const filtered = useMemo(() => {
    if (!search) return locations.slice(0, 15)
    const q = search.toLowerCase()
    return locations.filter(l => l.name_al.toLowerCase().includes(q)).slice(0, 15)
  }, [locations, search])

  const selected = locations.find(l => String(l.id) === value)

  return (
    <div className={cn('location-combobox relative', className)}>
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
          {filtered.map(loc => (
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
  )
}
