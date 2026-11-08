/**
 * Task 952 (T3): each popular-location card is a real link to its page. The card reaches Mantine's Flex through `ClientLink` (the `'use client'` re-export of
 * `next/link`), the form that Next 16 needs when a Server Component renders it. Every value is synthetic.
 */
import React from 'react'
import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import { PopularLocationsView } from '../PopularLocationsView'

beforeEach(() => { setViewport(1024) })   // Mantine's provider reads matchMedia, which jsdom lacks

describe('PopularLocationsView', () => {
  it('renders one link per location, to the href it was given, with its tracking marker', () => {
    render(
      <MantineProvider theme={theme} env="test">
        <PopularLocationsView
          heading="Popular locations"
          locations={[
            { id: 'loc-1', name: 'Tirana', href: '/sq/listings?location=tirana', imageUrl: null },
            { id: 'loc-2', name: 'Durres', href: '/sq/listings?location=durres', imageUrl: 'https://res.cloudinary.com/demo/image/upload/durres.jpg' },
          ]}
        />
      </MantineProvider>,
    )
    expect(screen.getByRole('heading', { name: 'Popular locations' })).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/sq/listings?location=tirana', '/sq/listings?location=durres'])
    expect(links.map((a) => a.getAttribute('data-track'))).toEqual(['popular_location_click', 'popular_location_click'])
    expect(screen.getByRole('link', { name: /Tirana/ })).toBeInTheDocument()
  })
})
