'use client'

import { useEffect, useState } from 'react'
import { getCompanies } from '@/modules/companies/lib/queries'
import type { Company } from '@/types/database'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { companies, loading }
}
