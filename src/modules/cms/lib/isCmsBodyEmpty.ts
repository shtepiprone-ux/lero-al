import { sanitizeCmsHtml } from './sanitizeCmsHtml'

/**
 * Task 868 (R18) — `true` when a CMS body would show the visitor nothing: no non-whitespace text and no
 * image. The rich-text editor serialises an empty document as `<p></p>`, which a plain `.trim()` would
 * count as content. The check runs on the sanitised HTML, so a body that the public renderer would empty
 * (a lone `<script>`, a foreign-host `<img>`) is empty here too. `&nbsp;` and zero-width characters count
 * as whitespace. Pure.
 */
export function isCmsBodyEmpty(html: string | null | undefined): boolean {
  const clean = sanitizeCmsHtml(html)
  if (/<img\b/i.test(clean)) return false
  const text = clean
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#(?:160|xa0);/gi, ' ')
    .replace(/[ ​‌‍﻿]/g, ' ')
  return text.trim().length === 0
}
