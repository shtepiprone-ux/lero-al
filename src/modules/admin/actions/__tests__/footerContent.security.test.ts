// @vitest-environment node
/**
 * Security (Task 923 R66 (n)): the public footer read returns display fields only and is not a Server Action.
 *  - SEC-X-SRV-FOOTER-SHAPE: the REAL `getFooterContent` runs against a service-role double that answers with a row holding editor bookkeeping (`updated_by`,
 *    `updated_by_name`, `updated_at`) whatever columns were asked for. The result holds the display fields and nothing else, and the query names its columns (no `*`).
 *    The module boundary is read as text: the function is exported from a `server-only` module and from no `'use server'` module, and the footer container imports it
 *    from there.
 * Every value is a synthetic placeholder.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  selects: [] as string[],
  filters: [] as Array<[string, unknown]>,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => {
      const chain = {
        select: (cols: string) => { state.selects.push(cols); return chain },
        in: (column: string, values: unknown) => { state.filters.push([column, values]); return chain },
        then: (resolve: (v: unknown) => void) => resolve({ data: state.rows, error: null }),
      }
      return chain
    },
  }),
}))

import { getFooterContent } from '../../lib/settings'

const DISPLAY = ['brand_title', 'copyright_template', 'info_links', 'info_section_title', 'locale', 'nav_links', 'nav_section_title', 'social_links', 'social_section_title', 'tagline']

const row = (locale: string) => ({
  locale,
  brand_title: `T-${locale}`,
  tagline: 'tag',
  nav_section_title: 'Nav',
  nav_links: [{ id: 'a', label: 'A', url: '/a', enabled: true, order: 0 }],
  info_section_title: 'Info',
  info_links: null,
  social_section_title: 'Social',
  social_links: undefined,
  copyright_template: '© {year}',
  // editor bookkeeping: must never reach a visitor
  updated_by: '00000000-0000-4000-8000-0000000000aa',
  updated_by_name: 'Synthetic Editor',
  updated_at: '2026-01-01T00:00:00Z',
  internal_note: 'not for the public',
})

const read = (relative: string) => readFileSync(join(process.cwd(), relative), 'utf8')

beforeEach(() => { state.rows = []; state.selects = []; state.filters = [] })

describe('footerContent', () => {
  it('[SEC-X-SRV-FOOTER-SHAPE] the footer read returns display fields only', async () => {
    state.rows = [row('sq'), row('en')]
    const footer = await getFooterContent('en')
    expect(Object.keys(footer ?? {}).sort()).toEqual(DISPLAY)
    expect(footer).toMatchObject({ locale: 'en', brand_title: 'T-en', info_links: [], social_links: [] })
    expect(JSON.stringify(footer)).not.toMatch(/updated_by|Synthetic Editor|00000000-0000-4000-8000-0000000000aa|internal_note|updated_at/)
    // the query names the display columns: no `*`, and none of the bookkeeping columns
    expect(state.selects).toHaveLength(1)
    expect(state.selects[0]).not.toContain('*')
    expect(state.selects[0]).not.toMatch(/updated_by|updated_at/)
    expect(state.selects[0].split(',').map((c) => c.trim()).sort()).toEqual(DISPLAY)

    // the module boundary: not a Server Action
    const actions = read('src/modules/admin/actions/footer.ts')
    expect(actions).toMatch(/^\s*['"]use server['"]/m)
    expect(actions).not.toMatch(/export\s+(async\s+)?function\s+getFooterContent\b/)
    expect(actions).not.toMatch(/export\s*\{[^}]*getFooterContent/)
    const settings = read('src/modules/admin/lib/settings.ts')
    expect(settings).toMatch(/^import\s+['"]server-only['"]/m)
    expect(settings).not.toMatch(/^\s*['"]use server['"]/m)
    expect(settings).toMatch(/export\s+async\s+function\s+getFooterContent\b/)
    expect(read('src/components/layout/Footer.tsx')).toMatch(/import\s*\{[^}]*getFooterContent[^}]*\}\s*from\s*'@\/modules\/admin\/lib\/settings'/)
  })

  it('the footer asks for its language and Albanian, prefers its language, and treats an unknown language as Albanian (the controls)', async () => {
    state.rows = [row('sq'), row('uk')]
    expect((await getFooterContent('uk'))?.brand_title).toBe('T-uk')
    expect((await getFooterContent('it'))?.brand_title).toBe('T-sq')
    expect(state.filters).toEqual([['locale', ['uk', 'sq']], ['locale', ['it', 'sq']]])
    state.filters = []
    await getFooterContent('en"),locale.neq.(x')
    expect(state.filters).toEqual([['locale', ['sq']]])
  })

  it('no row gives null, never a crash', async () => {
    expect(await getFooterContent('sq')).toBeNull()
  })
})
