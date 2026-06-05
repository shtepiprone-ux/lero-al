// @vitest-environment node
/**
 * Gate test suite for scripts/check-stories.mjs (Task 391).
 *
 * For every one of the 10 governance checks:
 *   - one BAD fixture that makes the gate exit non-zero / report that rule
 *   - one GOOD fixture that passes
 *
 * Plus explicit unit tests for isEnglishish and all 4 new Check-10 variants
 * (single-quote, expression, template-literal, JSX text children).
 *
 * Run: npm test  or  npx vitest run scripts/__tests__/check-stories.test.ts
 */

import { describe, it, expect, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'

// @ts-ignore — .mjs module; types inferred below
import { runGate, isEnglishish, JSX_PROP_ALLOWLIST } from '../check-stories.mjs'

// ── Types ─────────────────────────────────────────────────────────────────────

type Violation = { file: string; line: number; rule: string; detail: string }
type GateResult = { violations: Violation[]; storyFilesCount: number; checksRan: number }

// ── Fixture helpers ───────────────────────────────────────────────────────────

/**
 * Create a minimal temp repo root with:
 *   src/stories/fixtures/, src/components/, src/modules/, messages/
 * and empty-namespace message files for all 4 locales (prevents spurious
 * Check-6 / Check-8 violations in tests targeting other checks).
 */
function makeRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), 'gate-test-'))
  mkdirSync(join(dir, 'src', 'stories', 'fixtures'), { recursive: true })
  mkdirSync(join(dir, 'src', 'components'), { recursive: true })
  mkdirSync(join(dir, 'src', 'modules'), { recursive: true })
  mkdirSync(join(dir, 'messages'), { recursive: true })
  const emptyMsg = JSON.stringify({ storybook: {} })
  for (const l of ['sq', 'en', 'uk', 'it']) {
    writeFileSync(join(dir, 'messages', `${l}.json`), emptyMsg)
  }
  return dir
}

function writeStory(root: string, relPath: string, content: string): void {
  const abs = join(root, 'src', relPath)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

function writeFixture(root: string, name: string, content: string): void {
  writeFileSync(join(root, 'src', 'stories', 'fixtures', name), content)
}

function writeComponent(root: string, relPath: string, content: string): void {
  const abs = join(root, 'src', 'components', relPath)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

function writeMessages(root: string, data: Record<string, unknown>): void {
  for (const [locale, msgs] of Object.entries(data)) {
    writeFileSync(join(root, 'messages', `${locale}.json`), JSON.stringify(msgs))
  }
}

function gate(root: string): GateResult {
  return (runGate as (r: string, o: object) => GateResult)(root, { verbose: false })
}

function hasRule(violations: Violation[], rule: string): boolean {
  return violations.some(v => v.rule === rule)
}

// Collect roots created during a test run so afterEach can clean them up
const roots: string[] = []
function tmpRoot(): string {
  const r = makeRoot()
  roots.push(r)
  return r
}

afterEach(() => {
  for (const r of roots.splice(0)) {
    try { rmSync(r, { recursive: true, force: true }) } catch { /* ignore */ }
  }
})

// ── Check 1: layout:centered / layout:padded ──────────────────────────────────

describe('Check 1: layout:centered / layout:padded', () => {
  it("BAD — layout:'centered' triggers layout:centered rule", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const Default = { parameters: { layout: 'centered' } }`)
    expect(hasRule(gate(root).violations, 'layout:centered')).toBe(true)
  })

  it("BAD — layout:'padded' triggers layout:padded rule", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const Default = { parameters: { layout: 'padded' } }`)
    expect(hasRule(gate(root).violations, 'layout:padded')).toBe(true)
  })

  it("GOOD — layout:'fullscreen' passes with 0 layout violations", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const Default = { parameters: { layout: 'fullscreen' } }`)
    const { violations } = gate(root)
    expect(hasRule(violations, 'layout:centered')).toBe(false)
    expect(hasRule(violations, 'layout:padded')).toBe(false)
  })
})

// ── Check 2: Raw HTML controls ────────────────────────────────────────────────

describe('Check 2: raw HTML controls', () => {
  it('BAD — <button> in story triggers raw-html-button', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const Default = { render: () => <button>x</button> }`)
    expect(hasRule(gate(root).violations, 'raw-html-button')).toBe(true)
  })

  it('BAD — <input> in story triggers raw-html-input', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const Default = { render: () => <input type="text" /> }`)
    expect(hasRule(gate(root).violations, 'raw-html-input')).toBe(true)
  })

  it('GOOD — no raw HTML controls passes', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const Default = { render: () => null }`)
    expect(hasRule(gate(root).violations, 'raw-html-button')).toBe(false)
    expect(hasRule(gate(root).violations, 'raw-html-input')).toBe(false)
  })
})

