import { getLocale } from 'next-intl/server'
import type { AppLocale } from '@/i18n/uiLocale'

/**
 * The language of an admin page (Task 988, owner decision O988-4): the admin lives under the language slug, so it is next-intl's request locale, the `[locale]`
 * segment of the address (`src/i18n/request.ts` accepts only the four codes). No cookie is read.
 */
export async function getAdminLocale(): Promise<AppLocale> {
  return (await getLocale()) as AppLocale
}
