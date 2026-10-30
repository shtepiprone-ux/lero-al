import type { MantineColor } from '@mantine/core'
import type { ContactStatus, ListingStatus, ReportStatus, TicketStatus, UserRole, UserStatus } from '@/types/database'

/**
 * The ONE owner of badge meaning (Task 859 Revision 2, R24, owner decision D78-18): entity + value -> theme colour,
 * and the message key of its label. `MantineBadge` renders these; no other production file chooses a
 * badge colour (`check:badge-canonical`). Colours are theme colour names only; the visual (pill, solid fill at the
 * colour's index-7 stop with white text, 12px/500; owner D78-26) is the `Badge` theme entry.
 *
 * Every value of every enum below has an entry: a missing one is a type error (`Record<Enum, ...>`).
 * Owner decision D78-20 (2026-10-04): user `inactive` is gray everywhere (it was yellow on the profile, red in the
 * users table). A badge carries no icon (owner decision D78-29, 2026-10-08): the registry stores none.
 */

/** The semantic tones a badge can carry on its own (a label that is not a status). */
export type BadgeSemanticTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand' | 'sale' | 'purple'

export const BADGE_TONES: Record<BadgeSemanticTone, MantineColor> = {
  neutral: 'gray',
  info: 'blueLight',
  success: 'green',
  warning: 'yellow',
  danger: 'red',
  brand: 'brand',
  sale: 'sale',
  purple: 'purple',
}

export interface BadgeToneEntry {
  color: MantineColor
  /** Full message key (root namespace) of the label, e.g. `admin.support.support_status_open`. */
  labelKey: string
}

const entry = (tone: BadgeSemanticTone, labelKey: string): BadgeToneEntry => ({
  color: BADGE_TONES[tone],
  labelKey,
})

/** Listing lifecycle status (spec v3.3 §3.3, §17.1). Labels: `listing.status_*`. */
export const LISTING_STATUS_TONES: Record<ListingStatus, BadgeToneEntry> = {
  active: entry('success', 'listing.status_active'),
  inactive: entry('neutral', 'listing.status_inactive'),
  sold: entry('info', 'listing.status_sold'),
  rented: entry('purple', 'listing.status_rented'),
  archived: entry('neutral', 'listing.status_archived'),
  pending: entry('warning', 'listing.status_pending'),
  expired: entry('warning', 'listing.status_expired'),
}

/** Public visibility of a listing (`formatVisibility`). */
export type ListingVisibilityValue = 'visible' | 'hidden'
export const LISTING_VISIBILITY_TONES: Record<ListingVisibilityValue, BadgeToneEntry> = {
  visible: entry('success', 'admin.listings.visibility_visible'),
  hidden: entry('danger', 'admin.listings.visibility_hidden_status_not_public'),
}

/** Listing report status (kickoff 858 R4). */
export const REPORT_STATUS_TONES: Record<ReportStatus, BadgeToneEntry> = {
  pending: entry('warning', 'admin.reports.status_pending'),
  // D78-26: "Under review" is one meaning, one look: `reviewed` takes the `warning` tone, like listing `pending`.
  reviewed: entry('warning', 'admin.reports.status_reviewed'),
  resolved: entry('success', 'admin.reports.status_resolved'),
  dismissed: entry('danger', 'admin.reports.status_dismissed'),
}

/** Support ticket status. */
export const TICKET_STATUS_TONES: Record<TicketStatus, BadgeToneEntry> = {
  open: entry('warning', 'admin.support.support_status_open'),
  in_progress: entry('info', 'admin.support.support_status_in_progress'),
  resolved: entry('success', 'admin.support.support_status_resolved'),
  closed: entry('neutral', 'admin.support.support_status_closed'),
}

/** Support ticket type. */
export type TicketTypeValue = 'support' | 'user_complaint'
export const TICKET_TYPE_TONES: Record<TicketTypeValue, BadgeToneEntry> = {
  support: entry('info', 'admin.support.type_support'),
  user_complaint: entry('danger', 'admin.support.type_user_complaint'),
}

/**
 * Contact (inquiry) status (kickoff 894 R2). "New" is one look (owner D78-28, 2026-10-08): the `success` tone the listing
 * card's "new" badge carries (`LISTING_DETAIL_BADGE_TONES.new`, `ListingCard`).
 */
export const INQUIRY_STATUS_TONES: Record<ContactStatus, BadgeToneEntry> = {
  new: entry('success', 'admin.inquiries.status_new'),
  in_progress: entry('info', 'admin.inquiries.status_in_progress'),
  closed: entry('neutral', 'admin.inquiries.status_closed'),
}