// ── Check 3: Ukrainian export names ──────────────────────────────────────────

describe('Check 3: Ukrainian export names', () => {
  it('BAD — export const MyUkrainianStory triggers ukrainian-export', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const MyUkrainianStory = {}`)
    expect(hasRule(gate(root).violations, 'ukrainian-export')).toBe(true)
  })

  it('GOOD — export const LocaleStress passes', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const LocaleStress = {}`)
    expect(hasRule(gate(root).violations, 'ukrainian-export')).toBe(false)
  })
})

// ── Check 4: Pinned globals.locale = 'uk' ────────────────────────────────────

describe("Check 4: globals:{locale:'uk'} pin", () => {
  it("BAD — globals:{locale:'uk'} triggers globals-locale-pin", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { parameters: { globals: { locale: 'uk' } } }`)
    expect(hasRule(gate(root).violations, 'globals-locale-pin')).toBe(true)
  })

  it('GOOD — no locale pin passes', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const Default = { parameters: {} }`)
    expect(hasRule(gate(root).violations, 'globals-locale-pin')).toBe(false)
  })
})

// ── Check 5: Hardcoded title literals in fixtures ─────────────────────────────

describe('Check 5: hardcoded title literals in fixtures', () => {
  it("BAD — title:'Modern Apartment in Tirana...' triggers hardcoded-title-literal", () => {
    const root = tmpRoot()
    writeFixture(root, 'listing.ts',
      `export const bad = { title: 'Modern Apartment in Tirana, Center', price: 120000 }`)
    expect(hasRule(gate(root).violations, 'hardcoded-title-literal')).toBe(true)
  })

  it('GOOD — fixture with no forbidden title passes', () => {
    const root = tmpRoot()
    writeFixture(root, 'listing.ts', `export const good = { id: 1, price: 50000 }`)
    expect(hasRule(gate(root).violations, 'hardcoded-title-literal')).toBe(false)
  })
})

// ── Check 6: storybook.* key parity ──────────────────────────────────────────

describe('Check 6: storybook.* key parity across sq/en/uk/it', () => {
  it('BAD — key in en missing from sq triggers storybook-parity', () => {
    const root = tmpRoot()
    writeMessages(root, {
      en: { storybook: { check6: { title: 'Test' } } },
      sq: { storybook: {} },
      uk: { storybook: { check6: { title: 'Тест' } } },
      it: { storybook: { check6: { title: 'Test' } } },
    })
    expect(hasRule(gate(root).violations, 'storybook-parity')).toBe(true)
  })

  it('GOOD — all 4 locales have matching keys passes', () => {
    const root = tmpRoot()
    writeMessages(root, {
      en: { storybook: { check6: { title: 'Test' } } },
      sq: { storybook: { check6: { title: 'Test' } } },
      uk: { storybook: { check6: { title: 'Тест' } } },
      it: { storybook: { check6: { title: 'Test' } } },
    })
    const { violations } = gate(root)
    expect(hasRule(violations, 'storybook-parity')).toBe(false)
    expect(hasRule(violations, 'storybook-ns-missing')).toBe(false)
  })
})

// ── Check 7: Inline locale maps ───────────────────────────────────────────────

describe('Check 7: inline locale maps (uk:/sq: in stories)', () => {
  it("BAD — uk: 'value' object literal triggers inline-locale-map", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `const labels = { uk: 'Апартамент', sq: 'Apartament', en: 'Apartment', it: 'Appartamento' }`)
    expect(hasRule(gate(root).violations, 'inline-locale-map')).toBe(true)
  })

  it('GOOD — storyT call on the same line is skipped', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `const label = storyT(locale, 'storybook.test.label')`)
    expect(hasRule(gate(root).violations, 'inline-locale-map')).toBe(false)
  })
})

// ── Check 8: uk.json Latin-only storybook values ──────────────────────────────

describe('Check 8: uk.json Latin-only storybook values', () => {
  it('BAD — Latin-only uk storybook value triggers uk-latin-only', () => {
    const root = tmpRoot()
    writeMessages(root, {
      en: { storybook: { c8: { title: 'English Title' } } },
      sq: { storybook: { c8: { title: 'English Title' } } },
      uk: { storybook: { c8: { title: 'English Title' } } }, // no Cyrillic — violation
      it: { storybook: { c8: { title: 'English Title' } } },
    })
    expect(hasRule(gate(root).violations, 'uk-latin-only')).toBe(true)
  })

  it('GOOD — Cyrillic uk storybook value passes', () => {
    const root = tmpRoot()
    writeMessages(root, {
      en: { storybook: { c8: { title: 'Title' } } },
      sq: { storybook: { c8: { title: 'Title' } } },
      uk: { storybook: { c8: { title: 'Заголовок' } } },
      it: { storybook: { c8: { title: 'Title' } } },
    })
    expect(hasRule(gate(root).violations, 'uk-latin-only')).toBe(false)
  })
})

