'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AdminListingsView, type AdminListingsAuditCounts } from '@/components/admin/AdminListingsView'
import { ListingPreviewDialog } from '@/components/admin/ListingPreviewDialog'
import { PremiumDialog } from '@/components/admin/PremiumDialog'
import { useAdminSearchQuery } from '@/components/admin/useAdminSearchQuery'
import type { ListingStatus } from '@/types/database'
import { getListingStatusLabel, LISTING_STATUS_CODES } from '@/lib/i18n/listingStatusLabel'
import { usePropertyTypes } from '@/hooks/usePropertyTypes'

export interface AdminListing {
  id: string
  public_id?: number | null
  title: string
  status: ListingStatus
  is_premium: boolean
  listing_type: string
  property_type: string
  price: number
  currency: string
  slug: string
  created_at: string
  expires_at: string | null
  owner?: { name: string | null } | null
  // When the current premium ends (Task 857 R50/R57): read by the premium dialog and the preview dialog's details.
  premium_until?: string | null
}

interface Props {
  listings: AdminListing[]
  total: number
  page: number
  perPage: number
  activeStatus: string
  searchQuery?: string
  activeTab?: string
  activeVisibility?: string
  activeReason?: string
  auditCounts?: AdminListingsAuditCounts
}

// ── Container ─────────────────────────────────────────────────────────────────

export function AdminListingsTable({ listings: init, total, page, perPage, activeStatus, searchQuery = '', activeTab = 'all', activeVisibility = '', activeReason = '', auditCounts }: Props) {
  const tc = useTranslations('cabinet')
  const tl = useTranslations('listing')
  const { propertyTypes } = usePropertyTypes()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = useAdminSearchQuery(searchQuery)
  const [premiumDialog, setPremiumDialog] = useState<AdminListing | null>(null)
  const [previewListing, setPreviewListing] = useState<AdminListing | null>(null)
  const [items, setItems] = useState(init)
  const totalPages = Math.ceil(total / perPage)

  const statusLabel = (s: string) => getListingStatusLabel(s, k => tc(k as Parameters<typeof tc>[0]))

  const STATUS_LABEL: Record<ListingStatus, string> = Object.fromEntries(
    LISTING_STATUS_CODES.map(s => [s, statusLabel(s)])
  ) as Record<ListingStatus, string>

  useEffect(() => { setItems(init) }, [init])

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => v === null ? params.delete(k) : params.set(k, v))
    router.push(`${pathname}?${params.toString()}`)
  }

  function navigateVisibility(vis: string | null, reason?: string | null) {
    navigate({
      visibility: vis,
      reason: reason ?? null,
      page: '1',
    })
  }

  return (
    <>
      {premiumDialog && (
        <PremiumDialog
          listing={premiumDialog}
          onClose={() => setPremiumDialog(null)}
          onDone={() => {
            setPremiumDialog(null)
            router.refresh()
          }}
        />
      )}

      {previewListing && !premiumDialog && (
        <ListingPreviewDialog
          listing={previewListing}
          statusLabel={STATUS_LABEL[previewListing.status]}
          statusLabels={STATUS_LABEL}
          typeLabel={`${(tl as (k: string) => string)(previewListing.listing_type)} · ${propertyTypes.find(pt => pt.value === previewListing.property_type)?.label ?? previewListing.property_type}`}
          onClose={() => setPreviewListing(null)}
          onDeleted={id => {
            setItems(prev => prev.filter(x => x.id !== id))
            setPreviewListing(null)
            router.refresh()
          }}
          onPremium={() => {
            setPremiumDialog(previewListing)
            setPreviewListing(null)
          }}
          onStatusChanged={(id, newStatus) => {
            setItems(prev => prev.map(x => x.id === id ? { ...x, status: newStatus } : x))
            setPreviewListing(prev => prev?.id === id ? { ...prev, status: newStatus } : prev)
            router.refresh()
          }}
        />
      )}

      <AdminListingsView
        listings={items}
        page={page}
        totalPages={totalPages}
        activeStatus={activeStatus}
        activeTab={activeTab}
        activeVisibility={activeVisibility}
        activeReason={activeReason}
        auditCounts={auditCounts}
        statusLabels={STATUS_LABEL}
        search={search}
        onTabChange={tab => navigate({ tab: tab === 'all' ? null : tab, page: null, status: null })}
        onStatusChange={status => navigate({ status: status || null, page: null })}
        onVisibilityChange={vis => navigateVisibility(vis || null)}
        onAuditSelect={reason => navigateVisibility('hidden_eligible', reason)}
        onPageChange={p => navigate({ page: String(p) })}
        onSelect={setPreviewListing}
      />
    </>
  )
}
