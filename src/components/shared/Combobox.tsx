'use client'

import { useState, useMemo, useRef, useEffect, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn, normalizeSearch } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Validation error shown below the field */
  error?: string
  /** Leading icon inside the input */
  icon?: React.ReactNode
  /**
   * 'input'  — searchable text input (default, for longer lists)
   * 'button' — click-to-open trigger, no typing (for short static lists ≤ 8 items)
   */
  variant?: 'input' | 'button'
  /** 'default' = h-11 | 'sm' = h-9 | 'xs' = h-8 text-xs (inline compact) */
  size?: 'default' | 'sm' | 'xs'
  /** Extra classes for the trigger element */
  triggerClassName?: string
  /**
   * Render the dropdown via a React portal into document.body.
   * Use inside tables or any container with overflow:hidden/auto that would clip
   * the dropdown. Portal uses fixed positioning calculated from the trigger rect.
   */
  portal?: boolean
  /** Minimum pixel width for the dropdown (useful when the trigger is narrower than the options). */
  dropdownMinWidth?: number
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  className,
  error,
  icon,
  variant = 'input',
  size = 'default',
  triggerClassName,
  portal = false,
  dropdownMinWidth,
  onKeyDown,
}: ComboboxProps) {
  const uid = useId()
  const inputId = `combobox-${uid}`
  const listboxId = `listbox-${uid}`
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const t = useTranslations('common')
  const selected = options.find(o => o.value === value)

  const filtered = useMemo(() => {
    if (!search || variant === 'button') return options
    const q = normalizeSearch(search)
    return options.filter(o =>
      normalizeSearch(o.label).includes(q) ||
      (o.description && normalizeSearch(o.description).includes(q))
    )
  }, [options, search, variant])

  useEffect(() => {
    if (!value) setSearch('')
  }, [value])

  // Recalculate portal dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (!portal || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const maxH = 224 // max-h-56 = 14rem = 224px

    const dropdownWidth = Math.max(rect.width, dropdownMinWidth ?? 0)
    if (spaceBelow >= Math.min(maxH, 150) || spaceBelow >= spaceAbove) {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: dropdownWidth,
        maxHeight: Math.min(maxH, spaceBelow - 8),
        zIndex: 9999,
      })
    } else {
      // Open upward
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: dropdownWidth,
        maxHeight: Math.min(maxH, spaceAbove - 8),
        zIndex: 9999,
      })
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

  const heights: Record<string, string> = { default: 'h-11', sm: 'h-9', xs: 'h-8' }
  const textSizes: Record<string, string> = { default: 'text-sm', sm: 'text-sm', xs: 'text-xs' }
  const h = heights[size]
  const ts = textSizes[size]

  const triggerBase = cn(
    'w-full flex items-center justify-between gap-2 bg-muted border-0 rounded-xl',
    'focus:outline-none focus:ring-2 focus:ring-ring',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'placeholder:text-muted-foreground text-foreground',
    h, ts,
    icon ? 'pl-9 pr-3' : 'pl-3 pr-3',
    triggerClassName
  )

  const dropdownContent = open && !disabled && (
    <div
      className={cn(
        'bg-popover text-popover-foreground border rounded-xl shadow-lg overflow-hidden',
        !portal && 'absolute top-full mt-1 left-0 right-0 z-50'
      )}
      style={portal ? dropdownStyle : (dropdownMinWidth ? { minWidth: dropdownMinWidth } : undefined)}
    >
      <div id={listboxId} role="listbox" className="overflow-y-auto max-h-56">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">{t('no_results')}</p>
        ) : filtered.map(opt => (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={value === opt.value}
            className={cn(
              'w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between gap-2',
              value === opt.value && 'bg-primary/10 text-primary'
            )}
            onMouseDown={() => { onChange(opt.value); setSearch(''); setOpen(false) }}
          >
            <span className="flex-1 truncate">{opt.label}</span>
            {opt.description && (
              <span className="text-xs text-muted-foreground shrink-0">{opt.description}</span>
            )}
            {value === opt.value && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-muted-foreground">
          {icon}
        </span>
      )}

      {variant === 'input' ? (
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listboxId : undefined}
          value={selected ? selected.label : search}
          onChange={e => { setSearch(e.target.value); onChange(''); setOpen(true) }}
          onFocus={() => { setOpen(true); updateDropdownPosition() }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(triggerBase, 'cursor-text')}
        />
      ) : (
        <button
          type="button"
          onClick={() => { if (!disabled) { setOpen(o => !o); updateDropdownPosition() } }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          disabled={disabled}
          className={cn(triggerBase, 'cursor-pointer')}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : placeholder}
          </span>
        </button>
      )}

      <ChevronDown
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-transform',
          open && 'rotate-180'
        )}
      />

      {portal
        ? (typeof document !== 'undefined' && dropdownContent
            ? createPortal(dropdownContent, document.body)
            : null)
        : dropdownContent
      }

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  )
}
