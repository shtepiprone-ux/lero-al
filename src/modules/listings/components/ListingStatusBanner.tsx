import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  status: 'sold' | 'rented' | 'archived'
  message: string
  similarLabel: string
}

const STYLES: Record<Props['status'], string> = {
  sold:     'bg-status-info/10 border-status-info/30 text-status-info',
  rented:   'bg-status-rented/10 border-status-rented/30 text-status-rented',
  archived: 'bg-muted border-border text-muted-foreground',
}

export function ListingStatusBanner({ status, message, similarLabel }: Props) {
  return (
    <div
      className={cn(
        'listing-status-banner flex items-start gap-3 rounded-2xl border px-5 py-4 mb-6',
        STYLES[status],
      )}
    >
      <Info className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{message}</p>
        <a
          href="#similar-listings"
          className="text-xs underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity w-fit"
        >
          {similarLabel}
        </a>
      </div>
    </div>
  )
}
