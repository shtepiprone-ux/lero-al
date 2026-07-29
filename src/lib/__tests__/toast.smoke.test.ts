import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockShow = vi.fn()
vi.mock('@mantine/notifications', () => ({
  notifications: { show: (...args: unknown[]) => mockShow(...args) },
}))

beforeEach(() => { vi.clearAllMocks() })

describe('toast adapter (Task 681) — notifications.show() argument proof', () => {
  it('success passes green colour + CircleCheckIcon + autoClose 4000 + message unchanged', async () => {
    const { toast } = await import('../toast')
    const { VARIANT_COLORS, VARIANT_ICONS } = await import('@/design-system/mantine/notificationVariants')

    toast.success('report_success')

    expect(mockShow).toHaveBeenCalledTimes(1)
    const call = mockShow.mock.calls[0][0]
    expect(call.message).toBe('report_success')
    expect(call.color).toBe(VARIANT_COLORS.success)
    expect(call.color).toBe('green')
    expect(call.icon).toEqual(VARIANT_ICONS.success)
    expect(call.autoClose).toBe(4000)
    expect(call.title).toBeUndefined()
  })

  it('error passes red colour + OctagonXIcon + autoClose 4000 + message unchanged', async () => {
    const { toast } = await import('../toast')
    const { VARIANT_COLORS, VARIANT_ICONS } = await import('@/design-system/mantine/notificationVariants')

    toast.error('report_err_server')

    expect(mockShow).toHaveBeenCalledTimes(1)
    const call = mockShow.mock.calls[0][0]
    expect(call.message).toBe('report_err_server')
    expect(call.color).toBe(VARIANT_COLORS.error)
    expect(call.color).toBe('red')
    expect(call.icon).toEqual(VARIANT_ICONS.error)
    expect(call.autoClose).toBe(4000)
    expect(call.title).toBeUndefined()
  })

  it('info passes blueLight colour (NOT blue — §3.11 defect 5) + InfoIcon + autoClose 4000', async () => {
    const { toast } = await import('../toast')
    const { VARIANT_COLORS, VARIANT_ICONS } = await import('@/design-system/mantine/notificationVariants')

    toast.info('report_already_reported')

    expect(mockShow).toHaveBeenCalledTimes(1)
    const call = mockShow.mock.calls[0][0]
    expect(call.message).toBe('report_already_reported')
    expect(call.color).toBe(VARIANT_COLORS.info)
    expect(call.color).toBe('blueLight')
    expect(call.icon).toEqual(VARIANT_ICONS.info)
    expect(call.autoClose).toBe(4000)
    expect(call.title).toBeUndefined()
  })

  it('warning passes yellow colour + TriangleAlertIcon + autoClose 4000', async () => {
    const { toast } = await import('../toast')
    const { VARIANT_COLORS, VARIANT_ICONS } = await import('@/design-system/mantine/notificationVariants')

    toast.warning('some_warning_key')

    expect(mockShow).toHaveBeenCalledTimes(1)
    const call = mockShow.mock.calls[0][0]
    expect(call.message).toBe('some_warning_key')
    expect(call.color).toBe(VARIANT_COLORS.warning)
    expect(call.color).toBe('yellow')
    expect(call.icon).toEqual(VARIANT_ICONS.warning)
    expect(call.autoClose).toBe(4000)
    expect(call.title).toBeUndefined()
  })
})
