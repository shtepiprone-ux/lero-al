'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Group } from '@mantine/core'
import { MantinePagination } from '@/design-system/mantine/patterns/MantinePagination'

interface Props {
  total: number
  page: number
  perPage: number
}

export function ListingsPagination({ total, page, perPage }: Props) {
  const tc = useTranslations('common')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (p === 1) params.delete('page')
    else params.set('page', String(p))
    router.push(`${pathname}?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav aria-label={tc('aria_pagination')}>
      <Group justify="center" py="2xl">
        <MantinePagination
          total={totalPages}
          value={page}
          onChange={goTo}
          previousLabel={tc('aria_prev_page')}
          nextLabel={tc('aria_next_page')}
        />
      </Group>
    </nav>
  )
}
