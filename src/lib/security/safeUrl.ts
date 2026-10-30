/**
 * Links that come from data (Task 923 Revision 7, finding S9).
 *
 * A stored URL put straight into `href` runs script when it is `javascript:...` (and `data:`, `vbscript:`), and a deny-list does not hold: the browser removes
 * tabs and line breaks inside a scheme, so `java<TAB>script:alert(1)` is the same URL as `javascript:alert(1)` and passes a check for the word. This is an
 * ALLOW-list on the parsed result: a link is used only when, after the browser's own parsing, its scheme is one of those the caller allows (`http` and `https` by
 * default). A value with a control character anywhere is refused before parsing.
 */
// eslint-disable-next-line no-control-regex -- control characters are exactly what must be refused
const CONTROL = /[\u0000-\u001f\u007f\u0080-\u009f]/
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i

export type AllowedScheme = 'http:' | 'https:' | 'mailto:' | 'tel:'

/**
 * The normalised absolute URL, or null when the value is not a link this site may output.
 * A value without a scheme that looks like a host name ("example.com", "www.example.com/path") is read as https.
 */
export function safeExternalUrl(raw: string | null | undefined, allowed: readonly AllowedScheme[] = ['http:', 'https:']): string | null {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (!value || value.length > 2048 || CONTROL.test(value)) return null
  const candidate = HAS_SCHEME.test(value) ? value : /^[^\s/?#:@]+\.[^\s/?#@]+/.test(value) ? `https://${value}` : null
  if (!candidate) return null
  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }
  if (!allowed.includes(url.protocol as AllowedScheme)) return null
  // `https://user:pass@host` carries credentials in a link: not something a site should output
  if ((url.protocol === 'http:' || url.protocol === 'https:') && (url.username || url.password)) return null
  return url.href
}

export function isSafeExternalUrl(raw: string | null | undefined, allowed?: readonly AllowedScheme[]): boolean {
  return safeExternalUrl(raw, allowed) !== null
}

export interface LinkTarget {
  href: string
  /** true for an address on another site: it opens in a new tab with `noopener noreferrer` */
  external: boolean
}

/**
 * Where a configured footer / menu link goes, or null when the value is not a link this site may output.
 * An empty value is the home page of the locale; `/path` and `path` are pages of this site (locale prefix added); `http(s)://` is an external site; `mailto:` and `tel:`
 * are allowed; every other scheme, any control character and a protocol-relative `//host` or backslash form are refused.
 */
export function resolveLinkTarget(url: string | null | undefined, locale: string): LinkTarget | null {
  const value = typeof url === 'string' ? url.trim() : ''
  if (!value) return { href: `/${locale}`, external: false }
  if (CONTROL.test(value)) return null
  if (HAS_SCHEME.test(value)) {
    const safe = safeExternalUrl(value, ['http:', 'https:', 'mailto:', 'tel:'])
    return safe ? { href: safe, external: safe.startsWith('http') } : null
  }
  if (value.startsWith('//') || value.includes(String.fromCharCode(92))) return null
  // a value that does not start with a slash and has a colon before its first slash is a scheme in disguise, not a page
  if (!value.startsWith('/') && /^[^/?#]*:/.test(value)) return null
  return { href: `/${locale}${value.startsWith('/') ? value : `/${value}`}`, external: false }
}
