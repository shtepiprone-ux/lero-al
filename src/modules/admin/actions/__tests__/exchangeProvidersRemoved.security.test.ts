// @vitest-environment node
/**
 * Security (Task 923 R100, R78 (a), owner decision D51, case SEC-X-SRV-EXCHANGE-REMOVED): nothing reads or writes `exchange_providers` any more.
 *
 * The table held the `api_key` of third-party rate providers and had a screen and five Server Actions. The screen, the actions, their View, container, Stories and fixtures are
 * removed (hardening v8b drops the table after the push). Rates come from one fixed source that needs no key (`getExchangeRateServer.ts`). This test reads the REAL source tree:
 * no production file under `src` names the table, a provider type or a provider component, the removed files are gone, and the currency page renders the currencies list alone.
 * The scan is the same function on the real tree and on the planted inputs below, so it is proved to detect what it claims to.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(process.cwd(), 'src')
/** the table, the type and the components of the removed screen, as they were named in code */
const REMOVED_NAMES = /exchange_providers|exchangeProviders|ExchangeProvider|exchange-providers|AdminCurrencyTabs/i
/** tests (they name the table to prove it is gone) are not production code */
const isTestFile = (path: string) => /(?:(?:^|[\\/])__tests__[\\/]|\.(?:test|spec)\.[cm]?[jt]sx?$)/.test(path)

function productionFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return productionFiles(full)
    return /\.(?:[cm]?[jt]sx?|json|css|sql)$/.test(name) && !isTestFile(full) ? [full] : []
  })
}

/** the lines of a text that name something removed */
function removedNamesIn(text: string): string[] {
  return text.split(/\r?\n/).filter((line) => REMOVED_NAMES.test(line))
}

describe('exchangeProvidersRemoved', () => {
  it('[SEC-X-SRV-EXCHANGE-REMOVED] nothing reads or writes exchange_providers', () => {
    // the scan detects what it claims to (the same function, planted inputs)
    expect(removedNamesIn(`const { data } = await db.from('exchange_providers').select('api_key')`), 'a table read').toHaveLength(1)
    expect(removedNamesIn(`import { getAllExchangeProvidersAdmin } from './exchangeProviders'`), 'an import of the removed actions').toHaveLength(1)
    expect(removedNamesIn(`<AdminCurrencyTabs currencies={a} providers={b} />`), 'the removed tab frame').toHaveLength(1)
    expect(removedNamesIn(`const rates = await getExchangeRates()`), 'a legitimate line is not reported').toHaveLength(0)

    // the removed files are gone
    for (const file of [
      'modules/admin/actions/exchangeProviders.ts',
      'components/admin/AdminExchangeProvidersManager.tsx',
      'components/admin/AdminExchangeProvidersView.tsx',
      'components/admin/AdminCurrencyTabs.tsx',
      'stories/patterns/mantine/AdminExchangeProvidersView.stories.tsx',
      'stories/patterns/mantine/AdminCurrencyTabs.stories.tsx',
    ]) expect(existsSync(join(SRC, file)), `src/${file} is removed`).toBe(false)

    // no production file names the table, the type or the components
    const offenders = productionFiles(SRC).flatMap((file) => removedNamesIn(readFileSync(file, 'utf8')).map((line) => `${relative(process.cwd(), file)}: ${line.trim().slice(0, 100)}`))
    expect(offenders, `these production lines still name the removed exchange-providers screen:\n${offenders.join('\n')}`).toEqual([])

    // the currency page renders the currencies list alone, under the page header, with no tab frame
    const page = readFileSync(join(SRC, 'app/admin/currency/page.tsx'), 'utf8')
    expect(page).toContain('<AdminCurrenciesManager')
    expect(page).not.toMatch(/Tabs|Provider/)
  })
})
