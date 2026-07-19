'use client'

import Link from 'next/link'
import { Button } from '@mantine/core'

export interface ViewAllLinkProps {
  href: string
  label: string
}

export function ViewAllLink({ href, label }: ViewAllLinkProps) {
  return (
    <Button component={Link} href={href} variant="transparent" size="sm">
      {label}
    </Button>
  )
}
