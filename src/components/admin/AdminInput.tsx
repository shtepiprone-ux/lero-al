import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/** Admin-canonical Input: h-10 rounded-xl (40px height, consistent across all admin forms). */
export function AdminInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn('h-10 rounded-xl', className)} {...props} />
}
