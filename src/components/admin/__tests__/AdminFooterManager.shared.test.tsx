/**
 * Task 989 AC5: the admin "Footer" page is the one editor of the footer (O989-3, 2026-11-19: "All the settings must be merged into the Footer page in the admin").
 * Above the language tabs a shared block holds the phone, the support and sales e-mails, each with its show switch, the show switch of the footer text and one
 * social list for all languages, each link with its switch. Saving the block sends its fields to `saveFooterShared`; a language tab no longer sends social links.
 * The real container is rendered with the real `en` messages.
 */
import React from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
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

/** the manager with its providers; `sq` replaces fields of the sq row (Revision 2, F7: the lists at the link bound) */
function managerTree(sq: Partial<SiteFooter> = {}) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      <MantineProvider theme={theme} env="test">
        <AdminFooterManager initialData={{ sq: { ...row('sq'), ...sq }, en: row('en'), uk: row('uk'), it: row('it') }} initialShared={SHARED} initialized />
      </MantineProvider>
    </NextIntlClientProvider>
  )
}

function renderManager(sq: Partial<SiteFooter> = {}) {
  return render(managerTree(sq))
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

  // Revision 2, F7: the form carries the bounds of the two actions (`withinFooterBounds`), so a value the save would refuse cannot be typed or added; a language
  // tab refused with `validation` says the save failed, not the contacts message of the shared block
  it('the link label, link address and the six text fields of a language tab carry the bounds of the actions as maxLength', () => {
    renderManager()
    const maxLength = (inputs: HTMLElement[]) => inputs.map((input) => input.getAttribute('maxlength'))
    const labels = screen.getAllByLabelText(t.field_label)
    const urls = screen.getAllByLabelText(t.field_url)
    expect(labels.length).toBeGreaterThan(0)
    expect(maxLength(labels).every((v) => v === '200'), String(maxLength(labels))).toBe(true)
    expect(maxLength(urls).every((v) => v === '2048'), String(maxLength(urls))).toBe(true)
    const panel = screen.getByRole('tabpanel')
    const texts = [t.field_brand_title, t.field_tagline, t.field_copyright_template, t.field_social_section_title].map((name) => within(panel).getByLabelText(name))
    texts.push(...within(panel).getAllByLabelText(t.field_section_title))
    expect(texts).toHaveLength(6)
    expect(maxLength(texts)).toEqual(['5000', '5000', '5000', '5000', '5000', '5000'])
  })

  it('"add link" is disabled in a list of 50 links and enabled in a list of 49', () => {
    const links = (prefix: string, count: number) => Array.from({ length: count }, (_, i) => ({ id: `${prefix}${i}`, label: `L${i}`, url: `https://x.example/${i}`, enabled: true, order: i }))
    renderManager({ social_links: links('s', 50), nav_links: links('n', 49), info_links: links('i', 50) })
    // in document order: the shared social list, then the navigation and information lists of the language tab
    const add = screen.getAllByRole('button', { name: t.add_link }) as HTMLButtonElement[]
    expect(add.map((b) => b.disabled)).toEqual([true, false, true])
    fireEvent.click(add[1])
    expect((screen.getAllByRole('button', { name: t.add_link }) as HTMLButtonElement[]).map((b) => b.disabled)).toEqual([true, true, true])
  })

  it('a language-tab save refused with validation shows the save error, not the contacts message', async () => {
    mockUpsert.mockResolvedValue({ error: 'validation' })
    renderManager()
    fireEvent.click(screen.getByRole('button', { name: t.save }))
    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    expect(mockToastError).toHaveBeenCalledWith(t.error_save)
    expect(mockToastError).not.toHaveBeenCalledWith(t.error_invalid_contact)
  })

  it('the shared save refused with validation keeps the contacts message', async () => {
    mockSaveShared.mockResolvedValue({ error: 'validation' })
    renderManager()
    fireEvent.click(screen.getByRole('button', { name: t.save_shared }))
    await waitFor(() => expect(mockToastError).toHaveBeenCalled())
    expect(mockToastError).toHaveBeenCalledWith(t.error_invalid_contact)
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

  // Revision 4, F13 (owner's dev-server log, 2026-11-27: server "DndDescribedBy-1", client "DndDescribedBy-2"): the page is rendered on the server and hydrated in
  // the browser. Without a stable `id`, @dnd-kit names the drag instructions from a module counter that keeps counting across server requests, so the handles
  // hydrate with an `aria-describedby` the page does not hold. Two client-only renders would prove nothing (React's useId also takes a global counter there).
  it('the drag handles hydrate with the aria-describedby of the server HTML, and it names the drag instructions', async () => {
    renderToString(managerTree()) // an earlier request on the same server
    const html = renderToString(managerTree())
    const container = document.createElement('div')
    container.innerHTML = html
    document.body.appendChild(container)
    const serverIds = Array.from(container.querySelectorAll('[data-testid="footer-link-handle"]')).map((handle) => handle.getAttribute('aria-describedby'))
    expect(serverIds.length).toBeGreaterThan(0)
    expect(serverIds.every(Boolean)).toBe(true)

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const recoverable: unknown[] = []
    let root: ReturnType<typeof hydrateRoot> | undefined
    try {
      await act(async () => {
        root = hydrateRoot(container, managerTree(), { onRecoverableError: (error) => { recoverable.push(error) } })
      })
      const messagesLogged = consoleError.mock.calls.map((call) => call.map(String).join(' '))
      expect(messagesLogged.filter((m) => /hydrated but some attributes|did not match/i.test(m))).toEqual([])
      expect(recoverable).toEqual([])

      const handles = Array.from(container.querySelectorAll('[data-testid="footer-link-handle"]'))
      expect(handles.map((handle) => handle.getAttribute('aria-describedby'))).toEqual(serverIds)
      for (const id of serverIds) expect(document.getElementById(id!)?.textContent, id!).toBe(t.drag_instructions)
    } finally {
      consoleError.mockRestore()
      act(() => root?.unmount())
      container.remove()
    }
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
