import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  countBadge?: ReactNode
  action?: ReactNode
  as?: 'header' | 'div'
  className?: string
}

export function PageHeader({
  title,
  description,
  countBadge,
  action,
  as: Comp = 'header',
  className,
}: PageHeaderProps) {
  return (
    <Comp
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <h1 className="text-2xl sm:text-3xl 2xl:text-4xl font-bold leading-tight min-w-0">
            {title}
          </h1>
          {countBadge != null && <div className="shrink-0">{countBadge}</div>}
        </div>
        {description != null && (
          <p className="text-sm sm:text-base text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {action != null && <div className="shrink-0">{action}</div>}
    </Comp>
  )
}