// ── Check 9: Runtime component hardcoded literals ─────────────────────────────

describe('Check 9: runtime component hardcoded literals', () => {
  it('BAD — >Previous< in runtime component triggers runtime-hardcode', () => {
    const root = tmpRoot()
    writeComponent(root, 'Pagination.tsx', `export const Prev = () => <button>Previous</button>`)
    expect(hasRule(gate(root).violations, 'runtime-hardcode')).toBe(true)
  })

  it('GOOD — t() call on the same line is skipped', () => {
    const root = tmpRoot()
    writeComponent(root, 'Pagination.tsx', `export const Prev = () => <button>{t('prev')}</button>`)
    expect(hasRule(gate(root).violations, 'runtime-hardcode')).toBe(false)
  })
})

// ── isEnglishish unit tests ───────────────────────────────────────────────────

describe('isEnglishish', () => {
  it('returns true for plain English "Submit"',               () => expect(isEnglishish('Submit')).toBe(true))
  it('returns true for "Browse available properties"',        () => expect(isEnglishish('Browse available properties')).toBe(true))
  it('returns true for "Listings"',                           () => expect(isEnglishish('Listings')).toBe(true))
  it('returns false for Albanian with diacritic "Kërko"',     () => expect(isEnglishish('Kërko')).toBe(false))
  it('returns false for Cyrillic "Апартамент"',               () => expect(isEnglishish('Апартамент')).toBe(false))
  it('returns false for lowercase "next"',                    () => expect(isEnglishish('next')).toBe(false))
  it('returns false for number "25"',                         () => expect(isEnglishish('25')).toBe(false))
  it('returns false for 2-char value "OK" (< 3 alpha)',       () => expect(isEnglishish('OK')).toBe(false))
  it('returns false for Italian with diacritics "Città"',     () => expect(isEnglishish('Città')).toBe(false))
  it('returns false for empty string',                        () => expect(isEnglishish('')).toBe(false))
})

// ── Check 10: all 5 prop-value variants + JSX text children ──────────────────

