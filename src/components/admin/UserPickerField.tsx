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
  // The last answer of the server search and the query it answered. What the field shows is derived from it and the query: no state is set to mirror the query.
  const [answer, setAnswer] = useState<{ query: string; results: PickerUser[] } | null>(null)
  const searchable = query.length >= 2
  const results = searchable && answer ? answer.results : []
  const isSearching = searchable && answer?.query !== query
  const open = searchable && answer !== null

  useEffect(() => {
    if (query.length < 2) return
    const timer = setTimeout(async () => {
      const res = await searchUsersForPicker(query)
      setAnswer({ query, results: res })
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function handleQueryChange(next: string) {
    setQuery(next)
    // A query shorter than two characters forgets the last answer, so a later search for the same text starts empty.
    if (next.length < 2) setAnswer(null)
  }

  function handleSelect(user: PickerUser) {
    onChange(user)
    handleQueryChange('')
  }

  return (
    <UserPickerFieldView
      label={label}
      icon={icon}
      value={value}
      onClear={() => onChange(null)}
      query={query}
      onQueryChange={handleQueryChange}
      results={results}
      open={open}
      isSearching={isSearching}
      onSelect={handleSelect}
      error={error}
      placeholder={placeholder}
    />
  )
}
