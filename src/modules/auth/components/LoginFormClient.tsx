'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// dynamic with ssr:false must live inside a 'use client' module.
// This wrapper is the only place the LoginForm's <input> elements
// touch the render tree — server HTML never includes them.
const LoginFormDynamic = dynamic(
  () => import('@/modules/auth/components/LoginForm').then(m => ({ default: m.LoginForm })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card shadow-sm p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    ),
  }
)

interface Props {
  next?: string
}

export function LoginFormClient({ next }: Props) {
  return <LoginFormDynamic next={next} />
}