describe('Check 10: English JSX string-prop literal — all variants', () => {
  // ── (a) double-quote — title="Submit" (original detection) ──────────────────
  it('BAD (a) double-quote — title="Submit" triggers jsx-prop-literal', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <Button title="Submit">x</Button> }`)
    expect(hasRule(gate(root).violations, 'jsx-prop-literal')).toBe(true)
  })

  // ── (b) single-quote — title='Submit' ────────────────────────────────────────
  it("BAD (b) single-quote — title='Submit' triggers jsx-prop-literal", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <Button title='Submit'>x</Button> }`)
    expect(hasRule(gate(root).violations, 'jsx-prop-literal')).toBe(true)
  })

  // ── (c) expression double-quote — title={"Submit"} ───────────────────────────
  it('BAD (c) expression double-quote — title={"Submit"} triggers jsx-prop-literal', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <Button title={"Submit"}>x</Button> }`)
    expect(hasRule(gate(root).violations, 'jsx-prop-literal')).toBe(true)
  })

  // ── (d) expression single-quote — title={'Submit'} ───────────────────────────
  it("BAD (d) expression single-quote — title={'Submit'} triggers jsx-prop-literal", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <Button title={'Submit'}>x</Button> }`)
    expect(hasRule(gate(root).violations, 'jsx-prop-literal')).toBe(true)
  })

  // ── (e) template literal — title={`Submit`} ──────────────────────────────────
  it('BAD (e) template literal — title={`Submit`} triggers jsx-prop-literal', () => {
    const root = tmpRoot()
    // String written to file: export const Default = { render: () => <Button title={`Submit`}>x</Button> }
    writeStory(root, 'Test.stories.tsx',
      'export const Default = { render: () => <Button title={`Submit`}>x</Button> }')
    expect(hasRule(gate(root).violations, 'jsx-prop-literal')).toBe(true)
  })

  // ── (f) JSX text children — <Button>Submit</Button> ──────────────────────────
  it('BAD (f) JSX text child — <Button>Submit</Button> triggers jsx-text-literal', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <Button>Submit</Button> }`)
    expect(hasRule(gate(root).violations, 'jsx-text-literal')).toBe(true)
  })

  // ── True negatives ────────────────────────────────────────────────────────────

  it('GOOD — storyT() on same line skips the entire line', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: (_, c) => <Button title={storyT(c.globals.locale, 'storybook.cta')}>x</Button> }`)
    const { violations } = gate(root)
    expect(hasRule(violations, 'jsx-prop-literal')).toBe(false)
    expect(hasRule(violations, 'jsx-text-literal')).toBe(false)
  })

  it('GOOD — allowlisted city name "Tirana" in double-quote prop passes', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <Badge title="Tirana">x</Badge> }`)
    expect(hasRule(gate(root).violations, 'jsx-prop-literal')).toBe(false)
  })

  it('GOOD — Albanian diacritic placeholder="Kërko prona" passes (not Englishish)', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <Input placeholder="Kërko prona" /> }`)
    expect(hasRule(gate(root).violations, 'jsx-prop-literal')).toBe(false)
  })

  it('GOOD — Cyrillic placeholder passes', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <Input placeholder="Пошук нерухомості" /> }`)
    expect(hasRule(gate(root).violations, 'jsx-prop-literal')).toBe(false)
  })

  it('GOOD — template literal WITH ${} interpolation is not caught', () => {
    const root = tmpRoot()
    // The $ in ${storyT(…)} prevents the template-literal pattern from matching
    writeStory(root, 'Test.stories.tsx',
      'export const Default = { render: (_, c) => <Button title={`${storyT(c, "x")}`}>x</Button> }')
    expect(hasRule(gate(root).violations, 'jsx-prop-literal')).toBe(false)
  })

  it('GOOD — JSX text child wrapped in {" ... "} expression is not caught (no space → not form-i)', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <Button>{'Submit'}</Button> }`)
    const { violations } = gate(root)
    expect(hasRule(violations, 'jsx-text-literal')).toBe(false)
    // Form (i) requires a space in the content — single-word 'Submit' is excluded.
  })

  // ── (g) Object-property placeholder literal ───────────────────────────────────
  it("BAD (g) object-property placeholder:'Enter password' triggers jsx-prop-literal", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { args: { placeholder: 'Enter password', inputState: 'idle' } }`)
    expect(hasRule(gate(root).violations, 'jsx-prop-literal')).toBe(true)
  })

  it("GOOD (g) object-property placeholder with non-English value passes", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { args: { placeholder: 'Kërko pronë', inputState: 'idle' } }`)
    expect(hasRule(gate(root).violations, 'jsx-prop-literal')).toBe(false)
  })

  // ── (h) Standalone JSX text line (own line, pure alpha words) ────────────────
  it('BAD (h) standalone text line "Section body content" triggers jsx-text-literal', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = {\n  render: () => (\n    <div>\n      Section body content\n    </div>\n  )\n}`)
    expect(hasRule(gate(root).violations, 'jsx-text-literal')).toBe(true)
  })

  it('GOOD (h) standalone text line with JSX expression wrapper is not caught', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = {\n  render: (_, c) => (\n    <div>\n      {storyT(c.globals.locale, 'storybook.section.sample')}\n    </div>\n  )\n}`)
    expect(hasRule(gate(root).violations, 'jsx-text-literal')).toBe(false)
  })

  // ── (i) Expression string child with pure alpha words ─────────────────────────
  it("BAD (i) expression child {'Content bounded within this container'} triggers jsx-text-literal", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <div>{'Content bounded within this container'}</div> }`)
    expect(hasRule(gate(root).violations, 'jsx-text-literal')).toBe(true)
  })

  it("GOOD (i) expression child with Albanian diacritics passes (not Englishish)", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <div>{'Kërko pronë'}</div> }`)
    expect(hasRule(gate(root).violations, 'jsx-text-literal')).toBe(false)
  })
})

// ── Check 11: sm:flex-row sm:flex-wrap — toolbar 640px overflow ───────────────

describe('Check 11: sm:flex-row + sm:flex-wrap (toolbar overflow at 640px)', () => {
  it('BAD — sm:flex-row sm:flex-wrap on same line triggers toolbar-sm-flex-wrap', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2" /> }`)
    expect(hasRule(gate(root).violations, 'toolbar-sm-flex-wrap')).toBe(true)
  })

  it('GOOD — md:flex-row md:flex-wrap passes (correct 768px breakpoint)', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <div className="flex flex-col md:flex-row md:flex-wrap md:items-center gap-2" /> }`)
    expect(hasRule(gate(root).violations, 'toolbar-sm-flex-wrap')).toBe(false)
  })

  it('GOOD — sm:flex-row without sm:flex-wrap passes (single-control row)', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <div className="flex sm:flex-row sm:items-center gap-2" /> }`)
    expect(hasRule(gate(root).violations, 'toolbar-sm-flex-wrap')).toBe(false)
  })
})

// ── Gate completeness ─────────────────────────────────────────────────────────

describe('gate completeness', () => {
  it('checksRan === 11 on a clean root (all 11 checks executed)', () => {
    const root = tmpRoot()
    const { checksRan } = gate(root)
    expect(checksRan).toBe(11)
  })

  it('returns 0 violations on a clean root with valid messages', () => {
    const root = tmpRoot()
    const { violations } = gate(root)
    expect(violations).toHaveLength(0)
  })
})
