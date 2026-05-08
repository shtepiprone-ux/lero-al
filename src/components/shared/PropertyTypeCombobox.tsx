'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PROPERTY_TYPES } from '@/modules/listings/constants'

interface Props {
  value: string
  onChange: (value: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  placeholder?: string
  showAllOption?: boolean
  className?: string
}

export function PropertyTypeCombobox({
  value, onChange, onKeyDown,
  placeholder, showAllOption = true, className,
}: Props) {
  const t = useTranslations('common')
  const tl = useTranslations('listing')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const selected = PROPERTY_TYPES.find(pt => pt.value === value)

  const filtered = useMemo(() => {
    if (!search) return PROPERTY_TYPES
    const q = search.toLowerCase()
    return PROPERTY_TYPES.filter(pt => tl(pt.labelKey as any).toLowerCase().includes(q))
  }, [search, tl])

  const resolvedPlaceholder = placeholder ?? t('all_types')

  return (
    <div className={cn('property-type-combobox relative', className ?? 'sm:w-48 shrink-0')}>
      <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
      <input
        type="text"
        value={selected ? tl(selected.labelKey as any) : search}
        onChange={e => {
          setSearch(e.target.value)
          onChange('')
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        placeholder={resolvedPlaceholder}
        className="w-full h-11 pl-9 pr-3 text-sm text-foreground bg-muted border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        aria-label={resolvedPlaceholder}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-haspopup="listbox"
        role="combobox"
      />
      {open && (
        <div
          role="listbox"
          className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover text-popover-foreground border rounded-xl shadow-lg max-h-56 overflow-y-auto"
        >
          {showAllOption && (
            <Button
              variant="ghost"
              className="w-full px-3 py-2 h-auto text-sm justify-start rounded-none"
              onMouseDown={() => { onChange(''); setSearch(''); setOpen(false) }}
              role="option"
              aria-selected={value === ''}
            >
              {t('all_types')}
            </Button>
          )}
          {filtered.map(pt => (
            <Button
              key={pt.value}
              variant="ghost"
              className="w-full px-3 py-2 h-auto text-sm justify-start rounded-none"
              onMouseDown={() => { onChange(pt.value); setSearch(''); setOpen(false) }}
              role="option"
              aria-selected={value === pt.value}
            >
              {tl(pt.labelKey as any)}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
