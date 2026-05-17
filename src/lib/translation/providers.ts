/**
 * Translation provider abstraction.
 *
 * Providers are selected via env vars at the API-route level (server-only).
 * Add new providers by implementing TranslationProvider and registering in getProvider().
 *
 * All API keys remain server-side ONLY — never exposed to the client.
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

// ── Google Cloud Translation v2 provider ──────────────────────────────────────

class GoogleTranslateProvider implements TranslationProvider {
  readonly name = 'google'
  private readonly apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async translate(text: string, targetLang: string): Promise<string> {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target: targetLang, format: 'text' }),
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`)

    const data = await res.json() as {
      data: { translations: { translatedText: string }[] }
    }
    const translated = data.data?.translations?.[0]?.translatedText
    if (!translated) throw new Error('Google Translate: empty response')
    return translated
  }
}

// ── DeepL provider ────────────────────────────────────────────────────────────

class DeepLProvider implements TranslationProvider {
  readonly name = 'deepl'
  private readonly apiKey: string
  // Free tier uses api-free.deepl.com; paid tier uses api.deepl.com
  private readonly baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = apiKey.endsWith(':fx')
      ? 'https://api-free.deepl.com'
      : 'https://api.deepl.com'
  }

  async translate(text: string, targetLang: string): Promise<string> {
    // DeepL uses uppercase lang codes and some regional variants
    const langMap: Record<string, string> = { en: 'EN', uk: 'UK', it: 'IT', sq: 'SQ' }
    const targetCode = langMap[targetLang] ?? targetLang.toUpperCase()

    const res = await fetch(`${this.baseUrl}/v2/translate`, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: [text], target_lang: targetCode }),
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`DeepL HTTP ${res.status}`)

    const data = await res.json() as { translations: { text: string }[] }
    const translated = data.translations?.[0]?.text
    if (!translated) throw new Error('DeepL: empty response')
    return translated
  }
}

// ── Provider factory ──────────────────────────────────────────────────────────

let _provider: TranslationProvider | null = null

export function getTranslationProvider(): TranslationProvider {
  if (_provider) return _provider

  const googleKey = process.env.GOOGLE_TRANSLATE_API_KEY
  const deepLKey  = process.env.DEEPL_API_KEY

  if (googleKey) {
    _provider = new GoogleTranslateProvider(googleKey)
  } else if (deepLKey) {
    _provider = new DeepLProvider(deepLKey)
  } else {
    _provider = new MyMemoryProvider()
  }

  return _provider
}
