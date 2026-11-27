/**
 * Task 923 R134 (R78 (c); owner D51, D70): a setting the administrator can save, and a table only the admin code writes, must be read by something outside the admin code. This keeps
 * unread settings and tables from coming back. The rules are a pure function of a map from path to text (`findSettingFindings`, `findTableFindings`); the first group of cases runs them on
 * the real `src` tree, the second on planted inputs.
 *
 * The admin code is `src/app/[locale]/admin`, `src/components/admin` and `src/modules/admin`. The list of settings of the real tree is imported from `src/modules/admin/lib/settingKeys.ts`
 * (Task 989: the lists left the `'use server'` module `src/modules/admin/actions/index.ts`, which may export only async functions); the planted inputs still plant a `SETTING_KEYS` block in an
 * actions source, parsed by `parseSettingKeys`. A "library helper" is an `export async function` of `src/modules/admin/lib/settings.ts`
 * (a `server-only` module); a helper is used outside the admin code when a file outside it imports its name from `'@/modules/admin/lib/settings'`.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FOOTER_SETTING_KEYS, SETTINGS_FORM_KEYS } from '@/modules/admin/lib/settingKeys'

const ADMIN_DIRS = ['src/app/[locale]/admin/', 'src/components/admin/', 'src/modules/admin/']
const SETTINGS_ACTIONS = 'src/modules/admin/actions/index.ts'
const SETTINGS_LIB = 'src/modules/admin/lib/settings.ts'

/** shown on the site by Task 930 (owner D70); empty since Task 989, which gave every key a reader (its AC1) */
const TASK_930_KEYS: readonly string[] = []

/** the keys of the settings form and of the Footer page (Task 989) */
const SETTING_KEYS: readonly string[] = [...SETTINGS_FORM_KEYS, ...FOOTER_SETTING_KEYS]

/** tables that only staff use: their purpose is the admin screen that reads them, so they have no reader outside the admin code */
const ADMIN_RECORD_TABLES: Record<string, string> = {
  role_permission_events: 'the permission change history, read by the admin permissions screen',
  support_tickets: 'the support desk, created and read by staff',
  support_ticket_events: 'the support desk history, read by the admin support page',
  user_change_log: 'the user change history, read by the admin user page',
}

type Files = Record<string, string>
interface Rules { task930Keys: readonly string[]; recordTables: Record<string, string> }

const isAdmin = (path: string) => ADMIN_DIRS.some(dir => path.startsWith(dir))
/** tests, Stories, fixtures and declaration files are not production readers */
const isNotProduction = (path: string) => /(__tests__|\.test\.|\.spec\.|\.stories\.|\/stories\/|fixtures?\/|\.d\.ts$)/.test(path)

function readTree(root: string): Files {
  const files: Files = {}
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const rel = relative(root, path).split(sep).join('/')
        if (!isNotProduction(rel)) files[rel] = readFileSync(path, 'utf8')
      }
    }
  }
  walk(join(root, 'src'))
  return files
}

/** the exported async functions of the settings library, each with its source up to the next export */
function libraryHelpers(files: Files): Record<string, string> {
  const lib = files[SETTINGS_LIB] ?? ''
  const helpers: Record<string, string> = {}
  for (const match of lib.matchAll(/export async function (\w+)/g)) {
    const next = lib.indexOf('\nexport ', match.index + 1)
    helpers[match[1]] = lib.slice(match.index, next < 0 ? undefined : next)
  }
  return helpers
}

