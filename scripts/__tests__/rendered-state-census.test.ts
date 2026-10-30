// @vitest-environment node
/**
 * Unit tests of the rendered state census registry validator (Task 923, R8) and of the pure retry logic (R16).
 * The validator is pure (`scripts/rendered-state-census/registry.mjs`); the runner and the self-test that drive a
 * browser are proven by `npm run check:rendered-state-census:verify`.
 */
import { describe, expect, it } from 'vitest'
import { clickWidths } from '../rendered-state-census/discover.mjs'
import { appliesAtWidth, rangeEdges, validateRegistry } from '../rendered-state-census/registry.mjs'
import { DEFAULT_LOCALES, DEFAULT_WIDTHS, RULE_KEYS, blankRules, runWithRetry, summarize, transientReason } from '../rendered-state-census/runner.mjs'
import { loadBreakpoints, parseBreakpoints } from '../rendered-state-census/theme-breakpoints.mjs'

type State = Record<string, unknown>

const clickState = (): State => ({
  id: 'modal-structured',
  story: 'mantine-primitives-modal--structured',
  open: { kind: 'click', selector: 'button' },
  portals: 1,
  focus: 'trap',
  dismiss: ['escape', 'close-control', 'outside'],
  trigger: 'button',
})

const mountState = (): State => ({
  id: 'ticket-detail-support',
  story: 'patterns-mantine-ticketdetaildialogview--support',
  open: { kind: 'mount' },
  portals: 1,
  focus: 'trap',
  dismiss: ['escape', 'close-control', 'outside'],
})

const registryOf = (...states: State[]) => ({ version: 1, states })

// the theme breakpoint list in px (xs, xs1, xs2, sm, md, lg, xl, xxl): the validator receives it, it never hard-codes it
const breakpoints = [320, 390, 480, 640, 768, 1024, 1280, 1440]

const index = {
  'mantine-primitives-modal--structured': { id: 'mantine-primitives-modal--structured', title: 'Mantine/Primitives/Modal', type: 'story' },
  'patterns-mantine-ticketdetaildialogview--support': { id: 'patterns-mantine-ticketdetaildialogview--support', title: 'Patterns/Mantine/TicketDetailDialogView', type: 'story' },
  'legacy-card--default': { id: 'legacy-card--default', title: 'Legacy/Card', type: 'story' },
}

