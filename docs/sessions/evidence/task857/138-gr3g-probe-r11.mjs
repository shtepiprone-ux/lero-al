// Task 857 Revision 11, R71 (133-gr3g-probe-r10.mjs re-run; only the output name changed) — was R66 — GR-3g probe (DPR 1, sq, 390 and 1440). For every element that draws a line (border, outline,
// non-none box-shadow) in each state, find each clipping ancestor (overflow != visible, radius > 0) whose corner the element's
// box touches, and record both radii. A corner is cut when the element's radius there is smaller than the ancestor's and the
// line reaches that corner.
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const EV = 'C:/Claude_Code_Projects/lero-al/docs/sessions/evidence/task857'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6133)

const STORIES = [
  'patterns-mantine-navrowlist--default',
  'patterns-mantine-detaillist--default',
  'patterns-mantine-dialogsections--default',
  'patterns-mantine-dialogfooter--default',
  'patterns-mantine-listingpreviewdialogview--active',
  'patterns-mantine-listingpreviewdialogview--delete-confirm',
  'patterns-mantine-premiumdialogview--not-premium',
  'patterns-mantine-premiumdialogview--premium',
  'patterns-mantine-admintable--default',
  'patterns-mantine-adminlistingsview--default',
  'mantine-primitives-table--default',
  'mantine-primitives-radio--default',
]
const WIDTHS = [390, 1440]

// in-page: returns the cut corners and counts for the current state
const scan = () => {
  const px = (v) => parseFloat(v) || 0
  const desc = (el) => {
    const parts = []
    for (let e = el; e && e !== document.body && parts.length < 4; e = e.parentElement) {
      const cls = [...e.classList].filter((c) => /^mantine-|^_|row|list/i.test(c)).slice(0, 2).join('.')
      parts.unshift(e.tagName.toLowerCase() + (e.hasAttribute('data-nav-row') ? '[data-nav-row]' : '') + (cls ? '.' + cls : ''))
    }
    return parts.join(' > ')
  }
  const cuts = []
  let linesSeen = 0
  let pairsSeen = 0
  const all = [...document.body.querySelectorAll('*')]
  for (const el of all) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || cs.display === 'none') continue
    const side = (s) => px(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none' && !/rgba\(\d+, \d+, \d+, 0\)|transparent/.test(cs[`border${s}Color`])
    const b = { T: side('Top'), R: side('Right'), B: side('Bottom'), L: side('Left') }
    const outline = cs.outlineStyle !== 'none' && px(cs.outlineWidth) > 0
    const shadow = cs.boxShadow !== 'none'
    const any = b.T || b.R || b.B || b.L || outline || shadow
    if (!any) continue
    linesSeen++
    const reach = { tl: b.T || b.L || outline || shadow, tr: b.T || b.R || outline || shadow, bl: b.B || b.L || outline || shadow, br: b.B || b.R || outline || shadow }
    const elRad = { tl: px(cs.borderTopLeftRadius), tr: px(cs.borderTopRightRadius), bl: px(cs.borderBottomLeftRadius), br: px(cs.borderBottomRightRadius) }
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const ac = getComputedStyle(a)
      if (ac.overflowX === 'visible' && ac.overflowY === 'visible') continue
      const aRad = { tl: px(ac.borderTopLeftRadius), tr: px(ac.borderTopRightRadius), bl: px(ac.borderBottomLeftRadius), br: px(ac.borderBottomRightRadius) }
      if (!aRad.tl && !aRad.tr && !aRad.bl && !aRad.br) continue
      const ar = a.getBoundingClientRect()
      const bw = { l: px(ac.borderLeftWidth), t: px(ac.borderTopWidth), r: px(ac.borderRightWidth), b: px(ac.borderBottomWidth) }
      // the clip is the padding box; its corner radius is the ancestor's radius minus the border width on both sides
      const clip = { l: ar.left + bw.l, t: ar.top + bw.t, r: ar.right - bw.r, b: ar.bottom - bw.b }
      const geo = {
        tl: { rad: Math.max(0, aRad.tl - Math.max(bw.l, bw.t)), cx: clip.l, cy: clip.t, sx: 1, sy: 1 },
        tr: { rad: Math.max(0, aRad.tr - Math.max(bw.r, bw.t)), cx: clip.r, cy: clip.t, sx: -1, sy: 1 },
        bl: { rad: Math.max(0, aRad.bl - Math.max(bw.l, bw.b)), cx: clip.l, cy: clip.b, sx: 1, sy: -1 },
        br: { rad: Math.max(0, aRad.br - Math.max(bw.r, bw.b)), cx: clip.r, cy: clip.b, sx: -1, sy: -1 },
      }
      const corner = { tl: [r.left, r.top], tr: [r.right, r.top], bl: [r.left, r.bottom], br: [r.right, r.bottom] }
      const inward = { tl: [1, 1], tr: [-1, 1], bl: [1, -1], br: [-1, -1] }
      const near = {}
      for (const k of ['tl', 'tr', 'bl', 'br']) {
        const g = geo[k]
        // clip-corner-relative coordinates, x/y growing into the clip
        const rel = (x, y) => [(x - g.cx) * g.sx, (y - g.cy) * g.sy]
        const e = elRad[k]
        let clipped = false
        let touches = false
        // sample the element's own corner curve (or its square corner when e = 0)
        for (let i = 0; i <= 24; i++) {
          const t = (i / 24) * (Math.PI / 2)
          const [ix, iy] = inward[k]
          const ecx = corner[k][0] + ix * e, ecy = corner[k][1] + iy * e
          const px_ = ecx - ix * e * Math.cos(t), py_ = ecy - iy * e * Math.sin(t)
          const [rx, ry] = rel(px_, py_)
          if (rx < g.rad && ry < g.rad) {
            touches = true
            const d = Math.hypot(g.rad - rx, g.rad - ry)
            if (d > g.rad + 0.6 || rx < -0.6 || ry < -0.6) clipped = true
          } else if (rx < -0.6 || ry < -0.6) { touches = true; clipped = true }
        }
        near[k] = touches || (corner[k] && Math.abs(rel(...corner[k])[0]) < 1.5 && Math.abs(rel(...corner[k])[1]) < 1.5)
        geo[k].clipped = clipped
      }
      for (const k of ['tl', 'tr', 'bl', 'br']) {
        if (!near[k] || aRad[k] === 0) continue
        pairsSeen++
        if (reach[k] && geo[k].clipped) {
          cuts.push({ element: desc(el), ancestor: desc(a), corner: k, ancestorRadius: aRad[k], elementRadius: elRad[k], border: b, outline, shadow: shadow ? cs.boxShadow.slice(0, 60) : 'none' })
        }
      }
    }
  }
  return { cuts, linesSeen, pairsSeen }
}

