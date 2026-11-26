import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'
import { isReservedSlug } from '@/lib/reserved-slugs'
import { CmsPageView } from '@/modules/cms/components/CmsPageView'
import type { PageContent } from '@/types/database'
import type { Metadata } from 'next'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (isReservedSlug(slug)) return {}
  const supabase = await createClient()
  const { data: page, error } = await supabase
    .from('pages')
    .select('content')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  if (error) {
    console.error('CmsSlugPage.generateMetadata: pages query failed', { error, slug, locale })
  }
  if (!page) return {}
  const content = page.content as PageContent | null
  if (!content) return {}
  const loc = locale as keyof PageContent
  const localeContent = (content[loc]?.title ? content[loc] : content.sq) ?? null
  return { title: localeContent?.title ?? '' }
}

export default async function CmsSlugPage({ params }: Props) {
  const { locale, slug } = await params

  if (!(routing.locales as readonly string[]).includes(locale)) notFound()
  setRequestLocale(locale)

  // Reserved slugs are handled by existing routes; if they somehow reach here, 404.
  if (isReservedSlug(slug)) notFound()

  const supabase = await createClient()
  const { data: page, error } = await supabase
    .from('pages')
    .select('id, title, slug, content, is_published')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (error) {
    console.error('CmsSlugPage: pages query failed', { error, slug, locale })
  }

  if (!page) notFound()

  const content = page.content as PageContent | null
  if (!content) notFound()

  const loc = locale as keyof PageContent
  const hasLocaleContent = !!(content[loc]?.title || content[loc]?.body)
  const rendered = hasLocaleContent ? content[loc] : content.sq

  // If sq fallback is also empty, 404
  if (!rendered?.title && !rendered?.body) notFound()

  return <CmsPageView title={rendered.title} body={rendered.body} />
}
