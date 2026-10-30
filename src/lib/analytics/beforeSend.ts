'use client'

/**
 * Filter for the events of Vercel's Analytics and Speed Insights (Task 927 Amendment 11, R56). Both scripts run on every page of the root layout, so they also run on
 * `/auth/google/callback`, where Google's ID token is in the address fragment until that page removes it. This filter keeps the auth pages out of analytics and the fragment out of
 * every address that does go.
 * It is a client module because the root layout is a server component and hands the function to Vercel's client components: a function crosses that boundary only as a client reference.
 */

/**
 * `null` (the event is not sent) when the address's path starts with `/auth/`; otherwise the event with any fragment removed from its `url`. An address that cannot be parsed is returned unchanged.
 */
export function withoutAuthCallback<T extends { url: string }>(event: T): T | null {
  let address: URL
  try {
    address = new URL(event.url)
  } catch {
    return event
  }
  if (address.pathname.startsWith('/auth/')) return null
  const fragmentAt = event.url.indexOf('#')
  return fragmentAt === -1 ? event : { ...event, url: event.url.slice(0, fragmentAt) }
}
