/**
 * The site settings the admin saves, and the check of each value (Task 989). The lists left the `'use server'` action file: every export of such a file is a
 * Server Action, and the site's own components (the footer, the layouts) need the same checks before output.
 *
 * Two editors, no key in both (O989-3, 2026-11-19: "All the settings must be merged into the Footer page in the admin, and Site settings - Footer removed"):
 * - `SETTINGS_FORM_KEYS`: the "Site settings" page (`saveSettings`, permission `settings.manage`);
 * - `FOOTER_SETTING_KEYS`: the shared block of the "Footer" page (`saveFooterShared`, administrators only).
 * Every key of both lists has a reader on the site (`src/modules/admin/actions/__tests__/settingsReach.test.ts`).
 */
import { resolveLinkTarget } from '@/lib/security/safeUrl'

export const SITE_LOCALES = ['sq', 'en', 'uk', 'it'] as const
export type SiteLocale = typeof SITE_LOCALES[number]

/** the default title and description of each language (Task 989: they replace the unread `meta_title` and `meta_desc`) */
export const META_TITLE_KEYS = SITE_LOCALES.map((locale) => `meta_title_${locale}` as const)
export const META_DESC_KEYS = SITE_LOCALES.map((locale) => `meta_desc_${locale}` as const)

export const SETTINGS_FORM_KEYS: readonly string[] = [
  'site_name', 'logo_url', 'favicon_url', ...META_TITLE_KEYS, ...META_DESC_KEYS, 'og_image', 'archived_noindex_days', 'default_locale',
]

/** the show switches of the footer; an absent switch is on */
export const FOOTER_SWITCH_KEYS: readonly string[] = ['footer_show_phone', 'footer_show_email_support', 'footer_show_email_sales', 'footer_show_text']

export const FOOTER_SETTING_KEYS: readonly string[] = ['contact_phone', 'contact_email', 'contact_email_sales', ...FOOTER_SWITCH_KEYS]

/** keys the forms no longer hold (Task 989): `saveSettings` refuses them; their rows stay in the table, unread */
export const REMOVED_SETTING_KEYS: readonly string[] = [
  'tagline', 'logo_dark_url', 'social_facebook', 'social_instagram', 'social_linkedin', 'about_al', 'about_uk', 'meta_title', 'meta_desc',
]

const SETTING_MAX_LENGTH = 5000
const EMAIL_MAX_LENGTH = 254
/** one address: no space or line break, no `?`, `&`, `,` or `;` (a second address or a header in a `mailto:` link), exactly one `@` — one character class each side */
const EMAIL = /^[^\s@?&,;]+@[^\s@?&,;]+$/
/** `+`, digits, spaces, `(`, `)` and `-`, 6 to 20 characters */
const PHONE = /^[+0-9 ()-]{6,20}$/

/** a contact e-mail as the footer may output it; the domain has a dot that is neither its first nor its last character */
export function isValidContactEmail(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > EMAIL_MAX_LENGTH || !EMAIL.test(value)) return false
  const domain = value.slice(value.indexOf('@') + 1)
  return domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.')
}

export function isValidContactPhone(value: unknown): value is string {
  return typeof value === 'string' && PHONE.test(value) && /[0-9]/.test(value)
}

export function isValidSwitch(value: unknown): value is 'true' | 'false' {
  return value === 'true' || value === 'false'
}

/** a switch of the footer: shown unless it was saved as `'false'` */
export function isSwitchOn(value: string | null | undefined): boolean {
  return value !== 'false'
}

/** a value of the settings form; an address is empty or a link this site may output */
export function validSettingValue(key: string, value: unknown): boolean {
  if (!SETTINGS_FORM_KEYS.includes(key)) return false
  if (typeof value !== 'string' || value.length > SETTING_MAX_LENGTH) return false
  if (key === 'default_locale') return (SITE_LOCALES as readonly string[]).includes(value)
  if (key === 'archived_noindex_days') return /^[1-9][0-9]{0,4}$/.test(value)
  if (key === 'logo_url' || key === 'favicon_url' || key === 'og_image') return value === '' || resolveLinkTarget(value, 'sq') !== null
  return true
}

/** a value of the shared block of the Footer page; an empty contact is allowed (it is not shown) */
export function validFooterSettingValue(key: string, value: unknown): boolean {
  if (!FOOTER_SETTING_KEYS.includes(key) || typeof value !== 'string') return false
  if (FOOTER_SWITCH_KEYS.includes(key)) return isValidSwitch(value)
  if (value === '') return true
  if (key === 'contact_phone') return isValidContactPhone(value)
  return isValidContactEmail(value)
}

/** the `tel:` address of a valid phone (digits and a leading `+` only), or null */
export function telHref(phone: string | null | undefined): string | null {
  const value = typeof phone === 'string' ? phone.trim() : ''
  if (!isValidContactPhone(value)) return null
  return `tel:${value.startsWith('+') ? '+' : ''}${value.replace(/[^0-9]/g, '')}`
}

/** the `mailto:` address of a valid e-mail, each side encoded, or null */
export function mailtoHref(email: string | null | undefined): string | null {
  const value = typeof email === 'string' ? email.trim() : ''
  if (!isValidContactEmail(value)) return null
  const at = value.indexOf('@')
  return `mailto:${encodeURIComponent(value.slice(0, at))}@${encodeURIComponent(value.slice(at + 1))}`
}
