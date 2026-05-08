'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

  function getPages(): (number | 'ellipsis')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | 'ellipsis')[] = [1]
    if (page > 3) pages.push('ellipsis')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
    return pages
  }

  return (
    <nav className="listings-pagination flex items-center justify-center gap-1 py-8" aria-label="Pagination">
      <Button
        variant="outline"
        size="icon"
        onClick={() => goTo(page - 1)}
        disabled={page === 1}
        className="h-10 w-10 rounded-xl"
        aria-label={tc('aria_prev_page')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getPages().map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className="h-10 w-10 flex items-center justify-center text-muted-foreground text-sm">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="icon"
            onClick={() => goTo(p)}
            className="h-10 w-10 rounded-xl text-sm font-medium"
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => goTo(page + 1)}
        disabled={page === totalPages}
        className="h-10 w-10 rounded-xl"
        aria-label={tc('aria_next_page')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}
