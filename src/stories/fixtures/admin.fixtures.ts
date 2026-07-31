/**
 * Typed admin story fixtures — deterministic, no Date.now()/random.
 * All dates are frozen (same render every run → screenshots:assert stable).
 * These objects supply prop-driven admin components in Storybook stories.
 * Locale-reactive text comes from the component's useTranslations() internally
 * via the global withLocale decorator. Only structural/data fields are literal here.
 *
 * Task 410 — Admin Storybook render harness.
 */

import type {
  DBCurrency,
  DBExchangeProvider,
  DBPropertyType,
  EmailTemplate,
  Company,
  UserRole,
  UserStatus,
  UserType,
  TicketStatus,
  ComplaintType,
  UserChangeLog,
  UserStatusHistory,
} from '@/types/database'

import type { AdminListing } from '@/components/admin/AdminListingsTable'
import type { AdminUser, VerifiedAgent } from '@/components/admin/AdminUsersTable'
import type { SupportTicketRow, SupportTicketEventRow } from '@/components/admin/AdminSupportManager'
import type { AllSettings } from '@/components/admin/AdminSettings'

// ── CompanyRow (internal type mirrors AdminCompaniesManager.tsx) ──────────────

export interface CompanyRow extends Company {
  agentCount: number
}

// ── Frozen timestamp constants ────────────────────────────────────────────────

const D1 = '2026-01-15T09:00:00Z'
const D2 = '2026-02-20T14:30:00Z'
const D3 = '2026-03-05T11:00:00Z'
const D4 = '2026-04-10T08:45:00Z'
const D5 = '2026-05-01T16:00:00Z'

// Frozen anchor "today" (no Date.now()/new Date() wall-clock in fixtures per Storybook
// governance §14, Task 697) — a cross-day capture must render byte-identical PNGs. Anchor is
// 2026-07-30 (Task 697 kickoff date). expires_at values below are derived from this single
// constant, preserving the original +30d valid / -10d expired relationship (A3).
const FIXTURE_TODAY_MS = Date.parse('2026-07-30T00:00:00.000Z')
const FIXTURE_EXPIRES_VALID = new Date(FIXTURE_TODAY_MS + 30 * 86_400_000).toISOString()
const FIXTURE_EXPIRES_PAST = new Date(FIXTURE_TODAY_MS - 10 * 86_400_000).toISOString()

// ── DBCurrency fixtures ───────────────────────────────────────────────────────

export const FIXTURE_CURRENCIES: DBCurrency[] = [
  {
    id: 1,
    code: 'ALL',
    symbol: 'L',
    name_sq: 'Lekë shqiptarë',
    name_en: 'Albanian Lek',
    name_uk: 'Албанський лек',
    name_it: 'Lek albanese',
    is_active: true,
    is_default: true,
    decimals: 0,
    created_at: D1,
    updated_at: D1,
  },
  {
    id: 2,
    code: 'EUR',
    symbol: '€',
    name_sq: 'Euro',
    name_en: 'Euro',
    name_uk: 'Євро',
    name_it: 'Euro',
    is_active: true,
    is_default: false,
    decimals: 2,
    created_at: D2,
    updated_at: D2,
  },
  {
    id: 3,
    code: 'USD',
    symbol: '$',
    name_sq: 'Dollar amerikan',
    name_en: 'US Dollar',
    name_uk: 'Долар США',
    name_it: 'Dollaro statunitense',
    is_active: false,
    is_default: false,
    decimals: 2,
    created_at: D3,
    updated_at: D3,
  },
]

// ── DBExchangeProvider fixtures ───────────────────────────────────────────────

export const FIXTURE_PROVIDERS: DBExchangeProvider[] = [
  {
    id: 1,
    name: 'BankOfAlbania',
    endpoint_url: 'https://api.bankofalbania.example/rates',
    api_key: null,
    refresh_interval_min: 60,
    priority: 1,
    mode: 'auto',
    is_enabled: true,
    notes: null,
    created_at: D1,
    updated_at: D1,
  },
  {
    id: 2,
    name: 'ExchangeRatesAPI',
    endpoint_url: 'https://api.exchangeratesapi.example/latest',
    api_key: 'key-redacted',
    refresh_interval_min: 30,
    priority: 2,
    mode: 'hybrid',
    is_enabled: true,
    notes: null,
    created_at: D2,
    updated_at: D3,
  },
  {
    id: 3,
    name: 'ManualRates',
    endpoint_url: 'https://internal.example/manual',
    api_key: null,
    refresh_interval_min: 1440,
    priority: 10,
    mode: 'manual',
    is_enabled: false,
    notes: null,
    created_at: D4,
    updated_at: D4,
  },
]

// ── DBPropertyType fixtures ───────────────────────────────────────────────────

