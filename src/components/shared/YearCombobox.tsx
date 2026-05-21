'use client'

import { useState, useMemo, useId, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  /** Render dropdown via portal into document.body. Use inside overflow:hidden/auto containers. */
  portal?: boolean
}

export function YearCombobox({ value, onChange, placeholder, className, portal = false }: Props) {
  const listboxId = useId()
  const inputId = `${listboxId}-input`
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!search) return YEAR_OPTIONS
    return YEAR_OPTIONS.filter(y => String(y).startsWith(search))
  }, [search])

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

  const dropdownContent = open && filtered.length > 0 ? (
    <div
      id={listboxId}
      role="listbox"
      className={cn(
        'bg-popover text-popover-foreground border rounded-xl shadow-lg overflow-hidden',
        !portal && 'absolute top-full mt-1 left-0 right-0 z-50'
      )}
      style={portal ? dropdownStyle : undefined}
    >
      <div className="overflow-y-auto max-h-56">
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
    </div>
  ) : null

  return (
    <div ref={containerRef} className={cn('year-combobox relative', className)}>
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        value={value != null ? String(value) : search}
        onChange={handleChange}
        onFocus={() => { setOpen(true); updateDropdownPosition() }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full h-11 pl-9 pr-3 text-sm text-foreground bg-muted border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
      />
      {portal
        ? (typeof document !== 'undefined' && dropdownContent ? createPortal(dropdownContent, document.body) : null)
        : dropdownContent}
    </div>
  )
}
