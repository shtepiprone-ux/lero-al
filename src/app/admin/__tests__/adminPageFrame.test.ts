/**
 * Task 1007 AC10 — every admin page sits in the one canonical frame (owner rule 2026-11-19; owner decision O1007-2, 2026-11-24: "All pages in the admin must have the
 * canonical width ... The width must be the full screen", the dashboard included, the listing preview "do not touch").
 *  - every `src/app/admin/**\/page.tsx` has no `className`, and every one that renders (not a redirect) renders `<AdminPageFrame>` with no prop;
 *  - the one exception is the listing preview, named here with its owner decision;
 *  - `AdminPageFrame` caps nothing: no max width whatever a caller passes, the gutter `xl` (24px), `2xl` (32px) from `lg`; the five `adminPage*MaxWidth` tokens are gone;
 *  - `MantineDashboardGrid` with `framed={false}` renders no max width, margin or padding (the frame owns them); with the default it keeps the box of `main`.
 */
import { createElement, type ComponentType } from 'react'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import { AdminPageFrame } from '@/components/admin/AdminPageFrame'
import { MantineDashboardGrid } from '@/design-system/mantine/patterns/MantineDashboardGrid'

const ADMIN_ROOT = join(process.cwd(), 'src', 'app', 'admin')
/** the pages that render without the frame, each with its owner decision */
const UNFRAMED: Record<string, string> = {
  'src/app/admin/listings/[id]/preview/page.tsx': 'owner, 2026-11-24, "do not touch": it renders ListingDetailView, the public listing page, as it is on main',
}

function pageFiles(dir = ADMIN_ROOT, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) pageFiles(full, out)
    else if (entry.name === 'page.tsx') out.push(full)
  }
  return out.sort()
}
const relative = (file: string) => file.slice(process.cwd().length + 1).split('\\').join('/')

function html(element: unknown, props: Record<string, unknown> | null) {
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })))
  const view = render(createElement(MantineProvider, { theme, env: 'test' }, createElement(element as ComponentType<Record<string, unknown>>, props, createElement('p', null, 'content'))))
  // the provider's own `<style data-mantine-styles="true">` holds the theme's CSS variables (every token of the theme, caps included) and `="classes"` the visible-from media queries:
  // only what the component renders is read, that is its element and the `="inline"` style of its responsive props
  const own = view.container.cloneNode(true) as HTMLElement
  own.querySelectorAll('style[data-mantine-styles]:not([data-mantine-styles="inline"])').forEach((node) => node.remove())
  const markup = own.innerHTML
  view.unmount()
  return markup
}

describe('adminPageFrame', () => {
  it('every admin page has no className and renders <AdminPageFrame> with no prop, except the listing preview', () => {
    const files = pageFiles()
    expect(files.length, 'the scanner found the admin pages').toBeGreaterThanOrEqual(20)
    const offenders: string[] = []
    for (const file of files) {
      const path = relative(file)
      const text = readFileSync(file, 'utf8')
      if (/\bclassName\b/.test(text)) offenders.push(`${path}: has a className`)
      const renders = /return\s*\(?\s*</.test(text)   // a redirect-only page returns no markup
      if (!renders) continue
      if (path in UNFRAMED) {
        if (/<AdminPageFrame\b/.test(text)) offenders.push(`${path}: is named as unframed (${UNFRAMED[path]}) but renders a frame`)
        continue
      }
      if (!/<AdminPageFrame>/.test(text)) offenders.push(`${path}: does not render <AdminPageFrame>`)
      if (/<AdminPageFrame\s+[a-zA-Z]/.test(text)) offenders.push(`${path}: passes a prop to AdminPageFrame`)
    }
    expect(offenders, offenders.join('\n')).toEqual([])
  })

  it('AdminPageFrame caps no width, whatever a caller passes, and keeps the gutter xl, then 2xl from lg', () => {
    for (const props of [null, { width: 'shell', gutter: 'xl', centered: false }, { width: 'panel' }]) {
      const markup = html(AdminPageFrame, props)
      expect(markup, `props ${JSON.stringify(props)}: no max width`).not.toMatch(/max-width/i)
      expect(markup, 'the gutter xl').toContain('var(--mantine-spacing-xl)')
      expect(markup, 'the gutter 2xl from lg').toContain('var(--mantine-spacing-2xl)')
    }
  })

  it('the five adminPage*MaxWidth tokens are gone from the theme', () => {
    const layout = (theme.other as { layout: Record<string, unknown> }).layout
    expect(Object.keys(layout).filter((k) => /^adminPage/.test(k))).toEqual([])
  })

  it('MantineDashboardGrid: framed={false} renders no max width, margin or padding; the default keeps the box of main', () => {
    const bare = html(MantineDashboardGrid, { framed: false })
    expect(bare).not.toMatch(/max-width/i)
    expect(bare).not.toMatch(/padding/i)
    expect(bare).not.toMatch(/margin/i)

    const boxed = html(MantineDashboardGrid, null)
    expect(boxed, 'the default keeps the 1440px cap').toMatch(/max-width/i)
    expect(boxed, 'and the 16px/24px gutter').toMatch(/padding/i)
    expect(html(MantineDashboardGrid, { framed: true })).toMatch(/max-width/i)
  })
})