export const FIXTURE_PROPERTY_TYPES: DBPropertyType[] = [
  {
    id: 1,
    slug: 'apartment',
    name_sq: 'Apartament',
    name_en: 'Apartment',
    name_uk: 'Квартира',
    name_it: 'Appartamento',
    is_active: true,
    sort_order: 1,
    created_at: D1,
    updated_at: D1,
  },
  {
    id: 2,
    slug: 'house',
    name_sq: 'Shtëpi',
    name_en: 'House',
    name_uk: 'Будинок',
    name_it: 'Casa',
    is_active: true,
    sort_order: 2,
    created_at: D1,
    updated_at: D1,
  },
  {
    id: 3,
    slug: 'commercial',
    name_sq: 'Lokal tregtar',
    name_en: 'Commercial',
    name_uk: 'Комерційна нерухомість',
    name_it: 'Commerciale',
    is_active: true,
    sort_order: 3,
    created_at: D2,
    updated_at: D2,
  },
  {
    id: 4,
    slug: 'land',
    name_sq: 'Tokë',
    name_en: 'Land',
    name_uk: 'Земельна ділянка',
    name_it: 'Terreno',
    is_active: false,
    sort_order: 4,
    created_at: D3,
    updated_at: D3,
  },
]

// ── CompanyRow fixtures ───────────────────────────────────────────────────────

export const FIXTURE_COMPANIES: CompanyRow[] = [
  {
    id: 'co-001',
    name: 'Tirana Real Estate Group',
    logo_url: null,
    created_at: D1,
    agentCount: 12,
  },
  {
    id: 'co-002',
    name: 'Adriatik Properties',
    logo_url: null,
    created_at: D2,
    agentCount: 5,
  },
  {
    id: 'co-003',
    name: 'Blloku Premium Homes',
    logo_url: null,
    created_at: D3,
    agentCount: 0,
  },
]

// ── EmailTemplate fixtures ────────────────────────────────────────────────────

export const FIXTURE_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'et-001',
    key: 'account_verification',
    locale: 'sq',
    subject: 'Verifikoni llogarinë tuaj',
    html_body: '<p>Kliko linkun për të verifikuar.</p>',
    variables: ['user_name', 'verify_url'],
    is_active: true,
    created_at: D1,
    updated_at: D2,
    updated_by: null,
  },
  {
    id: 'et-002',
    key: 'account_verification',
    locale: 'en',
    subject: 'Verify your account',
    html_body: '<p>Click the link to verify your account.</p>',
    variables: ['user_name', 'verify_url'],
    is_active: true,
    created_at: D1,
    updated_at: D2,
    updated_by: null,
  },
  {
    id: 'et-003',
    key: 'account_verification',
    locale: 'uk',
    subject: 'Підтвердіть свій акаунт',
    html_body: '<p>Натисніть посилання для підтвердження.</p>',
    variables: ['user_name', 'verify_url'],
    is_active: true,
    created_at: D1,
    updated_at: D2,
    updated_by: null,
  },
  {
    id: 'et-004',
    key: 'account_verification',
    locale: 'it',
    subject: 'Verifica il tuo account',
    html_body: '<p>Clicca il link per verificare.</p>',
    variables: ['user_name', 'verify_url'],
    is_active: true,
    created_at: D1,
    updated_at: D2,
    updated_by: null,
  },
  {
    id: 'et-005',
    key: 'listing_approved',
    locale: 'sq',
    subject: 'Njoftimi juaj u aprovua',
    html_body: '<p>Njoftimi juaj është aktiv tani.</p>',
    variables: ['user_name', 'listing_title', 'listing_url'],
    is_active: true,
    created_at: D3,
    updated_at: D3,
    updated_by: null,
  },
  {
    id: 'et-006',
    key: 'listing_approved',
    locale: 'en',
    subject: 'Your listing has been approved',
    html_body: '<p>Your listing is now active.</p>',
    variables: ['user_name', 'listing_title', 'listing_url'],
    is_active: true,
    created_at: D3,
    updated_at: D3,
    updated_by: null,
  },
  {
    id: 'et-007',
    key: 'listing_approved',
    locale: 'uk',
    subject: 'Ваше оголошення схвалено',
    html_body: '<p>Ваше оголошення тепер активне.</p>',
    variables: ['user_name', 'listing_title', 'listing_url'],
    is_active: true,
    created_at: D3,
    updated_at: D3,
    updated_by: null,
  },
  {
    id: 'et-008',
    key: 'listing_approved',
    locale: 'it',
    subject: 'Il tuo annuncio è stato approvato',
    html_body: '<p>Il tuo annuncio è ora attivo.</p>',
    variables: ['user_name', 'listing_title', 'listing_url'],
    is_active: true,
    created_at: D3,
    updated_at: D3,
    updated_by: null,
  },
]

