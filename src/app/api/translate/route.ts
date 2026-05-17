import { createHash } from 'crypto'
import { getTranslationProvider } from '@/lib/translation/providers'

// ── Server-side in-memory cache ───────────────────────────────────────────────
// Key: sha256(text):targetLang  Value: { text: string, expiresAt: number }
// Persists for the server process lifetime. Prevents repeated provider calls
// for identical requests within the same server instance.

interface CacheEntry { text: string; expiresAt: number }
const translationCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000  // 24 hours

function cacheKey(text: string, targetLang: string): string {
  return `${createHash('sha256').update(text).digest('hex').slice(0, 16)}:${targetLang}`
}

function getCached(text: string, targetLang: string): string | null {
  const key = cacheKey(text, targetLang)
  const entry = translationCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { translationCache.delete(key); return null }
  return entry.text
}

function setCache(text: string, targetLang: string, translated: string): void {
  // Evict oldest entries if cache grows too large (simple LRU-approximation)
  if (translationCache.size > 500) {
    const firstKey = translationCache.keys().next().value
    if (firstKey) translationCache.delete(firstKey)
  }
  translationCache.set(cacheKey(text, targetLang), {
    text: translated,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

interface RateEntry { count: number; resetAt: number }
const rateMap = new Map<string, RateEntry>()
const RATE_LIMIT = 20       // requests per window per IP
const RATE_WINDOW_MS = 60_000  // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

// ── Supported locales ─────────────────────────────────────────────────────────

const SUPPORTED_LOCALES = ['sq', 'en', 'uk', 'it'] as const

// ── POST /api/translate ───────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Resolve client IP for rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? '0.0.0.0'

  if (isRateLimited(ip)) {
    return Response.json({ error: 'rate_limited' }, { status: 429 })
  }

  let body: { text?: unknown; targetLocale?: unknown }
  try {
    body = await req.json() as { text?: unknown; targetLocale?: unknown }
  } catch {
    return Response.json({ error: 'invalid_body' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const targetLocale = typeof body.targetLocale === 'string' ? body.targetLocale.trim() : ''

  if (!text || text.length < 1) {
    return Response.json({ error: 'empty_text' }, { status: 400 })
  }
  if (text.length > 5000) {
    return Response.json({ error: 'text_too_long' }, { status: 400 })
  }
  if (!(SUPPORTED_LOCALES as readonly string[]).includes(targetLocale)) {
    return Response.json({ error: 'unsupported_locale' }, { status: 400 })
  }

  // Cache hit
  const cached = getCached(text, targetLocale)
  if (cached) {
    return Response.json({ translatedText: cached, cached: true })
  }

  const provider = getTranslationProvider()
  try {
    const translatedText = await provider.translate(text, targetLocale)
    setCache(text, targetLocale, translatedText)
    return Response.json({ translatedText, provider: provider.name })
  } catch (e) {
    console.error('[translate] provider error', { provider: provider.name, error: e })
    return Response.json({ error: 'provider_error' }, { status: 502 })
  }
}
