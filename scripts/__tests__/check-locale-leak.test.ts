// @vitest-environment node
/**
 * Task 939 (review 1, F3 and F4) — scripts/check-locale-leak.mjs
 *
 * F3: the opt-in flags `--story=<id>` and `--widths=<px,px,…>` are parsed by a pure function, and no flag keeps the CI defaults
 *     (320, 375 and 1280 px, every Story, shard 1/1).
 * F4: a `page.goto` that the browser's network stack refuses (`net::ERR_*`) is retried once on a fresh page and counted; a render or play failure,
 *     an HTTP failure and the 15 s render wait are never retried.
 *
 * Importing the module must not start a scan (the entry-point guard).
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import { collectStoryTokens, isTransportError, parseCliArgs, parseWidths, renderErrorLines, viewportsForWidths } from '../check-locale-leak.mjs'
import { diagnose } from '../quality/load-watch.mjs'

describe('check-locale-leak render errors in the log', () => {
  it('names each failed tuple and its reason, so the log and the timeout diagnosis can read it', () => {
    // the reason was only in report.json: ci-local saw "1 render errors" and could not tell a timeout (2026-11-11)
    const lines = renderErrorLines([
      { storyId: 'patterns-mantine-cmspageview--body-only', viewport: 'mobile-375', locale: 'sq', reason: 'page.waitForFunction: Timeout 15000ms exceeded.' },
      { reason: 'scan runtime failed' },
    ])
    expect(lines).toEqual([
      '  render error: patterns-mantine-cmspageview--body-only at mobile-375 in sq: page.waitForFunction: Timeout 15000ms exceeded.',
      '  render error: (scan): scan runtime failed',
    ])
    const calm = [{ cpu: 20, memFree: 60, ports: 40 }]
    expect(diagnose(`Incomplete locale scan: 728/729 tuples\n${lines.join('\n')}`, calm)).toMatchObject({ timeout: true, cause: 'stall' })
  })
})

// ── Entry point (Task 963 AC17) ───────────────────────────────────────────────

describe('check-locale-leak entry point', () => {
  // Task 939 review 2: run through a symlinked or junctioned path, argv[1] kept the link while import.meta.url is the
  // real path, so the guard skipped run() and the gate exited 0 having scanned nothing. A refused flag proves run() ran.
  const runScript = (script: string) => spawnSync(process.execPath, [script, '--story=not a story id'], { encoding: 'utf8', timeout: 30000 })

  it('runs when started by its own path', () => {
    const result = runScript(path.resolve(__dirname, '../check-locale-leak.mjs'))
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Invalid --story')
  })

  it('runs when started through a symlinked directory (fails closed, never a silent exit 0)', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'locale-leak-link-'))
    try {
      const link = path.join(dir, 'scripts')
      symlinkSync(path.resolve(__dirname, '..'), link, 'junction')
      const result = runScript(path.join(link, 'check-locale-leak.mjs'))
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('Invalid --story')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

// ── Flags (F3) ────────────────────────────────────────────────────────────────

describe('check-locale-leak flags', () => {
  it('keeps 320, 375 and 1280 px, every Story and shard 1/1 when no flag is given', () => {
    const options = parseCliArgs([])
    expect(options.widths).toEqual([320, 375, 1280])
    expect(options.story).toBeUndefined()
    expect(options.shard).toBe('1/1')
    expect(options.viewports).toEqual([
      { name: 'mobile-320', width: 320, height: 812 },
      { name: 'mobile-375', width: 375, height: 812 },
      { name: 'desktop-1280', width: 1280, height: 800 },
    ])
  })

  it('keeps the CI command (--mantine-only --report-only-leaks --shard=N/6) on the default widths', () => {
    const options = parseCliArgs(['--mantine-only', '--report-only-leaks', '--shard=3/6'])
    expect(options).toMatchObject({ mantineOnly: true, reportOnlyLeaks: true, shard: '3/6', fast: false, story: undefined })
    expect(options.widths).toEqual([320, 375, 1280])
  })

  it('keeps --fast at the single 320 px viewport', () => {
    expect(parseCliArgs(['--fast']).widths).toEqual([320])
  })

  it('parses --story=<id> and --widths=<px,px,…>', () => {
    const options = parseCliArgs([
      '--mantine-only',
      '--report-only-leaks',
      '--story=patterns-mantine-dashboardperiodcontrol--custom-range-too-long',
      '--widths=320,639,640,1280',
    ])
    expect(options.story).toBe('patterns-mantine-dashboardperiodcontrol--custom-range-too-long')
    expect(options.widths).toEqual([320, 639, 640, 1280])
    expect(options.viewports.map((v: { name: string; width: number; height: number }) => [v.name, v.width, v.height])).toEqual([
      ['mobile-320', 320, 812],
      ['mobile-639', 639, 812],
      ['desktop-640', 640, 800],
      ['desktop-1280', 1280, 800],
    ])
  })

  it('lets --widths win over --fast and drops repeated widths', () => {
    expect(parseCliArgs(['--fast', '--widths=640,640,320']).widths).toEqual([640, 320])
  })

  it('refuses a width list that is not whole pixel widths in range', () => {
    for (const bad of ['', 'abc', '320,', ',320', '320,,640', '12.5', '-320', '199', '4001', '99999', '0x140', '320 ,640']) {
      expect(() => parseWidths(bad), JSON.stringify(bad)).toThrow(/Invalid --widths/)
    }
    expect(() => parseCliArgs(['--widths=abc'])).toThrow(/Invalid --widths/)
    expect(() => viewportsForWidths(parseWidths('200,4000'))).not.toThrow()
  })

  it('refuses a --story that is not a Storybook Story id', () => {
    for (const bad of ['', 'a b', '../x', 'id;rm', 'id&globals=locale:xx']) {
      expect(() => parseCliArgs([`--story=${bad}`]), JSON.stringify(bad)).toThrow(/Invalid --story/)
    }
  })
})

// ── Transport retry (F4) ──────────────────────────────────────────────────────

type Step = { reject: Error } | { ok: true; httpOk?: boolean }

/** A scripted Playwright browser: every `page.goto` answers the next step; `evaluate`/`waitForFunction` are scripted per test. */
function fakeBrowser(options: {
  gotos: Step[]
  renderFailed?: boolean
  waitRejects?: Error
  pageError?: boolean
  evaluateHangs?: boolean
  closeHangs?: boolean
}) {
  const pages: Array<{ closed: boolean }> = []
  const gotoSteps = [...options.gotos]
  let gotoCalls = 0
  const browser = {
    newPage: vi.fn(async () => {
      const state = { closed: false }
      pages.push(state)
      const handlers: Record<string, (arg?: unknown) => void> = {}
      return {
        on: (event: string, handler: (arg?: unknown) => void) => { handlers[event] = handler },
        setViewportSize: async () => undefined,
        goto: async () => {
          gotoCalls += 1
          const step = gotoSteps.shift()
          if (!step) throw new Error('unscripted goto')
          if ('reject' in step) throw step.reject
          if (options.pageError) handlers.pageerror?.()
          return { ok: () => step.httpOk !== false }
        },
        waitForFunction: async () => {
          if (options.waitRejects) throw options.waitRejects
        },
        evaluate: (arg: unknown) => (options.evaluateHangs
          ? new Promise(() => {})
          : Promise.resolve(typeof arg === 'function' ? options.renderFailed === true : ['Leaked word', 'Another token'])),
        close: () => { state.closed = true; return options.closeHangs ? new Promise(() => {}) : Promise.resolve() },
      }
    }),
  }
  return { browser, pages, gotoCalls: () => gotoCalls }
}

