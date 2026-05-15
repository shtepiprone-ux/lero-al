'use client'

import { useEffect } from 'react'

interface Props {
  slug: string
}

export function ViewTracker({ slug }: Props) {
  useEffect(() => {
    const controller = new AbortController()
    let timerId: number | undefined

    // Schedule the POST after 1500 ms — ensures the user has genuinely started
    // reading before incrementing (filters bounce-backs and accidental clicks).
    function schedulePost() {
      timerId = window.setTimeout(() => {
        fetch(`/api/listings/${slug}/view`, {
          method: 'POST',
          signal: controller.signal,
        }).catch(() => {})
      }, 1500)
    }

    // Speculation Rules guard: don't increment during a prerender that the user
    // never activates. document.prerendering is true while the page is in the
    // speculative prerender browsing context. On activation it fires
    // 'prerenderingchange' and becomes false.
    if ((document as Document & { prerendering?: boolean }).prerendering) {
      document.addEventListener('prerenderingchange', schedulePost, { once: true })
    } else {
      schedulePost()
    }

    // StrictMode safety: cleanup clears the pending timer (so mount #1's timer
    // never fires); only mount #2's timer completes. Also removes the prerender
    // listener and aborts any in-flight fetch on navigation away.
    return () => {
      if (timerId !== undefined) window.clearTimeout(timerId)
      document.removeEventListener('prerenderingchange', schedulePost)
      controller.abort()
    }
  }, [slug])

  return null
}
