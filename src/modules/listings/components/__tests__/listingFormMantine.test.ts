// @vitest-environment node
/**
 * Task 957 (AC15, owner rule 2026-11-19): the listing form and the photo widget are on canonical Mantine.
 * The three components and the two pages import nothing from the legacy `@/components/ui` and carry no `className`; the unused legacy `steps/StepPhotos.tsx` is deleted; the three
 * components are enrolled in `scripts/mantine-migration-scope.json`. Revision 1 (Review 1 F2): they also carry no local visual decision (`style=`, `var(--mantine-`, a
 * "<n>px solid|dashed" literal, `radius`, `bdrs`, `bd`, `bg`) and give no heading its own `fw` or `fz` literal (a heading takes the shared `fz={TITLE_FZ.…}` scale, because `npm run check:type-responsive` refuses a `Title` with a static size); the form title and subtitle are `MantinePageHeaderWithActions`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'
import { theme as appTheme } from '@/design-system/mantine/theme'

const ROOT = process.cwd()
const FILES = [
  'src/modules/listings/components/ImageUpload.tsx',
  'src/modules/listings/components/ListingFormShell.tsx',
  'src/modules/listings/components/ListingFormShellView.tsx',
  'src/app/[locale]/listings/create/page.tsx',
  'src/app/[locale]/listings/[slug]/edit/page.tsx',
]
const read = (file: string) => readFileSync(path.join(ROOT, file), 'utf8')

/** The opening tags `<Name ...>` of a component in a source text; braces and quotes inside the attributes are skipped, so an arrow function's `>` does not end a tag. */
function openingTags(text: string, name: string): string[] {
  const tags: string[] = []
  const start = new RegExp(`<${name}(?=[\\s/>])`, 'g')
  for (let match = start.exec(text); match; match = start.exec(text)) {
    let depth = 0
    let quote = ''
    let end = match.index
    for (; end < text.length; end++) {
      const ch = text[end]
      if (quote) { if (ch === quote) quote = ''; continue }
      if (ch === '"' || ch === "'" || ch === '`') quote = ch
      else if (ch === '{') depth++
      else if (ch === '}') depth--
      else if (ch === '>' && depth === 0) break
    }
    tags.push(text.slice(match.index, end + 1))
  }
  return tags
}