describe('validateRegistry', () => {
  it('accepts a valid registry (click and mount states) against the build index', () => {
    const result = validateRegistry(registryOf(clickState(), mountState()), { index })
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('accepts a keys-open state and an empty dismiss with a reason', () => {
    const keys: State = { ...clickState(), id: 'combobox-keys', open: { kind: 'keys', selector: 'input', keys: ['ArrowDown'] }, focus: 'trigger' }
    const view: State = { ...mountState(), id: 'view-only', dismiss: [], reason: 'a View Story whose onClose is a no-op' }
    expect(validateRegistry(registryOf(keys, view), { index }).ok).toBe(true)
  })

  it('accepts exemptTargets with its dated owner decision and rejects it without one (Task 923 R33, owner D9)', () => {
    const exempt: State = { ...clickState(), exemptTargets: '.range-day-cell', ownerDecision: 'owner D9, 2026-10-16: the day cells stay 39px' }
    expect(validateRegistry(registryOf(exempt), { index }).ok).toBe(true)
    const bare: State = { ...clickState(), exemptTargets: '.range-day-cell' }
    const result = validateRegistry(registryOf(bare), { index })
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain('"exemptTargets" needs a non-empty "ownerDecision"')
    expect(validateRegistry(registryOf({ ...exempt, exemptTargets: '' }), { index }).ok).toBe(false)
  })

  it('accepts exemptOverflow with its dated owner decision and rejects it without one (Task 923 R33, owner D10)', () => {
    const exempt: State = { ...clickState(), exemptOverflow: '.apexcharts-canvas', ownerDecision: 'owner D10, 2026-10-17: the semi-donut chart stays as it is' }
    expect(validateRegistry(registryOf(exempt), { index }).ok).toBe(true)
    const bare: State = { ...clickState(), exemptOverflow: '.apexcharts-canvas' }
    const result = validateRegistry(registryOf(bare), { index })
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain('"exemptOverflow" needs a non-empty "ownerDecision"')
    expect(validateRegistry(registryOf({ ...exempt, exemptOverflow: '' }), { index }).ok).toBe(false)
  })

  it('accepts exemptText with its dated owner decision and rejects it without one (Task 923 R136, owner D84)', () => {
    const exempt: State = { ...clickState(), exemptText: '.nsm7Bb-HzV7m-LgbsSe', ownerDecision: 'owner D84, 2026-10-23: the vendor sign-in button label stays as it is' }
    expect(validateRegistry(registryOf(exempt), { index }).ok).toBe(true)
    const bare: State = { ...clickState(), exemptText: '.nsm7Bb-HzV7m-LgbsSe' }
    const result = validateRegistry(registryOf(bare), { index })
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain('"exemptText" needs a non-empty "ownerDecision" naming the dated owner decision')
    expect(validateRegistry(registryOf({ ...exempt, exemptText: '' }), { index }).ok).toBe(false)
  })

  it('rejects a duplicate id', () => {
    const result = validateRegistry(registryOf(clickState(), clickState()), { index })
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('state "modal-structured": duplicate id "modal-structured"')
  })

  it('rejects an unknown key', () => {
    const result = validateRegistry(registryOf({ ...clickState(), viewport: 390 }), { index })
    expect(result.errors).toContain('state "modal-structured": unknown key "viewport"')
  })

  it('rejects an out-of-scope title', () => {
    const state: State = { ...clickState(), id: 'legacy', story: 'legacy-card--default' }
    const result = validateRegistry(registryOf(state), { index })
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain('out-of-scope title "Legacy/Card"')
  })

  it('rejects a Story id absent from the build index', () => {
    const state: State = { ...clickState(), story: 'mantine-primitives-modal--gone' }
    const result = validateRegistry(registryOf(state), { index })
    expect(result.errors.join('\n')).toContain('is not in the Storybook build index')
  })

  it('rejects an empty dismiss without a reason', () => {
    const result = validateRegistry(registryOf({ ...mountState(), dismiss: [] }), { index })
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('state "ticket-detail-support": an empty "dismiss" needs a non-empty "reason"')
  })

  it('rejects portals: 0', () => {
    const result = validateRegistry(registryOf({ ...mountState(), portals: 0 }), { index })
    expect(result.errors).toContain('state "ticket-detail-support": "portals" must be an integer >= 1')
  })

  it('rejects a click state without a selector or a trigger, and a mount state with a trigger', () => {
    const noSelector: State = { ...clickState(), open: { kind: 'click' } }
    const noTrigger: State = { ...clickState(), id: 'no-trigger', trigger: undefined }
    const mountWithTrigger: State = { ...mountState(), trigger: 'button' }
    const messages = [noSelector, noTrigger, mountWithTrigger].flatMap((s) => validateRegistry(registryOf(s), { index }).errors)
    expect(messages).toContain('state "modal-structured": open.kind "click" needs a non-empty open.selector')
    expect(messages).toContain('state "no-trigger": a "click" state needs "trigger" (the selector focus returns to)')
    expect(messages).toContain('state "ticket-detail-support": a "mount" state has no "trigger"')
  })

  it('rejects an unknown focus mode, an unknown dismiss mechanism and a wrong version', () => {
    const result = validateRegistry({ version: 2, states: [{ ...clickState(), focus: 'free', dismiss: ['swipe'] }] }, { index })
    expect(result.errors).toContain('version must be 1')
    expect(result.errors.join('\n')).toContain('focus "free" is not one of trap, trigger, inside')
    expect(result.errors.join('\n')).toContain('dismiss mechanism "swipe" is not one of escape, close-control, outside')
  })

  it('accepts a widths range made of theme breakpoints and applies it per viewport width', () => {
    const narrow: State = { ...clickState(), id: 'hamburger', widths: { max: 639 } }
    const wide: State = { ...clickState(), id: 'locale-dropdown', widths: { min: 640 } }
    const desktop: State = { ...clickState(), id: 'row-click', widths: { min: 1024 } }
    const band: State = { ...clickState(), id: 'band', widths: { min: 768, max: 1023 } }
    expect(validateRegistry(registryOf(narrow, wide, desktop, band), { index, breakpoints }).errors).toEqual([])
    expect(appliesAtWidth(narrow, 639)).toBe(true)
    expect(appliesAtWidth(narrow, 640)).toBe(false)
    expect(appliesAtWidth(wide, 639)).toBe(false)
    expect(appliesAtWidth(wide, 1440)).toBe(true)
    expect(appliesAtWidth(clickState(), 320)).toBe(true)
  })

  it('rejects a widths bound that is not a theme breakpoint (min) or a breakpoint minus 1 (max)', () => {
    const minOff: State = { ...clickState(), id: 'min-off', widths: { min: 1000 } }
    const maxOff: State = { ...clickState(), id: 'max-off', widths: { max: 640 } }
    const maxIsBreakpoint: State = { ...clickState(), id: 'max-bp', widths: { max: 1440 } }
    const messages = [minOff, maxOff, maxIsBreakpoint].flatMap((s) => validateRegistry(registryOf(s), { index, breakpoints }).errors)
    expect(messages).toContain('state "min-off": widths.min 1000 is not a theme breakpoint (320, 390, 480, 640, 768, 1024, 1280, 1440)')
    expect(messages).toContain('state "max-off": widths.max 640 is not a theme breakpoint minus 1 (319, 389, 479, 639, 767, 1023, 1279, 1439)')
    expect(messages).toContain('state "max-bp": widths.max 1440 is not a theme breakpoint minus 1 (319, 389, 479, 639, 767, 1023, 1279, 1439)')
  })

  it('does not accept a widths range without the theme breakpoint list', () => {
    const wide: State = { ...clickState(), id: 'locale-dropdown', widths: { min: 640 } }
    const result = validateRegistry(registryOf(wide), { index })
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toContain('cannot be checked without the theme breakpoint list')
  })

  it('rejects a malformed widths range', () => {
    const empty: State = { ...clickState(), id: 'w-empty', widths: {} }
    const inverted: State = { ...clickState(), id: 'w-inverted', widths: { min: 1024, max: 639 } }
    const unknownKey: State = { ...clickState(), id: 'w-key', widths: { from: 640 } }
    const messages = [empty, inverted, unknownKey].flatMap((s) => validateRegistry(registryOf(s), { index, breakpoints }).errors)
    expect(messages).toContain('state "w-empty": "widths" must be { min?, max? } with at least one bound')
    expect(messages).toContain('state "w-inverted": "widths" min 1024 is above max 639')
    expect(messages).toContain('state "w-key": "widths" must be { min?, max? } with at least one bound')
  })

  it('rejects a registry that is not an object with a states array', () => {
    expect(validateRegistry(null).ok).toBe(false)
    expect(validateRegistry({ version: 1 }).errors).toContain('"states" must be an array')
  })
})

describe('rangeEdges', () => {
  it('names the in-range bound and the first width outside the range', () => {
    expect(rangeEdges({ widths: { min: 1024 } })).toEqual({ inRange: [1024], outside: [1023] })
    expect(rangeEdges({ widths: { max: 639 } })).toEqual({ inRange: [639], outside: [640] })
    expect(rangeEdges({ widths: { min: 768, max: 1023 } })).toEqual({ inRange: [768, 1023], outside: [767, 1024] })
    expect(rangeEdges({})).toEqual({ inRange: [], outside: [] })
  })
})

describe('theme breakpoints', () => {
  it('parses the breakpoints block of the theme text', () => {
    const source = ["breakpoints: {", "    xs: '20em',   // 320px", "    sm: '40em',", "    lg: '64em' }"].join('\n')
    expect(parseBreakpoints(source)).toEqual({ xs: 320, sm: 640, lg: 1024 })
  })

  it('reads the real theme: sm is the 640px mobile gate and xxl is 1440px', () => {
    const { named, list } = loadBreakpoints(process.cwd())
    expect(named.sm).toBe(640)
    expect(named.lg).toBe(1024)
    expect(named.xxl).toBe(1440)
    expect(list).toEqual([...list].sort((a: number, b: number) => a - b))
  })

  it('rejects a theme text without a breakpoints block', () => {
    expect(() => parseBreakpoints('const theme = {}')).toThrow('no `breakpoints')
  })
})

describe('discovery click widths', () => {
  it('always clicks at 390 and 1440, and at every widths bound of the Story rows', () => {
    expect(clickWidths([])).toEqual([390, 1440])
    expect(clickWidths([{ widths: { min: 1024 } }, { widths: { max: 639 } }, {}])).toEqual([390, 639, 1024, 1440])
  })
})

// ---- R16: one recorded retry for a transient load / open failure ----
const rowWith = (rules: Record<string, string[]> = {}, root = 'app') => ({
  story: 's', state: 'x', root, locale: 'en', width: 390, rules: { ...blankRules(), ...rules }, notApplicable: {}, pass: false,
})
const NAV = 'navigation failed: page.goto: net::ERR_NETWORK_IO_SUSPENDED at http://127.0.0.1/iframe.html'
const TIMEOUT = 'open click "#open": locator.click: Timeout 4000ms exceeded.'
// the exact reasons `loadTarget` gives (runner.mjs): a render that never finished, and one that ended errored
const RENDER_TIMEOUT = 'render did not reach finished/errored within 20s'
const RENDER_ERRORED = 'render errored, sb-show-errordisplay=true'

describe('transient failures (R16)', () => {
  it('names a navigation error and an open timeout, and no other open or measured failure', () => {
    expect(transientReason([rowWith({ 'error-screen': [NAV] })])).toBe(NAV)
    expect(transientReason([rowWith({ 'open-failed': [TIMEOUT] })])).toBe(TIMEOUT)
    expect(transientReason([rowWith({ 'error-screen': ['render errored, sb-show-errordisplay=true'] })])).toBeNull()
    expect(transientReason([rowWith({ 'open-failed': ['open click "#x": element is not attached'] })])).toBeNull()
    expect(transientReason([rowWith({ 'component-overflow': ['div past div'] })])).toBeNull()
  })

  const freshPage = async () => ({ fresh: true })

  it('runs a job once and leaves no retry key when nothing was transient', async () => {
    let runs = 0
    const out = await runWithRetry(async () => { runs++; return [rowWith({ 'text-clamp': ['p clamp 2'] })] }, { fresh: false }, freshPage)
    expect(runs).toBe(1)
    expect('retry' in out.rows[0]).toBe(false)
    expect(out.page).toEqual({ fresh: false })
  })

  it('retries once on a fresh page and records the first failure on every row', async () => {
    let runs = 0
    const out = await runWithRetry(async () => {
      runs++
      return runs === 1 ? [rowWith({ 'open-failed': [TIMEOUT], 'portal-count': ['declared 1, found 0'] })] : [rowWith(), rowWith({}, 'portal:0')]
    }, { fresh: false }, freshPage)
    expect(runs).toBe(2)
    expect(out.page).toEqual({ fresh: true })
    expect(out.rows.map((r: { retry?: string }) => r.retry)).toEqual([TIMEOUT, TIMEOUT])
    expect(out.rows.every((r: { pass: boolean }) => r.pass)).toBe(true)
  })

  it('a second failure is the violation, still with the retry recorded', async () => {
    let runs = 0
    const out = await runWithRetry(async () => { runs++; return [rowWith({ 'error-screen': [NAV] })] }, { fresh: false }, freshPage)
    expect(runs).toBe(2)
    expect(out.rows[0].rules['error-screen']).toEqual([NAV])
    expect(out.rows[0].pass).toBe(false)
    expect(out.rows[0].retry).toBe(NAV)
  })

  it('a retry replaces the first attempt: nothing it measured on a page that never opened is carried over (R29)', async () => {
    let runs = 0
    const out = await runWithRetry(async () => {
      runs++
      return runs === 1 ? [rowWith({ 'open-failed': [TIMEOUT], 'text-clamp': ['p "x" clamp 2'] })] : [rowWith()]
    }, { fresh: false }, freshPage)
    expect(runs).toBe(2)
    expect(out.rows).toHaveLength(1)
    expect(out.rows[0].rules['text-clamp']).toEqual([])
    expect(out.rows[0].pass).toBe(true)
    expect(out.rows[0].retry).toBe(TIMEOUT)
  })

  // ---- R20: a render timeout is transient, an errored render is not ----
  it('names a render timeout as transient, and never an errored render or the error display', () => {
    expect(transientReason([rowWith({ 'error-screen': [RENDER_TIMEOUT] })])).toBe(RENDER_TIMEOUT)
    expect(transientReason([rowWith({ 'error-screen': [RENDER_ERRORED] })])).toBeNull()
    expect(transientReason([rowWith({ 'error-screen': ['render errored, sb-show-errordisplay=false'] })])).toBeNull()
    expect(transientReason([rowWith({ 'error-screen': ['the app root #storybook-root is missing'] })])).toBeNull()
  })

  it('(i) a render timeout then a green second attempt ends green, with the retry recorded', async () => {
    let runs = 0
    const out = await runWithRetry(async () => {
      runs++
      return runs === 1 ? [rowWith({ 'error-screen': [RENDER_TIMEOUT] })] : [rowWith(), rowWith({}, 'portal:0')]
    }, { fresh: false }, freshPage)
    expect(runs).toBe(2)
    expect(out.page).toEqual({ fresh: true })
    expect(out.rows.map((r: { retry?: string }) => r.retry)).toEqual([RENDER_TIMEOUT, RENDER_TIMEOUT])
    expect(out.rows.every((r: { pass: boolean }) => r.pass)).toBe(true)
  })

  it('(ii) a render that ends errored (the error display) is run once and has no retry key', async () => {
    let runs = 0
    const out = await runWithRetry(async () => { runs++; return [rowWith({ 'error-screen': [RENDER_ERRORED] })] }, { fresh: false }, freshPage)
    expect(runs).toBe(1)
    expect('retry' in out.rows[0]).toBe(false)
    expect(out.rows[0].rules['error-screen']).toEqual([RENDER_ERRORED])
    expect(out.rows[0].pass).toBe(false)
    expect(out.page).toEqual({ fresh: false })
  })

  it('(iii) a render timeout on both attempts still fails error-screen, with the retry recorded', async () => {
    let runs = 0
    const out = await runWithRetry(async () => { runs++; return [rowWith({ 'error-screen': [RENDER_TIMEOUT] })] }, { fresh: false }, freshPage)
    expect(runs).toBe(2)
    expect(out.rows[0].rules['error-screen']).toEqual([RENDER_TIMEOUT])
    expect(out.rows[0].pass).toBe(false)
    expect(out.rows[0].retry).toBe(RENDER_TIMEOUT)
  })

  // ---- R32 (c): a failed same-origin document / script / stylesheet is a transient load failure ----
  it('names a failed same-origin resource as transient, and still no errored render', () => {
    const RESOURCE = 'resource failed: stylesheet /x.css (status 503, EBUSY)'
    expect(transientReason([rowWith({ 'error-screen': [RESOURCE] })])).toBe(RESOURCE)
    expect(transientReason([rowWith({ 'error-screen': [RENDER_ERRORED] })])).toBeNull()
  })

  // ---- R52 / R33 (i): a transient load failure of the reopen of a dismissal check is retried, with the inner reason as the first failure ----
  it('names a transient reopen failure of a dismissal check as transient, with the inner reason', () => {
    const inner = 'render did not reach finished/errored within 20s'
    expect(transientReason([rowWith({ 'dismiss-outside': [`dismiss-outside: could not reopen the state (${inner})`] })])).toBe(inner)
    const resource = 'resource failed: stylesheet /x.css (status 503, EBUSY)'
    expect(transientReason([rowWith({ 'dismiss-escape': [`dismiss-escape: could not reopen the state (${resource})`] })])).toBe(resource)
  })

  it('does not name a reopen that failed for a reason that is not a load failure, nor a dismissal that did not close', () => {
    expect(transientReason([rowWith({ 'dismiss-outside': ['dismiss-outside: could not reopen the state (the trigger is not visible)'] })])).toBeNull()
    expect(transientReason([rowWith({ 'dismiss-escape': ['dismiss-escape: the portal is still visible 5000ms after the dismissal'] })])).toBeNull()
    expect(transientReason([rowWith({ 'text-overlap': [`could not reopen the state (${NAV})`] })])).toBeNull()
  })

  it('lists each retried cell in the summary with its outcome', () => {
    const recovered = { ...rowWith(), retry: NAV, pass: true }
    const failing = { ...rowWith({ 'open-failed': [TIMEOUT] }), state: 'y', retry: TIMEOUT }
    const summary = summarize([recovered, failing, rowWith()], {}, [])
    expect(summary.retries).toEqual([
      { cell: 's | x | en | 390', firstFailure: NAV, recovered: true },
      { cell: 's | y | en | 390', firstFailure: TIMEOUT, recovered: false },
    ])
  })
})

describe('the measured matrix (Task 923 Revision 7)', () => {
  it('has the contract widths and both sides of every theme layout switch between 640 and 1440', () => {
    for (const w of [320, 390, 639, 640, 1440]) expect(DEFAULT_WIDTHS).toContain(w)
    // md = 768 (admin tables switch to cards below it), lg = 1024 (the admin sidebar becomes a fixed navbar): 1023 and 1024 are its two sides
    for (const w of [768, 1023, 1024]) expect(DEFAULT_WIDTHS).toContain(w)
    expect([...DEFAULT_WIDTHS].sort((a, b) => a - b)).toEqual([...DEFAULT_WIDTHS])
    expect(new Set(DEFAULT_WIDTHS).size).toBe(DEFAULT_WIDTHS.length)
  })

  it('measures all four locales', () => {
    expect([...DEFAULT_LOCALES].sort()).toEqual(['en', 'it', 'sq', 'uk'])
  })

  it('every rule the measuring code reports is a rule of the evidence row (text inside an svg and overlapping text included)', () => {
    for (const rule of ['text-overlap', 'svg-text-clipped', 'component-overflow', 'viewport-overflow', 'text-hidden']) expect(RULE_KEYS).toContain(rule)
    expect(Object.keys(blankRules()).sort()).toEqual([...RULE_KEYS].sort())
  })
})
