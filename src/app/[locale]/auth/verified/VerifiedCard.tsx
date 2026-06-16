import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VerifiedCardProps {
  variant: 'success' | 'error' | 'syncfail'
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
}

export function VerifiedCard({ variant, title, body, ctaLabel, ctaHref }: VerifiedCardProps) {
  const isSuccess = variant === 'success'
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-card border rounded-2xl shadow-sm p-8 flex flex-col items-center gap-5 text-center">
        {isSuccess
          ? <CheckCircle2 className="h-14 w-14 text-status-success shrink-0" />
          : <XCircle className="h-14 w-14 text-destructive shrink-0" />
        }
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
        <Link
          href={ctaHref}
          className={cn(buttonVariants({ size: 'xl' }), 'w-full justify-center')}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  )
}
