'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'

/**
 * Admin search state shared by `AdminSearchInput` and the listings manager (Task 857, R7): a controlled value,
 * a 300 ms debounce, and the URL write. It sets `q`, drops `page`, preserves every other param, and resyncs
 * from the URL only when no debounce is pending (the user is not mid-type).
 */
export function useAdminSearchQuery(propValue: string) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(propValue)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync from URL only when no debounce is pending (user is not mid-type).
  useEffect(() => {
    if (!debounceTimer.current) setValue(propValue)
  }, [propValue])

  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
  }, [])

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setValue(next)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      debounceTimer.current = null
      const params = new URLSearchParams(searchParams.toString())
      if (next) params.set('q', next)
      else params.delete('q')
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
  }

  return { value, onChange }
}
