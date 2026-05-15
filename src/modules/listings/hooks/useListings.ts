'use client'

import { useEffect, useState } from 'react'
import { getFeaturedListings, getLatestListings } from '@/modules/listings/lib/queries'
import type { CardListingData } from '@/modules/listings/components/ListingCard'

export function useFeaturedListings() {
  const [listings, setListings] = useState<CardListingData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeaturedListings()
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { listings, loading }
}

export function useLatestListings() {
  const [listings, setListings] = useState<CardListingData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLatestListings()
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { listings, loading }
}
