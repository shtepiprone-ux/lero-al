#!/usr/bin/env node
/**
 * validate-production-lcp.mjs
 *
 * Production LCP validation for the Listing Detail Performance / LCP Epic (Task 75).
 *
 * What it does:
 *   1. Fetches live production HTML for each locale and verifies preload hints.
 *   2. Checks for native <link rel="preload" as="image" fetchpriority="high">.
 *   3. Verifies SSR hero <img fetchPriority="high" loading="eager">.
 *   4. Runs Lighthouse against live production URLs (mobile + desktop) if Chrome is present.
 *   5. Optionally uses PageSpeed Insights API if PAGESPEED_API_KEY env var is set.
 *   6. Saves artifacts to .artifacts/production-lcp/ (gitignored).
 *
 * Usage:
 *   node scripts/validate-production-lcp.mjs [BASE_URL] [SLUG]
 *
 * Examples:
 *   node scripts/validate-production-lcp.mjs https://lero.al test-7-molyl9c8
 *   node scripts/validate-production-lcp.mjs https://lero.al some-real-slug
 *
 *   # With PageSpeed Insights API:
 *   PAGESPEED_API_KEY=your_key node scripts/validate-production-lcp.mjs https://lero.al test-7-molyl9c8
 *
 *   # Preload-only (no Lighthouse):
 *   node scripts/validate-production-lcp.mjs https://lero.al test-7-molyl9c8 --preload-only
 *
 * Output directory: .artifacts/production-lcp/
 *
 * Requires:
 *   - Node.js 18+ (native fetch)
 *   - lighthouse (devDependency) — for Lighthouse runs
 *   - Google Chrome — for Lighthouse runs
 *
 * Task 74 localhost baselines (for comparison):
 *   Mobile 375px: sq=1400ms, en=1405ms, uk=1406ms, it=1519ms (all GOOD)
 *   Desktop 1280px: sq=908ms, en=572ms, uk=273ms, it=443ms (all GOOD)
 *
 * Locales:    sq, en, uk, it
 * Viewports:  320, 375, 390, 768, 1280, 1440, 2560 (documented)
 * Deep runs:  375 (mobile) + 1280 (desktop) via Lighthouse
 */

import { createRequire } from 'module'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const require      = createRequire(import.meta.url)
const __dirname    = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const ARTIFACTS    = path.join(PROJECT_ROOT, '.artifacts', 'production-lcp')

const BASE_URL     = process.argv[2] || 'https://lero.al'
const SLUG         = process.argv[3] || 'test-7-molyl9c8'
const PRELOAD_ONLY = process.argv.includes('--preload-only')
const PSI_KEY      = process.env.PAGESPEED_API_KEY || ''

const LOCALES = ['sq', 'en', 'uk', 'it']

const VIEWPORTS = [
  { name: '320-mobile',   width: 320,  height: 568,  mobile: true,  deep: false },
  { name: '375-mobile',   width: 375,  height: 667,  mobile: true,  deep: true  },
  { name: '390-mobile',   width: 390,  height: 844,  mobile: true,  deep: false },
  { name: '768-tablet',   width: 768,  height: 1024, mobile: false, deep: false },
  { name: '1280-desktop', width: 1280, height: 800,  mobile: false, deep: true  },
  { name: '1440-desktop', width: 1440, height: 900,  mobile: false, deep: false },
  { name: '2560-huge',    width: 2560, height: 1440, mobile: false, deep: false },
]

// Task 74 localhost baselines for comparison
const TASK74_BASELINE = {
  mobile_375: { sq: 1400, en: 1405, uk: 1406, it: 1519 },
  desktop_1280: { sq: 908, en: 572, uk: 273, it: 443 },
}

