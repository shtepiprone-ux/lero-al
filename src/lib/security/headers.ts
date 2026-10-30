/**
 * Security response headers for every route (Task 923 Revision 7, finding S7: `next.config.ts` set none).
 *
 *  - `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`: no other site may frame ours (clickjacking of the admin panel and of the sign-in sheet);
 *  - `X-Content-Type-Options: nosniff`: a response is never re-interpreted as another type (an uploaded file served as script);
 *  - `Referrer-Policy: strict-origin-when-cross-origin`: a private path (/admin/..., /cabinet/...) is not sent to another site in the Referer;
 *  - `Permissions-Policy`: the browser features the site never uses are off for it and for any frame;
 *  - `Strict-Transport-Security`: the browser talks to the site over HTTPS only (ignored on plain-http localhost);
 *  - CSP `base-uri 'self'; form-action 'self'; object-src 'none'`: an injected `<base>`, a form posting elsewhere and plug-ins are blocked.
 * A script / style policy is NOT set here: the site loads Cloudinary images, Leaflet tiles, Turnstile and analytics, and a wrong allow-list would break pages; that
 * policy is a separate, measured change (listed as a recommendation in the security findings).
 */
export const CSP_BASELINE = ["frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"].join('; ')

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(), usb=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: CSP_BASELINE },
]

/**
 * A SCRIPT policy in REPORT-ONLY mode for the dynamic routes (Task 923 R70 (f)): the admin panel, the cabinet and the auth pages. `Content-Security-Policy-Report-Only` reports
 * every script the policy would block and blocks nothing; enforcing it is a later owner decision, and `CSP_BASELINE` above is unchanged.
 *  - `'nonce-…'`: one fresh nonce per request. The REQUEST carries the same policy, so Next.js reads the nonce from it and puts it on its own scripts (the framework chunks and
 *    the hydration data); the response carries it to the browser.
 *  - `'strict-dynamic'`: a script that a nonce'd script loads is trusted too, so the host list only has to name the scripts the pages themselves ask for.
 *  - the host list (`CSP_SCRIPT_HOSTS`) is the inventory of third-party script sources of those pages: Cloudflare Turnstile, on the sign-in and sign-up forms
 *    (`src/components/auth/CaptchaWidget.tsx`). Every other script of the site is same-origin: the framework chunks and `/_vercel/*` of Vercel Analytics and Speed Insights.
 *    (A browser that knows `strict-dynamic` ignores the host list and `'self'`; an older one uses them.)
 */
export const CSP_SCRIPT_HOSTS = ['https://challenges.cloudflare.com']

export function scriptReportOnlyPolicy(nonce: string): string {
  return [`script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${CSP_SCRIPT_HOSTS.join(' ')}`, "object-src 'none'", "base-uri 'self'"].join('; ')
}

/** a fresh, unguessable nonce for one request (Web Crypto and `btoa` exist in the edge runtime) */
export function newScriptNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

/** the dynamic routes that carry the report-only script policy: `/admin` and the cabinet and auth pages, with or without a language prefix */
export function carriesScriptReportOnly(pathname: string): boolean {
  return /^\/admin(?:\/|$)/.test(pathname) || /^\/(?:(?:sq|en|uk|it)\/)?(?:cabinet|auth)(?:\/|$)/.test(pathname)
}
