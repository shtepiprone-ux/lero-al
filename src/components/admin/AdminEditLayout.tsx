import { cn } from '@/lib/utils'

/**
 * Reusable two-column admin edit-screen pattern.
 * Main content on the left (flex-1), sticky sidebar on the right (fixed width).
 * Collapses to single column below lg breakpoint.
 */
interface Props {
  main: React.ReactNode
  sidebar: React.ReactNode
  className?: string
}

export function AdminEditLayout({ main, sidebar, className }: Props) {
  return (
    <div className={cn('flex flex-col lg:flex-row gap-6 items-start', className)}>
      <div className="flex-1 min-w-0 flex flex-col gap-6">{main}</div>
      <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-4 lg:sticky lg:top-20">
        {sidebar}
      </div>
    </div>
  )
}