// ── HTTP Link header analysis ─────────────────────────────────────────────────
//
// Two-strategy parser for the combined HTTP Link header.
//
// The full header contains hreflang alternates (from next-intl middleware),
// optional Next.js static-asset preloads, and our Cloudinary image preload.
// All are combined by the middleware into a single header value.
//
// Strategy 1: RFC 8288-aware comma-split (respects quoted strings).
// Strategy 2: Direct regex scan for the Cloudinary URL (fallback for edge
//             cases where normalised \\n joins or unusual whitespace confuse
//             the split).

function splitLinkEntries(rawHeader) {
  // Normalise: multiple Link header values joined with \\n (e.g. from CDP or
  // Node.js undici when the server sent two separate Link header fields).
  const h = rawHeader.replace(/\r?\n/g, ', ')
  const entries = []
  let cur = '', inQ = false
  for (const ch of h) {
    if (ch === '"') { inQ = !inQ; cur += ch }
    else if (ch === ',' && !inQ) { entries.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  if (cur.trim()) entries.push(cur.trim())
  return entries
}

function findCloudinaryPreload(rawHeader) {
  if (!rawHeader) return null
  const h = rawHeader.replace(/\r?\n/g, ', ')

  // Strategy 1: RFC 8288-aware entry split
  for (const e of splitLinkEntries(h)) {
    const lo = e.toLowerCase()
    if (!lo.includes('res.cloudinary.com')) continue
    if (!/\brel\s*=\s*"?preload"?\b/.test(lo)) continue
    if (!/\bas\s*=\s*"?image"?\b/.test(lo)) continue
    const urlM = e.match(/^<([^>]+)>/)
    if (urlM) return { href: urlM[1], raw: e.slice(0, 300), method: 'rfc8288' }
  }

  // Strategy 2: Locate any Cloudinary URL in the header and check the
  // parameters that follow it for rel=preload and as=image.
  const cdnRe = /<(https:\/\/res\.cloudinary\.com\/[^>]+)>/gi
  let m
  while ((m = cdnRe.exec(h)) !== null) {
    const after = h.slice(m.index + m[0].length, m.index + m[0].length + 200)
    const lo = after.toLowerCase()
    if (/\brel\s*=\s*"?preload"?\b/.test(lo) && /\bas\s*=\s*"?image"?\b/.test(lo)) {
      const entry = (m[0] + after.split(/[,<]/)[0]).slice(0, 300)
      return { href: m[1], raw: entry, method: 'direct' }
    }
  }
  return null
}

function probeLinkHeader(headerValue) {
  if (!headerValue) return { present: false }

  const h = headerValue.replace(/\r?\n/g, ', ')
  const entries   = splitLinkEntries(h)
  const totalEntries  = entries.length
  const alternateCount = entries.filter(e => /\brel\s*=\s*"?alternate"?\b/i.test(e)).length

  const found = findCloudinaryPreload(h)
  if (!found) {
    return {
      present: true,
      hasImagePreload: false,
      totalEntries,
      alternateCount,
      raw: headerValue.slice(0, 600),
      valid: false,
    }
  }

  const hasFetchPri  = /\bfetchpriority=high\b/i.test(found.raw)
  const hasImgSrcSet = /\bimagesrcset=/i.test(found.raw)
  const widthMatch   = found.href.match(/[,/]w_(\d+)/)

  return {
    present: true,
    hasImagePreload: true,
    hasPreload: true,
    hasImage: true,
    hasFetchPriority: hasFetchPri,
    hasImgSrcSet,
    isCloudinary: true,
    url: found.href,
    preloadWidth: widthMatch ? Number(widthMatch[1]) : null,
    parserMethod: found.method,
    totalEntries,
    alternateCount,
    preloadEntryRaw: found.raw,
    raw: headerValue.slice(0, 600),
    valid: true,
  }
}

// ── HTML analysis helpers ─────────────────────────────────────────────────────

function extractHead(html) {
  const end = html.indexOf('</head>')
  return end > 0 ? html.slice(0, end) : html.slice(0, 8000)
}

function probePreload(html) {
  const headEnd = html.indexOf('</head>')
  const head = extractHead(html)
  const headMatch = head.match(/<link[^>]*rel="preload"[^>]*as="image"[^>]*\/?>/)
  const bodyMatch = html.slice(headEnd > 0 ? headEnd : 0).match(/<link[^>]*rel="preload"[^>]*as="image"[^>]*\/?>/)
  const tag = headMatch?.[0] ?? bodyMatch?.[0] ?? null
  if (!tag) return { present: false, inHead: false, hasFetchPriority: false, raw: null }
  return {
    present: true,
    inHead: !!headMatch,
    hasFetchPriority: /fetchpriority/i.test(tag),
    fetchPriorityValue: tag.match(/fetchpriority="([^"]*)"/i)?.[1] ?? null,
    href: tag.match(/href="([^"]*)"/)?.[1] ?? null,
    isCloudinary: tag.includes('res.cloudinary.com'),
    raw: tag.slice(0, 300),
  }
}