/** A local visual decision of Review 1 F2 (`ui-token-contract.md`, "Forbidden local visual decisions"): a prop or literal that picks a look in a consumer. */
const LOCAL_VISUAL = [
  ['a style= prop', /\bstyle=/],
  ['a var(--mantine- literal', /var\(--mantine-/],
  ['a "<n>px solid|dashed" literal', /\d+(\.\d+)?px\s+(solid|dashed)/],
  ['a radius, bdrs, bd or bg prop', /\b(radius|bdrs|bd|bg)=/],
] as const

/** A heading's own `fw`, or an `fz` that is not the shared `TITLE_FZ` scale (`typography.ts`), which `check:type-responsive` asks for in place of a static size. */
const HEADING_LITERAL = /\bfw=|\bfz=(?!\{TITLE_FZ\.)/

describe('the local-visual-decision scan sees what it must refuse (the checks below are not vacuous)', () => {
  it('[AC15] finds a heading tag with its own fz or fw literal, also when an arrow function sits in another attribute; the shared TITLE_FZ scale is no finding', () => {
    const planted = '<Stack><Title order={1} onClick={() => go()} fz="xl" fw={700}>x</Title><Text fz="sm">y</Text><Title order={2} size="h4" fz={TITLE_FZ.h4}>z</Title><Title order={3} fz={36}>w</Title></Stack>'
    expect(openingTags(planted, 'Title')).toEqual(['<Title order={1} onClick={() => go()} fz="xl" fw={700}>', '<Title order={2} size="h4" fz={TITLE_FZ.h4}>', '<Title order={3} fz={36}>'])
    expect(openingTags(planted, 'Title').filter((tag) => HEADING_LITERAL.test(tag))).toHaveLength(2)
  })

  it.each([
    ['style={{ flexShrink: 0 }}', 0],
    ['color="var(--mantine-color-green-6)"', 1],
    ['bd="2px dashed x"', 2],
    ['radius="xl"', 3],
    ['bg="gray.0"', 3],
  ] as const)('[AC15] flags %s', (planted, index) => {
    expect(LOCAL_VISUAL[index][1].test(`<Box ${planted} />`)).toBe(true)
  })
})

describe('the listing form is on Mantine', () => {
  it.each(FILES)('[AC15] %s carries no local visual decision (style=, var(--mantine-, "<n>px solid|dashed", radius, bdrs, bd, bg)', (file) => {
    const text = read(file)
    for (const [label, pattern] of LOCAL_VISUAL) expect(text, `${file}: ${label}`).not.toMatch(pattern)
  })

  it.each(FILES)('[AC15] %s gives no heading its own fw or fz literal (the canonical header, the theme and the TITLE_FZ scale own them)', (file) => {
    for (const tag of openingTags(read(file), 'Title')) expect(tag, `${file}: ${tag}`).not.toMatch(HEADING_LITERAL)
  })

  it('[AC15] the form title and subtitle go through MantinePageHeaderWithActions, not a page-local Title and Text', () => {
    const view = read('src/modules/listings/components/ListingFormShellView.tsx')
    expect(view).toMatch(/<MantinePageHeaderWithActions\b[^>]*title=/)
    expect(view).toMatch(/subtitle=\{t\('create_listing_subtitle'\)\}/)
    expect(openingTags(view, 'Title')).toEqual([])
  })

  it('[AC15] the saved screen heads its message with a Title and shows the success icon through the shared success colour', () => {
    const shell = read('src/modules/listings/components/ListingFormShell.tsx')
    const titles = openingTags(shell, 'Title')
    expect(titles.length).toBeGreaterThanOrEqual(1)
    for (const tag of titles) expect(tag, 'a responsive size, as check:type-responsive requires').toMatch(/fz=\{TITLE_FZ\.h[2-4]\}/)
    expect(shell).toMatch(/VARIANT_COLORS\.success/)
  })

  it.each(FILES)('[AC15] %s imports nothing from @/components/ui and has no className', (file) => {
    const text = read(file)
    expect(text).not.toMatch(/from ['"]@\/components\/ui\//)
    expect(text).not.toMatch(/\bclassName\b/)
  })

  it.each(FILES)('[AC15] %s names no public upload preset and no upload folder prop', (file) => {
    const text = read(file)
    expect(text).not.toContain('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET')
    expect(text).not.toMatch(/\buploadFolder\b|\buploadPreset\s*=|\buploadPreset\?:/)
  })

  it('[AC15] steps/StepPhotos.tsx, which no file imports, is deleted', () => {
    expect(existsSync(path.join(ROOT, 'src/modules/listings/components/steps/StepPhotos.tsx'))).toBe(false)
  })

  it('[AC15] the three components are enrolled in the Mantine migration scope', () => {
    const scope = readFileSync(path.join(ROOT, 'scripts/mantine-migration-scope.json'), 'utf8')
    for (const file of FILES.slice(0, 3)) expect(scope, file).toContain(file)
  })

  it('[AC15] the photo widget passes the listing id, not a preset or a folder, through the prop chain', () => {
    for (const file of ['ImageUpload.tsx', 'ListingFormShell.tsx', 'ListingFormShellView.tsx', 'ListingFormLoader.tsx']) {
      expect(read(`src/modules/listings/components/${file}`), file).toMatch(/listingId/)
    }
  })
})

// ── Task 957 Revision 2 (AC18, AC24; Review 2 F8, F13) ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const FORM_DIR = 'src/modules/listings/components/form'
const FIELD_FILES = [
  'DynamicFieldSection', 'NumInputField', 'AreaPairField', 'BuildingFloorsField', 'FloorGroupField', 'RoomsSelectorField', 'ButtonGroupField', 'EnumSelectorField', 'MultiToggleField', 'YearComboboxField', 'ParkingField',
].map((name) => `${FORM_DIR}/${name}.tsx`)
const CHILD_FILES = [...FIELD_FILES, 'src/components/admin/AdminEditLayout.tsx']
const VIEW = 'src/modules/listings/components/ListingFormShellView.tsx'
const UPLOAD = 'src/modules/listings/components/ImageUpload.tsx'

describe('the form children are on Mantine (Revision 2, AC18)', () => {
  it.each(CHILD_FILES)('[AC18] %s imports nothing from @/components/ui, has no className, no cn, no local visual decision', (file) => {
    const text = read(file)
    expect(text).not.toMatch(/from ['"]@\/components\/ui\//)
    expect(text).not.toMatch(/\bclassName\b/)
    expect(text).not.toMatch(/\bcn\(/)
    for (const [label, pattern] of LOCAL_VISUAL) expect(text, `${file}: ${label}`).not.toMatch(pattern)
  })

  it('[AC18] every file of form/ has no className, no @/components/ui and no style=', () => {
    const files = readdirSync(path.join(ROOT, FORM_DIR)).filter((f) => /\.tsx?$/.test(f) && !f.includes('.stories.'))
    expect(files.length).toBeGreaterThanOrEqual(10)
    for (const file of files) {
      const text = read(`${FORM_DIR}/${file}`)
      expect(text, file).not.toMatch(/className=|@\/components\/ui\/|style=/)
    }
  })

  it('[AC18] the form children, the number input they share, their two shared owners and the delete icon action are enrolled in the Mantine migration scope', () => {
    const scope = readFileSync(path.join(ROOT, 'scripts/mantine-migration-scope.json'), 'utf8')
    for (const file of [...CHILD_FILES, `${FORM_DIR}/NumberTextInput.tsx`, 'src/components/shared/FilterChoiceGroup.tsx', 'src/components/shared/YearCombobox.tsx', 'src/design-system/mantine/patterns/MantineDeleteIconButton.tsx']) expect(scope, file).toContain(file)
  })

  it('[AC18] the rendered-scope allowlist is empty again', () => {
    expect(JSON.parse(read('scripts/rendered-scope-allowlist.json'))).toEqual([])
  })

  it('[AC18] the dead steps/ directory and the legacy NumInputField Story are deleted', () => {
    expect(existsSync(path.join(ROOT, 'src/modules/listings/components/steps'))).toBe(false)
    expect(existsSync(path.join(ROOT, `${FORM_DIR}/NumInputField.stories.tsx`))).toBe(false)
  })

  it('[AC18] the fields take one column on a phone and the Task 905 columns from 640px (Review 2 F15)', () => {
    expect(read(`${FORM_DIR}/DynamicFieldSection.tsx`)).toMatch(/SimpleGrid[^>]*cols=\{\{ base: 1, sm: 3 \}\}/)
    for (const file of ['AreaPairField', 'FloorGroupField']) expect(read(`${FORM_DIR}/${file}.tsx`), file).toMatch(/SimpleGrid[^>]*cols=\{\{ base: 1, sm: 2 \}\}/)
    for (const file of FIELD_FILES) expect(read(file), file).not.toMatch(/cols=\{2\}|base: 2/)
  })
})

describe('one meaning, one look in the form (Revision 2, AC24)', () => {
  it.each([VIEW, UPLOAD])('[AC24] %s has no Text with fz, fw, c or ta, and no Alert with ta', (file) => {
    const text = read(file)
    for (const tag of openingTags(text, 'Text')) expect(tag, `${file}: ${tag}`).not.toMatch(/\b(fz|fw|c|ta)=/)
    for (const tag of openingTags(text, 'Alert')) expect(tag, `${file}: ${tag}`).not.toMatch(/\bta=/)
  })

  it.each([VIEW, UPLOAD])('[AC24] %s wraps no control in an mt="xs" box and picks no Button variant by a comparison', (file) => {
    const text = read(file)
    expect(text).not.toMatch(/\bmt="xs"/)
    expect(text).not.toMatch(/\? 'filled' :/)
    for (const tag of openingTags(text, 'Button')) expect(tag, `${file}: ${tag}`).not.toMatch(/variant=\{[^}]*\?/)
  })

  // Task 957 Revision 8 (R8-3, AC47; Review 8 F45): a Mantine Button of `size="lg"` also sets an 18px font; the theme's canonical Button is `sm` (14px text, 44px high), so a Button of the form takes it by passing no size
  it.each([VIEW, UPLOAD])('[AC47] %s: no Button passes size=, so each takes the theme\'s canonical size', (file) => {
    const tags = openingTags(read(file), 'Button')
    expect(tags.length, `${file}: its Buttons`).toBeGreaterThan(0)
    // the Button's own attributes only: the `size=` of an icon inside `leftSection={<Camera size={…} />}` is the icon's, not the Button's
    const ownAttributes = (tag: string) => { let depth = 0; let out = ''; for (const ch of tag) { if (ch === '{') depth++; else if (ch === '}') depth--; else if (depth === 0) out += ch } return out }
    for (const tag of tags) expect(ownAttributes(tag), `${file}: ${tag}`).not.toMatch(/\bsize=/)
  })

  it('[AC24] the listing type and the currency, single choices like the fields, render FilterChoiceGroup', () => {
    const view = read(VIEW)
    expect(view).toMatch(/import \{ FilterChoiceGroup \} from '@\/components\/shared\/FilterChoiceGroup'/)
    expect(openingTags(view, 'FilterChoiceGroup').length).toBeGreaterThanOrEqual(2)
    expect(view).not.toMatch(/Button\.Group/)
  })

  it('[AC24] the sidebar card takes the section card owner, not a copy of its padding', () => {
    const view = read(VIEW)
    expect(view).not.toMatch(/<Paper\b/)
    expect(view).not.toMatch(/p=\{\{ base: 'lg', sm: 'xl' \}\}/)
  })

  it('[AC24] the counters and the photo hints use one canonical helper-text owner, not a local dimmed Text', () => {
    for (const file of [VIEW, UPLOAD]) expect(read(file), file).not.toMatch(/c="dimmed"/)
  })

  it('[AC24] one canonical delete icon action owns the delete look; its three consumers use it and keep no red ActionIcon', () => {
    const owner = 'src/design-system/mantine/patterns/MantineDeleteIconButton.tsx'
    expect(existsSync(path.join(ROOT, owner))).toBe(true)
    for (const file of [UPLOAD, 'src/components/admin/AdminPagesView.tsx', 'src/modules/listings/components/CollectionsSection.tsx']) {
      const text = read(file)
      expect(text, file).toMatch(/MantineDeleteIconButton/)
      for (const tag of openingTags(text, 'ActionIcon')) expect(tag, `${file}: ${tag}`).not.toMatch(/color="red"/)
    }
    expect(existsSync(path.join(ROOT, 'src/stories/patterns/mantine/DeleteIconButton.stories.tsx'))).toBe(true)
  })

  it('[AC24] StatusChangeSelect has a documented label prop and a labelled note', () => {
    const text = read('src/components/admin/StatusChangeSelect.tsx')
    expect(text).toMatch(/label\?: string/)
    expect(text).toMatch(/status_change_note_label/)
  })
})

// ── Task 957 Revision 3 (AC28, AC30, AC31, AC35; Review 3 F17, F20, F21, F22, F26) ──────────────────────────────────────────────────────────────────────────────────────────────────

const STORY_DIR = 'src/stories/patterns/mantine'
// every Story file of this task that shows page content (`skipCanvas`: the default canvas gutter is dropped)
const GUTTER_STORY_FILES = ['ImageUpload', 'ListingFormShellView', 'AdminEditLayout', 'ListingFormShellContainer', 'ListingFormFields', 'DeleteIconButton'].map((name) => `${STORY_DIR}/${name}.stories.tsx`)

/** The exports of a Story file with their source: `export const Name ...` up to the next blank line (a Story export has none inside; a helper after it starts after one). */
function storyExports(text: string): Array<{ name: string; body: string }> {
  return [...text.matchAll(/^export const (\w+)[\s\S]*?(?=\n\n|\n*(?![\s\S]))/gm)].map((match) => ({ name: match[1]!, body: match[0] }))
}

describe('every Story of this task keeps the GR-3d gutter (Revision 3, AC28, F17)', () => {
  it.each(GUTTER_STORY_FILES)('[AC28] %s wraps every export in StoryPageGutter, or names the GR-3d exception that applies with its path:line', (file) => {
    const text = read(file)
    const exception = /GR-3d:\s*n\/a:\s*(?:own gutter \(([^):]+):(\d+)\)|overlay-only)/.exec(text)
    if (exception) {
      // an exception names a gutter that exists: the file has that line, and the Story adds no gutter of its own on top of it
      if (exception[1]) expect(read(exception[1]).split('\n').length, `${file}: ${exception[1]}:${exception[2]}`).toBeGreaterThanOrEqual(Number(exception[2]))
      expect(text, `${file}: a Story with its own gutter adds none`).not.toMatch(/<StoryPageGutter|MantineStoryShell/)
      return
    }
    expect(text, `${file} imports the gutter`).toMatch(/import \{ StoryPageGutter \} from '@\/stories\/_StoryPageGutter'/)
    const exports = storyExports(text).filter(({ name }) => name !== 'default')
    expect(exports.length, `${file} has exports`).toBeGreaterThan(0)
    // a local component of the file (a Demo or a Section) that renders the gutter counts for the exports that render it
    const components = [...text.matchAll(/^function (\w+)\([\s\S]*?^}/gm)].map((match) => ({ name: match[1]!, body: match[0] }))
    const wrapping: string[] = []
    for (let changed = true; changed;) {
      changed = false
      for (const { name, body } of components) {
        if (wrapping.includes(name)) continue
        if (body.includes('<StoryPageGutter>') || wrapping.some((inner) => new RegExp(`<${inner}[\\s/>]`).test(body))) { wrapping.push(name); changed = true }
      }
    }
    for (const { name, body } of exports) {
      const wrapped = body.includes('<StoryPageGutter>') || wrapping.some((component) => new RegExp(`<${component}[\\s/>]`).test(body))
      expect(wrapped, `${file} ${name} is wrapped`).toBe(true)
    }
  })

  it('[AC28] the four Story files of Review 3 F17 are covered by the list above', () => {
    for (const name of ['ImageUpload', 'ListingFormShellView', 'AdminEditLayout', 'ListingFormShellContainer']) expect(GUTTER_STORY_FILES).toContain(`${STORY_DIR}/${name}.stories.tsx`)
  })

  it('[AC28] the exception check is not vacuous: an own-gutter comment with a line past the end of its file is refused', () => {
    const bogus = 'GR-3d: n/a: own gutter (src/modules/listings/components/ListingFormShellView.tsx:99999)'
    const match = /GR-3d:\s*n\/a:\s*(?:own gutter \(([^):]+):(\d+)\)|overlay-only)/.exec(bogus)!
    expect(read(match[1]!).split('\n').length).toBeLessThan(Number(match[2]))
  })
})

describe('the photo fixtures are photographs (Revision 3, AC30, F20)', () => {
  it('[AC30] listingPhotos.fixture.ts has no SVG data URI, and every photo URL is one of the listing card fixture photographs', async () => {
    expect(read('src/stories/fixtures/listingPhotos.fixture.ts')).not.toContain('data:image/svg')
    const { fixturePhotos } = await import('@/stories/fixtures/listingPhotos.fixture')
    const { CARD_FIXTURE_IMAGE_URLS } = await import('@/stories/fixtures/cardListingData.fixture')
    expect(CARD_FIXTURE_IMAGE_URLS.length).toBeGreaterThanOrEqual(4)
    const photos = fixturePhotos(20)
    expect(photos).toHaveLength(20)
    for (const photo of photos) expect(CARD_FIXTURE_IMAGE_URLS, photo.url).toContain(photo.url)
    expect(new Set(photos.map((p) => p.public_id)).size).toBe(20)
    expect(photos.filter((p) => p.is_cover).map((p) => p.public_id)).toEqual([photos[0]!.public_id])
    expect(photos.map((p) => p.order)).toEqual(Array.from({ length: 20 }, (_, i) => i))
  })
})

describe('the photo tile keeps main\'s cover border through its canonical owner (Revision 3, AC31, F22)', () => {
  it('[AC31] ImageUpload.tsx has no bd= and no style=, and the cover tile takes the Card theme variant "selected"', () => {
    const text = read(UPLOAD)
    expect(text).not.toMatch(/\bbd=|\bstyle=/)
    expect(text).toMatch(/variant=\{img\.is_cover \? 'selected' : undefined\}/)
  })

  it('[AC31] the "selected" Card variant is defined in the theme with its own border-width token', () => {
    const theme = read('src/design-system/mantine/theme.ts')
    expect(theme).toMatch(/props\.variant === 'selected'/)
    expect(theme).toMatch(/selectedCard/)
  })
})

describe('the Story set (Revision 3, AC35, F26)', () => {
  it('[AC35] no script or source names the removed or renamed Story ids', () => {
    const ids = ['deleteiconbutton--clickable', 'imageupload--disabled']
    const roots = ['scripts', 'src']
    const hits: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`
        if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(rel); continue }
        if (!/\.(m?[jt]sx?|json)$/.test(entry.name) || rel === 'src/modules/listings/components/__tests__/listingFormMantine.test.ts') continue
        const text = read(rel).toLowerCase()
        for (const id of ids) if (text.includes(id)) hits.push(`${rel}: ${id}`)
      }
    }
    for (const root of roots) walk(root)
    expect(hits).toEqual([])
  })

  it('[AC35] ImageUpload has the Story "Saving" with a description and no "Disabled"; DeleteIconButton has "OnPhoto" and no "Clickable" and no click counter', () => {
    const upload = read(`${STORY_DIR}/ImageUpload.stories.tsx`)
    expect(upload).toMatch(/export const Saving: Story/)
    expect(upload).not.toMatch(/export const Disabled\b/)
    const saving = /\/\*\*([^*]|\*(?!\/))*\*\/\s*export const Saving/.exec(upload)
    expect(saving, 'a description comment above Saving').not.toBeNull()
    const del = read(`${STORY_DIR}/DeleteIconButton.stories.tsx`)
    expect(del).toMatch(/export const OnPhoto: Story/)
    expect(del).not.toMatch(/export const Clickable\b|delete-clicks|setClicks/)
  })
})

// Task 957 Revision 9 (R9-1, AC48; Review 9 F46): the number fields are Mantine `NumberInput`s; they take the canonical field look of `TextInput` through the theme and `input-chrome.css`, adding no value
describe('the number fields have the canonical field look (Revision 9, AC48, F46)', () => {
  const components = appTheme.components as Record<string, { defaultProps?: unknown; styles?: { input?: unknown } } | undefined>

  it('[AC48] theme.components.NumberInput has the same defaultProps and styles.input as theme.components.TextInput', () => {
    const text = components.TextInput
    const number = components.NumberInput
    expect(text?.defaultProps, 'TextInput has defaultProps').toBeDefined()
    expect(number, 'a NumberInput entry').toBeDefined()
    expect(number?.defaultProps).toEqual(text?.defaultProps)
    expect(number?.styles?.input).toEqual(text?.styles?.input)
  })

  // every rule of input-chrome.css that styles the TextInput field (resting, placeholder, focus, error, padding, disabled root and field) also names the matching NumberInput selector.
  // Left out on purpose: the RangeDatePicker button trigger (`[type='button']`, not a field), the end padding (the controls are a permanent right section, Mantine reserves it), `-section` (the rich-text link editor)
  it('[AC48] every TextInput field rule of input-chrome.css also holds the matching NumberInput selector', () => {
    const css = readFileSync(path.join(ROOT, 'src/design-system/mantine/input-chrome.css'), 'utf8')
    const checked: string[] = []
    const missing: string[] = []
    postcss.parse(css).walkRules((rule) => {
      for (const selector of rule.selectors) {
        if (!/\.mantine-TextInput-(input|root)/.test(selector)) continue
        if (selector.includes("[type='button']") || selector.includes('data-with-right-section')) continue
        let wanted = selector.replaceAll('TextInput', 'NumberInput')
        // Task 957 Revision 10 (R10-1, AC51; Review 10 F49): a NumberInput also holds its step controls, and Mantine disables the down control at the lower bound, so its root fades only for a disabled FIELD:
        // the root rule's `:has(...)` names `.mantine-NumberInput-input`, never a bare `:disabled` / `[data-disabled]`
        if (wanted.includes('-root:has(')) wanted = wanted.replace(':has(:disabled)', ':has(.mantine-NumberInput-input:disabled)').replace(':has([data-disabled])', ':has(.mantine-NumberInput-input[data-disabled])')
        checked.push(wanted)
        if (!rule.selectors.includes(wanted)) missing.push(`${selector}  →  ${wanted}`)
      }
    })
    expect(checked.length, 'the TextInput selectors were found').toBeGreaterThanOrEqual(11)
    expect(missing).toEqual([])
  })

  it('[AC48] the blocks named by the review hold the NumberInput selectors: resting, placeholder, focus, error, start padding, disabled root and field', () => {
    const css = readFileSync(path.join(ROOT, 'src/design-system/mantine/input-chrome.css'), 'utf8')
    const lists = new Set<string>()
    postcss.parse(css).walkRules((rule) => { for (const selector of rule.selectors) lists.add(selector) })
    for (const selector of [
      '.mantine-NumberInput-input',
      '.mantine-NumberInput-input::placeholder',
      '.mantine-NumberInput-input:focus',
      '.mantine-NumberInput-input[data-error]',
      '.mantine-NumberInput-input[data-error]:focus',
      '.mantine-NumberInput-wrapper:not([data-with-left-section]) .mantine-NumberInput-input',
      '.mantine-NumberInput-root:has(.mantine-NumberInput-input:disabled)',
      '.mantine-NumberInput-root:has(.mantine-NumberInput-input[data-disabled])',
      '.mantine-NumberInput-input:disabled',
      '.mantine-NumberInput-input[data-disabled]',
    ]) expect(lists.has(selector), selector).toBe(true)
  })

  it('[AC51] no NumberInput root selector holds a bare :disabled or [data-disabled] (a disabled step control must not fade the field)', () => {
    const css = readFileSync(path.join(ROOT, 'src/design-system/mantine/input-chrome.css'), 'utf8')
    const bare: string[] = []
    postcss.parse(css).walkRules((rule) => {
      for (const selector of rule.selectors) if (selector.includes('.mantine-NumberInput-root') && /:has\((:disabled|\[data-disabled\])\)/.test(selector)) bare.push(selector)
    })
    expect(bare).toEqual([])
  })

  // Task 957 Revision 10 (R10-2, AC52; Review 10 F50, owner decision O957-22 "one variable for all"): Mantine sizes a field, its sections and the number controls from `--input-height`, which `Input` sets inline on every
  // field's wrapper from the size (36px for `sm`). One theme `Input` entry sets it to the touch-target token for every field, so no field entry carries a height of its own (a stylesheet cannot set it: the variable is inline),
  // and the stylesheet gives the number controls the field's border and text colours.
  it('[AC52] theme.components.Input.vars gives the wrapper --input-height equal to theme.other.touchTarget', () => {
    const input = components.Input as { vars?: (theme: unknown, props: unknown, ctx: unknown) => Record<string, Record<string, string>> } | undefined
    expect(typeof input?.vars, 'a vars function').toBe('function')
    expect(appTheme.other, 'the theme has other').toBeDefined()
    const other = appTheme.other!
    expect(input!.vars!(appTheme, {}, {}).wrapper?.['--input-height']).toBe(other.touchTarget)
    expect(other.touchTarget, 'the token is the 44px').toBe('2.75rem')
  })

  it('[AC52] no field entry (TextInput, NumberInput, PasswordInput, Select, FileInput) holds an input minHeight or an --input-height of its own', () => {
    for (const name of ['TextInput', 'NumberInput', 'PasswordInput', 'Select', 'FileInput']) {
      const entry = components[name] as { styles?: unknown; vars?: unknown } | undefined
      const styles = typeof entry?.styles === 'function' ? (entry.styles as (theme: unknown) => { input?: Record<string, unknown> })(appTheme) : (entry?.styles as { input?: Record<string, unknown> } | undefined)
      expect(styles?.input && 'minHeight' in styles.input, `${name}: styles.input.minHeight`).toBeFalsy()
      expect(entry?.vars, `${name}: its own vars`).toBeUndefined()
    }
  })

  it('[AC52] input-chrome.css gives .mantine-NumberInput-control the field\'s border colour as its divider and the field\'s text colour', () => {
    const css = readFileSync(path.join(ROOT, 'src/design-system/mantine/input-chrome.css'), 'utf8')
    const decls: Record<string, string> = {}
    postcss.parse(css).walkRules((rule) => {
      if (!rule.selectors.includes('.mantine-NumberInput-control')) return
      rule.walkDecls((d) => { decls[d.prop] = d.value })
    })
    expect(decls['border-inline-start-color']).toBe('var(--mantine-color-gray-3)')
    expect(decls.color).toBe('var(--mantine-color-gray-8)')
  })

  it('[AC48] the end padding is left to Mantine: no NumberInput rule sets padding-inline-end', () => {
    const css = readFileSync(path.join(ROOT, 'src/design-system/mantine/input-chrome.css'), 'utf8')
    const hits: string[] = []
    postcss.parse(css).walkRules((rule) => {
      if (!rule.selectors.some((selector) => selector.includes('.mantine-NumberInput-input'))) return
      rule.walkDecls('padding-inline-end', () => { hits.push(rule.selector) })
    })
    expect(hits).toEqual([])
  })
})

// Task 957 Revision 11 (R11-1, AC54; Review 11 F52, owner decision O957-22): the file field (Mantine `FileInput`, the image dialog of the CMS editor) takes the canonical field look: every rule of input-chrome.css that styles
// the NumberInput field also names the matching FileInput selector, adding no value
describe('the file field has the canonical field look (Revision 11, AC54, F52)', () => {
  const css = () => readFileSync(path.join(ROOT, 'src/design-system/mantine/input-chrome.css'), 'utf8')

  it('[AC54] every NumberInput field rule of input-chrome.css also holds the matching FileInput selector (the placeholder is the FileInput placeholder element)', () => {
    const checked: string[] = []
    const missing: string[] = []
    postcss.parse(css()).walkRules((rule) => {
      for (const selector of rule.selectors) {
        // the step controls (`-control`, `-controls`) belong to NumberInput alone; a FileInput has none
        if (!/\.mantine-NumberInput-(input|wrapper|root)/.test(selector) || selector.includes('-control')) continue
        // Mantine renders the FileInput placeholder as an element (`.mantine-FileInput-placeholder`), not as the `::placeholder` pseudo-element of an <input>
        const wanted = selector.endsWith('::placeholder') ? '.mantine-FileInput-placeholder' : selector.replaceAll('NumberInput', 'FileInput')
        checked.push(wanted)
        if (!rule.selectors.includes(wanted)) missing.push(`${selector}  →  ${wanted}`)
      }
    })
    expect(checked.length, 'the NumberInput selectors were found').toBeGreaterThanOrEqual(10)
    expect(missing).toEqual([])
  })

  it('[AC54] the blocks named by the review hold the FileInput selectors: resting, placeholder, focus, error, start padding, disabled root and field', () => {
    const lists = new Set<string>()
    postcss.parse(css()).walkRules((rule) => { for (const selector of rule.selectors) lists.add(selector) })
    for (const selector of [
      '.mantine-FileInput-input',
      '.mantine-FileInput-placeholder',
      '.mantine-FileInput-input:focus',
      '.mantine-FileInput-input[data-error]',
      '.mantine-FileInput-input[data-error]:focus',
      '.mantine-FileInput-wrapper:not([data-with-left-section]) .mantine-FileInput-input',
      '.mantine-FileInput-root:has(.mantine-FileInput-input:disabled)',
      '.mantine-FileInput-root:has(.mantine-FileInput-input[data-disabled])',
      '.mantine-FileInput-input:disabled',
      '.mantine-FileInput-input[data-disabled]',
    ]) expect(lists.has(selector), selector).toBe(true)
  })

  it('[AC54] the FileInput disabled root names the field, never a bare :disabled or [data-disabled]', () => {
    const roots: string[] = []
    const bare: string[] = []
    postcss.parse(css()).walkRules((rule) => {
      for (const selector of rule.selectors) {
        if (!selector.includes('.mantine-FileInput-root')) continue
        roots.push(selector)
        if (/:has\((:disabled|\[data-disabled\])\)/.test(selector)) bare.push(selector)
      }
    })
    expect(roots.length, 'the FileInput root selectors were found').toBeGreaterThanOrEqual(2)
    expect(bare).toEqual([])
  })

  // Task 957 Revision 12 (R12-1, AC55; Review 12 F53): an empty file field has no right section, so it takes the field's 16px end padding like a TextInput; with a file chosen the clear button's section
  // carries `data-with-right-section` on the wrapper and Mantine keeps its reservation (the selector is guarded, as the TextInput one)
  it('[AC55] the end-padding rule that names the TextInput selector also names the FileInput selector guarded on the wrapper\'s data-with-right-section', () => {
    const textSelector = '.mantine-TextInput-wrapper:not([data-with-right-section]) .mantine-TextInput-input'
    const fileSelector = '.mantine-FileInput-wrapper:not([data-with-right-section]) .mantine-FileInput-input'
    const rules: string[][] = []
    postcss.parse(css()).walkRules((rule) => {
      if (!rule.selectors.includes(textSelector)) return
      let sets = false
      rule.walkDecls('padding-inline-end', () => { sets = true })
      if (sets) rules.push(rule.selectors)
    })
    expect(rules.length, 'the TextInput end-padding rule').toBe(1)
    expect(rules[0]).toContain(fileSelector)
  })
})

// Task 957 Revision 9 (R9-3, AC50; Review 9 F48, owner decision O957-21): the description is as on `main`: seven rows, a vertical handle, no autosize (it does not grow by itself)
describe('the description keeps main\'s height and resize handle (Revision 9, AC50, F48)', () => {
  it('[AC50] the description Textarea passes rows={7} and resize="vertical" and no autosize, minRows or maxRows', () => {
    const tags = openingTags(read(VIEW), 'Textarea').filter((tag) => /\bid="description"/.test(tag))
    expect(tags.length, 'the description Textarea').toBe(1)
    expect(tags[0]).toMatch(/\brows=\{7\}/)
    expect(tags[0]).toMatch(/\bresize="vertical"/)
    expect(tags[0]).not.toMatch(/\bautosize\b|\bminRows=|\bmaxRows=/)
  })
})

// Task 957 Revision 9 (R9-2, AC49; Review 9 F47): the pencil beside the delete takes the theme's radius, as the delete icon does (U3: no consumer radius)
describe('the collection row icons share the theme radius (Revision 9, AC49, F47)', () => {
  it('[AC49] no ActionIcon of CollectionsSection passes radius=, and its delete icon passes no touch', () => {
    const text = read('src/modules/listings/components/CollectionsSection.tsx')
    const tags = openingTags(text, 'ActionIcon')
    expect(tags.length, 'the rename pencil').toBeGreaterThan(0)
    for (const tag of tags) expect(tag, tag).not.toMatch(/\bradius=/)
    for (const tag of openingTags(text, 'MantineDeleteIconButton')) expect(tag, tag).not.toMatch(/\btouch\b/)
  })
})
