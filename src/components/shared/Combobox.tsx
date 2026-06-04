'use client'

import { useState, useMemo, useRef, useEffect, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn, normalizeSearch } from '@/lib/utils'
import { MOBILE_POPUP, DRAG_HANDLE_WRAPPER, DRAG_HANDLE_BAR } from '@/components/ui/mobile-bottom-sheet'

export interface ComboboxOption {
  value: string
  /** Shown in the trigger (compact). Also used in dropdown if dropdownLabel is absent. */
  label: string
  /** Shown in dropdown items only — can differ from label for richer display (e.g. localized country name). */
  dropdownLabel?: string
  description?: string
  /** Extra text to search against — not displayed, only used for filtering. */
  searchText?: string
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
  /** Non-filtered "clear" item always shown at the top of the list (e.g. "All locations"). Clicking it calls onChange(''). */
  clearLabel?: string
  /** inputMode passed to the search input (e.g. "numeric" for year fields). */
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  /** Called on each keystroke in variant="input" mode before onChange fires. Useful for live-parse wrappers (e.g. YearCombobox). */
  onInputChange?: (value: string) => void
  /**
   * variant="button" only: adds a search input INSIDE the dropdown popup.
   * Use for long lists (e.g. 44-country phone dial code selector).
   * The trigger stays as a compact button; search lives inside the dropdown.
   */
  searchable?: boolean
  /** Placeholder for the internal search input when searchable=true. */
  searchPlaceholder?: string
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
  clearLabel,
  inputMode,
  onInputChange,
  searchable = false,
  searchPlaceholder = '',
}: ComboboxProps) {
  const uid = useId()
  const inputId = `combobox-${uid}`
  const listboxId = `listbox-${uid}`
  const [internalSearch, setInternalSearch] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const t = useTranslations('common')
  const selected = options.find(o => o.value === value)

  const filtered = useMemo(() => {
    const q = variant === 'button' && searchable && internalSearch
      ? normalizeSearch(internalSearch)
      : (!internalSearch && search && variant !== 'button' ? normalizeSearch(search) : null)

    if (!q) return options
    return options.filter(o =>
      normalizeSearch(o.label).includes(q) ||
      (o.dropdownLabel && normalizeSearch(o.dropdownLabel).includes(q)) ||
      (o.description && normalizeSearch(o.description).includes(q)) ||
      (o.searchText && normalizeSearch(o.searchText).includes(q))
    )
  }, [options, search, variant, searchable, internalSearch])

  useEffect(() => {
    if (!value) setSearch('')
  }, [value])

  // Reset internal search when dropdown closes
  useEffect(() => {
    if (!open) setInternalSearch('')
  }, [open])

  // Recalculate portal dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (!portal || !containerRef.current) return

    // Mobile (<640px): always full-width bottom sheet
    if (window.innerWidth < 640) {
      setDropdownStyle({
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxHeight: '90dvh',
        zIndex: 9999,
      })
      return
    }

    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const maxH = 224 // max-h-56 = 14rem = 224px

    // Clamp dropdown width and left to stay within the viewport (prevents horizontal
    // page overflow at 320px and other narrow widths, e.g. when dropdownMinWidth is set).
    const rawWidth = Math.max(rect.width, dropdownMinWidth ?? 0)
    const viewportW = window.innerWidth
    const dropdownWidth = Math.min(rawWidth, viewportW - 8)
    const safeLeft = Math.min(rect.left, Math.max(0, viewportW - dropdownWidth - 4))

    if (spaceBelow >= Math.min(maxH, 150) || spaceBelow >= spaceAbove) {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: safeLeft,
        width: dropdownWidth,
        maxHeight: Math.min(maxH, spaceBelow - 8),
        zIndex: 9999,
      })
    } else {
      // Open upward
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 4,
        left: safeLeft,
        width: dropdownWidth,
        maxHeight: Math.min(maxH, spaceAbove - 8),
        zIndex: 9999,
      })
    }
  }, [portal, dropdownMinWidth])

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
    'w-full flex items-center justify-between gap-2 bg-muted border-0 rounded-xl text-left',
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
        'bg-popover text-popover-foreground border shadow-lg overflow-hidden',
        !portal && 'absolute top-full mt-1 left-0 right-0 z-50',
        // Mobile: full-width bottom sheet (overrides absolute positioning)
        !portal && 'max-sm:!fixed max-sm:!inset-x-0 max-sm:!bottom-0 max-sm:!top-auto max-sm:!mt-0',
        MOBILE_POPUP,
        // Desktop-only rounded corners (mobile: rounded-t-2xl from MOBILE_POPUP)
        'sm:rounded-xl',
      )}
      style={portal ? dropdownStyle : (dropdownMinWidth ? { minWidth: dropdownMinWidth } : undefined)}
    >
      {/* Drag handle — mobile bottom sheet affordance */}
      <div className={DRAG_HANDLE_WRAPPER}>
        <div className={DRAG_HANDLE_BAR} />
      </div>
      {/* Internal search input — variant="button" + searchable={true} */}
      {variant === 'button' && searchable && (
        <div className="px-2 pt-2 pb-1 border-b">
          <input
            type="text"
            value={internalSearch}
            onChange={e => setInternalSearch(e.target.value)}
            onBlur={() => {
              setTimeout(() => {
                if (!containerRef.current?.contains(document.activeElement)) setOpen(false)
              }, 150)
            }}
            placeholder={searchPlaceholder}
            className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}
      <div id={listboxId} role="listbox" className="overflow-y-auto max-h-56 max-sm:max-h-[calc(90dvh-2.5rem)]">
        {clearLabel && (
          <button
            type="button"
            role="option"
            aria-selected={value === ''}
            className={cn(
              'w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between gap-2 max-sm:min-h-11',
              value === '' && 'bg-primary/10 text-primary'
            )}
            onMouseDown={() => { onChange(''); setSearch(''); setOpen(false) }}
          >
            <span className="flex-1 break-words">{clearLabel}</span>
            {value === '' && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
        )}
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
            <span className="flex-1 break-words">{opt.dropdownLabel ?? opt.label}</span>
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
          onChange={e => { setSearch(e.target.value); onChange(''); setOpen(true); onInputChange?.(e.target.value) }}
          onFocus={() => { setOpen(true); updateDropdownPosition() }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          inputMode={inputMode}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(triggerBase, 'cursor-text')}
        />
      ) : (
        <button
          type="button"
          onClick={() => { if (!disabled) { setOpen(o => !o); updateDropdownPosition() } }}
          onBlur={() => {
            // When searchable: don't close if focus moved to the search input inside the dropdown
            setTimeout(() => {
              if (searchable && containerRef.current?.contains(document.activeElement)) return
              setOpen(false)
            }, 150)
          }}
          disabled={disabled}
          className={cn(triggerBase, 'cursor-pointer')}
        >
          <span className={cn('flex-1 min-w-0 truncate', !selected && 'text-muted-foreground')}>
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
