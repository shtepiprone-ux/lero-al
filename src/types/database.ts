export type UserRole = 'admin' | 'moderator' | 'agent' | 'user'
export type UserType = 'private' | 'agent' | 'developer'
export type UserStatus = 'active' | 'blocked' | 'inactive'
export type PreferredCurrency = 'ALL' | 'EUR' | 'USD' | 'GBP'

export interface LocationRequest {
  city: string
  region?: string
}

export interface UserChangeLog {
  id: string
  user_id: string
  changed_by: string | null
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_at: string
}

export type LandLegalStatus = 'agricultural' | 'urban' | 'forest' | 'pasture'
export type LandZoning = 'residential' | 'commercial' | 'tourism' | 'industrial' | 'mixed_use'
export type LandDevelopmentPotential = 'buildable' | 'change_of_use_required' | 'non_buildable'

export type ListingType = 'sale' | 'rent'
export type PropertyType = 'apartment' | 'house' | 'room' | 'land' | 'commercial' | 'office' | 'garage' | 'parking' | 'warehouse' | 'other'

export interface DBPropertyType {
  id: number
  slug: string
  name_sq: string
  name_en: string
  name_uk: string
  name_it: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}
export type ListingCondition = 'new_build' | 'good' | 'needs_repair' | 'needs_renovation' | 'under_construction'
export type WallType = 'brick' | 'concrete' | 'panel' | 'wood' | 'other'
export type HeatingType = 'electric' | 'wood' | 'central' | 'gas' | 'none'
export type ListingStatus = 'active' | 'inactive' | 'sold' | 'rented' | 'archived' | 'pending'
export type ListingCurrency = 'ALL' | 'EUR'
export type LocationType = 'region' | 'city' | 'village' | 'district'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type ReportReason = 'spam' | 'fraud' | 'duplicate' | 'wrong_category' | 'offensive' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'
export type NotificationType = 'new_message' | 'saved_search_match' | 'listing_status_change' | 'support_reply' | 'listing_expires_soon' | 'agent_verified' | 'marketing' | 'report_outcome' | 'price_change'

export interface Company {
  id: string
  name: string
  logo_url: string | null
  created_at: string
}

export interface Collection {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface CollectionWithCount extends Collection {
  item_count: number
}

export interface RecentlyViewed {
  id: string
  user_id: string
  listing_id: string
  viewed_at: string
}

export interface User {
  id: string
  name: string | null
  last_name: string | null
  phone: string | null
  whatsapp: string | null
  avatar_url: string | null
  role: UserRole
  user_type: UserType
  status: UserStatus
  block_reason: string | null
  suspended_until: string | null
  company_name: string | null
  company_logo_url: string | null
  company_id: string | null
  website: string | null
  is_verified: boolean
  social_provider: string | null
  location_id: number | null
  position: string | null
  year_started: number | null
  deleted_at: string | null
  location_request: LocationRequest | null
  preferred_currency: PreferredCurrency
  pending_email: string | null
  last_seen_at: string | null
  inactivity_warning_sent_at: string | null
  preferred_locale: string
  created_at: string
}

export interface UserStatusHistory {
  id: string
  user_id: string
  old_status: string | null
  new_status: string
  reason: string | null
  changed_by: string | null
  changed_at: string
}

export interface EmailChangeToken {
  id: string
  user_id: string
  new_email: string
  token_hash: string
  expires_at: string
  consumed_at: string | null
  created_at: string
}

export interface EmailTemplate {
  id: string
  key: string
  locale: string
  subject: string
  html_body: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  updated_by: string | null
}

export interface Location {
  id: number
  name_al: string
  name_en: string | null
  slug: string
  type: LocationType
  parent_id: number | null
  region_id: number | null
  lat: number | null
  lng: number | null
  image_url: string | null
  is_featured: boolean
  display_order: number
}

export interface Listing {
  id: string
  user_id: string
  location_id: number | null
  slug: string
  title: string
  description: string | null
  price: number
  price_old: number | null
  currency: ListingCurrency
  listing_type: ListingType
  property_type: PropertyType
  condition: ListingCondition | null
  wall_type: WallType | null
  heating: HeatingType | null
  rooms: number | null
  bedrooms: number | null
  bathrooms: number | null
  toilets: number | null
  area_gross: number | null
  area_net: number | null
  floor: number | null
  total_floors: number | null
  multi_storey_building: boolean
  land_legal_status: LandLegalStatus | null
  land_zoning: LandZoning | null
  land_development_potential: LandDevelopmentPotential | null
  year_built: number | null
  address: string | null
  lat: number | null
  lng: number | null
  views_count: number
  is_premium: boolean
  status: ListingStatus
  expires_at: string
  created_at: string
  updated_at: string
}

export interface ListingImage {
  id: string
  listing_id: string
  url: string
  order: number
  is_cover: boolean
}

export interface Amenity {
  id: number
  name_al: string
  name_en: string
  category: string
  icon: string | null
}

export interface ListingAmenity {
  listing_id: string
  amenity_id: number
}

export interface ListingView {
  id: string
  listing_id: string
  user_id: string | null
  ip_hash: string
  viewed_at: string
}

export interface Favorite {
  id: string
  user_id: string
  listing_id: string
  created_at: string
}

export interface SavedSearch {
  id: string
  user_id: string
  name: string
  filters: Record<string, unknown>
  filters_hash: string | null
  notify_email: boolean
  notify_frequency: 'instant' | 'daily' | 'weekly'
  last_checked_at: string | null
  last_viewed_at: string | null
  new_count: number
  updated_at: string
  created_at: string
}

export interface ListingReport {
  id: string
  listing_id: string
  user_id: string | null
  reason: ReportReason
  comment: string | null
  status: ReportStatus
  created_at: string
}

export interface Conversation {
  id: string
  listing_id: string | null
  buyer_id: string
  seller_id: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  status: TicketStatus
  assigned_to: string | null
  created_at: string
}

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

export interface NotificationSettings {
  id: string
  user_id: string
  new_message: boolean
  saved_search_match: boolean
  listing_status_change: boolean
  support_reply: boolean
  listing_expires_soon: boolean
  marketing: boolean
  channel_email: boolean
  channel_push: boolean
}

export interface CurrencyRate {
  id: number
  from_currency: string
  to_currency: string
  rate: number
  source_url: string
  fetched_at: string
}

export interface DBCurrency {
  id: number
  code: string
  symbol: string
  name_sq: string
  name_en: string
  name_uk: string
  name_it: string
  is_active: boolean
  is_default: boolean
  decimals: number
  created_at: string
  updated_at: string
}

export interface DBExchangeProvider {
  id: number
  name: string
  endpoint_url: string
  api_key: string | null
  refresh_interval_min: number
  priority: number
  mode: 'auto' | 'manual' | 'hybrid'
  is_enabled: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Page {
  id: number
  title: string
  slug: string
  content: Record<string, unknown>
  is_published: boolean
  updated_by: string | null
  updated_at: string
}

export interface Language {
  id: number
  code: string
  name_native: string
  name_en: string
  is_active: boolean
  is_default: boolean
}

export interface SiteSetting {
  key: string
  value: string
  updated_at: string
}

export interface AgentReview {
  id: string
  agent_id: string
  reviewer_id: string
  listing_id: string | null
  rating: number
  comment: string | null
  created_at: string
}

export interface VerificationRequest {
  id: string
  user_id: string
  document_url: string
  status: VerificationStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}