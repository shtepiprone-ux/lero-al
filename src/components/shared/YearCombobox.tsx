'use client'

import { useState, useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MIN_PROPERTY_YEAR } from '@/modules/listings/constants'

const MAX_YEAR = new Date().getFullYear() + 5

const YEAR_OPTIONS = Array.from(
  { length: MAX_YEAR - MIN_PROPERTY_YEAR + 1 },
  (_, i) => MAX_YEAR - i,
)

interface Props {
  value?: number
  onChange: (year: number | undefined) => void
  placeholder?: string
  className?: string
}

export function YearCombobox({ value, onChange, placeholder, className }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    if (!search) return YEAR_OPTIONS
    return YEAR_OPTIONS.filter(y => String(y).startsWith(search))
  }, [search])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
    setSearch(raw)
    onChange(undefined)
    setOpen(true)
    if (!raw) return
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= MIN_PROPERTY_YEAR && n <= MAX_YEAR) {
      onChange(n)
    }
  }

  return (
    <div className={cn('year-combobox relative', className)}>
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
      <input
        type="text"
        inputMode="numeric"
        value={value != null ? String(value) : search}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full h-11 pl-9 pr-3 text-sm text-foreground bg-muted border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-haspopup="listbox"
        role="combobox"
      />
      {open && filtered.length > 0 && (
        <div
          role="listbox"
          className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover text-popover-foreground border rounded-xl shadow-lg max-h-56 overflow-y-auto"
        >
          {filtered.map(y => (
            <Button
              key={y}
              variant="ghost"
              className={cn(
                'w-full px-3 py-2 h-auto text-sm justify-start rounded-none',
                value === y && 'bg-primary/10 text-primary font-medium',
              )}
              onMouseDown={() => { onChange(y); setSearch(''); setOpen(false) }}
              role="option"
              aria-selected={value === y}
            >
              {y}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
