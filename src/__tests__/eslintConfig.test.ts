// @vitest-environment node
/**
 * Task 952 switched five React Compiler rules (eslint-plugin-react-hooks 7) off; Task 953 fixed their 55 findings and turned them back on.
 * Two things must stay true for product code: the two classic hook rules (a hook called conditionally, an effect with a missing dependency) are errors,
 * and the five compiler rules are errors too, with no `eslint-disable` comment hiding a finding. The test reads the configuration ESLint resolves
 * for a product file, not the text of eslint.config.mjs.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

// Stories are outside the first check: eslint-plugin-storybook turns rules-of-hooks off for *.stories.* files (a Story's render function may call hooks).
const severity = (entry: unknown): string | number | undefined => (Array.isArray(entry) ? entry[0] : (entry as string | number | undefined))
const isError = (entry: unknown) => severity(entry) === 2 || severity(entry) === 'error'

const COMPILER_RULES = ['set-state-in-effect', 'refs', 'purity', 'incompatible-library', 'immutability'].map((name) => `react-hooks/${name}`)

describe('eslint.config.mjs keeps the classic hook rules', () => {
  it('[SEC-T3-SRV-HOOK-RULES] react-hooks/rules-of-hooks and react-hooks/exhaustive-deps are errors for product code and tests', async () => {
    const eslint = new ESLint()
    for (const file of ['src/modules/listings/components/ListingsShell.tsx', 'src/modules/listings/hooks/useFavoritesRealtime.ts', 'src/modules/listings/components/__tests__/ImageUpload.test.tsx']) {
      const config = await eslint.calculateConfigForFile(file)
      expect(config, file).toBeTruthy()
      const rules = (config as { rules: Record<string, unknown> }).rules
      expect(isError(rules['react-hooks/rules-of-hooks']), `${file}: rules-of-hooks`).toBe(true)
      expect(isError(rules['react-hooks/exhaustive-deps']), `${file}: exhaustive-deps`).toBe(true)
    }
  })

  it('[AC1] no react-hooks/ rule is off, and the five React Compiler rules are errors (severity 2)', async () => {
    const eslint = new ESLint()
    for (const file of ['src/modules/listings/components/ListingsShell.tsx', 'src/hooks/useIsMobile.ts', 'src/app/[locale]/(site)/favorites/page.tsx']) {
      const config = await eslint.calculateConfigForFile(file) as { rules: Record<string, unknown> }
      const hookRules = Object.entries(config.rules).filter(([name]) => name.startsWith('react-hooks/'))
      const off = hookRules.filter(([, entry]) => severity(entry) === 0 || severity(entry) === 'off').map(([name]) => name)
      expect(off, `${file}: react-hooks rules that are off`).toEqual([])
      for (const rule of COMPILER_RULES) {
        expect(severity(config.rules[rule]), `${file}: ${rule}`).toBeOneOf([2, 'error'])
      }
    }
  })
})

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) sourceFiles(path, found)
    else if (/\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(entry)) found.push(path)
  }
  return found
}

/**
 * An `eslint-disable` comment that names one of the five rules. A rule name ends where a word character or "-" would continue it. The pattern is assembled from parts
 * so that this file does not match itself; the rule names hold no character that needs an escape ("/" is not special in a RegExp built from a string).
 */
const disableCommentPattern = () => new RegExp(String.raw`eslint-${'disable'}[^\n]*?(?:${COMPILER_RULES.join('|')})(?![\w-])`)

describe('no suppression hides a React Compiler finding', () => {
  it('[AC2] no file under src/ has an eslint-disable comment that names one of the five rules', () => {
    const comment = disableCommentPattern()
    const offenders: string[] = []
    for (const file of sourceFiles('src')) {
      const lines = readFileSync(file, 'utf8').split('\n')
      lines.forEach((text, index) => {
        if (comment.test(text)) offenders.push(`${relative('.', file).split(sep).join('/')}:${index + 1}`)
      })
    }
    expect(offenders).toEqual([])
  })

  it('[AC2] the matcher itself catches a disable comment for each of the five rules', () => {
    const comment = disableCommentPattern()
    for (const rule of COMPILER_RULES) {
      expect(comment.test(`// eslint-${'disable'}-next-line ${rule} -- reason`), rule).toBe(true)
      expect(comment.test(`/* eslint-${'disable'} react-hooks/exhaustive-deps, ${rule} */`), rule).toBe(true)
    }
    expect(comment.test(`// eslint-${'disable'}-next-line react-hooks/exhaustive-deps`)).toBe(false)
  })
})

