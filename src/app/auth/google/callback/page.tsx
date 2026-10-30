import type { Metadata } from 'next'
import { GoogleCallbackRelay } from './GoogleCallbackRelay'

// Task 927 Amendment 10 (D25): the address Google returns the sign-in window to. It lies outside the locale tree (the middleware leaves `/auth/*` out) and shows nothing but a loader
// while it hands the ID token to the opening window. It is never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function GoogleCallbackPage() {
  return <GoogleCallbackRelay />
}
