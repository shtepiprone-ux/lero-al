'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAdminSearchQuery } from '@/components/admin/useAdminSearchQuery'

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
  const { value, onChange: handleChange } = useAdminSearchQuery(propValue)

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
