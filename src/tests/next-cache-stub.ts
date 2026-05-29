/* eslint-disable @typescript-eslint/no-unused-vars */
// Stub for `next/cache` in the Vitest environment.
// next/cache functions require a Next.js request scope (static generation store)
// that is not present in jsdom. In tests, cache invalidation is a no-op and
// unstable_cache returns the raw function unchanged (no memoization).
// Pattern mirrors the server-only-stub.ts alias added in Task 290.

export function revalidateTag(_tag: string): void {}

export function revalidatePath(_path: string, _type?: 'page' | 'layout'): void {}

export function unstable_cache<T>(fn: T): T {
  return fn
}
