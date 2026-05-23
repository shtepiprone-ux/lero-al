import type {
  ListingType, PropertyType, ListingCondition, WallType, HeatingType,
  LandLegalStatus, LandZoning, LandDevelopmentPotential,
} from '@/types/database'
import type { ListingImage } from '@/modules/listings/components/ImageUpload'

export interface FormValues {
  listing_type: ListingType
  property_type: PropertyType | ''
  title: string
  description?: string
  price?: number
  price_old?: number
  currency: 'ALL' | 'EUR'
  condition?: ListingCondition
  wall_type?: WallType
  heating?: HeatingType
  rooms?: number
  bedrooms?: number
  bathrooms?: number
  toilets?: number
  area_gross?: number
  area_net?: number
  floor?: number
  total_floors?: number
  multi_storey_building: boolean
  land_legal_status?: LandLegalStatus
  land_zoning?: LandZoning
  land_development_potential?: LandDevelopmentPotential
  offer_type?: string
  purchase_conditions?: string[]
  year_built?: number
  location_id?: number
  address?: string
  lat?: number
  lng?: number
  images: ListingImage[]
}