// ── AdminListing fixtures ─────────────────────────────────────────────────────

export const FIXTURE_LISTINGS: AdminListing[] = [
  {
    id: 'lst-001',
    public_id: 1001,
    title: '3+1 apartament në qendër të Tiranës — kati i 5-të, pamje panoramike',
    status: 'active',
    is_premium: true,
    listing_type: 'sale',
    property_type: 'apartment',
    price: 95000,
    currency: 'EUR',
    slug: 'apartament-3-1-tirane-qender-1001',
    created_at: D1,
    expires_at: FIXTURE_EXPIRES_VALID,
    owner: { name: 'Arben Krasniqi' },
  },
  {
    id: 'lst-002',
    public_id: 1002,
    title: 'Shtëpi 250 m² me kopsht — Kombinat, Tirana',
    status: 'pending',
    is_premium: false,
    listing_type: 'sale',
    property_type: 'house',
    price: 180000,
    currency: 'EUR',
    slug: 'shtepi-250m2-kombinat-1002',
    created_at: D2,
    expires_at: null,
    owner: { name: 'Oksana Petrenko' },
  },
  {
    id: 'lst-003',
    public_id: 1003,
    title: 'Lokal tregtar 120 m² — Rruga e Kavajës',
    status: 'inactive',
    is_premium: false,
    listing_type: 'rent',
    property_type: 'commercial',
    price: 1200,
    currency: 'EUR',
    slug: 'lokal-tregtar-120m2-kavajes-1003',
    created_at: D3,
    expires_at: null,
    owner: { name: 'Marco Rossi' },
  },
  {
    id: 'lst-004',
    public_id: 1004,
    title: 'Apartament 2+1 — Durrës, pranë bregdetit',
    status: 'sold',
    is_premium: false,
    listing_type: 'sale',
    property_type: 'apartment',
    price: 62000,
    currency: 'EUR',
    slug: 'apartament-2-1-durres-bregdet-1004',
    created_at: D4,
    expires_at: FIXTURE_EXPIRES_PAST,
    owner: { name: 'Arben Krasniqi' },
  },
  {
    id: 'lst-005',
    public_id: 1005,
    title: 'Tokë 500 m² — Vlorë, zonë rezidenciale me leje ndërtimi',
    status: 'archived',
    is_premium: false,
    listing_type: 'sale',
    property_type: 'land',
    price: 45000,
    currency: 'EUR',
    slug: 'toke-500m2-vlore-rezidenciale-1005',
    created_at: D5,
    expires_at: null,
    owner: null,
  },
]

// ── AdminUser fixtures ────────────────────────────────────────────────────────

export const FIXTURE_USERS: AdminUser[] = [
  {
    id: 'usr-001',
    public_id: 101,
    name: 'Arben',
    last_name: 'Krasniqi',
    phone: '+355691234567',
    role: 'agent' as UserRole,
    user_type: 'agent' as UserType,
    is_verified: true,
    company_name: 'Tirana Real Estate Group',
    status: 'active' as UserStatus,
    location_request: null,
    created_at: D1,
    last_seen_at: D5,
    avatar_url: null,
  },
  {
    id: 'usr-002',
    public_id: 102,
    name: 'Oksana',
    last_name: 'Petrenko',
    phone: '+380509876543',
    role: 'user' as UserRole,
    user_type: 'private' as UserType,
    is_verified: false,
    company_name: null,
    status: 'active' as UserStatus,
    location_request: { city: 'Tirana' },
    created_at: D2,
    last_seen_at: D4,
    avatar_url: null,
  },
  {
    id: 'usr-003',
    public_id: 103,
    name: 'Marco',
    last_name: 'Rossi',
    phone: null,
    role: 'moderator' as UserRole,
    user_type: 'private' as UserType,
    is_verified: false,
    company_name: null,
    status: 'active' as UserStatus,
    location_request: null,
    created_at: D3,
    last_seen_at: D3,
    avatar_url: null,
  },
  {
    id: 'usr-004',
    public_id: 104,
    name: 'Gentiana',
    last_name: 'Hoxha',
    phone: '+355695557777',
    role: 'user' as UserRole,
    user_type: 'private' as UserType,
    is_verified: false,
    company_name: null,
    status: 'blocked' as UserStatus,
    location_request: null,
    created_at: D4,
    last_seen_at: null,
    avatar_url: null,
  },
]

export const FIXTURE_VERIFIED_AGENTS: VerifiedAgent[] = [
  { id: 'usr-001', name: 'Arben Krasniqi', company_name: 'Tirana Real Estate Group', created_at: D1 },
]

// ── SupportTicketRow fixtures ─────────────────────────────────────────────────

