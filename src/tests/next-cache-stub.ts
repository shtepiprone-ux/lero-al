// Stub for `next/cache` in the Vitest environment.
// next/cache functions require a Next.js request scope (static generation store)
// that is not present in jsdom. In tests, cache invalidation is a no-op and
// unstable_cache returns the raw function unchanged (no memoization).
// Pattern mirrors the server-only-stub.ts alias added in Task 290.

// Next 16: `revalidateTag(tag, profile)` marks a tag stale (the profile is required) and `updateTag(tag)` expires it at once; `updateTag` works only in a Server Action.
export function revalidateTag(_tag: string, _profile?: string): void {}

export function updateTag(_tag: string): void {}

export function revalidatePath(_path: string, _type?: 'page' | 'layout'): void {}

export function unstable_cache<T>(fn: T): T {
  return fn
}
