import { Home, BedDouble, Bath, Maximize2, Building2, Layers, CalendarDays } from 'lucide-react'
import type { PresentationIcon } from '@/modules/listings/domain/listingFields'

const ICON_MAP: Record<PresentationIcon, React.FC<{ className?: string; size?: number }>> = {
  'home':       Home,
  'bed-double': BedDouble,
  'bath':       Bath,
  'area':       Maximize2,
  'building':   Building2,
  'layers':     Layers,
  'calendar':   CalendarDays,
}

interface Props {
  name:       PresentationIcon
  className?: string
  /** Task 791 — a className-free sizing path for consumers (e.g. `ListingDetailView.tsx`) that
   * may not use Tailwind `className` at all. Optional; existing `className`-based callers are
   * unaffected. */
  size?: number
}

export function ListingFeatureIcon({ name, className, size }: Props) {
  const Icon = ICON_MAP[name]
  return <Icon className={className} size={size} />
}
