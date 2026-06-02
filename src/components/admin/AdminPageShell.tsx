'use client'

import { type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

type AdminPageShellProps = {
  title?: string
  subtitle?: string
  countBadge?: { value: number; ariaLabel?: string }
  actions?: ReactNode
  filterBar?: ReactNode
  children: ReactNode
  stickyHeader?: boolean
}

export function AdminPageShell({
  title,
  subtitle,
  countBadge,
  actions,
  filterBar,
  children,
  stickyHeader = false,
}: AdminPageShellProps) {
  return (
    <div className="container-admin">
      <div className="p-3 md:p-6 flex flex-col gap-4">
        {(title || actions) && (
          <div
            className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4${stickyHeader ? ' sticky top-0 z-30 bg-background py-3 border-b' : ''}`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {title && (
                  <h1 className="text-2xl font-bold text-foreground leading-tight">{title}</h1>
                )}
                {countBadge != null && (
                  <Badge
                    variant="secondary"
                    className="text-xs shrink-0"
                    aria-label={countBadge.ariaLabel}
                  >
                    {countBadge.value}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap sm:shrink-0 max-sm:w-full [&>*]:max-sm:w-full">{actions}</div>
            )}
          </div>
        )}

        {filterBar && (
          <div className="flex flex-col gap-3">{filterBar}</div>
        )}

        {children}
      </div>
    </div>
  )
}