/**
 * Task 1038 Revision 2 (R2-4, owner decision O1038-6, 2026-11-25): `public/vendor/` holds byte copies of third-party files, not authored code; they are held by the sha256 tests of `photoPipeline.test.ts`
 * and ESLint ignores that folder and nothing wider. Asked of ESLint itself (`isPathIgnored`), not read from the text of `eslint.config.mjs`.
 */
describe('ESLint ignores the third-party copies under public/vendor and nothing else of public/', () => {
  it('[AC1] the Worker script copy is ignored; another file of public/, a script outside public/vendor and the pipeline are not', async () => {
    const eslint = new ESLint()
    expect(await eslint.isPathIgnored('public/vendor/browser-image-compression-2.0.2.js')).toBe(true)
    expect(await eslint.isPathIgnored('public/vendor/anything/else.js')).toBe(true)
    expect(await eslint.isPathIgnored('public/other.js')).toBe(false)
    expect(await eslint.isPathIgnored('public/vendorish/other.js')).toBe(false)
    expect(await eslint.isPathIgnored('src/modules/listings/lib/photoPipeline.ts')).toBe(false)
  })
})

/**
 * Task 1053 (owner decisions O1053-1, O1053-2, 2026-11-26): the modules of src/modules depend on each other in one direction. Each module sits on one layer of
 * `MODULE_LAYERS` (eslint.config.mjs) and its production files may import only modules of a lower layer; `import/no-restricted-paths` refuses the rest.
 * Asked of ESLint itself (`calculateConfigForFile`, `lintText`), not read from the text of the configuration.
 */
const MODULE_FOLDERS = readdirSync('src/modules').filter((name) => name !== '__tests__' && statSync(join('src/modules', name)).isDirectory())

async function restrictedPathErrors(text: string, filePath: string): Promise<string[]> {
  const [result] = await new ESLint().lintText(text, { filePath })
  return result.messages.filter((m) => m.ruleId === 'import/no-restricted-paths').map((m) => m.message)
}

describe('the modules of src/modules depend on each other in one direction (Task 1053)', () => {
  it('[AC1] import/no-restricted-paths is an error for a production file of each module, and no-restricted-imports still is', async () => {
    const eslint = new ESLint()
    expect(MODULE_FOLDERS.length).toBeGreaterThan(0)
    for (const folder of MODULE_FOLDERS) {
      for (const file of [`src/modules/${folder}/X.ts`, `src/modules/${folder}/components/X.tsx`]) {
        const config = await eslint.calculateConfigForFile(file) as { rules: Record<string, unknown> }
        expect(isError(config.rules['import/no-restricted-paths']), `${file}: import/no-restricted-paths`).toBe(true)
        expect(isError(config.rules['no-restricted-imports']), `${file}: no-restricted-imports`).toBe(true)
      }
    }
  })

  it('[AC1] the three reverse imports of the Cause are refused; cabinet importing listings is not', async () => {
    expect(await restrictedPathErrors("import { saveSavedSearch } from '@/modules/cabinet/actions'\nvoid saveSavedSearch\n", 'src/modules/listings/components/X.tsx')).not.toEqual([])
    expect(await restrictedPathErrors("import type { AgentOwnerId } from '@/modules/cabinet/statistics/types'\nexport type T = AgentOwnerId\n", 'src/modules/analytics/activity/X.ts')).not.toEqual([])
    expect(await restrictedPathErrors("import { useAuth } from '@/modules/auth/context/AuthContext'\nvoid useAuth\n", 'src/modules/notifications/hooks/X.ts')).not.toEqual([])
    expect(await restrictedPathErrors("import { ListingCard } from '@/modules/listings/components/ListingCard'\nvoid ListingCard\n", 'src/modules/cabinet/components/X.tsx')).toEqual([])
  })

  it('[AC1] next/image is still refused in a module file by no-restricted-imports', async () => {
    const [result] = await new ESLint().lintText("import Image from 'next/image'\nvoid Image\n", { filePath: 'src/modules/cabinet/components/X.tsx' })
    expect(result.messages.some((m) => m.ruleId === 'no-restricted-imports')).toBe(true)
  })

  it('[AC2] MODULE_LAYERS names every folder of src/modules except __tests__ exactly once', async () => {
    const { MODULE_LAYERS } = await import('../../eslint.config.mjs') as { MODULE_LAYERS?: readonly (readonly string[])[] }
    expect(Array.isArray(MODULE_LAYERS)).toBe(true)
    const named = (MODULE_LAYERS ?? []).flat()
    expect(named.length).toBe(new Set(named).size)
    expect([...named].sort()).toEqual([...MODULE_FOLDERS].sort())
  })
})
