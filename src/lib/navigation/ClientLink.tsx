'use client'

import Link from 'next/link'

/**
 * `next/link` as a Client Component reference (Task 952, Next 16).
 *
 * Since Next 16 a Server Component that imports `next/link` receives the real `LinkComponent` function, not a client reference. A function cannot cross from a
 * Server Component into a Client Component, so `<Anchor component={Link}>` / `<Button component={Link}>` rendered by a Server Component fails the whole page with
 * "Functions cannot be passed directly to Client Components". Importing the link from this `'use client'` module turns it into a reference again. Render a plain
 * `<Link>` directly; use `ClientLink` only as the `component` prop of a Mantine (client) component inside a Server Component. No markup or style is added here.
 */
export const ClientLink = Link
