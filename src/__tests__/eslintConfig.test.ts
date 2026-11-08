// @vitest-environment node
/**
 * Task 952: eslint-config-next 16 brought five React Compiler rules (eslint-plugin-react-hooks 7) that are switched off until Task 953 fixes their 55 findings
 * (docs/sessions/2026-11-06-task952-react-hooks-v7-findings.json). Switching those five off must never take the two classic hook rules with it: a hook called
 * conditionally, or an effect with a missing dependency, are real defects. The test reads the configuration ESLint resolves for a product file, not the text.
 */
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

// Stories are outside this check: eslint-plugin-storybook turns rules-of-hooks off for *.stories.* files (a Story's render function may call hooks), unchanged by Task 952.
const severity = (entry: unknown): string | number | undefined => (Array.isArray(entry) ? entry[0] : (entry as string | number | undefined))
const isError = (entry: unknown) => severity(entry) === 2 || severity(entry) === 'error'

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

  it('exactly the five React Compiler rules are off (the list Task 953 turns back on)', async () => {
    const config = await new ESLint().calculateConfigForFile('src/modules/listings/components/ListingsShell.tsx') as { rules: Record<string, unknown> }
    const hookRules = Object.entries(config.rules).filter(([name]) => name.startsWith('react-hooks/'))
    const off = hookRules.filter(([, entry]) => severity(entry) === 0 || severity(entry) === 'off').map(([name]) => name).sort()
    expect(off).toEqual(['react-hooks/immutability', 'react-hooks/incompatible-library', 'react-hooks/purity', 'react-hooks/refs', 'react-hooks/set-state-in-effect'])
  })
})
