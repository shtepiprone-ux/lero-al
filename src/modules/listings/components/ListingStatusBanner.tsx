import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ListingStatus } from '@/types/database'

// Task 793 F3 — widened from 4 to all 6 non-active statuses (`isListingVisible` returns true
// only for `active`, so `ListingDetailView.tsx` renders this banner for every other status;
// `pending`/`inactive` had no entry here and rendered a raw i18n key, owner-reported 2026-09-06).
interface Props {
  status: Exclude<ListingStatus, 'active'>
  message: string
  similarLabel: string
}

const STYLES: Record<Props['status'], string> = {
  sold:     'bg-status-info/10 border-status-info/30 text-status-info',
  rented:   'bg-status-rented/10 border-status-rented/30 text-status-rented',
  archived: 'bg-muted border-border text-muted-foreground',
  expired:  'bg-status-warning/10 border-status-warning/30 text-status-warning',
  // `--status-warning`'s own doc comment (globals.css) names its intended usage as
  // "amber — inactive, pending" — reused verbatim rather than inventing a new token.
  pending:  'bg-status-warning/10 border-status-warning/30 text-status-warning',
  inactive: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
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
