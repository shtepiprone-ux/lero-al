import { Box, Title, TypographyStylesProvider } from '@mantine/core'

export interface CmsPageViewProps {
  title: string | null | undefined
  body: string | null | undefined
}

/**
 * Task 869 — presentational server component for the public CMS route
 * (`src/app/[locale]/[slug]/page.tsx`). Plain data in, JSX out: locale resolution, the `sq`
 * fallback and every `notFound()` decision stay in the route (§10.3). No hooks, no network, no
 * `'use client'`.
 *
 * Width: `var(--width-content)` (`globals.css`, `theme.ts` `other.width.content` = 48rem/768px —
 * the exact value the migrated `max-w-3xl` resolved to). Spacing: theme tokens only
 * (`py-8 md:py-12` → `2xl`/`3xl`, `px-4` → `md`, `mb-6` → `xl`). Body typography: Mantine's
 * `TypographyStylesProvider`, replacing the `prose` classes that emitted no CSS (G8-G10).
 */
export function CmsPageView({ title, body }: CmsPageViewProps) {
  return (
    <Box component="main" maw="var(--width-content)" mx="auto" w="100%" px="md" py={{ base: '2xl', md: '3xl' }}>
      {title && (
        <Title order={1} fz={{ base: 'h5', sm: 'h4', md: 'h3' }} mb="xl">
          {title}
        </Title>
      )}
      {body && (
        <TypographyStylesProvider>
          <div dangerouslySetInnerHTML={{ __html: body }} />
        </TypographyStylesProvider>
      )}
    </Box>
  )
}
