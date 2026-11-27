// @vitest-environment node
/**
 * Task 989 AC1: every setting the admin saves reaches the site. Production held `logo_url`, `favicon_url`, `meta_title`, `meta_desc`, `contact_phone` and the
 * social links of the settings form, and nothing outside the admin read them (Task 989 "## Cause"). For each key of the settings form and of the Footer page this
 * test looks for a reader: a source file outside the admin pages, the admin forms, the action files, the key list itself, the Stories and the tests that names the
 * key (a per-language key `<base>_<locale>` may be read as the template `` `<base>_${…}` ``).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FOOTER_SETTING_KEYS, SETTINGS_FORM_KEYS, SITE_LOCALES } from '@/modules/admin/lib/settingKeys'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

/** the places that write or edit a setting, not read it for the site */
const NOT_A_READER = [
  /^src\/app\/\[locale\]\/admin\//,
  /^src\/components\/admin\//,
  /^src\/modules\/admin\/actions\//,
  /^src\/modules\/admin\/lib\/settingKeys\.ts$/,
  /^src\/stories\//,
  /\/__tests__\//,
  /\.test\.tsx?$/,
  /\.stories\.tsx?$/,
]

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full))
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

const readers = sourceFiles(SRC)
  .map((file) => ({ path: relative(ROOT, file).split(sep).join('/'), text: readFileSync(file, 'utf8') }))
  .filter(({ path }) => !NOT_A_READER.some((pattern) => pattern.test(path)))

function readersOf(key: string): string[] {
  const word = new RegExp(`(^|[^A-Za-z0-9_])${key}([^A-Za-z0-9_]|$)`)
  const perLocale = new RegExp(`^(.+)_(${SITE_LOCALES.join('|')})$`).exec(key)
  const template = perLocale ? `${perLocale[1]}_\${` : null
  return readers.filter(({ text }) => word.test(text) || (template !== null && text.includes(template))).map(({ path }) => path)
}

describe('Task 989 AC1 — every saved setting reaches the site', () => {
  it('the two lists are not empty and share no key', () => {
    expect(SETTINGS_FORM_KEYS.length).toBeGreaterThan(0)
    expect(FOOTER_SETTING_KEYS.length).toBeGreaterThan(0)
    expect(SETTINGS_FORM_KEYS.filter((key) => (FOOTER_SETTING_KEYS as readonly string[]).includes(key))).toEqual([])
  })

  it.each([...SETTINGS_FORM_KEYS])('settings form key %s has a reader outside the admin', (key) => {
    expect(readersOf(key), `no file outside the admin reads "${key}"`).not.toEqual([])
  })

  it.each([...FOOTER_SETTING_KEYS])('Footer page key %s has a reader outside the admin', (key) => {
    expect(readersOf(key), `no file outside the admin reads "${key}"`).not.toEqual([])
  })
})
