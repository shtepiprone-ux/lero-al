import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionProps = {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function Section({ title, description, children, className }: SectionProps) {
  const hasHeading = title != null || description != null

  return (
    <div data-testid="section" className={cn(className)}>
      {hasHeading && (
        <div className="min-w-0 mb-4">
          {title && (
            <h2 className="text-xl sm:text-2xl 2xl:text-3xl font-semibold leading-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
