'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const RegisterFormDynamic = dynamic(
  () => import('@/modules/auth/components/RegisterForm').then(m => ({ default: m.RegisterForm })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border bg-card shadow-sm p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    ),
  }
)

export function RegisterFormClient() {
  return <RegisterFormDynamic />
}
