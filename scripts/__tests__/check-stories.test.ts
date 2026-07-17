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

function writeModule(root: string, relPath: string, content: string): void {
  const abs = join(root, 'src', 'modules', relPath)
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

describe('Check 3: Locale-NAME export families', () => {
  it('BAD — export const MyUkrainianStory triggers locale-name-export', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const MyUkrainianStory = {}`)
    expect(hasRule(gate(root).violations, 'locale-name-export')).toBe(true)
  })

  it('GOOD — export const LocaleStress passes', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const LocaleStress = {}`)
    expect(hasRule(gate(root).violations, 'locale-name-export')).toBe(false)
  })

  it('BAD (p) — UkDialogOpen/SqProof/EnDesktop/AlbanianFull FAIL', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const UkDialogOpen = {}\nexport const SqProof = {}\nexport const EnDesktop = {}\nexport const AlbanianFull = {}`)
    const { violations } = gate(root)
    const localeViolations = violations.filter(v => v.rule === 'locale-name-export')
    expect(localeViolations.length).toBe(4)
  })

  it('GOOD (q) — Items/Enabled/Square/Editable PASS (no It/En/Sq false-positive)', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const Items = {}\nexport const Enabled = {}\nexport const Square = {}\nexport const Editable = {}`)
    expect(hasRule(gate(root).violations, 'locale-name-export')).toBe(false)
  })

  it('BAD — .stories.ts file is scanned', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.ts', `export const UkDialogOpen = {}`)
    expect(hasRule(gate(root).violations, 'locale-name-export')).toBe(true)
  })
})

// ── Check 4: Pinned globals.locale = 'uk' ────────────────────────────────────

