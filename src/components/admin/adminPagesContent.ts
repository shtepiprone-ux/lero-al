import type { Page, PageContent, PageLocaleContent } from '@/types/database'

// Pure helpers of `/admin/pages` (Task 868). Moved unchanged out of `AdminPagesManager.tsx` so the two
// containers (`AdminPagesManager`, `PageEditorDialog`) share one copy.

export type PageLocale = 'sq' | 'en' | 'uk' | 'it'
export const PAGE_LOCALES: PageLocale[] = ['sq', 'en', 'uk', 'it']

export function toSlug(str: string) {
  // Task 990: a Latin letter with a mark loses the mark, not the letter (NFD splits "ç" into "c" and a combining mark): "Çmimet e shtëpive" → "cmimet-e-shtepive";
  // another script still gives nothing, so the empty address keeps its format error.
  const unmarked = str.normalize('NFD').replace(/[̀-ͯ]/g, '')
  // one hyphen between words and none at the ends (Task 923 Revision 7): "Terms & Conditions" used to give "terms--conditions", "--a--" gave "-a-"
  return unmarked.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
}

export function isLegacyContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false
  return !('sq' in (content as object))
}

export function getLocaleContent(page: Page | undefined, locale: PageLocale): PageLocaleContent {
  if (!page) return { title: '', body: '' }
  const c = page.content as PageContent | { body?: string }
  if (isLegacyContent(c)) {
    return locale === 'sq'
      ? { title: page.title ?? '', body: (c as { body?: string }).body ?? '' }
      : { title: '', body: '' }
  }
  const pc = c as PageContent
  return { title: pc[locale]?.title ?? '', body: pc[locale]?.body ?? '' }
}

export function isMigrationPending(pages: Page[]): boolean {
  return pages.some(p => isLegacyContent(p.content))
}

export function getDisplayTitle(page: Page): string {
  const c = page.content as PageContent | { body?: string }
  if (!isLegacyContent(c)) {
    const pc = c as PageContent
    return pc.sq?.title || page.title || page.slug
  }
  return page.title || page.slug
}
