import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { routing } from '@/i18n/routing'
import { isReservedSlug } from '@/lib/reserved-slugs'
import type { PageContent } from '@/types/database'
import type { Metadata } from 'next'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  if (isReservedSlug(slug)) return {}
  const supabase = await createClient()
  const { data: page } = await supabase
    .from('pages')
    .select('content')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
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
  const { data: page } = await supabase
    .from('pages')
    .select('id, title, slug, content, is_published')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()

  if (!page) notFound()

  const content = page.content as PageContent | null
  if (!content) notFound()

  const loc = locale as keyof PageContent
  const hasLocaleContent = !!(content[loc]?.title || content[loc]?.body)
  const rendered = hasLocaleContent ? content[loc] : content.sq

  // If sq fallback is also empty, 404
  if (!rendered?.title && !rendered?.body) notFound()

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {rendered.title && (
        <h1 className="text-3xl font-bold mb-6 break-words">{rendered.title}</h1>
      )}
      {rendered.body && (
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: rendered.body }}
        />
      )}
    </main>
  )
}
