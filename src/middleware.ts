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
//
// ── Header variant system (Task 80) ─────────────────────────────────────────
//
// Production diagnosis showed PRELOAD_NOT_USED: the browser starts the 640w
// request at 655–4708ms, not at TTFB (~50ms). This suggests Chromium rejects
// the preload entry. Most likely cause: unrecognised `fetchpriority` param or
// unquoted params (not strict RFC 8288) causing the entry to be silently ignored.
//
// Four variants can be tested without redeployment via `?_lcp_v=` query param
// or the LINK_PRELOAD_VARIANT env var:
//
//   A — unquoted + fetchpriority=high  (original format, known PRELOAD_NOT_USED)
//   B — quoted   + fetchpriority="high"
//   C — quoted,  no fetchpriority      (DEFAULT — RFC 8288 standard, most conservative)
//   D — same as C, image preload placed FIRST before hreflang alternates
//
// Default C is the safest bet: RFC 8288 requires quoted parameter values when
// the value contains special chars; omitting fetchpriority removes the one
// non-standard parameter that may cause rejection.
//
// Usage:
//   Production test:  https://lero.al/sq/listings/test-7-molyl9c8?_lcp_v=A
//   Env override:     LINK_PRELOAD_VARIANT=B  (Vercel env var)
//   npm diagnose:     npm run diagnose:lcp:network -- https://lero.al test-7-molyl9c8 --variant=D

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

type LinkPreloadVariant = 'A' | 'B' | 'C' | 'D'

function resolveLinkVariant(request: NextRequest, isListingDetail: boolean): LinkPreloadVariant {
  if (!isListingDetail) return 'C'
  // ?_lcp_v= query param: diagnostic experiment mode — no redeployment needed.
  // Only honoured on listing detail pages; ignored everywhere else.
  const qv = request.nextUrl.searchParams.get('_lcp_v')
  if (qv === 'A' || qv === 'B' || qv === 'C' || qv === 'D') return qv
  const env = process.env.LINK_PRELOAD_VARIANT
  if (env === 'A' || env === 'B' || env === 'C' || env === 'D') return env
  return 'C'
}

function buildLcpLinkHeader(coverUrl: string, variant: LinkPreloadVariant): string | null {
  const href = buildGalleryLcpPreloadHref(coverUrl)
  if (!href) return null
  switch (variant) {
    case 'A': return `<${href}>; rel=preload; as=image; fetchpriority=high`
    case 'B': return `<${href}>; rel="preload"; as="image"; fetchpriority="high"`
    case 'D': // same format as C; position (first vs last) is handled at call site
    case 'C':
    default:  return `<${href}>; rel="preload"; as="image"`
  }
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

  // Sync admin-locale cookie from the URL locale on every public-site request.
  // Ensures the admin panel opens in the same locale even when users arrive
  // via direct URL / bookmark rather than clicking the locale switcher.
  const LOCALE_IN_PATH = /^\/(sq|en|uk|it)(\/|$)/
  const localeFromPath = LOCALE_IN_PATH.exec(pathname)?.[1]
  if (localeFromPath) {
    const existingAdminLocale = request.cookies.get('admin-locale')?.value
    if (existingAdminLocale !== localeFromPath) {
      response.cookies.set('admin-locale', localeFromPath, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      })
    }
  }

  if (coverUrl) {
    const variant   = resolveLinkVariant(request, !!slug)
    const linkEntry = buildLcpLinkHeader(coverUrl, variant)
    if (linkEntry) {
      const existing = response.headers.get('Link')
      // Variant D places the image preload FIRST (before hreflang alternates)
      // to test whether entry ordering affects Chromium's preload scanner.
      // All other variants append after existing entries (hreflang stays first).
      if (variant === 'D') {
        response.headers.set('Link', existing ? `${linkEntry}, ${existing}` : linkEntry)
      } else {
        response.headers.set('Link', existing ? `${existing}, ${linkEntry}` : linkEntry)
      }
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