/** User account status. */
export const USER_STATUS_TONES: Record<UserStatus, BadgeToneEntry> = {
  active: entry('success', 'admin.users.user_status_active'),
  blocked: entry('danger', 'admin.users.user_status_blocked'),
  inactive: entry('neutral', 'admin.users.user_status_inactive'),
}

/** User role. `moderator` keeps `orange`, the colour the users table has always used. */
export const USER_ROLE_TONES: Record<UserRole, BadgeToneEntry> = {
  user: entry('neutral', 'admin.users.role_user'),
  agent: entry('info', 'admin.users.role_agent'),
  moderator: { color: 'orange', labelKey: 'admin.users.role_moderator' },
  admin: entry('success', 'admin.users.role_admin'),
}

/**
 * The account type an admin sees on a user's profile (`ProfileType`, `admin.user_profile.profile_types.*`). It is the
 * same meaning as the role badge for the types they share, so `admin`, `moderator`, `agent` and `private` carry the
 * `USER_ROLE_TONES` colour of the same name (`private` is role `user`) and `developer` keeps its neutral look (R57(b)).
 */
export type ProfileTypeValue = 'admin' | 'moderator' | 'private' | 'agent' | 'developer'
export const PROFILE_TYPE_TONES: Record<ProfileTypeValue, BadgeToneEntry> = {
  admin: { ...USER_ROLE_TONES.admin, labelKey: 'admin.user_profile.profile_types.admin' },
  moderator: { ...USER_ROLE_TONES.moderator, labelKey: 'admin.user_profile.profile_types.moderator' },
  private: { ...USER_ROLE_TONES.user, labelKey: 'admin.user_profile.profile_types.private' },
  agent: { ...USER_ROLE_TONES.agent, labelKey: 'admin.user_profile.profile_types.agent' },
  developer: entry('neutral', 'admin.user_profile.profile_types.developer'),
}

/** Whether the user's e-mail address is confirmed. */
export type EmailConfirmationValue = 'confirmed' | 'unconfirmed'
export const EMAIL_CONFIRMATION_TONES: Record<EmailConfirmationValue, BadgeToneEntry> = {
  confirmed: entry('success', 'admin.user_profile.fields.email_confirmed'),
  unconfirmed: entry('warning', 'admin.user_profile.fields.email_not_confirmed'),
}

/** Currency active state (`admin.currency.currencies`). */
export type CurrencyStateValue = 'active' | 'inactive'
export const CURRENCY_STATE_TONES: Record<CurrencyStateValue, BadgeToneEntry> = {
  active: entry('success', 'admin.currency.currencies.is_active'),
  inactive: entry('neutral', 'admin.currency.currencies.status_inactive'),
}

/** Exchange-rate provider enabled state (`admin.currency.providers`). */
export type ProviderStateValue = 'enabled' | 'disabled'
export const PROVIDER_STATE_TONES: Record<ProviderStateValue, BadgeToneEntry> = {
  enabled: entry('success', 'admin.currency.providers.is_enabled'),
  disabled: entry('neutral', 'admin.currency.providers.status_disabled'),
}

/** Static page publication state. */
export type PageStateValue = 'published' | 'draft'
export const PAGE_STATE_TONES: Record<PageStateValue, BadgeToneEntry> = {
  published: entry('success', 'admin.pages.status_published'),
  draft: entry('neutral', 'admin.pages.status_draft'),
}

/** Property type active state (`admin.property_types`; the inactive label is the action key the manager has always shown). */
export type PropertyTypeStateValue = 'active' | 'inactive'
export const PROPERTY_TYPE_STATE_TONES: Record<PropertyTypeStateValue, BadgeToneEntry> = {
  active: entry('success', 'admin.property_types.is_active'),
  inactive: entry('neutral', 'admin.property_types.deactivate'),
}

/** Verified user or agent (the cabinet header, the admin user profile). */
export type AgentVerificationValue = 'verified'
export const AGENT_VERIFICATION_TONES: Record<AgentVerificationValue, BadgeToneEntry> = {
  verified: entry('success', 'cabinet.verified'),
}

/** Flags a listing carries beside its status (the cabinet listings tab). */
export type ListingFlagValue = 'premium'
export const LISTING_FLAG_TONES: Record<ListingFlagValue, BadgeToneEntry> = {
  premium: entry('warning', 'cabinet.filter_PREMIUM'),
}

/** What a photo is in an uploader (the cover). */
export type PhotoMarkValue = 'cover'
export const PHOTO_MARK_TONES: Record<PhotoMarkValue, BadgeToneEntry> = {
  cover: entry('brand', 'listing.cover_photo'),
}