describe('Check 4: Hardcoded locale pins (globals + args + props)', () => {
  it("BAD — globals:{locale:'uk'} triggers locale-pin", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { globals: { locale: 'uk' } }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it('GOOD — no locale pin passes', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const Default = { parameters: {} }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(false)
  })

  it("BAD (f) — multiline globals with locale:'uk' FAIL", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = {\n  globals: {\n    viewport: { value: 'mobile320' },\n    locale: 'uk'\n  }\n}`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it("BAD (g) — key-order globals:{ locale:'sq', viewport:… } FAIL", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { globals: { locale: 'sq', viewport: { value: 'mobile320' } } }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it("BAD (h) — each of uk/sq/en/it FAIL", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const A = { args: { locale: 'uk' } }\nexport const B = { args: { locale: 'sq' } }\nexport const C = { args: { locale: 'it' } }\nexport const D = { args: { locale: 'en' } }`)
    const localeViolations = gate(root).violations.filter(v => v.rule === 'locale-pin')
    expect(localeViolations.length).toBe(4)
  })

  it("BAD — args:{ locale:'en' } FAIL (not just non-en)", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { args: { locale: 'en' } }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it('BAD — JSX locale="en" FAIL', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <Component locale="en" /> }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it('GOOD — function parameter default locale = \'en\' PASS (not a pin)', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `function Demo({ locale = 'en' }: { locale?: string }) { return null }\nexport const Default = { render: (_, ctx) => <Demo locale={ctx.globals.locale} /> }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(false)
  })

  it('BAD — multiline JSX locale="en" FAIL (prop on separate line from tag)', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => (\n  <Component\n    locale="en"\n  />\n) }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it('BAD — multiline JSX prop + closing slash on same line: locale="en" />', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => (\n  <Component\n    locale="en" />\n) }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it("BAD — multiline expression prop + closing slash on same line: locale={'uk'} />", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => (\n  <Component\n    locale={'uk'} />\n) }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it("BAD — JSX locale={'uk'} expression prop FAIL", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <Component locale={'uk'} /> }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it("BAD — multiline JSX locale={'it'} expression prop FAIL", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => (\n  <Component\n    locale={'it'}\n  />\n) }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it('GOOD — arrow fn parameter default locale = \'en\' PASS', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `const L = (key: string, locale = 'en') => storyT(locale, key)\nexport const Default = {}`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(false)
  })

  it('GOOD — destructured obj parameter default locale = \'en\' on continuation line PASS', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `function Demo({\n  locale = 'en',\n}: { locale?: string }) { return null }\nexport const Default = {}`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(false)
  })

  it("BAD (i) — args:{ locale:'uk' } FAIL", () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { args: { locale: 'uk' } }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it('BAD (i) — JSX locale="uk" FAIL', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: () => <C locale="uk" /> }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
  })

  it('GOOD (j) — toolbar-reactive locale={ctx.globals.locale} PASS', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { render: (_, ctx) => <C locale={ctx.globals.locale ?? 'en'} /> }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(false)
  })

  it('GOOD (j) — viewport-only pin PASS', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { globals: { viewport: { value: 'mobile320' } } }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(false)
  })

  it('GOOD (o) — a single pin yields exactly ONE violation (no double-count)', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx',
      `export const Default = { globals: { locale: 'uk' } }`)
    const localeViolations = gate(root).violations.filter(v => v.rule === 'locale-pin')
    expect(localeViolations.length).toBe(1)
  })

  it('BAD — .stories.ts file is scanned', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.ts', `export const Default = { args: { locale: 'uk' } }`)
    expect(hasRule(gate(root).violations, 'locale-pin')).toBe(true)
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

// ── Check 9 exclusion boundary (Task 612 / Task 614) ──────────────────────────
//
// Task 612 widened `isNonRuntimeFile` to also exclude `.test.tsx` and `__tests__/**`
// files (previously only `.stories.tsx` was excluded), because a vitest RTL assertion
// like `getByRole('button', { name: 'Next' })` matches the same regex as a genuine
// hardcoded `Next` string in JSX — a false positive, not real runtime UI copy.
//
// Same literal content used in all three fixtures below so the ONLY variable is the
// file path — the cleanest possible proof the exclusion keys on the filename alone.
const CHECK9_BOUNDARY_CONTENT = `export const Prev = () => {
  const btn = screen.getByRole('button', { name: 'Next' })
  return <button>Previous</button>
}`

describe('Check 9 exclusion boundary (Task 612 test-file exclusion)', () => {
  it('GOOD — src/components/**/*.test.tsx is excluded (no runtime-hardcode)', () => {
    const root = tmpRoot()
    writeComponent(root, 'Pagination.test.tsx', CHECK9_BOUNDARY_CONTENT)
    expect(hasRule(gate(root).violations, 'runtime-hardcode')).toBe(false)
  })

  it('GOOD — src/modules/**/__tests__/*.tsx is excluded (no runtime-hardcode)', () => {
    const root = tmpRoot()
    writeModule(root, join('__tests__', 'Pagination.tsx'), CHECK9_BOUNDARY_CONTENT)
    expect(hasRule(gate(root).violations, 'runtime-hardcode')).toBe(false)
  })

  it('BAD (blind-spot guard) — real non-test src/modules/**/*.tsx with the SAME literal is still caught', () => {
    const root = tmpRoot()
    writeModule(root, 'Pagination.tsx', CHECK9_BOUNDARY_CONTENT)
    expect(hasRule(gate(root).violations, 'runtime-hardcode')).toBe(true)
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

// ── Check 12: Viewport/width-named exports ──────────────────────────────────

describe('Check 12: Viewport/width-named exports (identifier-token)', () => {
  it('BAD (a) — export const FooMobile320 FAIL', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const FooMobile320 = {}`)
    expect(hasRule(gate(root).violations, 'viewport-width-export')).toBe(true)
  })

  it('BAD (b) — bare Tablet/Desktop/HugeDesktop FAIL', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const Tablet = {}\nexport const Desktop = {}\nexport const HugeDesktop = {}`)
    const vpV = gate(root).violations.filter(v => v.rule === 'viewport-width-export')
    expect(vpV.length).toBe(3)
  })

  it('BAD (c) — prefix/infix TabletStack/MobileStack FAIL', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const TabletStack = {}\nexport const MobileStack = {}`)
    const vpV = gate(root).violations.filter(v => v.rule === 'viewport-width-export')
    expect(vpV.length).toBe(2)
  })

  it('GOOD (d) — allowlisted real modes PASS', () => {
    const root = tmpRoot()
    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'story-realmode-allowlist.json'), JSON.stringify([
      { file: 'src/Test.stories.tsx', export: 'MobileBottomSheet', check: 12, reason: 'test' },
      { file: 'src/Test.stories.tsx', export: 'MobileDrawerOpen', check: 12, reason: 'test' },
    ]))
    writeStory(root, 'Test.stories.tsx', `export const MobileBottomSheet = {}\nexport const MobileDrawerOpen = {}`)
    expect(hasRule(gate(root).violations, 'viewport-width-export')).toBe(false)
  })

  it('BAD (e) — non-allowlisted SheetOpenMobile FAIL', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const SheetOpenMobile = {}`)
    expect(hasRule(gate(root).violations, 'viewport-width-export')).toBe(true)
  })

  it('GOOD (l) — WorldwideResults PASS (no Wide false-positive)', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const WorldwideResults = {}`)
    expect(hasRule(gate(root).violations, 'viewport-width-export')).toBe(false)
  })

  it('GOOD (m) — file-scoped: MobileScroll in allowlisted file PASS, same name in different file FAIL', () => {
    const root = tmpRoot()
    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'story-realmode-allowlist.json'), JSON.stringify([
      { file: 'src/AllowedFile.stories.tsx', export: 'MobileScroll', check: 12, reason: 'test' },
    ]))
    writeStory(root, 'AllowedFile.stories.tsx', `export const MobileScroll = {}`)
    writeStory(root, 'OtherFile.stories.tsx', `export const MobileScroll = {}`)
    const vpV = gate(root).violations.filter(v => v.rule === 'viewport-width-export')
    expect(vpV.length).toBe(1)
    expect(vpV[0].file).toContain('OtherFile')
  })

  it('BAD (n) — stale allowlist entry for non-existent file FAIL', () => {
    const root = tmpRoot()
    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'story-realmode-allowlist.json'), JSON.stringify([
      { file: 'src/NonExistent.stories.tsx', export: 'MobileScroll', check: 12, reason: 'test' },
    ]))
    expect(hasRule(gate(root).violations, 'stale-allowlist-entry')).toBe(true)
  })

  it('BAD (k) — .stories.ts file is scanned', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.ts', `export const FooMobile320 = {}`)
    expect(hasRule(gate(root).violations, 'viewport-width-export')).toBe(true)
  })
})

// ── Check 13: Duplicate-family export names ──────────────────────────────────

describe('Check 13: Duplicate-family export names (Proof/Demo/Filtered/Canonical)', () => {
  it('BAD (r) — ProofRow/DemoState/Canonical320/FilteredDraft FAIL', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.tsx', `export const ProofRow = {}\nexport const DemoState = {}\nexport const Canonical320 = {}\nexport const FilteredDraft = {}`)
    const famV = gate(root).violations.filter(v => v.rule === 'duplicate-family-export')
    expect(famV.length).toBe(4)
  })

  it('GOOD (s) — allowlisted FilteredPending PASS', () => {
    const root = tmpRoot()
    mkdirSync(join(root, 'scripts'), { recursive: true })
    mkdirSync(join(root, 'src', 'components', 'admin'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'story-realmode-allowlist.json'), JSON.stringify([
      { file: 'src/components/admin/AdminListingsTable.stories.tsx', export: 'FilteredPending', check: 13, reason: 'test' },
    ]))
    writeStory(root, 'components/admin/AdminListingsTable.stories.tsx', `export const FilteredPending = {}`)
    expect(hasRule(gate(root).violations, 'duplicate-family-export')).toBe(false)
  })

  it('BAD (t) — same Filtered* name in a different file FAIL', () => {
    const root = tmpRoot()
    mkdirSync(join(root, 'scripts'), { recursive: true })
    mkdirSync(join(root, 'src', 'components', 'admin'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'story-realmode-allowlist.json'), JSON.stringify([
      { file: 'src/components/admin/AdminListingsTable.stories.tsx', export: 'FilteredPending', check: 13, reason: 'test' },
    ]))
    writeStory(root, 'components/admin/AdminListingsTable.stories.tsx', `export const FilteredPending = {}`)
    writeStory(root, 'OtherFile.stories.tsx', `export const FilteredPending = {}`)
    const famV = gate(root).violations.filter(v => v.rule === 'duplicate-family-export')
    expect(famV.length).toBe(1)
    expect(famV[0].file).toContain('OtherFile')
  })

  it('BAD — .stories.ts file is scanned', () => {
    const root = tmpRoot()
    writeStory(root, 'Test.stories.ts', `export const ProofRow = {}`)
    expect(hasRule(gate(root).violations, 'duplicate-family-export')).toBe(true)
  })
})

// ── Gate completeness ─────────────────────────────────────────────────────────

describe('gate completeness', () => {
  // Tracks the real number of checks `runGate` runs (check-stories.mjs:872, hardcoded
  // `checksRan: 14`). Was 13 pre-Task-520 (Check 14, Mantine Button off-scale size, added
  // a 14th check without updating this assertion — stale drift, reconciled by Task 614).
  // Bump this deliberately whenever a new Check N is added to the gate.
  it('checksRan === 14 on a clean root (all 14 checks executed)', () => {
    const root = tmpRoot()
    const { checksRan } = gate(root)
    expect(checksRan).toBe(14)
  })

  it('returns 0 violations on a clean root with valid messages', () => {
    const root = tmpRoot()
    const { violations } = gate(root)
    expect(violations).toHaveLength(0)
  })
})
