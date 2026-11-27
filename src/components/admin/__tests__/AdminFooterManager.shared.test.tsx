/**
 * Task 989 AC5: the admin "Footer" page is the one editor of the footer (O989-3, 2026-11-19: "All the settings must be merged into the Footer page in the admin").
 * Above the language tabs a shared block holds the phone, the support and sales e-mails, each with its show switch, the show switch of the footer text and one
 * social list for all languages, each link with its switch. Saving the block sends its fields to `saveFooterShared`; a language tab no longer sends social links.
 * The real container is rendered with the real `en` messages.
 */
import React from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { MantineProvider } from '@mantine/core'
import { theme } from '@/design-system/mantine/theme'
import { setViewport } from '@/design-system/mantine/patterns/__tests__/viewportKit'
import messages from '../../../../messages/en.json'
import type { SiteFooter } from '@/types/database'
import { AdminFooterManager, reorderLinks } from '../AdminFooterManager'

const mockSaveShared = vi.fn()
const mockUpsert = vi.fn()
vi.mock('@/modules/admin/actions/footer', () => ({
  saveFooterShared: (...args: unknown[]) => mockSaveShared(...args),
  upsertFooterContent: (...args: unknown[]) => mockUpsert(...args),
}))
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock('@/lib/toast', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a), success: (...a: unknown[]) => mockToastSuccess(...a) } }))

const t = messages.admin.footer as Record<string, string>
const row = (locale: string): SiteFooter => ({
  locale,
  brand_title: `Brand ${locale}`,
  tagline: `Text ${locale}`,
  nav_section_title: 'Navigation',
  nav_links: [],
  info_section_title: 'Information',
  info_links: [],
  social_section_title: 'Follow us',
  social_links: locale === 'sq'
    ? [{ id: 's1', label: 'Facebook', url: 'https://www.facebook.com/lero.al', enabled: true, order: 0 }, { id: 's2', label: 'Instagram', url: 'https://www.instagram.com/lero.al', enabled: false, order: 1 }]
    : [],
  copyright_template: '© {year} Lero.al',
  updated_at: '2026-11-27T10:00:00Z',
  updated_by: null,
} as SiteFooter)

const SHARED = { contact_phone: '+355 69 123 4567', contact_email: 'support@lero.al', contact_email_sales: '', footer_show_phone: 'true', footer_show_email_support: 'false' }

function renderManager() {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminFooterManager initialData={{ sq: row('sq'), en: row('en'), uk: row('uk'), it: row('it') }} initialShared={SHARED} initialized />
      </MantineProvider>
    </NextIntlClientProvider>,
  )
}

beforeAll(() => setViewport(1280))
beforeEach(() => {
  mockSaveShared.mockReset().mockResolvedValue({})
  mockUpsert.mockReset().mockResolvedValue({})
  mockToastError.mockReset()
  mockToastSuccess.mockReset()
})
afterEach(cleanup)