const STORY = { id: 'patterns-mantine-example--default', title: 'Patterns/Mantine/Example', label: 'Patterns/Mantine/Example/Default' }
const VIEWPORT = { name: 'mobile-320', width: 320, height: 812 }
const collect = (browser: unknown, onRetry?: (retry: unknown) => void) =>
  collectStoryTokens(browser, 'http://127.0.0.1:1', STORY, VIEWPORT, 'sq', onRetry)

describe('check-locale-leak transport retry', () => {
  it('recognises net::ERR_* as a transport error and nothing else', () => {
    expect(isTransportError(new Error('page.goto: net::ERR_NO_BUFFER_SPACE at http://127.0.0.1:1/iframe.html'))).toBe(true)
    expect(isTransportError(new Error('page.goto: net::ERR_NETWORK_IO_SUSPENDED at http://127.0.0.1:1/iframe.html'))).toBe(true)
    expect(isTransportError(new Error('Story render/play failed'))).toBe(false)
    expect(isTransportError(new Error('page.waitForFunction: Timeout 15000ms exceeded.'))).toBe(false)
    expect(isTransportError(new Error('page.goto: Timeout 20000ms exceeded.'))).toBe(false)
    expect(isTransportError(undefined)).toBe(false)
  })

  for (const code of ['net::ERR_NO_BUFFER_SPACE', 'net::ERR_NETWORK_IO_SUSPENDED']) {
    it(`retries ${code} once on a fresh page and counts it`, async () => {
      const fake = fakeBrowser({ gotos: [{ reject: new Error(`page.goto: ${code} at http://127.0.0.1:1/iframe.html`) }, { ok: true }] })
      const onRetry = vi.fn()

      await expect(collect(fake.browser, onRetry)).resolves.toEqual(['Leaked word', 'Another token'])

      expect(fake.gotoCalls()).toBe(2)
      expect(fake.browser.newPage).toHaveBeenCalledTimes(2)
      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(onRetry).toHaveBeenCalledWith({ storyId: STORY.id, viewport: 'mobile-320', reason: expect.stringContaining(code) })
      expect(fake.pages.every(page => page.closed)).toBe(true)
    })
  }

  it('retries only once: a second transport error is the tuple\'s error', async () => {
    const fake = fakeBrowser({
      gotos: [{ reject: new Error('page.goto: net::ERR_NO_BUFFER_SPACE') }, { reject: new Error('page.goto: net::ERR_NO_BUFFER_SPACE') }, { ok: true }],
    })
    const onRetry = vi.fn()

    await expect(collect(fake.browser, onRetry)).rejects.toThrow('net::ERR_NO_BUFFER_SPACE')

    expect(fake.gotoCalls()).toBe(2)
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(fake.pages.every(page => page.closed)).toBe(true)
  })

  it('never retries a render failure', async () => {
    const fake = fakeBrowser({ gotos: [{ ok: true }, { ok: true }], renderFailed: true })
    const onRetry = vi.fn()

    await expect(collect(fake.browser, onRetry)).rejects.toThrow('Story render/play failed')

    expect(fake.gotoCalls()).toBe(1)
    expect(fake.browser.newPage).toHaveBeenCalledTimes(1)
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('never retries a play failure reported as a page error', async () => {
    const fake = fakeBrowser({
      gotos: [{ ok: true }, { ok: true }],
      pageError: true,
    })
    const onRetry = vi.fn()

    await expect(collect(fake.browser, onRetry)).rejects.toThrow('Story render/play failed')

    expect(fake.gotoCalls()).toBe(1)
    expect(onRetry).not.toHaveBeenCalled()
  })

  it('never retries the 15 s render wait', async () => {
    const fake = fakeBrowser({
      gotos: [{ ok: true }, { ok: true }],
      waitRejects: new Error('page.waitForFunction: Timeout 15000ms exceeded.'),
    })
    const onRetry = vi.fn()

    await expect(collect(fake.browser, onRetry)).rejects.toThrow('Timeout 15000ms exceeded')

    expect(fake.gotoCalls()).toBe(1)
    expect(fake.browser.newPage).toHaveBeenCalledTimes(1)
    expect(onRetry).not.toHaveBeenCalled()
    expect(fake.pages.every(page => page.closed)).toBe(true)
  })

  it('ends a tuple whose renderer hangs at its deadline, names it, and does not wait for its page to close', async () => {
    // shard 1/6 of a local run of 2026-11-10 stopped at tuple 468 of 729 and waited 19 hours: evaluate and close have no
    // timeout of their own
    vi.useFakeTimers()
    try {
      const fake = fakeBrowser({ gotos: [{ ok: true }], evaluateHangs: true, closeHangs: true })
      const result = collectStoryTokens(fake.browser, 'http://127.0.0.1:1', STORY, VIEWPORT, 'sq', undefined, 50)
      const settled = expect(result).rejects.toThrow(`Timeout 50ms exceeded: ${STORY.id} at mobile-320 in sq`)
      await vi.advanceTimersByTimeAsync(50 + 5000)
      await settled
      expect(fake.pages.every(page => page.closed)).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('never retries a page load timeout or an HTTP failure', async () => {
    const timeout = fakeBrowser({ gotos: [{ reject: new Error('page.goto: Timeout 20000ms exceeded.') }, { ok: true }] })
    await expect(collect(timeout.browser)).rejects.toThrow('Timeout 20000ms exceeded')
    expect(timeout.gotoCalls()).toBe(1)

    const http = fakeBrowser({ gotos: [{ ok: true, httpOk: false }, { ok: true }] })
    await expect(collect(http.browser)).rejects.toThrow('Story HTTP response failed')
    expect(http.gotoCalls()).toBe(1)
  })
})
