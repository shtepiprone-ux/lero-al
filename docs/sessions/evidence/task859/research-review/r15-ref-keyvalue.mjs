// Task 859 review 15b (Opus) - GR-7 live check: how the standing references show a record's labelled fields at a
// phone width (390) and on desktop (1440). For each page: DPR-1 screenshot, and every pair of short text leaves where
// a muted "label" leaf is followed by a "value" leaf in the same parent: stacked (value below) or inline (beside),
// plus the vertical gap label -> value when stacked. usage: node r15-ref-keyvalue.mjs <outDir> > r15-ref-keyvalue.json
import { chromium } from 'file:///C:/Claude_Code_Projects/lero-al/node_modules/playwright/index.mjs'
const pages = [
  ['tailadmin', 'https://demo.tailadmin.com/profile'], ['tailadmin', 'https://demo.tailadmin.com/single-invoice'],
  ['lahomes', 'https://techzaa.in/lahomes/admin/customers-details.html'], ['lahomes', 'https://techzaa.in/lahomes/admin/agents-details.html'],
  ['omah', 'https://omah.dexignzone.com/xhtml/account/agent-profile.html'], ['omah', 'https://omah.dexignzone.com/xhtml/account/app-profile.html'],
  ['kamr', 'https://kamr-vite.vercel.app/guest-details'], ['kamr', 'https://kamr-vite.vercel.app/app-profile'],
]
const b = await chromium.launch(); const ctx = await b.newContext(); const out = []
for (const [ref, url] of pages) for (const w of [390, 1440]) {
  const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: 1400 })
  try {
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); await p.waitForTimeout(3500)
    if ((await p.locator('input[type="password"]').count()) > 0) {
      await p.locator('input[type="email"],input[name="email"],input[type="text"]').first().fill('demo@example.com').catch(() => {})
      await p.locator('input[type="password"]').first().fill('123456').catch(() => {})
      await p.locator('button[type="submit"],button:has-text("Sign")').first().click().catch(() => {})
      await p.waitForTimeout(3500); await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {}); await p.waitForTimeout(3500)
    }
    const r = await p.evaluate(() => {
      const vis = e => { const s = getComputedStyle(e), rc = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && rc.width > 0 && rc.height > 0 }
      const leaves = [...document.querySelectorAll('body *')].filter(e => vis(e) && e.children.length === 0 && (e.textContent || '').trim().length > 0 && (e.textContent || '').trim().length < 60)
      const lum = c => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return 0; const [r, g, b] = m.map(Number); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
      const pairs = []
      for (let i = 0; i < leaves.length - 1; i++) {
        const l = leaves[i], v = leaves[i + 1]; if (l.parentElement !== v.parentElement && l.parentElement?.parentElement !== v.parentElement?.parentElement) continue
        const ls = getComputedStyle(l), vs = getComputedStyle(v)
        const labelish = /:$/.test(l.textContent.trim()) || lum(ls.color) > lum(vs.color) + 25 || parseFloat(ls.fontSize) < parseFloat(vs.fontSize)
        if (!labelish) continue
        const lr = l.getBoundingClientRect(), vr = v.getBoundingClientRect()
        const stacked = vr.top >= lr.bottom - 1; const inline = !stacked && vr.left >= lr.right - 1
        if (!stacked && !inline) continue
        pairs.push({ label: l.textContent.trim().slice(0, 24), value: v.textContent.trim().slice(0, 24), mode: stacked ? 'stacked' : 'inline', gap: stacked ? Math.round(vr.top - lr.bottom) : Math.round(vr.left - lr.right) })
      }
      return { url: location.href, pairs: pairs.slice(0, 40), overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth }
    })
    await p.screenshot({ path: `${process.argv[2]}/gr7-r15kv-${ref}-${url.split('/').pop().replace('.html', '')}-${w}.png`, fullPage: true })
    const modes = r.pairs.reduce((m, x) => (m[x.mode] = (m[x.mode] || 0) + 1, m), {})
    const gaps = r.pairs.filter(x => x.mode === 'stacked' && x.gap < 20).map(x => x.gap).sort((a, b) => a - b)
    out.push({ ref, url, w, final: r.url, modes, stackedGapMedian: gaps.length ? gaps[Math.floor(gaps.length / 2)] : null, stackedGaps: gaps, overflowX: r.overflowX, sample: r.pairs.slice(0, 12) })
  } catch (e) { out.push({ ref, url, w, error: String(e).slice(0, 140) }) }
  await p.close()
}
await b.close(); console.log(JSON.stringify(out, null, 1))
