'use client'

import { Box, Skeleton, useMantineTheme } from '@mantine/core'

/**
 * `HeroSearchClient`'s `ssr:false` `loading:` fallback, extracted into its own presentational
 * component (Task 568/665 container/View precedent) so it can be canonically story-rendered and
 * enrolled in `scripts/mantine-migration-scope.json` (agent-contract clause 16c). No hooks, no
 * props, no data-fetching — the fallback carries no text (nothing to translate).
 *
 * Height is per-breakpoint and MEASURED (`scripts/task670-qa-hero-fallback-geometry.mjs
 * --baseline`, `.screenshots/task670/baseline.json`), not invented: the real `HeroSearchView`
 * renders 279px below Mantine `sm` (640px, 3-row mobile stack), 175px in the `sm`-`md` band
 * (640-767px, Task 572's Search-alone second row), and 123px at `md`+ (768px, single row) —
 * identical across all 4 locales against this task's fixture (Task 670 kickoff §5 A1:
 * fixture-relative, not an all-content proof). Radius matches the real search bar's own token
 * (`var(--mantine-radius-lg)`, `HeroSearchView.tsx` `rounded-b-[var(--mantine-radius-lg)]`), not
 * `Skeleton`'s own `xl` theme default (Task 670 kickoff §10 I3).
 */
export function HeroSearchFallback() {
  const theme = useMantineTheme()
  return (
    <Box maw={theme.other.boxSize.content} mx="auto" w="100%">
      <Skeleton data-testid="hero-search-fallback" radius="lg" h={{ base: 279, sm: 175, md: 123 }} />
    </Box>
  )
}
