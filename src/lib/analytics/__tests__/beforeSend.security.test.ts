/**
 * Task 927 Amendment 11 (R56): Vercel's Analytics and Speed Insights run on every page of the root layout, the Google callback page included, where the ID token sits in the address
 * fragment until that page removes it. The real `withoutAuthCallback` is the `beforeSend` of both scripts.
 * What it protects: no event leaves for an `/auth` page, and no event carries a fragment (the ID token, or anything else after a `#`); every other field of an event stays as it was.
 */
import { expect, it } from 'vitest'
import { withoutAuthCallback } from '../beforeSend'

it('[SEC-927-FE-ANALYTICS-DROP] analytics drop every /auth event and strip the fragment from every other', () => {
  const callback = 'http://localhost:3000/auth/google/callback#id_token=zz.synthetic.idtoken&state=s1'
  const productionCallback = 'https://lero.al/auth/google/callback#id_token=zz.synthetic.idtoken&state=s1'

  // the callback page's events are dropped, for both scripts' event types
  expect(withoutAuthCallback({ type: 'pageview', url: callback })).toBeNull()
  expect(withoutAuthCallback({ type: 'event', url: productionCallback })).toBeNull()
  expect(withoutAuthCallback({ type: 'vital', url: callback, route: '/auth/google/callback' })).toBeNull()

  // another page's event keeps everything but the fragment
  const listing = { type: 'pageview', url: 'https://lero.al/en/listings?x=1#top' }
  const stripped = withoutAuthCallback(listing)
  expect(stripped).toEqual({ type: 'pageview', url: 'https://lero.al/en/listings?x=1' })
  expect(withoutAuthCallback({ type: 'vital', url: 'https://lero.al/en/listings#top', route: '/[locale]/listings' })).toEqual({ type: 'vital', url: 'https://lero.al/en/listings', route: '/[locale]/listings' })
  expect(listing.url, 'the event it was given is not changed').toBe('https://lero.al/en/listings?x=1#top')

  // an address without a fragment, and one that cannot be parsed, are returned unchanged
  const plain = { type: 'pageview', url: 'https://lero.al/en' }
  expect(withoutAuthCallback(plain)).toBe(plain)
  const unreadable = { type: 'pageview', url: 'not a url #zz.synthetic.idtoken' }
  expect(withoutAuthCallback(unreadable)).toBe(unreadable)

  // a path that only looks like /auth is not one
  expect(withoutAuthCallback({ type: 'pageview', url: 'https://lero.al/en/authors' })).toEqual({ type: 'pageview', url: 'https://lero.al/en/authors' })

  // no returned event carries the token
  const returned = [stripped, withoutAuthCallback({ type: 'pageview', url: 'https://lero.al/en/x#id_token=zz.synthetic.idtoken' })]
  expect(JSON.stringify(returned)).not.toContain('zz.synthetic.idtoken')
})
