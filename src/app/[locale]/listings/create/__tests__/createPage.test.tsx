// @vitest-environment node
/**
 * Task 957 (AC5, AC15): the create page hands the form only the locale, the mode and the Cloudinary API key and cloud name (Revision 1): no public preset, no upload folder (the folder
 * and the signature come from the server route); it adds no frame of its own; and a guest is sent to sign in.
 */
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MantineProvider } from '@mantine/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'

const state = vi.hoisted(() => ({ user: null as { id: string } | null, redirected: null as string | null, loaderProps: null as Record<string, unknown> | null }))
vi.mock('next/navigation', () => ({ redirect: (to: string) => { state.redirected = to; throw new Error('NEXT_REDIRECT') } }))
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }))
vi.mock('@/lib/auth/server', () => ({ getUser: async () => state.user }))
vi.mock('@/modules/listings/components/ListingFormLoader', () => ({
  ListingFormLoader: (props: Record<string, unknown>) => { state.loaderProps = props; return <div data-testid="loader" /> },
}))

import CreateListingPage, { generateMetadata } from '../page'

const NAMES = ['NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'CLOUDINARY_API_KEY', 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'] as const
const SAVED = Object.fromEntries(NAMES.map((name) => [name, process.env[name]]))
beforeEach(() => { state.user = null; state.redirected = null; state.loaderProps = null; for (const name of NAMES) delete process.env[name] })
afterEach(() => { for (const name of NAMES) { if (SAVED[name] === undefined) delete process.env[name]; else process.env[name] = SAVED[name] } })

describe('the create listing page', () => {
  it('[AC5] a signed-in person gets the form with the locale, the create mode and the Cloudinary API key and cloud name only; the public preset never reaches it', async () => {
    state.user = { id: 'u-1' }
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = 'public-preset-that-must-not-reach-the-form'
    process.env.CLOUDINARY_API_KEY = 'key-957'
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'cloud-957'
    const page = await CreateListingPage({ params: Promise.resolve({ locale: 'sq' }) })
    const html = renderToStaticMarkup(<MantineProvider theme={theme} env="test">{page}</MantineProvider>)
    expect(html).toContain('data-testid="loader"')
    expect(state.loaderProps).toEqual({ locale: 'sq', mode: 'create', cloudinary: { apiKey: 'key-957', cloudName: 'cloud-957' } })
    expect(html).not.toContain('public-preset-that-must-not-reach-the-form')
  })

  it('[AC5] unset variables reach the form as empty values (the photo widget then is not offered), never as "undefined"', async () => {
    state.user = { id: 'u-1' }
    const page = await CreateListingPage({ params: Promise.resolve({ locale: 'sq' }) })
    renderToStaticMarkup(<MantineProvider theme={theme} env="test">{page}</MantineProvider>)
    expect(state.loaderProps).toEqual({ locale: 'sq', mode: 'create', cloudinary: { apiKey: '', cloudName: '' } })
  })

  it('[AC15] the page adds no frame of its own: the form is the page element (no wrapper with a local background)', async () => {
    state.user = { id: 'u-1' }
    const page = (await CreateListingPage({ params: Promise.resolve({ locale: 'sq' }) })) as unknown as { type: unknown }
    const { ListingFormLoader } = await import('@/modules/listings/components/ListingFormLoader')
    expect(page.type).toBe(ListingFormLoader)
  })

  it('a guest is sent to sign in and comes back to the form', async () => {
    await expect(CreateListingPage({ params: Promise.resolve({ locale: 'en' }) })).rejects.toThrow('NEXT_REDIRECT')
    expect(state.redirected).toBe(`/en/auth/login?next=${encodeURIComponent('/en/listings/create')}&session=lost`)
    expect(state.loaderProps).toBeNull()
  })

  it('the title comes from the translations', async () => {
    expect(await generateMetadata({ params: Promise.resolve({ locale: 'sq' }) })).toEqual({ title: 'create_listing | Lero.al' })
  })
})
