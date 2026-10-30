import { describe, it, expect } from 'vitest'
import {
  BADGE_COUNT_EMPHASIS,
  BADGE_STATUS_REGISTRY,
  BADGE_TONES,
  LISTING_DETAIL_BADGE_TONES,
  LISTING_STATUS_COLOR,
  PROFILE_TYPE_TONES,
  USER_STATUS_TONES,
  USER_ROLE_TONES,
} from '../badgeTones'
import { theme } from '../theme'
import en from '../../../../messages/en.json'
import sq from '../../../../messages/sq.json'
import uk from '../../../../messages/uk.json'
import it_ from '../../../../messages/it.json'

// Task 859 R24: the registry is the one owner of badge meaning. Every entry has a theme colour and a label key that
// exists in all four locales; the one disagreement between the old maps (user `inactive`) is settled (D78-20).
const LOCALES: Record<string, unknown> = { en, sq, uk, it: it_ }
const lookup = (messages: unknown, key: string): unknown =>
  key.split('.').reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined), messages)

describe('badge registry', () => {
  const entries = Object.entries(BADGE_STATUS_REGISTRY).flatMap(([entity, map]) =>
    Object.entries(map).map(([value, entry]) => ({ entity, value, entry })),
  )

  it('has entries', () => {
    expect(entries.length).toBeGreaterThan(30)
  })

  it.each(entries)('$entity.$value has a theme colour', ({ entry }) => {
    const known = [...Object.keys(theme.colors ?? {}), 'orange']
    expect(known).toContain(entry.color)
  })

  it.each(entries)('$entity.$value label key exists in sq, en, uk and it', ({ entry }) => {
    for (const [locale, messages] of Object.entries(LOCALES)) {
      expect(typeof lookup(messages, entry.labelKey), `${locale}: ${entry.labelKey}`).toBe('string')
    }
  })

  it('semantic tones are theme colours', () => {
    for (const color of Object.values(BADGE_TONES)) expect(Object.keys(theme.colors ?? {})).toContain(color)
  })

  it('user inactive is gray everywhere (D78-20); blocked red; active green', () => {
    expect(USER_STATUS_TONES.inactive.color).toBe('gray')
    expect(USER_STATUS_TONES.blocked.color).toBe('red')
    expect(USER_STATUS_TONES.active.color).toBe('green')
  })

  it('role colours are the users table\'s', () => {
    expect(USER_ROLE_TONES.agent.color).toBe('blueLight')
    expect(USER_ROLE_TONES.moderator.color).toBe('orange')
  })

  it('the listing colour export is the registry\'s', () => {
    expect(LISTING_STATUS_COLOR.sold).toBe('blueLight')
    expect(LISTING_STATUS_COLOR.pending).toBe('yellow')
  })

  it('report "Under review" and listing "pending" are one meaning, one tone (D78-26)', () => {
    expect(BADGE_STATUS_REGISTRY.report.reviewed.color).toBe(BADGE_STATUS_REGISTRY.listing.pending.color)
  })
})

