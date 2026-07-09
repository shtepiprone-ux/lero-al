'use client'

import { useState, useMemo } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, startOfWeek, endOfWeek,
  isSameDay, isSameMonth, isToday, parseISO, isValid, isAfter, startOfDay,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface Props {
  value?: string          // ISO "yyyy-MM-dd"
  onChange: (v: string | undefined) => void
  placeholder?: string
  className?: string
  maxDate?: Date          // upper bound — days after this are disabled
}

/**
 * Static per-locale calendar strings (`common.calendar_*`, Task 562/564/565) instead of a
 * live `Intl.DateTimeFormat(locale, ...)` call — some browsers' bundled ICU lacks locale data
 * entirely for `sq` (`Intl.DateTimeFormat.supportedLocalesOf(['sq'])` → `[]` in Chromium),
 * which would otherwise silently fall back to a different locale on the client while the
 * server (full ICU) renders correctly, causing a hydration mismatch. Mirrors
 * `RangeDatePicker.tsx`'s `useCalendarLocaleData` shape — data reused, not duplicated
 * (lives only in `messages/*.json`).
 */
interface CalendarLocaleData {
  monthsNominative: string[]
  monthsFormatting: string[]
  weekdaysShort: string[]
  monthYearSuffix: string
  summaryOrder: 'day_month' | 'month_day'
}

function useCalendarLocaleData(t: ReturnType<typeof useTranslations<'common'>>): CalendarLocaleData {
  return useMemo(
    () => ({
      monthsNominative: t.raw('calendar_months') as string[],
      monthsFormatting: t.raw('calendar_months_formatting') as string[],
      weekdaysShort: t.raw('calendar_weekdays_short') as string[],
      monthYearSuffix: t.raw('calendar_month_year_suffix') as string,
      summaryOrder: t.raw('calendar_summary_order') as 'day_month' | 'month_day',
    }),
    [t],
  )
}

export function DatePicker({ value, onChange, placeholder, className, maxDate }: Props) {
  const t = useTranslations('common')
  const cal = useCalendarLocaleData(t)

  const [open, setOpen] = useState(false)

  const selected = useMemo(() => {
    if (!value) return undefined
    const d = parseISO(value)
    return isValid(d) ? d : undefined
  }, [value])

  const [viewMonth, setViewMonth] = useState<Date>(() => selected ?? new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 })
    const end   = endOfWeek(endOfMonth(viewMonth),   { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [viewMonth])

  // Locale-aware weekday labels Mon–Sun (static data — see CalendarLocaleData)
  const weekdays = cal.weekdaysShort

  const monthLabel = `${cal.monthsNominative[viewMonth.getMonth()]} ${viewMonth.getFullYear()}${cal.monthYearSuffix}`

  const todayLabel = useMemo(() => {
    const now = new Date()
    const day = now.getDate()
    const month = cal.monthsFormatting[now.getMonth()]
    return cal.summaryOrder === 'month_day' ? `${month} ${day}` : `${day} ${month}`
  }, [cal])

  function selectDay(day: Date) {
    onChange(format(day, 'yyyy-MM-dd'))
    setOpen(false)
  }

  function clearDate(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(undefined)
  }

  function goToday() {
    onChange(format(new Date(), 'yyyy-MM-dd'))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={(v) => setOpen(v)}>
      <PopoverTrigger
        className={cn(
          'date-picker relative flex w-full items-center h-11 pl-9 pr-8 text-sm rounded-xl bg-muted text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-150',
          !selected ? 'text-muted-foreground' : 'text-foreground',
          className
        )}
      >
        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <span className="flex-1 truncate select-none">
          {selected ? format(selected, 'dd.MM.yyyy') : (placeholder ?? t('select_date'))}
        </span>
        {selected && (
          <button
            type="button"
            onClick={clearDate}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted-foreground/20 transition-colors duration-100"
            tabIndex={-1}
            aria-label={t('aria_clear')}
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="p-0 w-auto rounded-2xl shadow-xl"
      >
        <div
          className="w-[272px] p-3 select-none" // design-tokens-allow: w-[272px] — calendar grid fixed width; off-scale (no spacing token = 272px)
        >

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 rounded-xl"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold capitalize">{monthLabel}</span>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="h-8 w-8 rounded-xl"
              disabled={!!maxDate && isSameMonth(viewMonth, maxDate)}
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekdays.map((d, i) => (
              <div
                key={i}
                className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px">
            {days.map(day => {
              const inMonth    = isSameMonth(day, viewMonth)
              const isSelected = !!selected && isSameDay(day, selected)
              const todayFlag  = isToday(day)
              const isFuture   = !!maxDate && isAfter(startOfDay(day), startOfDay(maxDate))
              const isDisabled = !inMonth || isFuture
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  className={cn(
                    'h-8 w-full flex items-center justify-center text-sm rounded-xl transition-colors duration-100',
                    isDisabled && 'opacity-20 pointer-events-none cursor-not-allowed',
                    !isDisabled && !isSelected && 'hover:bg-accent hover:text-accent-foreground',
                    isSelected && 'bg-primary text-primary-foreground font-semibold shadow-sm',
                    !isSelected && todayFlag && inMonth && 'font-semibold text-primary ring-1 ring-inset ring-primary/40',
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-2 pt-2 border-t border-border/60">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
              onClick={goToday}
            >
              {t('period_today')} — {todayLabel}
            </Button>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  )
}
