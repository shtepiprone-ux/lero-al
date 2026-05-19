import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { type NextRequest } from 'next/server'
import { refreshSession } from '@/lib/auth/middleware'
import { createServerClient } from '@supabase/ssr'
import { buildGalleryLcpPreloadHref } from '@/lib/imageDelivery'

const handleI18nRouting = createMiddleware(routing)

// ── Listing Detail LCP preload header ─────────────────────────────────────────
//
// Matches /:locale/listings/:slug GET requests and injects an HTTP Link header
// so the browser can discover and start loading the Cloudinary LCP image during
// TTFB — before receiving the 124KB HTML where the body preload tag appears at
// char ~103K (86% through the document).
//
// The DB lookup runs in parallel with refreshSession to minimise added TTFB:
// both are Supabase edge queries (~50ms); overhead ≈ max(auth, lookup) - auth.
//
// Uses href-only (640w) — NOT imagesrcset — to avoid commas inside the srcset
// value corrupting the combined Link header when next-intl also sets hreflang
// alternate entries. The 640w URL matches the browser's srcset selection at
// desktop 1280px DPR=1 (sizes="50vw" → 640px).

const LISTING_DETAIL_RE = /^\/(sq|en|uk|it)\/listings\/([^/?#]+)$/

async function fetchListingCoverUrl(slug: string): Promise<string | null> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      // No session needed — reading public listing data with anon key.
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
    const { data } = await supabase
      .from('listings')
      .select('images:listing_images(url, is_cover)')
      .eq('slug', slug)
      .in('status', ['active', 'sold', 'rented', 'archived'])
      .maybeSingle()
    const images =
      (data as unknown as { images?: { url: string; is_cover: boolean }[] } | null)
        ?.images ?? []
    const cover = images.find(img => img.is_cover) ?? images[0]
    return cover?.url ?? null
  } catch {
    return null
  }
}

function buildLcpLinkHeader(coverUrl: string): string | null {
  const href = buildGalleryLcpPreloadHref(coverUrl)
  if (!href) return null
  return `<${href}>; rel=preload; as=image; fetchpriority=high`
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip RSC navigation requests (Next-Router-State-Tree present) — they are
  // partial re-renders that do not produce a full HTML response and do not
  // benefit from a Link preload header.
  const isNavigation = request.headers.has('Next-Router-State-Tree')
  const match = !isNavigation && request.method === 'GET'
    ? LISTING_DETAIL_RE.exec(pathname)
    : null
  const slug = match?.[2] ?? null

  const [sessionResponse, coverUrl] = await Promise.all([
    refreshSession(request),
    slug ? fetchListingCoverUrl(slug) : Promise.resolve(null),
  ])

  const response = handleI18nRouting(request)

  for (const { name, value, ...options } of sessionResponse.cookies.getAll()) {
    response.cookies.set(name, value, options)
  }

  if (coverUrl) {
    const linkHeader = buildLcpLinkHeader(coverUrl)
    if (linkHeader) {
      // append() keeps the preload entry as a separate Link header value,
      // isolating it from next-intl's hreflang entries. This prevents the
      // imagesrcset commas from corrupting the combined header when combined.
      response.headers.append('Link', linkHeader)
    }
  }

  return response
}

export const config = {
  // Routes that receive locale routing + session refresh.
  // Excluded intentionally:
  //   api/*    — API routes handle auth internally, must not get locale prefixes
  //   auth/*   — Supabase OAuth callback lives outside the [locale] tree
  //   admin/*  — admin panel has no [locale] segment in the URL
  matcher: [
    '/((?!api|auth|admin|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