const browser = await chromium.launch()
const results = []
const seen = new Set()
let cutTotal = 0
const record = async (page, story, width, state) => {
  const r = await page.evaluate(scan)
  for (const c of r.cuts) {
    const key = [story, width, c.element, c.ancestor, c.corner].join('|')
    if (seen.has(key)) continue
    seen.add(key); cutTotal++
    results.push({ story, width, state, ...c })
  }
  return r
}
const summary = []
for (const story of STORIES) {
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`http://127.0.0.1:6133/iframe.html?id=${story}&globals=locale:sq&viewMode=story`)
    await page.waitForTimeout(1500)
    const row = { story, width, states: 0, linesSeen: 0, pairsSeen: 0, tabs: 0, hovers: 0 }
    const add = (r) => { row.states++; row.linesSeen = Math.max(row.linesSeen, r.linesSeen); row.pairsSeen = Math.max(row.pairsSeen, r.pairsSeen) }
    add(await record(page, story, width, 'rest'))
    // hover the first and last row of every list or table
    const groups = await page.evaluate(() => {
      const sel = '[data-nav-row], tbody > tr, [role=row], [data-detail-row]'
      const els = [...document.querySelectorAll(sel)]
      const byParent = new Map()
      for (const e of els) { const p = e.parentElement; if (!byParent.has(p)) byParent.set(p, []); byParent.get(p).push(e) }
      const picks = []
      for (const list of byParent.values()) { picks.push(els.indexOf(list[0])); if (list.length > 1) picks.push(els.indexOf(list.at(-1))) }
      return picks
    })
    for (const idx of groups) {
      const h = page.locator('[data-nav-row], tbody > tr, [role=row], [data-detail-row]').nth(idx)
      try { await h.hover({ timeout: 2000 }); await page.waitForTimeout(150); add(await record(page, story, width, `hover #${idx}`)); row.hovers++ } catch {}
    }
    await page.mouse.move(0, 0)
    // Tab through every focusable (cap 30)
    await page.evaluate(() => document.activeElement?.blur())
    const first = await page.evaluate(() => null)
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab'); await page.waitForTimeout(120)
      const info = await page.evaluate(() => ({ tag: document.activeElement?.tagName, vis: document.activeElement?.matches?.(':focus-visible') }))
      if (info.tag === 'BODY') break
      row.tabs++
      add(await record(page, story, width, `tab ${i + 1}`))
    }
    summary.push(row)
    await ctx.close()
  }
}
fs.writeFileSync(`${EV}/138-gr3g-probe-r11.json`, JSON.stringify({ platform: `${process.platform} ${process.version}`, dpr: 1, locale: 'sq', widths: WIDTHS, cutCorners: cutTotal, cuts: results, coverage: summary }, null, 2))
await browser.close(); server.close()
console.log('cut corners:', cutTotal)
console.table(summary)
for (const c of results) console.log(JSON.stringify(c))
