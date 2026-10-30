'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toggleUserVerified } from '@/modules/admin/actions'
import { toast } from '@/lib/toast'
import { AdminUsersTableView, type AdminUser, type VerifiedAgent } from './AdminUsersTableView'

export type { AdminUser, VerifiedAgent } from './AdminUsersTableView'

interface Props {
  users: AdminUser[]
  total: number
  page: number
  perPage: number
  activeRole: string
  activeStatus?: string
  locationRequestFilter?: boolean
  searchQuery?: string
  activeTab?: string
  verifiedAgents?: VerifiedAgent[]
}

/**
 * Container of the admin users surface (Task 859 Revision 7, R52): it owns the URL (`router.push`), the search debounce
 * and the `toggleUserVerified` server action, and renders `AdminUsersTableView` (presentational, with its own Story).
 */
export function AdminUsersTable({
  users: init,
  total,
  page,
  perPage,
  activeRole,
  activeStatus = '',
  locationRequestFilter,
  searchQuery = '',
  activeTab = 'all',
  verifiedAgents = [],
}: Props) {
  const t = useTranslations('admin.users')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [items, setItems] = useState(init)
  const [searchValue, setSearchValue] = useState(searchQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setItems(init) }, [init])

  // Sync search field from URL only when no debounce is pending (user not mid-type).
  useEffect(() => {
    if (!debounceRef.current) setSearchValue(searchQuery)
  }, [searchQuery])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => v === null ? params.delete(k) : params.set(k, v))
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSearchChange(next: string) {
    setSearchValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      const params = new URLSearchParams(searchParams.toString())
      if (next) params.set('q', next)
      else params.delete('q')
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
  }

  function withLoading(id: string, fn: () => Promise<void>) {
    setLoadingId(id)
    startTransition(async () => { await fn(); setLoadingId(null) })
  }

  function handleToggleVerified(user: { id: string; is_verified: boolean }) {
    withLoading(user.id, async () => {
      await toggleUserVerified(user.id, !user.is_verified)
      toast.success(t(user.is_verified ? 'revoke_success' : 'verify_success'))
    })
  }

  return (
    <AdminUsersTableView
      users={items}
      total={total}
      page={page}
      perPage={perPage}
      activeRole={activeRole}
      activeStatus={activeStatus}
      locationRequestFilter={locationRequestFilter}
      activeTab={activeTab}
      verifiedAgents={verifiedAgents}
      searchValue={searchValue}
      loadingId={loadingId}
      onNavigate={navigate}
      onSearchChange={handleSearchChange}
      onToggleVerified={handleToggleVerified}
    />
  )
}
