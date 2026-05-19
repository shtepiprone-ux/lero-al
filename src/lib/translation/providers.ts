/**
 * Translation provider abstraction.
 *
 * Uses MyMemory (free, no API key required) as the sole provider.
 * Optionally set MYMEMORY_API_KEY to increase rate limits.
 */

export interface TranslationProvider {
  readonly name: string
  translate(text: string, targetLang: string): Promise<string>
}

// ── MyMemory provider (free, no API key required) ─────────────────────────────

class MyMemoryProvider implements TranslationProvider {
  readonly name = 'mymemory'

  async translate(text: string, targetLang: string): Promise<string> {
    const url = new URL('https://api.mymemory.translated.net/get')
    url.searchParams.set('q', text)
    url.searchParams.set('langpair', `|${targetLang}`)  // auto-detect source

    const apiKey = process.env.MYMEMORY_API_KEY
    if (apiKey) url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lero.al/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)

    const data = await res.json() as {
      responseStatus: number
      responseData: { translatedText: string }
    }
    if (data.responseStatus !== 200) throw new Error(`MyMemory status ${data.responseStatus}`)

    const translated = data.responseData?.translatedText
    if (!translated) throw new Error('MyMemory: empty response')
    return translated
  }
}

// ── Provider factory ──────────────────────────────────────────────────────────

let _provider: TranslationProvider | null = null

export function getTranslationProvider(): TranslationProvider {
  if (!_provider) _provider = new MyMemoryProvider()
  return _provider
}
