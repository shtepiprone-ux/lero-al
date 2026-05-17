'use client'

import { useState, useRef, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Languages, RotateCcw, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  description: string
  label: string
}

type TranslationState = 'original' | 'loading' | 'translated' | 'error'

export function ListingDescriptionTranslator({ description, label }: Props) {
  const t = useTranslations('listing')
  const locale = useLocale()
  const [state, setState] = useState<TranslationState>('original')
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Client-side session cache: avoids repeated API calls for the same text+locale.
  // Key: `${locale}:${description.slice(0,50)}`  — description is fixed per listing.
  const cacheRef = useRef<Map<string, string>>(new Map())

  // Guard: prevent concurrent requests (rapid clicks, Enter key spam).
  const inFlightRef = useRef(false)

  const showTranslated = state === 'translated' && translatedText !== null
  const showOriginal = state === 'original'
  const showLoading = state === 'loading' || isPending
  const showError = state === 'error'

  function handleTranslate() {
    if (inFlightRef.current || showLoading) return

    const cacheKey = `${locale}:${description.slice(0, 80)}`

    // Client cache hit — no network call needed.
    const cached = cacheRef.current.get(cacheKey)
    if (cached) {
      setTranslatedText(cached)
      setState('translated')
      return
    }

    inFlightRef.current = true
    setState('loading')

    startTransition(async () => {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: description, targetLocale: locale }),
        })

        if (res.status === 429) throw new Error('rate_limited')
        if (!res.ok) throw new Error(`http_${res.status}`)

        const data = await res.json() as { translatedText?: string; error?: string }
        if (!data.translatedText) throw new Error('empty_response')

        // Store in client cache
        cacheRef.current.set(cacheKey, data.translatedText)
        setTranslatedText(data.translatedText)
        setState('translated')
      } catch {
        setState('error')
      } finally {
        inFlightRef.current = false
      }
    })
  }

  function handleShowOriginal() {
    setState('original')
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="font-bold text-lg">{label}</h2>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {showOriginal && (
            <button
              type="button"
              onClick={handleTranslate}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/60 rounded-lg px-2.5 py-1.5 transition-colors"
              aria-label={t('translate_btn')}
            >
              <Languages className="h-3.5 w-3.5" />
              {t('translate_btn')}
            </button>
          )}

          {showLoading && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t('translating')}
            </span>
          )}

          {showTranslated && (
            <button
              type="button"
              onClick={handleShowOriginal}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition-colors"
              aria-label={t('show_original')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('show_original')}
            </button>
          )}

          {showError && (
            <button
              type="button"
              onClick={() => { setState('original') }}
              className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 border border-destructive/30 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {t('translate_btn')}
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {showError && (
        <p className="text-xs text-destructive mb-2">{t('translation_error')}</p>
      )}

      {/* Description text — XSS-safe: always plain text, never dangerouslySetInnerHTML */}
      <p className={cn(
        'text-muted-foreground leading-relaxed whitespace-pre-line',
        showLoading && 'opacity-50',
      )}>
        {showTranslated ? translatedText! : description}
      </p>

      {/* Disclaimer */}
      {showTranslated && (
        <p className="mt-2 text-[11px] text-muted-foreground/60 italic">
          {t('translated_automatically')}
        </p>
      )}
    </div>
  )
}
