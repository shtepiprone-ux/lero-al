'use client'

import Link from 'next/link'
import { Button, useMantineTheme } from '@mantine/core'
import { Building2 } from 'lucide-react'

export interface AgentCtaButtonProps {
  href: string
  label: string
}

export function AgentCtaButton({ href, label }: AgentCtaButtonProps) {
  const theme = useMantineTheme()
  return (
    <Button
      component={Link}
      href={href}
      variant="filled"
      size="sm"
      leftSection={<Building2 size={theme.other.iconSize.standard} />}
      data-track="register"
      w={{ base: '100%', sm: 'auto' }}
      styles={{
        root: {
          paddingInlineStart: 'var(--button-padding-x)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      {label}
    </Button>
  )
}
