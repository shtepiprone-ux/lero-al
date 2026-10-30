// @vitest-environment node
/**
 * SITE_URL is the origin every e-mailed link starts with. A wrong value sends a person's reset or confirmation link elsewhere, so the fallback must be the
 * real site and the value must be read from the one environment variable.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

const ENV = { ...process.env }
afterEach(() => { process.env = { ...ENV }; vi.resetModules() })

describe('SITE_URL', () => {
  it('is the configured address', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://staging.lero.al'
    vi.resetModules()
    expect((await import('../siteUrl')).SITE_URL).toBe('https://staging.lero.al')
  })

  it('falls back to the production site, not to localhost or an empty string', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    vi.resetModules()
    expect((await import('../siteUrl')).SITE_URL).toBe('https://lero.al')
  })
})
