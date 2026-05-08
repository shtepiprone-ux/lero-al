import { Home, BedDouble, Bath, Maximize2, Building2, Layers, CalendarDays } from 'lucide-react'
import type { PresentationIcon } from '@/modules/listings/domain/listingFields'

const ICON_MAP: Record<PresentationIcon, React.FC<{ className?: string }>> = {
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
}

export function ListingFeatureIcon({ name, className }: Props) {
  const Icon = ICON_MAP[name]
  return <Icon className={className} />
}
