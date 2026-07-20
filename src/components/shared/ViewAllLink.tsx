'use client'

import Link from 'next/link'
import { Button } from '@mantine/core'

export interface ViewAllLinkProps {
  href: string
  label: string
}

export function ViewAllLink({ href, label }: ViewAllLinkProps) {
  return (
    <Button
      component={Link}
      href={href}
      variant="transparent"
      size="sm"
      styles={{
        root: {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        label: {
          textAlign: 'right',
        },
      }}
    >
      {label}
    </Button>
  )
}
