'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Props {
  value: string
  placeholder?: string
  className?: string
}

/**
 * Shared admin search input: controlled, debounced, space-safe.
 * Syncs q + resets page in the URL; preserves all other params.
 */
export function AdminSearchInput({ value: propValue, placeholder = '', className }: Props) {
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  return (
    <div className={`relative ${className ?? ''}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        placeholder={placeholder}
        className="h-9 pl-9 rounded-xl"
        onChange={handleChange}
      />
    </div>
  )
}
