/**
 * Task 953 (immutability): the favorites page tells the shell that the list could not be loaded. The flag was set from inside a rejection handler; it is now taken
 * from the result of the read. The shell must get `error` only when the read failed, with an empty list, and the counts and collections still come through.
 */
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const state = vi.hoisted(() => ({
  user: { id: 'u1' } as { id: string } | null,
  favorites: vi.fn(),
  counts: vi.fn(),
  collections: vi.fn(),
}))

vi.mock('@/lib/auth/server', () => ({ getUser: async () => state.user }))
vi.mock('next/navigation', () => ({ redirect: (to: string) => { throw new Error(`REDIRECT ${to}`) } }))
vi.mock('next/link', () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }))
vi.mock('next-intl/server', () => ({ getTranslations: async ({ namespace }: { namespace: string }) => (key: string) => `${namespace}.${key}` }))
vi.mock('@/modules/listings/lib/favoritesQueries', () => ({
  getFavoriteListingsPaginated: (...args: unknown[]) => state.favorites(...args),
  getFavoriteTypeCounts: (...args: unknown[]) => state.counts(...args),
  getUserCollections: (...args: unknown[]) => state.collections(...args),
}))
vi.mock('@/modules/listings/components/FavoritesShell', () => ({
  FavoritesShell: (props: { listings: unknown[]; userId: string; typeFilter?: string; typeCounts: Record<string, number>; page: number; perPage: number; error?: boolean; initialCollections: unknown[] }) => (
    <div data-testid="shell" data-error={String(props.error)} data-count={props.listings.length} data-user={props.userId} data-type={props.typeFilter ?? ''} data-page={props.page} data-per-page={props.perPage}
      data-counts={JSON.stringify(props.typeCounts)} data-collections={props.initialCollections.length} />
  ),
}))

import FavoritesPage from '../page'

const search = (sp: Record<string, string | string[] | undefined> = {}) => ({ params: Promise.resolve({ locale: 'en' }), searchParams: Promise.resolve(sp) })

beforeEach(() => {
  state.user = { id: 'u1' }
  state.favorites.mockReset().mockResolvedValue({ listings: [{ id: 'a' }, { id: 'b' }], total: 2 })
  state.counts.mockReset().mockResolvedValue({ apartment: 2 })
  state.collections.mockReset().mockResolvedValue([{ id: 'c1' }])
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('FavoritesPage', () => {
  it('passes the loaded list to the shell with no error', async () => {
    render(await FavoritesPage(search()))
    const shell = screen.getByTestId('shell')
    expect(shell).toHaveAttribute('data-error', 'false')
    expect(shell).toHaveAttribute('data-count', '2')
    expect(shell).toHaveAttribute('data-user', 'u1')
    expect(shell).toHaveAttribute('data-counts', '{"apartment":2}')
    expect(shell).toHaveAttribute('data-collections', '1')
  })

  it('marks the shell as failed, with an empty list, when the read of the favorites fails, and still passes the counts and collections', async () => {
    state.favorites.mockRejectedValue(new Error('db down'))
    render(await FavoritesPage(search()))
    const shell = screen.getByTestId('shell')
    expect(shell).toHaveAttribute('data-error', 'true')
    expect(shell).toHaveAttribute('data-count', '0')
    expect(shell).toHaveAttribute('data-counts', '{"apartment":2}')
    expect(shell).toHaveAttribute('data-collections', '1')
    expect(console.error).toHaveBeenCalledWith('Failed to fetch favorite listings', expect.any(Error))
  })

  it('reads the requested page and type filter, ignoring values that are not valid', async () => {
    render(await FavoritesPage(search({ page: '3', type: 'apartment' })))
    expect(state.favorites).toHaveBeenCalledWith('u1', 'apartment', 3, 25)
    expect(screen.getByTestId('shell')).toHaveAttribute('data-type', 'apartment')
    state.favorites.mockClear()
    render(await FavoritesPage(search({ page: '-4', type: 'castle' })))
    expect(state.favorites).toHaveBeenCalledWith('u1', undefined, 1, 25)
  })

  it('sends a visitor with no session to the sign-in page', async () => {
    state.user = null
    await expect(FavoritesPage(search())).rejects.toThrow('REDIRECT /en/auth/login?next=%2Fen%2Ffavorites&session=lost')
  })
})
