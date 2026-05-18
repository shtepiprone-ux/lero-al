'use client'

import { useState } from 'react'
import { usePresence } from '@/hooks/usePresence'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminMobileHeader } from '@/components/admin/AdminMobileHeader'

export function AdminShell({ children, siteName }: { children: React.ReactNode; siteName?: string; locale?: string }) {
  usePresence()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="admin-shell flex min-h-screen bg-muted/30">
      <AdminSidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} siteName={siteName} />

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <AdminMobileHeader onOpen={() => setMobileOpen(true)} siteName={siteName} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
