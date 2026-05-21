'use client'

import { useState, useMemo, useId, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/shared/Combobox'
import { cn, normalizeSearch } from '@/lib/utils'

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
}

export function LocationCombobox({
  locations, value, onChange, onKeyDown, placeholder, className, error,
  regions, onAddLocation, portal = false,
}: Props) {
  const tc = useTranslations('common')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addRegionId, setAddRegionId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = locations.find(l => String(l.id) === value)

  const updateDropdownPosition = useCallback(() => {
    if (!portal || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const maxH = 224
    if (spaceBelow >= Math.min(maxH, 150) || spaceBelow >= spaceAbove) {
      setDropdownStyle({ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, maxHeight: Math.min(maxH, spaceBelow - 8), zIndex: 9999, overflowY: 'auto' })
    } else {
      setDropdownStyle({ position: 'fixed', bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, maxHeight: Math.min(maxH, spaceAbove - 8), zIndex: 9999, overflowY: 'auto' })
    }
  }, [portal])

  useEffect(() => {
    if (!open || !portal) return
    updateDropdownPosition()
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [open, portal, updateDropdownPosition])

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
  const listboxId = useId()
  const inputId = `${listboxId}-input`

  const dropdownContent = open ? (
    <div
      id={listboxId}
      className={cn(
        'bg-popover text-popover-foreground border rounded-xl shadow-lg overflow-hidden',
        !portal && 'absolute top-full mt-1 left-0 right-0 z-50'
      )}
      style={portal ? dropdownStyle : undefined}
    >
      <div className="overflow-y-auto max-h-56">
        <Button
          variant="ghost"
          className="w-full px-3 py-2 h-auto text-sm justify-start rounded-none"
          onMouseDown={() => { onChange(null); setSearch(''); setOpen(false) }}
        >
          {tc('all_locations')}
        </Button>
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">{tc('no_results')}</p>
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
    </div>
  ) : null

  return (
    <div ref={containerRef} className={cn('location-combobox relative', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          value={selected ? selected.name_al : search}
          onChange={e => {
            setSearch(e.target.value)
            onChange(null)
            setOpen(true)
          }}
          onFocus={() => { setOpen(true); updateDropdownPosition() }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={placeholder ?? tc('all_locations')}
          className="w-full h-11 pl-9 pr-3 text-sm text-foreground bg-muted border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
        {portal
          ? (typeof document !== 'undefined' && dropdownContent ? createPortal(dropdownContent, document.body) : null)
          : dropdownContent}
      </div>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

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
