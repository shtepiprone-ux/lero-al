import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageShellProps = {
  children: ReactNode
  as?: 'main' | 'div'
  container?: 'wide' | 'narrow' | 'form'
  className?: string
}

export function PageShell({
  children,
  as: Comp = 'main',
  container = 'wide',
  className,
}: PageShellProps) {
  const inner =
    container === 'narrow' ? (
      <div className="max-w-3xl mx-auto">{children}</div>
    ) : container === 'form' ? (
      <div className="max-w-xl mx-auto">{children}</div>
    ) : (
      children
    )

  return (
    <Comp className={cn('container-wide py-8 sm:py-12 lg:py-16 2xl:py-20', className)}>
      {inner}
    </Comp>
  )
}