export const FIXTURE_TICKETS: SupportTicketRow[] = [
  {
    id: 'tkt-001',
    subject: 'Nuk mund të redaktoj njoftimin pas publikimit',
    status: 'open' as TicketStatus,
    ticket_type: 'support',
    complaint_type: null,
    reason: null,
    assigned_to: null,
    created_at: D1,
    updated_at: D2,
    reporter: { id: 'usr-002', name: 'Oksana Petrenko' },
    reported: null,
    created_by_admin: null,
  },
  {
    id: 'tkt-002',
    subject: 'Ankesë për foto false të pronës',
    status: 'in_progress' as TicketStatus,
    ticket_type: 'user_complaint',
    complaint_type: 'fake_listing_or_profile' as ComplaintType,
    reason: null,
    assigned_to: 'usr-003',
    created_at: D2,
    updated_at: D3,
    reporter: { id: 'usr-004', name: 'Gentiana Hoxha' },
    reported: { id: 'usr-001', name: 'Arben Krasniqi' },
    created_by_admin: null,
  },
  {
    id: 'tkt-003',
    subject: 'Disputa pagese për depozitën e qirasë',
    status: 'resolved' as TicketStatus,
    ticket_type: 'support',
    complaint_type: null,
    reason: null,
    assigned_to: null,
    created_at: D3,
    updated_at: D4,
    reporter: { id: 'usr-002', name: 'Oksana Petrenko' },
    reported: null,
    created_by_admin: null,
  },
]

export const FIXTURE_TICKET_EVENTS: SupportTicketEventRow[] = [
  {
    id: 'ev-001',
    ticket_id: 'tkt-002',
    actor_user_id: 'usr-003',
    actor_role: 'moderator',
    event_type: 'status_change',
    old_status: 'open',
    new_status: 'in_progress',
    note: null,
    created_at: D3,
    actor: { name: 'Marco Rossi' },
  },
]

// ── AllSettings fixture ───────────────────────────────────────────────────────

export const FIXTURE_SETTINGS: AllSettings = {
  site_name: 'Lero.al',
  tagline: '',
  contact_email: 'info@lero.al',
  contact_phone: '',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  social_facebook: '',
  social_instagram: '',
  social_linkedin: '',
  about_al: '',
  about_uk: '',
  meta_title: 'Lero.al',
  meta_desc: '',
  og_image: '',
  archived_noindex_days: '90',
  default_locale: 'sq',
}

// ── AdminUserProfile fixtures ─────────────────────────────────────────────────

export const FIXTURE_PROFILE_USER = {
  id: 'usr-001',
  public_id: 101,
  name: 'Arben',
  last_name: 'Krasniqi',
  phone: '+355691234567',
  whatsapp: null,
  avatar_url: null,
  role: 'agent' as UserRole,
  user_type: 'agent' as UserType,
  status: 'active' as UserStatus,
  block_reason: null,
  suspended_until: null,
  company_name: 'Tirana Real Estate Group',
  company_logo_url: null,
  company_id: 'co-001',
  website: null,
  is_verified: true,
  social_provider: null,
  location_id: null,
  position: null,
  year_started: null,
  deleted_at: null,
  location_request: null,
  preferred_currency: 'EUR',
  pending_email: null,
  last_seen_at: D5,
  inactivity_warning_sent_at: null,
  preferred_locale: 'sq',
  created_at: D1,
  location: null,
}

export const FIXTURE_CHANGE_LOG: UserChangeLog[] = [
  {
    id: 'chg-001',
    user_id: 'usr-001',
    changed_by: 'usr-admin',
    field_name: 'profile_type',
    old_value: 'private',
    new_value: 'agent',
    changed_at: D3,
  },
]

export const FIXTURE_STATUS_HISTORY: UserStatusHistory[] = [
  {
    id: 'sth-001',
    user_id: 'usr-001',
    old_status: 'active',
    new_status: 'inactive',
    reason: 'Requested by user',
    changed_by: 'usr-admin',
    changed_at: D4,
  },
  {
    id: 'sth-002',
    user_id: 'usr-001',
    old_status: 'inactive',
    new_status: 'active',
    reason: null,
    changed_by: 'usr-admin',
    changed_at: D5,
  },
]

export const FIXTURE_CITIES = [
  { id: 1, name_al: 'Tirana', region_id: 1 },
  { id: 2, name_al: 'Durrës', region_id: 2 },
  { id: 3, name_al: 'Vlorë', region_id: 3 },
]

export const FIXTURE_REGIONS = [
  { id: 1, name_al: 'Qarku i Tiranës' },
  { id: 2, name_al: 'Qarku i Durrësit' },
  { id: 3, name_al: 'Qarku i Vlorës' },
]
