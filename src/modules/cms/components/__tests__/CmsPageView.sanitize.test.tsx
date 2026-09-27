// @vitest-environment jsdom
/**
 * CmsPageView.sanitize.test.tsx — Task 884 (R3/T2).
 *
 * Renders the real `CmsPageView` with a body carrying a script and an `onerror` image, through
 * `renderToStaticMarkup` (server-component-shaped: no hydration, no client APIs), inside a real
 * `MantineProvider` matching `MantinePagination.smoke.test.tsx` / `theme.d69-18.test.tsx`'s stub.
 * Proves the rendered markup contains neither `<script` nor `onerror`, while the payload's
 * surrounding text survives — i.e. that sanitisation happens on the actual render path, not only
 * inside the `sanitizeCmsHtml` unit under test in T1.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { CmsPageView } from '../CmsPageView'

// jsdom has no matchMedia — MantineProvider's color-scheme detection needs it (same stub as
// theme.d69-18.test.tsx:44-58 / MantinePagination.smoke.test.tsx).
beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

function renderBody(body: string): string {
  return renderToStaticMarkup(
    <MantineProvider theme={theme}>
      <CmsPageView title="Terms" body={body} />
    </MantineProvider>,
  )
}

describe('CmsPageView — render-path sanitisation (R3/T2)', () => {
  it('strips a <script> payload from the rendered markup, keeping its surrounding text', () => {
    const markup = renderBody('<p>before</p><script>alert(1)</script><p>after</p>')
    expect(markup).not.toContain('<script')
    expect(markup).not.toContain('alert(1)')
    expect(markup).toContain('before')
    expect(markup).toContain('after')
  })

  it('strips an onerror image payload from the rendered markup, keeping its surrounding text', () => {
    const markup = renderBody('<p>lead-in</p><img src=x onerror=alert(1)><p>trail</p>')
    expect(markup).not.toContain('onerror')
    expect(markup).not.toContain('alert(1)')
    expect(markup).toContain('lead-in')
    expect(markup).toContain('trail')
  })
})