describe('Task 989 AC5 — the shared block of the Footer page', () => {
  it('holds the phone and the two e-mails with their switches, the text switch and the social list, above the language tabs', () => {
    renderManager()
    const phone = screen.getByLabelText(t.field_phone) as HTMLInputElement
    const support = screen.getByLabelText(t.field_email_support) as HTMLInputElement
    const sales = screen.getByLabelText(t.field_email_sales) as HTMLInputElement
    expect(phone.value).toBe('+355 69 123 4567')
    expect(support.value).toBe('support@lero.al')
    expect(sales.value).toBe('')
    expect((screen.getByRole('switch', { name: t.show_phone }) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByRole('switch', { name: t.show_email_support }) as HTMLInputElement).checked).toBe(false)
    // an absent switch is on
    expect((screen.getByRole('switch', { name: t.show_email_sales }) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByRole('switch', { name: t.show_text }) as HTMLInputElement).checked).toBe(true)
    // the social list is shown once, from the sq row
    expect(screen.getAllByDisplayValue('https://www.facebook.com/lero.al')).toHaveLength(1)
    expect(screen.getAllByDisplayValue('https://www.instagram.com/lero.al')).toHaveLength(1)
    const tabs = screen.getByRole('tablist')
    for (const field of [phone, support, sales]) {
      expect(field.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING, 'the shared block is above the language tabs').toBeTruthy()
    }
    expect(within(tabs).getAllByRole('tab')).toHaveLength(4)
  })

  it('a language tab has no social list of its own', () => {
    renderManager()
    const panel = screen.getByRole('tabpanel')
    expect(within(panel).queryByDisplayValue('https://www.facebook.com/lero.al')).toBeNull()
    expect(within(panel).getByDisplayValue('Brand sq')).toBeInTheDocument()
    expect(within(panel).getByDisplayValue('Text sq')).toBeInTheDocument()
  })

  it('saving the block sends its fields, its switches and the social list to saveFooterShared', async () => {
    renderManager()
    fireEvent.change(screen.getByLabelText(t.field_email_sales), { target: { value: 'sales@lero.al' } })
    fireEvent.click(screen.getByRole('switch', { name: t.show_phone }))
    fireEvent.click(screen.getByRole('button', { name: t.save_shared }))
    await waitFor(() => expect(mockSaveShared).toHaveBeenCalledTimes(1))
    const [payload] = mockSaveShared.mock.calls[0] as [{ settings: Record<string, string>; social_links: { url: string; enabled: boolean }[] }]
    expect(payload.settings).toEqual({
      contact_phone: '+355 69 123 4567',
      contact_email: 'support@lero.al',
      contact_email_sales: 'sales@lero.al',
      footer_show_phone: 'false',
      footer_show_email_support: 'false',
      footer_show_email_sales: 'true',
      footer_show_text: 'true',
    })
    expect(payload.social_links.map((l) => [l.url, l.enabled])).toEqual([['https://www.facebook.com/lero.al', true], ['https://www.instagram.com/lero.al', false]])
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled())
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('a refused save shows the error toast', async () => {
    mockSaveShared.mockResolvedValue({ error: 'validation' })
    renderManager()
    fireEvent.click(screen.getByRole('button', { name: t.save_shared }))
    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  // Owner, 2026-11-27: the six-dot handle promised reordering and did nothing. A link moves by dragging its handle (a mouse) or by its up and down buttons
  // (a finger, a keyboard: WCAG 2.2, 2.5.7 Dragging Movements asks for a single-pointer way); the saved order is the new one.
  it('the down and up buttons move a link, the end buttons are disabled, and the save sends the new order', async () => {
    renderManager()
    const urls = () => (screen.getAllByLabelText(t.field_url) as HTMLInputElement[]).filter((i) => /facebook|instagram/.test(i.value)).map((i) => i.value)
    expect(screen.getByRole('button', { name: t.move_up.replace('{n}', '1') })).toBeDisabled()
    expect(screen.getByRole('button', { name: t.move_down.replace('{n}', '2') })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: t.move_down.replace('{n}', '1') }))
    expect(urls()).toEqual(['https://www.instagram.com/lero.al', 'https://www.facebook.com/lero.al'])
    fireEvent.click(screen.getByRole('button', { name: t.save_shared }))
    await waitFor(() => expect(mockSaveShared).toHaveBeenCalledTimes(1))
    const [payload] = mockSaveShared.mock.calls[0] as [{ social_links: { url: string; order: number }[] }]
    expect(payload.social_links.map((l) => [l.url, l.order])).toEqual([['https://www.instagram.com/lero.al', 0], ['https://www.facebook.com/lero.al', 1]])
    // while the save runs every control is disabled; the next move waits for it
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled())
    await waitFor(() => expect(screen.getByRole('button', { name: t.move_up.replace('{n}', '2') })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: t.move_up.replace('{n}', '2') }))
    expect(urls()).toEqual(['https://www.facebook.com/lero.al', 'https://www.instagram.com/lero.al'])
  })

  // The drag itself (pointer and keyboard) needs real layout, which jsdom does not have (every rectangle is 0×0): it is checked in the browser on the Story.
  it('each link has a drag handle of @dnd-kit, named and described in the page language', () => {
    renderManager()
    const rows = screen.getAllByTestId('footer-link-row').filter((row) => within(row).queryByDisplayValue(/facebook|instagram/))
    expect(rows).toHaveLength(2)
    const handle = within(rows[0]).getByTestId('footer-link-handle')
    expect(handle).toHaveAccessibleName(t.drag_link)
    expect(handle.getAttribute('aria-roledescription')).toBe(t.drag_role)
    const describedBy = handle.getAttribute('aria-describedby')
    expect(describedBy && document.getElementById(describedBy)?.textContent).toBe(t.drag_instructions)
  })

  // Revision 1, F3: the handle, up, down and delete of a link row are at least the touch target (44px, `theme.other.touchTarget`) below 640px and at least 32px
  // (main's `h-8 w-8`) from 640px; the delete is the canonical MantineDeleteIconButton with `touch` at every width (owner, 2026-11-27). jsdom has no layout, so the
  // sizes are read from the props as Mantine writes them: an inline style, or a class with its rule and its `@media (min-width: 40em)` rule.
  it('the four icon controls of a link row are at least 44px below 640px and at least 32px from 640px', () => {
    renderManager()
    const css = Array.from(document.querySelectorAll('style[data-mantine-styles="inline"]')).map((s) => s.textContent ?? '').join('')
    const rule = (selector: string): Record<string, string> => {
      const at = css.indexOf(selector)
      if (at < 0) return {}
      const body = css.slice(at + selector.length, css.indexOf('}', at))
      return Object.fromEntries(body.split(';').filter((d) => d.includes(':')).map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]))
    }
    const px = (value: string | undefined) => (value && value.includes('rem') ? Number.parseFloat(value.replace('calc(', '')) * 16 : 0)
    const sizes = (el: HTMLElement) => {
      const cls = Array.from(el.classList).find((c) => c.startsWith('__m__-'))
      const base = cls ? rule(`.${cls}{`) : {}
      const wide = cls ? rule(`@media(min-width: 40em){.${cls}{`) : {}
      const below = { w: px(base['min-width'] ?? el.style.minWidth), h: px(base['min-height'] ?? el.style.minHeight) }
      const from640 = { w: px(wide['min-width'] ?? base['min-width'] ?? el.style.minWidth), h: px(wide['min-height'] ?? base['min-height'] ?? el.style.minHeight) }
      return { below, from640 }
    }
    const row = screen.getAllByTestId('footer-link-row').find((r) => within(r).queryByDisplayValue(/facebook/))!
    const controls = {
      handle: within(row).getByTestId('footer-link-handle'),
      up: within(row).getByRole('button', { name: t.move_up.replace('{n}', '1') }),
      down: within(row).getByRole('button', { name: t.move_down.replace('{n}', '1') }),
      delete: within(row).getByRole('button', { name: t.remove_link.replace('{n}', '1') }),
    }
    for (const [name, el] of Object.entries(controls)) {
      const { below, from640 } = sizes(el)
      expect(below.w, `${name} width below 640px`).toBeGreaterThanOrEqual(44)
      expect(below.h, `${name} height below 640px`).toBeGreaterThanOrEqual(44)
      expect(from640.w, `${name} width from 640px`).toBeGreaterThanOrEqual(32)
      expect(from640.h, `${name} height from 640px`).toBeGreaterThanOrEqual(32)
    }
    // the handle, up and down are 32px from 640px, as main's row controls; the delete keeps the touch target (owner, 2026-11-27)
    for (const name of ['handle', 'up', 'down'] as const) expect(sizes(controls[name]).from640, name).toEqual({ w: 32, h: 32 })
    expect(sizes(controls.delete).from640).toEqual({ w: 44, h: 44 })
  })

  it('reorderLinks moves the dragged link to the place of the one it is dropped on, and nothing else', () => {
    const link = (id: string) => ({ id, label: id, url: `/${id}`, enabled: true, order: 0 })
    const list = [link('a'), link('b'), link('c')]
    expect(reorderLinks(list, 'c', 'a').map((l) => l.id)).toEqual(['c', 'a', 'b'])
    expect(reorderLinks(list, 'a', 'c').map((l) => l.id)).toEqual(['b', 'c', 'a'])
    expect(reorderLinks(list, 'a', 'a')).toBe(list)
    expect(reorderLinks(list, 'a', null)).toBe(list)
    expect(reorderLinks(list, 'x', 'a')).toBe(list)
  })

  it('saving a language tab sends no social links', async () => {
    renderManager()
    fireEvent.click(screen.getByRole('button', { name: t.save }))
    await waitFor(() => expect(mockUpsert).toHaveBeenCalledTimes(1))
    const [locale, payload] = mockUpsert.mock.calls[0] as [string, Record<string, unknown>]
    expect(locale).toBe('sq')
    expect(payload).not.toHaveProperty('social_links')
    expect(payload).toMatchObject({ brand_title: 'Brand sq', tagline: 'Text sq' })
  })
})
