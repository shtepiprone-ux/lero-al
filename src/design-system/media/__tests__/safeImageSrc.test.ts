/**
 * Task 951 AC7 (CodeQL js/xss-through-dom): an <img src> takes a string from props or the DOM. `safeImageSrc` returns it only for https:, blob:, data:image/ or a
 * root-relative path; every other scheme gives `undefined`, and AppImage then renders no src attribute.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { render } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { theme } from '@/design-system/mantine/theme'
import { safeImageSrc } from '../appImageConfig'
import { AppImage } from '../AppImage'

beforeAll(() => {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error -- test-only global stub, jsdom has no IntersectionObserver
  global.IntersectionObserver = IntersectionObserverStub
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })))
})

describe('safeImageSrc', () => {
  it.each([
    ['https', 'https://res.cloudinary.com/demo/image/upload/a.jpg'],
    ['blob', 'blob:https://lero.al/7e2f5c1a-0000-4000-8000-000000000000'],
    ['data:image/', 'data:image/png;base64,iVBORw0KGgo='],
    ['a root-relative path', '/photos/a.jpg'],
  ])('keeps %s', (_label, src) => {
    expect(safeImageSrc(src)).toBe(src)
  })

  it.each([
    ['javascript:', 'javascript:alert(1)'],
    ['JavaScript: in mixed case with a leading space', ' JaVaScRiPt:alert(1)'],
    ['javascript: with an embedded tab', 'java\tscript:alert(1)'],
    ['data:text/html', 'data:text/html,<script>alert(1)</script>'],
    ['vbscript:', 'vbscript:msgbox(1)'],
    ['plain http', 'http://example.com/a.jpg'],
    ['file:', 'file:///etc/passwd'],
    ['a protocol-relative address', '//evil.example/a.jpg'],
    ['a backslash path that browsers read as protocol-relative', '/\\evil.example/a.jpg'],
    ['a relative address without a leading slash', 'photos/a.jpg'],
    ['an empty string', ''],
    ['null', null],
    ['undefined', undefined],
  ])('refuses %s', (_label, src) => {
    expect(safeImageSrc(src as string | null | undefined)).toBeUndefined()
  })
})

describe('AppImage', () => {
  const renderImage = (src: string) => render(
    createElement(MantineProvider, { theme }, createElement(AppImage, { src, alt: 'photo', variant: 'listing' })),
  )

  it('renders no src attribute for javascript:alert(1)', () => {
    const { container } = renderImage('javascript:alert(1)')
    for (const img of container.querySelectorAll('img')) {
      expect(img.hasAttribute('src')).toBe(false)
      expect(img.hasAttribute('srcset')).toBe(false)
    }
  })

  it('renders no src attribute for javascript:alert(1) in the server markup either (no effect has run)', () => {
    const html = renderToStaticMarkup(createElement(MantineProvider, { theme }, createElement(AppImage, { src: 'javascript:alert(1)', alt: 'photo', variant: 'listing' })))
    const tag = html.match(/<img[^>]*>/)?.[0]
    expect(tag).toBeDefined()
    expect(tag).not.toMatch(/[ ]src=/)
    expect(tag).not.toMatch(/javascript/i)
  })

  it('still renders an https address', () => {
    const { container } = renderImage('https://example.com/a.jpg')
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://example.com/a.jpg')
  })
})
