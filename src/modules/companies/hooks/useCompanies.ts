'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCompanies } from '@/modules/companies/lib/queries'
import type { Company } from '@/types/database'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await getCompanies()
      setCompanies(data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  return { companies, loading, refetch: load }
}