// Task 859 Revision 8 (R57, GR-12): one label, one look. These pin the entries the review-9 census found with two looks.
// Revision 9 (R61, owner D78-29): a badge carries no icon, so the registry stores none.
describe('one look per label (R57)', () => {
  it('inquiry "New" is the listing card\'s "new" badge: the same colour (D78-28)', () => {
    expect(BADGE_STATUS_REGISTRY.inquiry.new.color).toBe(BADGE_TONES[LISTING_DETAIL_BADGE_TONES.new])
  })

  it('"Premium" is the registry flag, not a detail-page tone', () => {
    expect(BADGE_STATUS_REGISTRY.listingFlag.premium.color).toBe(BADGE_TONES.warning)
    expect(Object.keys(LISTING_DETAIL_BADGE_TONES)).not.toContain('premium')
  })

  const everyEntry = Object.entries(BADGE_STATUS_REGISTRY).flatMap(([entity, map]) =>
    Object.keys(map).map((value) => [entity, value] as const),
  )
  it.each(everyEntry)('%s.%s stores no icon (D78-29)', (entity, value) => {
    const map = BADGE_STATUS_REGISTRY[entity as keyof typeof BADGE_STATUS_REGISTRY] as Record<string, object>
    expect(Object.keys(map[value])).not.toContain('icon')
  })

  it('the registry covers every status entity (the no-icon check above is not vacuous)', () => {
    expect(everyEntry.length).toBeGreaterThan(40)
  })

  it('profile types reuse the role colours of the same name; developer stays neutral', () => {
    expect(PROFILE_TYPE_TONES.admin.color).toBe(USER_ROLE_TONES.admin.color)
    expect(PROFILE_TYPE_TONES.moderator.color).toBe(USER_ROLE_TONES.moderator.color)
    expect(PROFILE_TYPE_TONES.agent.color).toBe(USER_ROLE_TONES.agent.color)
    expect(PROFILE_TYPE_TONES.private.color).toBe(USER_ROLE_TONES.user.color)
    expect(PROFILE_TYPE_TONES.developer.color).toBe(BADGE_TONES.neutral)
  })

  it('count emphasis maps to today\'s three colour/variant pairs (R59)', () => {
    expect(BADGE_COUNT_EMPHASIS).toEqual({
      brand: { color: BADGE_TONES.brand, variant: 'filled' },
      onBrand: { color: BADGE_TONES.brand, variant: 'white' },
      neutral: { color: BADGE_TONES.neutral, variant: 'light' },
    })
  })
})

// Task 859 Revision 7 (R49, owner D78-26): every status and tone badge is the solid look, white text on the colour's
// index-7 stop (the theme's primaryShade). WCAG 2.x contrast of that pair, read from the theme and the registry, never
// retyped.
const WHITE = '#ffffff'
const FILL_SHADE = 7
const MIN_CONTRAST = 4.5

function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastOnWhite(hex: string): number {
  const fg = relativeLuminance(hex)
  const bg = relativeLuminance(WHITE)
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)
}

const registryColours = Object.values(BADGE_STATUS_REGISTRY).flatMap((map) =>
  Object.values(map).map((entry) => entry.color as string),
)
const toneColours = Object.values(BADGE_TONES) as string[]
// `brand` is the owner's primary (#EC5447 at index 7, 3.14:1 under white): it is not a status colour, and no registry
// entry other than the `brand` tone-based marks uses it. Owner decision D78-27 (2026-10-08) accepts it for the `brand`
// tone, the `brand` count and the cover mark: the assertion below pins the measured ratio (>= 3.0 and < 4.5) so a change
// to it is visible. Every other registry and tone colour stays >= 4.5:1.
const BRAND_MEASURED_MIN = 3.0

describe('solid badge text contrast (white on index 7)', () => {
  const colours = [...new Set([...toneColours, ...registryColours])].filter((c) => c !== 'brand')

  it.each(colours)('%s: white on the index-7 fill reaches 4.5:1', (name) => {
    const palette = theme.colors?.[name] as readonly string[] | undefined
    expect(palette, `theme colour ${name}`).toBeDefined()
    expect(contrastOnWhite(palette?.[FILL_SHADE] ?? '#000000')).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })

  it('covers every registry colour and every tone colour except the brand tone', () => {
    expect(colours).toEqual(expect.arrayContaining(['gray', 'blueLight', 'green', 'yellow', 'red', 'sale', 'purple', 'orange']))
  })

  it('brand: the measured ratio is pinned (owner primary; below 4.5:1, accepted by owner decision D78-27)', () => {
    const palette = theme.colors?.brand as readonly string[] | undefined
    const ratio = contrastOnWhite(palette?.[FILL_SHADE] ?? '#000000')
    expect(ratio).toBeGreaterThanOrEqual(BRAND_MEASURED_MIN)
    expect(ratio).toBeLessThan(MIN_CONTRAST)
  })
})
