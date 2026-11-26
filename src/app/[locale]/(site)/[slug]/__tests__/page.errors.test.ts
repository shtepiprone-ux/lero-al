/**
 * page.errors.test.ts — Task 869 (R1, R2, R5).
 *
 * The first test for any `page.tsx` route in this repository (G6). Copies the `vi.hoisted` +
 * `vi.mock` idiom of `src/app/api/cron/listing-activity/__tests__/route.test.ts` (G7).
 *
 * Covers:
 *   - CmsSlugPage's own `pages` query (R1): a PostgREST/transport error logs exactly once with
 *     `{ error, slug, locale }` and still 404s; a genuine miss (no row, no error) 404s with
 *     `console.error` called zero times. Arm (b) is what makes arm (a) meaningful — a suite with
 *     only the error arm would pass even if every miss were logged too.
 *   - `generateMetadata`'s own, independent `pages` query (R2): the identical two-arm distinction,
 *     with its own log prefix, returning `{}` in both cases (its return value never changes).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type QueryResult = { data: Record<string, unknown> | null; error: { code?: string; message: string } | null }

const state = vi.hoisted(() => ({
  pageResult: { data: null, error: null } as QueryResult,
  metaResult: { data: null, error: null } as QueryResult,
}))

const mockNotFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
)

vi.mock('next/navigation', () => ({
  notFound: mockNotFound,
}))

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
}))

// A chainable builder dispatching by `select(cols)`: `select('content')` is generateMetadata's
// own query; anything else is the page's own query. Both end in `.eq().eq().maybeSingle()`,
// matching the exact chain page.tsx calls.
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      select: (cols: string) => {
        const result = cols === 'content' ? state.metaResult : state.pageResult
        return {
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => result,
            }),
          }),
        }
      },
    }),
  }),
}))

const { default: CmsSlugPage, generateMetadata } = await import('../page')

const params = Promise.resolve({ locale: 'en', slug: 'test-cms-page' })

beforeEach(() => {
  state.pageResult = { data: null, error: null }
  state.metaResult = { data: null, error: null }
  mockNotFound.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CmsSlugPage — pages query error surfacing (R1)', () => {
  it('a 42501 permission error logs once and still 404s', async () => {
    const error = { code: '42501', message: 'permission denied for table pages' }
    state.pageResult = { data: null, error }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(CmsSlugPage({ params })).rejects.toThrow('NEXT_NOT_FOUND')

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith('CmsSlugPage: pages query failed', {
      error,
      slug: 'test-cms-page',
      locale: 'en',
    })
    expect(mockNotFound).toHaveBeenCalledTimes(1)
  })

  it('a genuine miss (no row, no error) 404s with console.error called zero times', async () => {
    state.pageResult = { data: null, error: null }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(CmsSlugPage({ params })).rejects.toThrow('NEXT_NOT_FOUND')

    expect(errorSpy).not.toHaveBeenCalled()
    expect(mockNotFound).toHaveBeenCalledTimes(1)
  })
})

describe('generateMetadata — pages query error surfacing (R2)', () => {
  it('a 42501 permission error logs once with its own prefix and still returns {}', async () => {
    const error = { code: '42501', message: 'permission denied for table pages' }
    state.metaResult = { data: null, error }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await generateMetadata({ params })

    expect(result).toEqual({})
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith('CmsSlugPage.generateMetadata: pages query failed', {
      error,
      slug: 'test-cms-page',
      locale: 'en',
    })
  })

  it('a genuine miss (no row, no error) returns {} with console.error called zero times', async () => {
    state.metaResult = { data: null, error: null }
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await generateMetadata({ params })

    expect(result).toEqual({})
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
