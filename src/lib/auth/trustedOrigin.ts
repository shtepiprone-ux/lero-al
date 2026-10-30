/**
 * The origin an e-mailed sign-in / recovery link may point to (Task 923 Revision 7, finding S17).
 *
 * The e-mail hook built the link from `new URL(payload.redirect_to).origin`. `redirect_to` is chosen by whoever asked for the e-mail (the sign-in call carries it),
 * so an origin taken from it can be another site: the e-mail then carries the person's one-time `token_hash` to that site, which can redeem it and sign in as them.
 * The link origin is therefore always one of OUR origins: the configured site URL, the production domain, and (outside production) localhost. Anything else
 * falls back to the configured site URL.
 */
const PRODUCTION_ORIGINS = ['https://lero.al', 'https://www.lero.al']

function originOf(value: string | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function allowedAppOrigins(env: { NEXT_PUBLIC_SITE_URL?: string; NODE_ENV?: string } = process.env): string[] {
  const configured = originOf(env.NEXT_PUBLIC_SITE_URL)
  const list = [...PRODUCTION_ORIGINS]
  if (configured) list.push(configured)
  return [...new Set(list)]
}

export function trustedAppOrigin(redirectTo: string | null | undefined, env: { NEXT_PUBLIC_SITE_URL?: string; NODE_ENV?: string } = process.env): string {
  const fallback = originOf(env.NEXT_PUBLIC_SITE_URL) ?? PRODUCTION_ORIGINS[0]
  const requested = originOf(redirectTo ?? undefined)
  if (!requested) return fallback
  if (allowedAppOrigins(env).includes(requested)) return requested
  // local development only: the dev server on this machine
  if (env.NODE_ENV !== 'production') {
    try {
      const u = new URL(requested)
      if ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && (u.protocol === 'http:' || u.protocol === 'https:')) return u.origin
    } catch {
      /* fall through */
    }
  }
  return fallback
}

/**
 * A redirect address that is safe to give to the auth provider for an e-mailed link (Task 923 Revision 7, finding S41): the origin is always one of ours (see
 * `trustedAppOrigin`), the path and query are kept, anything that is not a plain http(s) address becomes the site root. The caller sends the address, so it cannot be
 * trusted: `https://evil.example/auth/callback?next=/x` becomes `https://lero.al/auth/callback?next=/x`.
 */
export function trustedRedirectUrl(
  redirectTo: string | null | undefined,
  env: { NEXT_PUBLIC_SITE_URL?: string; NODE_ENV?: string } = process.env,
): string {
  const origin = trustedAppOrigin(typeof redirectTo === 'string' ? redirectTo : null, env)
  try {
    const u = new URL(String(redirectTo))
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return `${origin}/`
    return `${origin}${u.pathname}${u.search}`
  } catch {
    return `${origin}/`
  }
}
