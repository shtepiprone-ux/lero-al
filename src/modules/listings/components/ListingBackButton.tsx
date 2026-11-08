'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { readSavedPosition } from '@/modules/listings/lib/savedListingsPosition'

interface Props {
  locale: string
  label: string
}

export function ListingBackButton({ locale, label }: Props) {
  const router = useRouter()
  // Read when the button first renders; nothing on the page shows it, only the click uses it.
  const [returnUrl] = useState<string | null>(() => readSavedPosition()?.returnUrl ?? null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  function handleBack() {
    router.push(returnUrl ?? `/${locale}/listings`)
  }

  return (
    <Button
      variant="transparent"
      size="xs"
      onClick={handleBack}
      leftSection={<ArrowLeft size={theme.other!.iconSize!.badge} />}
    >
      {label}
    </Button>
  )
}