/** the files outside the admin code that import `name` from the settings library */
function importersOutsideAdmin(files: Files, name: string): string[] {
  const importing = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*'@/modules/admin/lib/settings'`)
  return Object.entries(files).filter(([path, text]) => !isAdmin(path) && importing.test(text)).map(([path]) => path)
}

/** the keys between `const SETTING_KEYS = [` and `] as const` in the source of the Server Action module, or null when that block is absent */
function parseSettingKeys(files: Files): string[] | null {
  const source = files[SETTINGS_ACTIONS] ?? ''
  const start = source.indexOf('const SETTING_KEYS = [')
  if (start < 0) return null
  const end = source.indexOf('] as const', start)
  if (end < 0) return null
  return [...source.slice(start, end).matchAll(/'([a-z_]+)'/g)].map(match => match[1])
}

/**
 * Task 989 (owner, 2026-11-27: extend the detector): the files outside the admin code that import `getSettings` from the settings library and name the key — quoted, as the
 * template `<base>_${` of a per-language key, or through `FOOTER_SETTING_KEYS` of the key list when the key is one of them
 */
function getSettingsReaders(files: Files, key: string): string[] {
  const perLocale = /^(.+)_(sq|en|uk|it)$/.exec(key)
  const template = perLocale ? perLocale[1] + '_${' : null
  const footerKey = FOOTER_SETTING_KEYS.includes(key)
  return importersOutsideAdmin(files, 'getSettings').filter((path) => {
    const text = files[path]
    return text.includes(`'${key}'`) || (template !== null && text.includes(template)) || (footerKey && /\bFOOTER_SETTING_KEYS\b/.test(text))
  })
}

/** the files outside the admin code that read the setting, directly, through `getSettings` or through a helper of the settings library */
function settingReaders(files: Files, helpers: Record<string, string>, key: string): string[] {
  const direct = Object.entries(files).filter(([path, text]) => !isAdmin(path) && (text.includes(`getSetting('${key}'`) || text.includes(`key=eq.${key}`))).map(([path]) => path)
  const through = Object.entries(helpers).filter(([, body]) => body.includes(`getSetting('${key}'`)).flatMap(([name]) => importersOutsideAdmin(files, name))
  return [...direct, ...getSettingsReaders(files, key), ...through]
}

/** Each finding names the setting and what is wrong with it. An empty list means no orphan. */
function findSettingFindings(files: Files, rules: Rules, keys: readonly string[] | null = parseSettingKeys(files)): string[] {
  if (!keys) return [`SETTING_KEYS: the block "const SETTING_KEYS = [" ... "] as const" is not in ${SETTINGS_ACTIONS}`]
  const helpers = libraryHelpers(files)
  const findings: string[] = []
  for (const key of keys) {
    const readers = settingReaders(files, helpers, key)
    const owned = rules.task930Keys.includes(key)
    if (!owned && readers.length === 0) findings.push(`setting '${key}': no reader outside the admin code (a getSetting('${key}' call, key=eq.${key}, a file that imports getSettings and names the key, or a helper of ${SETTINGS_LIB} that reads it)`)
    if (owned && readers.length > 0) findings.push(`setting '${key}': listed in TASK_930_KEYS but read outside the admin code by ${readers.join(', ')}: remove it from TASK_930_KEYS`)
  }
  for (const key of rules.task930Keys) {
    if (!keys.includes(key)) findings.push(`setting '${key}': listed in TASK_930_KEYS but not in SETTING_KEYS`)
  }
  return findings
}

interface TableUse { adminWrites: Set<string>; otherWrites: Set<string>; adminReads: Set<string>; otherReads: Set<string> }

function tableUses(files: Files): Record<string, TableUse> {
  const uses: Record<string, TableUse> = {}
  const call = /\.from\(\s*['"]([a-z_]+)['"]\s*\)\s*\.(insert|update|upsert|delete|select)\(/g
  for (const [path, text] of Object.entries(files)) {
    for (const match of text.matchAll(call)) {
      const use = (uses[match[1]] ??= { adminWrites: new Set(), otherWrites: new Set(), adminReads: new Set(), otherReads: new Set() })
      if (match[2] === 'select') (isAdmin(path) ? use.adminReads : use.otherReads).add(path)
      else (isAdmin(path) ? use.adminWrites : use.otherWrites).add(path)
    }
  }
  return uses
}

/** the tables that only the admin code writes */
function adminWrittenOnly(uses: Record<string, TableUse>): string[] {
  return Object.entries(uses).filter(([, use]) => use.adminWrites.size > 0 && use.otherWrites.size === 0).map(([table]) => table).sort()
}

function tableReaders(files: Files, helpers: Record<string, string>, uses: Record<string, TableUse>, table: string): string[] {
  const through = Object.entries(helpers).filter(([, body]) => new RegExp(`\\.from\\(\\s*['"]${table}['"]`).test(body)).flatMap(([name]) => importersOutsideAdmin(files, name))
  return [...(uses[table]?.otherReads ?? []), ...through]
}

/** Each finding names the table and what is missing. An empty list means no orphan. */
function findTableFindings(files: Files, rules: Rules): string[] {
  const helpers = libraryHelpers(files)
  const uses = tableUses(files)
  const only = adminWrittenOnly(uses)
  const findings: string[] = []
  if (only.length === 0) findings.push('tables: no table is written only by the admin code, so the scan found nothing to check (the scan itself is broken)')
  for (const table of only) {
    if (tableReaders(files, helpers, uses, table).length === 0 && !(table in rules.recordTables)) {
      findings.push(`table '${table}': written only by the admin code and read by nothing outside it (add a reader, or list it in ADMIN_RECORD_TABLES with its reason)`)
    }
  }
  for (const table of Object.keys(rules.recordTables)) {
    if (!only.includes(table)) findings.push(`table '${table}': listed in ADMIN_RECORD_TABLES but no longer written only by the admin code: remove it from the list`)
    else if ((uses[table]?.adminReads.size ?? 0) === 0) findings.push(`table '${table}': listed in ADMIN_RECORD_TABLES but no admin code reads it with .select(`)
  }
  return findings
}

const RULES: Rules = { task930Keys: TASK_930_KEYS, recordTables: ADMIN_RECORD_TABLES }

describe('adminOrphans — the real src tree', () => {
  const files = readTree(process.cwd())

  it('reads twenty-one unique setting keys from the key lists of the settings form and the Footer page', () => {
    expect(SETTING_KEYS).toHaveLength(21)
    expect(new Set(SETTING_KEYS).size, 'the keys are unique').toBe(21)
  })

  it('every setting key has a reader outside the admin code (Task 930 has no key left)', () => {
    const findings = findSettingFindings(files, RULES, SETTING_KEYS)
    expect(findings, findings.join('\n')).toEqual([])
  })

  it('every table that only the admin code writes has a reader outside it, or is an admin record table that an admin screen reads', () => {
    expect(adminWrittenOnly(tableUses(files)).length, 'the scan finds admin-written-only tables').toBeGreaterThan(0)
    const findings = findTableFindings(files, RULES)
    expect(findings, findings.join('\n')).toEqual([])
  })
})

describe('adminOrphans — the rules on planted inputs', () => {
  const none: Rules = { task930Keys: [], recordTables: {} }
  const actions = "'use server'\nconst SETTING_KEYS = [\n  'alpha', 'beta',\n] as const\n"
  const library = "import 'server-only'\nexport async function getSetting(key: string, fallback: string) { return fallback }\nexport async function getAlpha() {\n  return getSetting('alpha', '')\n}\n"
  const reader = "import { getAlpha } from '@/modules/admin/lib/settings'\n"

  it('a key with no reader outside the admin code is an orphan', () => {
    const files: Files = { [SETTINGS_ACTIONS]: actions, [SETTINGS_LIB]: library, 'src/components/Alpha.tsx': reader }
    const findings = findSettingFindings(files, none)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toContain("setting 'beta': no reader outside the admin code")
  })

  it('a key read only inside the admin code is an orphan; a direct getSetting and a key=eq. reader are readers', () => {
    const admin: Files = { [SETTINGS_ACTIONS]: actions, [SETTINGS_LIB]: library, 'src/components/admin/Alpha.tsx': reader }
    expect(findSettingFindings(admin, none)).toHaveLength(2)
    const direct: Files = { [SETTINGS_ACTIONS]: actions, [SETTINGS_LIB]: library, 'src/app/a.ts': "await getSetting('alpha', '')", 'src/app/b.ts': 'fetch(`/rest/v1/site_settings?key=eq.beta`)' }
    expect(findSettingFindings(direct, none)).toEqual([])
  })

  it('Task 989: a file outside the admin code that imports getSettings and names the key is a reader; naming it without that import, or only inside the admin code, is not', () => {
    const keys = ['alpha', 'beta', 'title_en', 'contact_phone']
    const base: Files = { [SETTINGS_LIB]: library }
    const importing = "import { getSettings } from '@/modules/admin/lib/settings'\n"
    // quoted, a per-language template, and a key of FOOTER_SETTING_KEYS through the list
    const readers: Files = {
      ...base,
      'src/app/a.ts': `${importing}await getSettings(['alpha', 'beta'])`,
      'src/app/b.ts': importing + 'await getSettings([`title_${locale}`])',
      'src/components/c.tsx': `${importing}import { FOOTER_SETTING_KEYS } from '@/modules/admin/lib/settingKeys'\nawait getSettings(FOOTER_SETTING_KEYS)`,
    }
    expect(findSettingFindings(readers, none, keys)).toEqual([])
    // the control: the same text without the import of getSettings, or inside the admin code, reads nothing
    const noImport: Files = { ...base, 'src/app/a.ts': "await getSettings(['alpha', 'beta'])", 'src/app/b.ts': 'await getSettings([`title_${locale}`])', 'src/components/c.tsx': 'await getSettings(FOOTER_SETTING_KEYS)' }
    expect(findSettingFindings(noImport, none, keys)).toHaveLength(4)
    const admin: Files = { ...base, 'src/components/admin/a.tsx': `${importing}await getSettings(['alpha', 'beta', 'contact_phone'])` }
    expect(findSettingFindings(admin, none, keys)).toHaveLength(4)
    // FOOTER_SETTING_KEYS stands only for its own keys
    expect(findSettingFindings({ ...base, 'src/components/c.tsx': readers['src/components/c.tsx'] }, none, ['alpha'])).toHaveLength(1)
  })

  it('a TASK_930_KEYS key that gains a getSetting reader outside the admin code is reported', () => {
    const files: Files = { [SETTINGS_ACTIONS]: actions, [SETTINGS_LIB]: library, 'src/components/Alpha.tsx': reader, 'src/components/Beta.tsx': "const v = await getSetting('beta', '')" }
    const findings = findSettingFindings(files, { task930Keys: ['beta'], recordTables: {} })
    expect(findings).toHaveLength(1)
    expect(findings[0]).toContain("setting 'beta': listed in TASK_930_KEYS but read outside the admin code by src/components/Beta.tsx")
    // a listed key with no reader is as intended, and a listed key that is not a setting is reported
    expect(findSettingFindings({ [SETTINGS_ACTIONS]: actions, [SETTINGS_LIB]: library, 'src/components/Alpha.tsx': reader }, { task930Keys: ['beta'], recordTables: {} })).toEqual([])
    expect(findSettingFindings({ [SETTINGS_ACTIONS]: actions, [SETTINGS_LIB]: library, 'src/components/Alpha.tsx': reader }, { task930Keys: ['beta', 'gamma'], recordTables: {} })).toEqual(["setting 'gamma': listed in TASK_930_KEYS but not in SETTING_KEYS"])
  })

  it('an admin-written-only table with no reader outside the admin code is an orphan', () => {
    const files: Files = { 'src/modules/admin/actions/ghost.ts': "await db.from('ghost')\n  .insert({ a: 1 })" }
    const findings = findTableFindings(files, none)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toContain("table 'ghost': written only by the admin code and read by nothing outside it")
    // a table that another file also writes is not admin-written-only
    expect(findTableFindings({ ...files, 'src/lib/other.ts': "await db.from('ghost').update({})", 'src/modules/admin/actions/real.ts': "await db.from('real').insert({})" }, { task930Keys: [], recordTables: {} })).toEqual([
      expect.stringContaining("table 'real'"),
    ])
  })

  it('a table read only through a helper of the settings library that a file outside the admin code imports is not an orphan', () => {
    const lib = "import 'server-only'\nexport async function getShared() {\n  return db.from('shared_t')\n    .select('*')\n}\n"
    const writer: Files = { 'src/modules/admin/actions/shared.ts': "await db.from('shared_t').upsert({})", [SETTINGS_LIB]: lib }
    expect(findTableFindings({ ...writer, 'src/components/Shared.tsx': "import { getShared } from '@/modules/admin/lib/settings'" }, none)).toEqual([])
    // the control: without the importing file, or when only an admin file imports the helper, the table is an orphan
    expect(findTableFindings(writer, none)).toEqual([expect.stringContaining("table 'shared_t'")])
    expect(findTableFindings({ ...writer, 'src/components/admin/Shared.tsx': "import { getShared } from '@/modules/admin/lib/settings'" }, none)).toEqual([expect.stringContaining("table 'shared_t'")])
  })

  it('an ADMIN_RECORD_TABLES table with no admin reader is reported, and so is one that is no longer admin-written-only', () => {
    const records: Rules = { task930Keys: [], recordTables: { tick: 'a record only staff use' } }
    const write: Files = { 'src/app/[locale]/admin/tick/actions.ts': "await db.from('tick').insert({})" }
    expect(findTableFindings(write, records)).toEqual([expect.stringContaining("table 'tick': listed in ADMIN_RECORD_TABLES but no admin code reads it")])
    expect(findTableFindings({ ...write, 'src/app/[locale]/admin/tick/page.tsx': "await db.from('tick').select('*')" }, records)).toEqual([])
    // 'anchor' keeps the scan non-empty: the admin code writes it and a file outside reads it
    const shared: Files = { ...write, 'src/app/[locale]/admin/tick/page.tsx': "await db.from('tick').select('*')", 'src/app/[locale]/admin/anchor.ts': "await db.from('anchor').insert({})", 'src/lib/anchor.ts': "await db.from('anchor').select('*')" }
    expect(findTableFindings({ ...shared, 'src/lib/site.ts': "await db.from('tick').insert({})" }, records)).toEqual([
      expect.stringContaining("table 'tick': listed in ADMIN_RECORD_TABLES but no longer written only by the admin code"),
    ])
  })
})
