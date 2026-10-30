/**
 * The `next` parameter of the sign-in and e-mail-link routes, made safe (Task 923 Revision 7, finding S5).
 *
 * `NextResponse.redirect(`${origin}${next}`)` with `next=@evil.example` is `https://lero.al@evil.example`: the part before `@` is "user info", so the browser goes to
 * evil.example. `next=//evil.example` and `next=/\evil.example` are protocol-relative forms; a tab or line break inside the value is removed by the URL parser and can
 * turn `/<TAB>/evil.example` into `//evil.example`. Only a path of THIS site is accepted: it must start with a single `/`, hold no control character or backslash,
 * and resolve against the site origin to the same origin. Anything else becomes the fallback.
 */
export function safeNextPath(next: string | null | undefined, origin: string, fallback = '/'): string {
  if (typeof next !== 'string' || next.length === 0 || next.length > 2048) return fallback
  if (!next.startsWith('/') || next.startsWith('//')) return fallback
  // eslint-disable-next-line no-control-regex -- control characters are exactly what must be refused
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return fallback
  let url: URL
  try {
    url = new URL(next, origin)
  } catch {
    return fallback
  }
  if (url.origin !== new URL(origin).origin) return fallback
  return `${url.pathname}${url.search}${url.hash}`
}
