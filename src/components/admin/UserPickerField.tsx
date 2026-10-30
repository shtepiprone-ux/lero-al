'use client'

import { useState, useEffect } from 'react'
import { searchUsersForPicker } from '@/modules/admin/actions'
import type { PickerUser } from '@/components/admin/AdminSupportManager'
import { UserPickerFieldView, type UserPickerIcon } from '@/components/admin/UserPickerFieldView'

interface Props {
  label: string
  icon: UserPickerIcon
  value: PickerUser | null
  onChange: (user: PickerUser | null) => void
  error?: string
  placeholder?: string
}

/**
 * Container of the support/complaint user picker (Task 859): owns the query, the 300 ms debounced
 * `searchUsersForPicker` call and the selection; renders only `UserPickerFieldView`.
 */
export function UserPickerField({ label, icon, value, onChange, error, placeholder }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PickerUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    setIsSearching(true)
    const timer = setTimeout(async () => {
      const res = await searchUsersForPicker(query)
      setResults(res)
      setIsSearching(false)
      setOpen(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(user: PickerUser) {
    onChange(user)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <UserPickerFieldView
      label={label}
      icon={icon}
      value={value}
      onClear={() => onChange(null)}
      query={query}
      onQueryChange={setQuery}
      results={results}
      open={open}
      isSearching={isSearching}
      onSelect={handleSelect}
      error={error}
      placeholder={placeholder}
    />
  )
}