function probeGalleryImg(html) {
  const m = html.match(/<img[^>]*fetchPriority="high"[^>]*\/?>/)
  if (!m) return { present: false }
  return {
    present: true,
    isCloudinary: m[0].includes('res.cloudinary.com'),
    hasSrcSet: m[0].includes('srcSet='),
    hasEager: m[0].includes('loading="eager"'),
    raw: m[0].slice(0, 300),
  }
}

function probePreconnect(html) {
  const head = extractHead(html)
  const m = head.match(/<link[^>]*rel="preconnect"[^>]*res\.cloudinary\.com[^>]*\/?>/)
  return { present: !!m }
}

// ── Production HTML fetch ─────────────────────────────────────────────────────

async function fetchProduction(locale) {
  const url = `${BASE_URL}/${locale}/listings/${SLUG}`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; lero-lcp-validator/1.0)',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)
    const html = await res.text()
    const rawLinkHeader = res.headers.get('link') ?? res.headers.get('Link') ?? ''
    return {
      locale, url, status: res.status,
      linkHeader: probeLinkHeader(rawLinkHeader),
      preload: probePreload(html),
      galleryImg: probeGalleryImg(html),
      preconnect: probePreconnect(html),
      redirected: res.redirected,
      finalUrl: res.url,
    }
  } catch (e) {
    return { locale, url, status: 0, error: e.message }
  }
}

// ── PageSpeed Insights API ────────────────────────────────────────────────────

