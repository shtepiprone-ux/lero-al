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
    for (const file of ['src/modules/listings/components/ListingsShell.tsx', 'src/hooks/useIsMobile.ts', 'src/app/[locale]/favorites/page.tsx']) {
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

describe('no suppression hides a React Compiler finding', () => {
  it('[AC2] no file under src/ has an eslint-disable comment that names one of the five rules', () => {
    const named = COMPILER_RULES.map((rule) => rule.replace('/', '\/')).join('|')
    // The pattern is assembled from parts so that this file does not match itself.
    const comment = new RegExp(`eslint-${'disable'}[^\n]*?(?:${named})(?![\w-])`)
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
    const named = COMPILER_RULES.map((rule) => rule.replace('/', '\/')).join('|')
    const comment = new RegExp(`eslint-${'disable'}[^\n]*?(?:${named})(?![\w-])`)
    for (const rule of COMPILER_RULES) {
      expect(comment.test(`// eslint-${'disable'}-next-line ${rule} -- reason`), rule).toBe(true)
      expect(comment.test(`/* eslint-${'disable'} react-hooks/exhaustive-deps, ${rule} */`), rule).toBe(true)
    }
    expect(comment.test(`// eslint-${'disable'}-next-line react-hooks/exhaustive-deps`)).toBe(false)
  })
})