/** A signal on a user row: they asked for a city that is not in the list (`users.location_request`). */
export type UserSignalValue = 'locationRequest'
export const USER_SIGNAL_TONES: Record<UserSignalValue, BadgeToneEntry> = {
  locationRequest: entry('warning', 'admin.users.location_request_badge'),
}

/** Every `status` entity `MantineBadge` renders, keyed by its `entity` prop. */
export const BADGE_STATUS_REGISTRY = {
  listing: LISTING_STATUS_TONES,
  listingVisibility: LISTING_VISIBILITY_TONES,
  report: REPORT_STATUS_TONES,
  ticket: TICKET_STATUS_TONES,
  ticketType: TICKET_TYPE_TONES,
  inquiry: INQUIRY_STATUS_TONES,
  user: USER_STATUS_TONES,
  userRole: USER_ROLE_TONES,
  profileType: PROFILE_TYPE_TONES,
  emailConfirmation: EMAIL_CONFIRMATION_TONES,
  currency: CURRENCY_STATE_TONES,
  provider: PROVIDER_STATE_TONES,
  page: PAGE_STATE_TONES,
  propertyType: PROPERTY_TYPE_STATE_TONES,
  agentVerification: AGENT_VERIFICATION_TONES,
  listingFlag: LISTING_FLAG_TONES,
  photoMark: PHOTO_MARK_TONES,
  userSignal: USER_SIGNAL_TONES,
} as const

export type BadgeStatusEntity = keyof typeof BADGE_STATUS_REGISTRY

/** The four-bucket vocabulary (dashboard rows, visibility diagnostics) mapped onto the semantic tones. */
export type BadgeBucket = 'positive' | 'warning' | 'danger' | 'neutral'
export const BADGE_BUCKET_TONES: Record<BadgeBucket, BadgeSemanticTone> = {
  positive: 'success',
  warning: 'warning',
  danger: 'danger',
  neutral: 'neutral',
}

/**
 * Listing-detail badge tones (`MantineListingDetailPattern`): new, price reduced. "Premium" is the registry flag
 * `listingFlag.premium` (colour), so the detail page and the cabinet render one badge (R57(d)).
 */
export type ListingDetailBadgeToneValue = 'new' | 'reduced'
export const LISTING_DETAIL_BADGE_TONES: Record<ListingDetailBadgeToneValue, BadgeSemanticTone> = {
  new: 'success',
  reduced: 'sale',
}

/**
 * Count-badge emphasis -> theme colour and Mantine variant (R59, owner "no hardcode"): the three hosts a counter sits on.
 * `brand` is the solid brand counter, `onBrand` the white counter inside a filled brand button, `neutral` the theme's
 * light count chip (inside a light button or beside a tab label; its fill and text are the `Badge` theme entry's).
 * `MantineBadge` reads this map and holds no colour or variant literal for a count.
 */
export type BadgeCountEmphasis = 'brand' | 'onBrand' | 'neutral'
export const BADGE_COUNT_EMPHASIS: Record<BadgeCountEmphasis, { color: MantineColor; variant: 'filled' | 'white' | 'light' }> = {
  brand: { color: BADGE_TONES.brand, variant: 'filled' },
  onBrand: { color: BADGE_TONES.brand, variant: 'white' },
  neutral: { color: BADGE_TONES.neutral, variant: 'light' },
}

/** Notification variants mapped onto the semantic tones (the badge that names a notification's kind). */
export const NOTIFICATION_VARIANT_BADGE_TONES: Record<'success' | 'error' | 'info' | 'warning', BadgeSemanticTone> = {
  success: 'success',
  error: 'danger',
  info: 'info',
  warning: 'warning',
}

/** Theme colour per listing status, for callers that need the colour alone (listing cards, banners). */
export const LISTING_STATUS_COLOR: Record<ListingStatus, MantineColor> = {
  active: LISTING_STATUS_TONES.active.color,
  inactive: LISTING_STATUS_TONES.inactive.color,
  sold: LISTING_STATUS_TONES.sold.color,
  rented: LISTING_STATUS_TONES.rented.color,
  archived: LISTING_STATUS_TONES.archived.color,
  pending: LISTING_STATUS_TONES.pending.color,
  expired: LISTING_STATUS_TONES.expired.color,
}

export type VisibilityTone = BadgeBucket

/** Theme colour per visibility bucket, for callers that classify by meaning rather than by status. */
export const VISIBILITY_TONE_COLOR: Record<VisibilityTone, MantineColor> = {
  positive: BADGE_TONES.success,
  warning: BADGE_TONES.warning,
  danger: BADGE_TONES.danger,
  neutral: BADGE_TONES.neutral,
}
