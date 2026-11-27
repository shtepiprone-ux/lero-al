// @vitest-environment node
/**
 * Task 989 AC5: both footer-related admin forms leave the legacy kit whole (owner rule 2026-11-19, `.claude/rules/shared/canonical-component-reuse.md`), and the
 * settings form no longer offers a key of the Footer page (O989-3: "Site settings - Footer removed"). Read from the source files; the rendered forms are checked by
 * `AdminFooterManager.shared.test.tsx` and the Stories.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FOOTER_SETTING_KEYS, REMOVED_SETTING_KEYS, SETTINGS_FORM_KEYS } from '@/modules/admin/lib/settingKeys'

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')
const FORMS = ['src/components/admin/AdminFooterManager.tsx', 'src/components/admin/AdminSettings.tsx']
const MANIFEST = JSON.parse(read('scripts/mantine-migration-scope.json')) as string[]

describe('Task 989 AC5 — both forms on Mantine', () => {
  it.each(FORMS)('%s imports nothing of @/components/ui, no AdminInput and no shared Combobox', (path) => {
    const text = read(path)
    expect(text).not.toMatch(/from ['"]@\/components\/ui\//)
    expect(text).not.toMatch(/\bAdminInput\b/)
    expect(text).not.toMatch(/@\/components\/shared\/Combobox/)
    expect(text).not.toMatch(/<Combobox\b/)
    expect(text).not.toMatch(/\bclassName=/)
  })

  it.each(FORMS)('%s is enrolled in the Mantine migration scope', (path) => {
    expect(MANIFEST).toContain(path)
  })
})

describe('Task 989 AC5 — the settings form holds no key of the Footer page', () => {
  it('the settings key list has no Footer page key and no removed key', () => {
    for (const key of [...FOOTER_SETTING_KEYS, ...REMOVED_SETTING_KEYS]) expect(SETTINGS_FORM_KEYS).not.toContain(key)
  })

  it('the settings form names no Footer page key and no removed key', () => {
    const text = read('src/components/admin/AdminSettings.tsx')
    for (const key of [...FOOTER_SETTING_KEYS, ...REMOVED_SETTING_KEYS]) {
      expect(text, key).not.toMatch(new RegExp(`['"\`.]${key}['"\`]|\\b${key}\\s*:`))
    }
  })

  it('the settings page passes no Footer page key and no removed key to the form', () => {
    const text = read('src/app/[locale]/admin/settings/page.tsx')
    for (const key of [...FOOTER_SETTING_KEYS, ...REMOVED_SETTING_KEYS]) {
      expect(text, key).not.toMatch(new RegExp(`['"\`]${key}['"\`]|\\b${key}\\s*:`))
    }
  })
})