async function runPageSpeedInsights(url, strategy) {
  if (!PSI_KEY) return { error: 'No PAGESPEED_API_KEY env var set. Skipping PSI.' }
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${PSI_KEY}`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    const res = await fetch(endpoint, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return { error: `PSI API error: HTTP ${res.status}` }
    const data = await res.json()
    const cats = data.lighthouseResult?.categories
    const audits = data.lighthouseResult?.audits
    const lcp   = audits?.['largest-contentful-paint']
    const fcp   = audits?.['first-contentful-paint']
    const tbt   = audits?.['total-blocking-time']
    const cls   = audits?.['cumulative-layout-shift']
    const si    = audits?.['speed-index']
    const ttfb  = audits?.['server-response-time']
    const lcpEl = audits?.['largest-contentful-paint-element']
    return {
      source: 'psi',
      strategy,
      lcp_ms:    Math.round(lcp?.numericValue ?? 0),
      lcp_score: lcp?.score ?? null,
      lcp_rating: lcp?.score != null ? (lcp.score >= 0.9 ? 'GOOD' : lcp.score >= 0.5 ? 'NEEDS_IMPROVEMENT' : 'POOR') : null,
      fcp_ms:    Math.round(fcp?.numericValue ?? 0),
      tbt_ms:    Math.round(tbt?.numericValue ?? 0),
      cls:       cls?.numericValue ?? 0,
      si_ms:     Math.round(si?.numericValue ?? 0),
      ttfb_ms:   Math.round(ttfb?.numericValue ?? 0),
      perf_score: Math.round((cats?.performance?.score ?? 0) * 100),
      lcp_element: lcpEl?.details?.items?.[0]?.node?.snippet ?? null,
    }
  } catch (e) {
    return { error: `PSI request failed: ${e.message}` }
  }
}

// ── Lighthouse LCP element extraction (multi-version) ────────────────────────
//
// Lighthouse 10-11: audits['lcp-element'].details.items[0].node.snippet
// Lighthouse 12-13: audits['lcp-element'].details.items[0].items[0].node.snippet
// (The audit was refactored to use a nested table in Lighthouse 12.)

function extractLcpElement(lcpAudit) {
  if (!lcpAudit?.details?.items?.length) return null
  const items = lcpAudit.details.items
  // Lighthouse 10-11 path
  const v1 = items[0]?.node?.snippet
  if (v1) return v1
  // Lighthouse 12-13 nested table path
  const v2 = items[0]?.items?.[0]?.node?.snippet
  if (v2) return v2
  // Fallback: stringify first item for debugging
  return JSON.stringify(items[0])?.slice(0, 200) ?? null
}

// ── Lighthouse runner (same as compare-listing-lcp-lighthouse.mjs) ────────────

const CHROME_PATH = process.env.CHROME_PATH
  || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

async function runLighthouse(url, viewport) {
  let lighthouse, chromeLauncher
  try {
    const lhModule = require('lighthouse')
    lighthouse     = lhModule.default ?? lhModule
    chromeLauncher = require('chrome-launcher')
  } catch (e) {
    return { error: `Missing dependency: ${e.message}. Run: npm install lighthouse` }
  }

  let chrome
  try {
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
      chromePath: CHROME_PATH,
    })
  } catch (e) {
    return { error: `Chrome launch failed: ${e.message}. Verify CHROME_PATH or install Chrome.` }
  }

  const mobileUA  = 'Mozilla/5.0 (Linux; Android 11; moto g power) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
  const desktopUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'

  const options = {
    logLevel: 'silent',
    output: ['json', 'html'],
    port: chrome.port,
    formFactor: viewport.mobile ? 'mobile' : 'desktop',
    screenEmulation: {
      mobile: viewport.mobile,
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.mobile ? 2 : 1,
      disabled: false,
    },
    emulatedUserAgent: viewport.mobile ? mobileUA : desktopUA,
    throttlingMethod: 'simulate',
    throttling: viewport.mobile ? {
      rttMs: 40,
      throughputKbps: 10240,
      requestLatencyMs: 0,
      downloadThroughputKbps: 10240,
      uploadThroughputKbps: 10240,
      cpuSlowdownMultiplier: 4,
    } : {
      rttMs: 0,
      throughputKbps: 0,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
      cpuSlowdownMultiplier: 1,
    },
  }

  let result
  try {
    result = await lighthouse(url, options)
  } catch (e) {
    await chrome.kill()
    return { error: `Lighthouse error: ${e.message}` }
  }
  await chrome.kill()

  const lhr    = result.lhr
  const cats   = lhr.categories
  const audits = lhr.audits
  const lcp    = audits['largest-contentful-paint']
  const fcp    = audits['first-contentful-paint']
  const tbt    = audits['total-blocking-time']
  const cls    = audits['cumulative-layout-shift']
  const si     = audits['speed-index']
  const ttfb   = audits['server-response-time']
  const lcpEl  = audits['largest-contentful-paint-element']

  const metrics = {
    source: 'lighthouse-cli',
    viewport: viewport.name,
    lcp_ms:    Math.round(lcp?.numericValue ?? 0),
    lcp_score: lcp?.score ?? null,
    lcp_rating: lcp?.score != null ? (lcp.score >= 0.9 ? 'GOOD' : lcp.score >= 0.5 ? 'NEEDS_IMPROVEMENT' : 'POOR') : null,
    fcp_ms:    Math.round(fcp?.numericValue ?? 0),
    tbt_ms:    Math.round(tbt?.numericValue ?? 0),
    cls:       cls?.numericValue ?? 0,
    si_ms:     Math.round(si?.numericValue ?? 0),
    ttfb_ms:   Math.round(ttfb?.numericValue ?? 0),
    perf_score: Math.round((cats?.performance?.score ?? 0) * 100),
    lcp_element: extractLcpElement(lcpEl),
  }

  try {
    await mkdir(ARTIFACTS, { recursive: true })
    const reportPath = path.join(ARTIFACTS, `lh-${viewport.name}.html`)
    await writeFile(reportPath, result.report[1])
    metrics.reportPath = reportPath
  } catch {}

  return metrics
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function icon(ok) { return ok ? '✅' : '❌' }
function fmt(ms)  { return `${ms}ms` }
function ratingStr(ms) {
  if (!ms) return ''
  if (ms <= 2500)  return '🟢 GOOD'
  if (ms <= 4000)  return '🟡 NEEDS IMPROVEMENT'
  return '🔴 POOR'
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(72))
  console.log('Listing Detail Production LCP Validation (Task 75)')
  console.log('='.repeat(72))
  console.log(`Base URL     : ${BASE_URL}`)
  console.log(`Slug         : ${SLUG}`)
  console.log(`Locales      : ${LOCALES.join(', ')}`)
  console.log(`PSI API key  : ${PSI_KEY ? '✅ set' : '❌ not set (Lighthouse CLI fallback)'}`)
  console.log(`Preload-only : ${PRELOAD_ONLY}`)
  console.log()

  // ── Step 1: Production HTML probes ─────────────────────────────────────────
  console.log('── Step 1: Production HTML Preload Probe ──────────────────────────')
  const htmlResults = []
  for (const locale of LOCALES) {
    process.stdout.write(`  Fetching ${locale} ... `)
    const r = await fetchProduction(locale)
    htmlResults.push(r)
    if (r.error) {
      console.log(`ERROR: ${r.error}`)
      continue
    }
    const p = r.preload
    const g = r.galleryImg
    const lh = r.linkHeader
    const linkStatus = lh?.present
      ? `✅ | rel=${lh.hasPreload ? '✅' : '❌'} as=${lh.hasImage ? '✅' : '❌'} fp=${lh.hasFetchPriority ? '✅' : '❌'} srcset=${lh.hasImgSrcSet ? '✅' : '❌'} cdn=${lh.isCloudinary ? '✅' : '❌'}`
      : '❌ MISSING'
    const preloadStatus = p.present
      ? (p.inHead ? '✅ HEAD' : '⚠️  BODY') + ` | fetchpriority=${p.hasFetchPriority ? `✅ ${p.fetchPriorityValue}` : '❌'} | cloudinary=${p.isCloudinary ? '✅' : '❌'}`
      : '❌ MISSING'
    console.log(`HTTP ${r.status} | Link header=${linkStatus}`)
    console.log(`         | html preload=${preloadStatus} | img=${g.present ? '✅' : '❌'} eager=${g.hasEager ? '✅' : '❌'} | preconnect=${r.preconnect?.present ? '✅' : '❌'}`)
  }

  console.log()
  const allOk       = htmlResults.filter(r => !r.error)
  const allHttp200  = allOk.every(r => r.status === 200)
  const allLinkHdr  = allOk.every(r => r.linkHeader?.present)
  const allLinkValid= allOk.every(r => r.linkHeader?.valid)
  const allLinkFP   = allOk.every(r => r.linkHeader?.hasFetchPriority)
  const allPreload  = allOk.every(r => r.preload?.present)
  const allFetchPri = allOk.every(r => r.preload?.hasFetchPriority)
  const allImg      = allOk.every(r => r.galleryImg?.present)
  const allEager    = allOk.every(r => r.galleryImg?.hasEager)

  console.log(`  All locales HTTP 200            : ${icon(allHttp200)}`)
  console.log(`  HTTP Link header in all locales : ${icon(allLinkHdr)}`)
  console.log(`  Link header valid (all)         : ${icon(allLinkValid)}  (rel=preload + as=image + cloudinary)`)
  console.log(`  Link fetchpriority=high (all)   : ${icon(allLinkFP)}`)
  console.log(`  HTML preload in all locales     : ${icon(allPreload)}`)
  console.log(`  HTML fetchpriority in all       : ${icon(allFetchPri)}`)
  console.log(`  Gallery img in all              : ${icon(allImg)}`)
  console.log(`  eager loading in all            : ${icon(allEager)}`)
  console.log()

  // Check if slug produced 404s
  const missing = allOk.filter(r => r.status === 404)
  if (missing.length > 0) {
    console.log(`⚠️  WARNING: ${missing.length} locale(s) returned HTTP 404.`)
    console.log('   The slug may not exist in production. Using 404 response for HTML probe.')
    console.log('   Update SLUG argument to use a known production listing slug.')
    console.log()
  }

  if (PRELOAD_ONLY) {
    console.log('--preload-only flag set. Skipping Lighthouse / PSI runs.')
    await saveArtifacts(htmlResults, [])
    return
  }

  // ── Step 2: PageSpeed Insights or Lighthouse ────────────────────────────────
  const perfResults = []

  if (PSI_KEY) {
    console.log('── Step 2: PageSpeed Insights API ────────────────────────────────')
    for (const locale of LOCALES) {
      const url = `${BASE_URL}/${locale}/listings/${SLUG}`
      for (const strategy of ['mobile', 'desktop']) {
        process.stdout.write(`  PSI ${locale} @ ${strategy} ... `)
        const r = await runPageSpeedInsights(url, strategy)
        perfResults.push({ locale, url, ...r })
        if (r.error) {
          console.log(`SKIPPED: ${r.error}`)
        } else {
          console.log(`LCP=${fmt(r.lcp_ms)} ${r.lcp_rating || ''} | FCP=${fmt(r.fcp_ms)} | TBT=${fmt(r.tbt_ms)} | CLS=${(r.cls ?? 0).toFixed(3)} | Perf=${r.perf_score}`)
        }
      }
    }
  } else {
    console.log('── Step 2: Lighthouse CLI (no PSI key) ───────────────────────────')
    console.log('   Running Lighthouse against live production URLs.')
    console.log('   Note: Lighthouse CLI against remote URLs includes real network latency.')
    console.log()
    const deepVPs = VIEWPORTS.filter(v => v.deep)
    for (const vp of deepVPs) {
      for (const locale of LOCALES) {
        const url = `${BASE_URL}/${locale}/listings/${SLUG}`
        process.stdout.write(`  Lighthouse ${locale} @ ${vp.name} ... `)
        const r = await runLighthouse(url, vp)
        perfResults.push({ locale, url, ...r })
        if (r.error) {
          console.log(`ERROR: ${r.error}`)
        } else {
          console.log(`LCP=${fmt(r.lcp_ms)} ${r.lcp_rating || ''} | FCP=${fmt(r.fcp_ms)} | TBT=${fmt(r.tbt_ms)} | CLS=${(r.cls ?? 0).toFixed(3)} | Perf=${r.perf_score}`)
        }
      }
    }
  }

  // ── Step 3: Summary ─────────────────────────────────────────────────────────
  console.log()
  console.log('='.repeat(72))
  console.log('SUMMARY — Task 74 Baseline vs Production')
  console.log('='.repeat(72))
  console.log()
  console.log('Task 74 localhost baseline (4× CPU, 10 Mbps simulated):')
  console.log('  Mobile 375px : sq=1400ms 🟢 | en=1405ms 🟢 | uk=1406ms 🟢 | it=1519ms 🟢')
  console.log('  Desktop 1280 : sq=908ms 🟢 | en=572ms 🟢 | uk=273ms 🟢 | it=443ms 🟢')
  console.log()

  const successPerf = perfResults.filter(r => !r.error && r.lcp_ms)
  if (successPerf.length > 0) {
    console.log('Production results:')
    for (const r of successPerf) {
      const strategy = r.strategy || r.viewport || 'unknown'
      const baseline = strategy.includes('mobile') || r.viewport?.includes('mobile')
        ? TASK74_BASELINE.mobile_375[r.locale]
        : TASK74_BASELINE.desktop_1280[r.locale]
      const delta = baseline ? ` (baseline=${baseline}ms, delta=${r.lcp_ms - baseline >= 0 ? '+' : ''}${r.lcp_ms - baseline}ms)` : ''
      console.log(`  ${r.locale} @ ${strategy}: LCP=${fmt(r.lcp_ms)} ${r.lcp_rating || ratingStr(r.lcp_ms)}${delta}`)
    }
    console.log()

    // Epic closure decision
    const allGood = successPerf.every(r => r.lcp_rating === 'GOOD' || (!r.lcp_rating && r.lcp_ms <= 2500))
    const anyPoor = successPerf.some(r => r.lcp_rating === 'POOR' || (!r.lcp_rating && r.lcp_ms > 4000))
    const anyNI   = successPerf.some(r => r.lcp_rating === 'NEEDS_IMPROVEMENT' || (!r.lcp_rating && r.lcp_ms > 2500 && r.lcp_ms <= 4000))

    console.log('Epic closure decision:')
    if (allGood) {
      console.log('  ✅ All production LCP results are GOOD.')
      console.log('  ✅ Listing Detail Performance / LCP Epic can be CLOSED.')
      console.log('  → HTTP Link response headers are NOT currently justified.')
    } else if (anyPoor) {
      console.log('  🔴 POOR LCP detected in production.')
      console.log('  → Investigate: Cloudinary image delivery, CDN caching, or HTTP Link headers.')
    } else if (anyNI) {
      console.log('  🟡 NEEDS IMPROVEMENT in some production locales.')
      console.log('  → Consider: Cloudinary quality/format tuning, HTTP Link headers via Next.js middleware.')
    }
  } else {
    console.log('No perf results available — HTML probe only (--preload-only or Lighthouse not available).')
    console.log('Run with PAGESPEED_API_KEY set for full production validation:')
    for (const locale of LOCALES) {
      console.log(`  PAGESPEED_API_KEY=<key> node scripts/validate-production-lcp.mjs ${BASE_URL} ${SLUG}`)
    }
    console.log()
    console.log('Lighthouse CLI viewport commands:')
    for (const vp of VIEWPORTS) {
      const form = vp.mobile ? '--emulated-form-factor=mobile' : '--emulated-form-factor=desktop'
      console.log(`  npx lighthouse ${BASE_URL}/sq/listings/${SLUG} ${form} --screenEmulation.width=${vp.width} --screenEmulation.height=${vp.height} --view`)
    }
  }

  await saveArtifacts(htmlResults, perfResults)
}

async function saveArtifacts(htmlResults, perfResults) {
  try {
    await mkdir(ARTIFACTS, { recursive: true })
    const summary = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      slug: SLUG,
      task74Baseline: TASK74_BASELINE,
      htmlProbeResults: htmlResults,
      perfResults,
    }
    const summaryPath = path.join(ARTIFACTS, 'summary.json')
    await writeFile(summaryPath, JSON.stringify(summary, null, 2))
    console.log()
    console.log(`Summary saved: ${summaryPath}`)
    if (perfResults.some(r => r.reportPath)) {
      console.log(`Lighthouse reports: ${ARTIFACTS}/`)
    }
  } catch (e) {
    console.error('Failed to save summary:', e.message)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
