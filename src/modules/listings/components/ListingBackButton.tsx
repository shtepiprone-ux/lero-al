'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const RESTORE_KEY = 'listings_restore'

interface Props {
  locale: string
  label: string
}

export function ListingBackButton({ locale, label }: Props) {
  const router = useRouter()
  const [returnUrl, setReturnUrl] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    try {
      const raw = sessionStorage.getItem(RESTORE_KEY)
      if (raw) {
        const { returnUrl: url } = JSON.parse(raw)
        setReturnUrl(url)
      }
    } catch {}
  }, [])

  function handleBack() {
    router.push(returnUrl ?? `/${locale}/listings`)
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      <ArrowLeft className="h-3 w-3" />
      {label}
    </button>
  )
}
