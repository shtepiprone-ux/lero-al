#!/usr/bin/env node
/**
 * profile-listing-lcp.mjs
 *
 * Repeatable LCP profiling baseline for the Listing Detail page.
 *
 * Checks performed for every locale × viewport combination:
 *   1. HTTP response code
 *   2. <link rel="preload" as="image"> presence in <head>
 *   3. fetchpriority attribute on the preload link
 *   4. <img fetchPriority="high"> presence in body (GalleryStaticFrame)
 *   5. Position of first fetchPriority image relative to first <script> tag
 *   6. Whether image URL is a Cloudinary URL (srcset transform coverage)
 *
 * Usage:
 *   node scripts/profile-listing-lcp.mjs [BASE_URL] [SLUG]
 *
 * Examples:
 *   node scripts/profile-listing-lcp.mjs http://localhost:3000 test-7-molyl9c8
 *   node scripts/profile-listing-lcp.mjs https://lero.al some-listing-slug
 *
 * Requires: Node.js 18+ (native fetch). No other dependencies.
 *
 * For full Lighthouse LCP timing:
 *   npx playwright install chromium
 *   Then extend this script or use: npx lighthouse <url> --view
 *
 * Locales checked: sq, en, uk, it
 * Viewports documented (for manual Lighthouse runs): see VIEWPORTS below
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'
const SLUG     = process.argv[3] || 'test-7-molyl9c8'

const LOCALES = ['sq', 'en', 'uk', 'it']

// Breakpoints the project governs (docs/component-governance.md)
const VIEWPORTS = [
  { name: 'mobile-320',      w: 320,  h: 568  },
  { name: 'mobile-375',      w: 375,  h: 667  },
  { name: 'mobile-390',      w: 390,  h: 844  },
  { name: 'tablet-768',      w: 768,  h: 1024 },
  { name: 'desktop-1280',    w: 1280, h: 800  },
  { name: 'desktop-1440',    w: 1440, h: 900  },
  { name: 'huge-2560',       w: 2560, h: 1440 },
]

function extractHead(html) {
  const end = html.indexOf('</head>')
  return end > 0 ? html.slice(0, end) : html.slice(0, 8000)
}

function checkPreloadLink(html) {
  const head = extractHead(html)
  const headEnd = html.indexOf('</head>')

  // React 19 RSC: native <link rel="preload" as="image"> may appear in either
  // <head> (ideal, browser discovers early) or <body> (React 19 SSR limitation —
  // link hoisting is a client-side post-hydration operation, not SSR-time).
  // Check both; prefer HEAD if found there.
  const headMatch = head.match(/<link[^>]*rel="preload"[^>]*as="image"[^>]*\/>/)
  const bodyMatch = html.slice(headEnd > 0 ? headEnd : 0).match(/<link[^>]*rel="preload"[^>]*as="image"[^>]*\/>/)

  const tag    = headMatch?.[0] ?? bodyMatch?.[0] ?? null
  const inHead = !!headMatch

  if (!tag) return { present: false, inHead: false, hasFetchPriority: false, raw: null }
  const hasFetchPriority   = /fetchpriority/i.test(tag)
  const fetchPriorityValue = tag.match(/fetchpriority="([^"]*)"/i)?.[1] ?? null
  const hasHref            = /\bhref=/.test(tag)
  const hasImageSrcSet     = /imageSrcSet=/i.test(tag)
  return { present: true, inHead, hasFetchPriority, fetchPriorityValue, hasHref, hasImageSrcSet, raw: tag.slice(0, 200) }
}

function checkGalleryImg(html) {
  // GalleryStaticFrame renders <img ... fetchPriority="high" loading="eager" ...>
  const m = html.match(/<img[^>]*fetchPriority="high"[^>]*\/>/)
  if (!m) return { present: false, position: -1 }
  const position = html.indexOf(m[0])
  const firstScript = html.indexOf('<script ')
  const isBeforeScripts = firstScript === -1 || position < firstScript
  const isCloudinary = m[0].includes('res.cloudinary.com')
  return {
    present: true,
    position,
    isBeforeScripts,
    isCloudinary,
    hasSrcSet: m[0].includes('srcSet='),
  }
}

function checkPreloadPosition(html) {
  const head = extractHead(html)
  const preloadIdx = head.indexOf('<link rel="preload" as="image"')
  const firstLink   = head.indexOf('<link ')
  const firstScript = html.indexOf('<script ')
  return {
    preloadIsFirstLink: preloadIdx > 0 && preloadIdx === firstLink,
    preloadBeforeScripts: preloadIdx > 0 && preloadIdx < firstScript,
  }
}

function checkLinkHeader(headerValue) {
  if (!headerValue) return { present: false }
  return {
    present: true,
    hasPreload:   /rel=preload/.test(headerValue),
    hasImage:     /as=image/.test(headerValue),
    hasFetchPri:  /fetchpriority=high/i.test(headerValue),
    isCloudinary: headerValue.includes('res.cloudinary.com'),
    raw: headerValue.slice(0, 300),
  }
}

async function probeLocale(locale) {
  const url = `${BASE_URL}/${locale}/listings/${SLUG}`
  let html = ''
  let status = 0
  let linkHeader = { present: false }
  try {
    const res = await fetch(url, { headers: { 'Accept': 'text/html' } })
    status = res.status
    html = await res.text()
    linkHeader = checkLinkHeader(res.headers.get('link') ?? res.headers.get('Link') ?? '')
  } catch (e) {
    return { locale, url, status: 0, error: e.message }
  }

  const preload   = checkPreloadLink(html)
  const img       = checkGalleryImg(html)
  const position  = checkPreloadPosition(html)

  return {
    locale,
    url,
    status,
    linkHeader,
    preload,
    galleryImg: img,
    position,
  }
}

function icon(ok) { return ok ? '✅' : '❌' }

async function main() {
  console.log('='.repeat(60))
  console.log('Listing Detail LCP Profile Baseline')
  console.log('='.repeat(60))
  console.log(`Base URL : ${BASE_URL}`)
  console.log(`Slug     : ${SLUG}`)
  console.log(`Locales  : ${LOCALES.join(', ')}`)
  console.log()

  const results = []
  for (const locale of LOCALES) {
    const r = await probeLocale(locale)
    results.push(r)
  }

  // ── Per-locale report ───────────────────────────────────────────────────
  for (const r of results) {
    console.log(`── ${r.locale.toUpperCase()} ─────────────────────────────`)
    if (r.error) { console.log(`  ERROR: ${r.error}`); continue }
    console.log(`  URL    : ${r.url}`)
    console.log(`  Status : ${r.status}`)
    console.log()
    console.log(`  HTTP Link header (Task 76 — early preload)`)
    if (r.linkHeader?.present) {
      console.log(`    Present          : ${icon(true)}`)
      console.log(`    rel=preload      : ${icon(r.linkHeader.hasPreload)}`)
      console.log(`    as=image         : ${icon(r.linkHeader.hasImage)}`)
      console.log(`    fetchpriority    : ${icon(r.linkHeader.hasFetchPri)}`)
      console.log(`    Cloudinary URL   : ${icon(r.linkHeader.isCloudinary)}`)
      console.log(`    Raw              : ${r.linkHeader.raw}`)
    } else {
      console.log(`    Present          : ${icon(false)} (deploy to Vercel to verify production header)`)
      console.log(`    Note: HTTP Link headers are set in middleware. Running locally against`)
      console.log(`          http://localhost they require "npm run build && npm start" first.`)
    }
    console.log()
    console.log(`  <link rel="preload" as="image"> (HTML body — Task 73)`)
    console.log(`    Present          : ${icon(r.preload.present)} ${r.preload.present}`)
    if (r.preload.present) {
      console.log(`    Location         : ${r.preload.inHead ? '✅ HEAD (optimal)' : '⚠️  BODY (browser discovers post-head-parse)'}`)
      console.log(`    fetchpriority    : ${icon(r.preload.hasFetchPriority)} ${r.preload.fetchPriorityValue ?? 'MISSING'}`)
      console.log(`    Has href         : ${icon(r.preload.hasHref)} ${r.preload.hasHref}`)
      console.log(`    Has imageSrcSet  : ${icon(r.preload.hasImageSrcSet)} ${r.preload.hasImageSrcSet}`)
      console.log(`    Raw              : ${r.preload.raw}`)
    }
    console.log()
    console.log(`  BODY <img fetchPriority="high"> (GalleryStaticFrame)`)
    console.log(`    Present         : ${icon(r.galleryImg.present)} ${r.galleryImg.present}`)
    if (r.galleryImg.present) {
      console.log(`    Before scripts  : ${icon(r.galleryImg.isBeforeScripts)} ${r.galleryImg.isBeforeScripts}`)
      console.log(`    Cloudinary URL  : ${icon(r.galleryImg.isCloudinary)} ${r.galleryImg.isCloudinary}`)
      console.log(`    Has srcSet      : ${icon(r.galleryImg.hasSrcSet)} ${r.galleryImg.hasSrcSet}`)
    }
    console.log()
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))

  const allHaveLinkHeader        = results.every(r => r.linkHeader?.present)
  const allLinkValid             = results.every(r => r.linkHeader?.present && r.linkHeader?.hasPreload && r.linkHeader?.hasImage && r.linkHeader?.isCloudinary)
  const allHavePreload           = results.every(r => r.preload?.present)
  const allPreloadInHead         = results.every(r => r.preload?.inHead)
  const allHaveFetchPriority     = results.every(r => r.preload?.hasFetchPriority)
  const allHaveGalleryImg        = results.every(r => r.galleryImg?.present)
  const allGalleryImgBeforeScripts = results.every(r => r.galleryImg?.isBeforeScripts)

  console.log(`HTTP Link header in ALL locales                : ${icon(allHaveLinkHeader)} ${allHaveLinkHeader ? '' : '(missing — check that server runs with middleware enabled)'}`)
  console.log(`  Link header valid (preload+image+cloudinary) : ${icon(allLinkValid)}`)
  console.log(`HTML <link rel="preload" as="image"> (all)     : ${icon(allHavePreload)}`)
  console.log(`  Preload in <head> (all)                      : ${icon(allPreloadInHead)} ${allPreloadInHead ? '' : '(body only — browser discovers post-head-parse)'}`)
  console.log(`fetchpriority on html preload in ALL locales   : ${icon(allHaveFetchPriority)}`)
  console.log(`<img fetchPriority="high"> in ALL locales      : ${icon(allHaveGalleryImg)}`)
  console.log(`Gallery img appears BEFORE scripts (all)       : ${icon(allGalleryImgBeforeScripts)}`)
  console.log()

  // ── Known issues ─────────────────────────────────────────────────────────
  const issues = []
  if (!allHavePreload) {
    const missing = results.filter(r => !r.preload?.present).map(r => r.locale)
    issues.push(`ISSUE: <link rel="preload" as="image"> missing for locales: ${missing.join(', ')}`)
    issues.push('  Likely cause: React 19 preload() deduplication persisting across SSR requests.')
    issues.push('  Fix: use native JSX <link rel="preload"> in the RSC page tree (Task 73 approach).')
  }
  if (!allHaveFetchPriority) {
    issues.push('ISSUE: fetchpriority="high" is ABSENT from <link rel="preload"> tags')
    issues.push('  Fix: ensure fetchPriority="high" is set on the native <link> element.')
  }
  if (!allPreloadInHead) {
    const bodyOnly = results.filter(r => r.preload?.present && !r.preload?.inHead).map(r => r.locale)
    issues.push(`KNOWN LIMITATION: Preload link in <body> (not <head>) for locales: ${bodyOnly.join(', ')}`)
    issues.push('  React 19 SSR: <link> hoisting to <head> is a client-side (post-hydration) operation.')
    issues.push('  The preload is still emitted but browser discovers it during body parsing, not head.')
    issues.push('  For true <head> preload: use Next.js middleware to set HTTP Link response headers.')
    issues.push('  e.g.: Link: <https://res.cloudinary.com/...>; rel=preload; as=image; fetchpriority=high')
  }
  if (!allHaveLinkHeader) {
    const missing = results.filter(r => !r.linkHeader?.present).map(r => r.locale)
    issues.push(`NOTE: HTTP Link header missing for locales: ${missing.join(', ')}`)
    issues.push('  Expected in production (Task 76). Requires "npm run build && npm start" locally.')
    issues.push('  Validate header after deploy: npm run profile:lcp:production -- --preload-only')
  }
  if (issues.length === 0) {
    console.log('No critical preload issues found.')
  } else {
    issues.forEach(i => console.log(i))
  }
  console.log()

  // ── Viewport note ────────────────────────────────────────────────────────
  console.log('VIEWPORT NOTE')
  console.log('Preload behavior is viewport-independent (HTML is the same for all viewports).')
  console.log('LCP timing varies by viewport — run Lighthouse per viewport for full data:')
  for (const v of VIEWPORTS) {
    console.log(`  npx lighthouse ${BASE_URL}/sq/listings/${SLUG} --emulated-form-factor=mobile --screenEmulation.width=${v.w} --screenEmulation.height=${v.h} --view`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
