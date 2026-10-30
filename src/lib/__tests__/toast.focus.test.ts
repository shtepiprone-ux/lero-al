/**
 * toast — focus return (Task 923 Revision 7, owner D6; WCAG 2.4.3 Focus Order): when a toast is dismissed while the focus is on it or lost, the focus goes back
 * to what had it when the toast was raised, also when that control had dropped it (a Mantine `loading` Button disables itself and the focus falls to `body`);
 * a focus the person moved elsewhere is left alone; a trigger that is gone is not focused.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const shown: { onClose: () => void }[] = []
vi.mock('@mantine/notifications', () => ({
  notifications: { show: (arg: { onClose: () => void }) => { shown.push(arg) } },
}))

async function freshToast() {
  vi.resetModules()
  return (await import('../toast')).toast
}
function button(id: string) {
  const b = document.createElement('button')
  b.id = id
  document.body.appendChild(b)
  return b
}

beforeEach(() => { shown.length = 0; document.body.replaceChildren() })
afterEach(() => { document.body.replaceChildren() })

describe('toast focus return', () => {
  it('returns the focus to the control that had it when the toast was raised', async () => {
    const toast = await freshToast()
    const save = button('save')
    save.focus()
    toast.success('Saved')
    ;(document.activeElement as HTMLElement).blur()
    shown[0].onClose()
    expect(document.activeElement).toBe(save)
  })

  it('returns it to the control that LOST the focus before the toast (a loading button disables itself)', async () => {
    const toast = await freshToast()
    const save = button('save')
    save.focus()
    save.blur()
    save.disabled = true
    expect(document.activeElement).toBe(document.body)
    toast.error('Could not save')
    save.disabled = false // the request ended; the toast closes seconds later
    shown[0].onClose()
    expect(document.activeElement).toBe(save)
  })

  it('returns it when the focus is on the toast itself (its close control)', async () => {
    const toast = await freshToast()
    const save = button('save')
    save.focus()
    toast.info('Note')
    const root = document.createElement('div')
    root.className = 'mantine-Notification-root'
    const close = document.createElement('button')
    root.appendChild(close)
    document.body.appendChild(root)
    close.focus()
    shown[0].onClose()
    expect(document.activeElement).toBe(save)
  })

  it('leaves a focus the person moved elsewhere alone', async () => {
    const toast = await freshToast()
    const save = button('save')
    const other = button('other')
    save.focus()
    toast.warning('Careful')
    other.focus()
    shown[0].onClose()
    expect(document.activeElement).toBe(other)
  })

  it('does not focus a trigger that is no longer in the page', async () => {
    const toast = await freshToast()
    const save = button('save')
    save.focus()
    toast.success('Saved')
    save.remove()
    expect(() => shown[0].onClose()).not.toThrow()
    expect(document.activeElement).toBe(document.body)
  })

  it('does not take the toast own controls for the trigger', async () => {
    const toast = await freshToast()
    const save = button('save')
    save.focus()
    const root = document.createElement('div')
    root.className = 'mantine-Notification-root'
    const close = document.createElement('button')
    root.appendChild(close)
    document.body.appendChild(root)
    close.focus()
    toast.success('Second toast')
    ;(document.activeElement as HTMLElement).blur()
    shown[0].onClose()
    expect(document.activeElement).toBe(save)
  })
})
