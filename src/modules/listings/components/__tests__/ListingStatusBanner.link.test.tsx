/**
 * Task 952 (T3): the banner's "similar listings" control is a real link to the pre-filtered search. It reaches Mantine's Anchor through `ClientLink` (the `'use client'`
 * re-export of `next/link`), the form that Next 16 needs when a Server Component renders it. Every value is synthetic.
 */
import React from 'react'
import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { ListingStatusBanner } from '../ListingStatusBanner'

beforeEach(() => { setViewport(1024) })   // Mantine's provider reads matchMedia, which jsdom lacks

describe('ListingStatusBanner', () => {
  it('shows the message and a link to the search that the caller computed', () => {
    render(
      <MantineProvider theme={theme} env="test">
        <ListingStatusBanner status="sold" message="This listing was sold" similarLabel="See similar listings" href="/sq/listings?listing_type=sale" />
      </MantineProvider>,
    )
    expect(screen.getByText('This listing was sold')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'See similar listings' })
    expect(link).toHaveAttribute('href', '/sq/listings?listing_type=sale')
  })
})
