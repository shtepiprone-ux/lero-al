import type { ReactNode } from 'react'
import { Box } from '@mantine/core'

/**
 * GR-3d (docs/golden-rules.md) — the ONE Story gutter profile, and the only place a Story's edge gutter
 * is written. A `skipCanvas` Story drops the default canvas, so it wraps its page content here.
 *
 * Source: the default Storybook canvas — the `.container-wide` horizontal ladder
 * (`src/app/globals.css:714-724`: 16px, 24px from 640px, 32px from 1024px) with the canvas `py-6`
 * (`.storybook/preview.tsx` `withCanvas`, 24px top and bottom). No props: there are no variants.
 */
export function StoryPageGutter({ children }: { children: ReactNode }) {
  return (
    <Box px={{ base: 'md', sm: 'xl', lg: '2xl' }} py="xl">
      {children}
    </Box>
  )
}
