// Opus review probe for Task 912 Revision 1 (independent of the executor's r1-measure.mjs).
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence probe run directly by node.exe (review 3) */
const http = require('http')
const fs = require('fs')
const path = require('path')
const { chromium } = require('C:/Claude_Code_Projects/lero-al/node_modules/playwright')

const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mjs': 'text/javascript' }
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  const f = path.join(ROOT, p)
  fs.readFile(f, (err, buf) => {
    if (err) { res.statusCode = 404; return res.end() }
    res.setHeader('Content-Type', TYPES[path.extname(f)] || 'application/octet-stream')
    res.end(buf)
  })
})

const STORIES = [
  'patterns-mantine-listingdetailview--public-listing',
  'patterns-mantine-listingdetailview--staff-preview-unpublished',
  'patterns-mantine-listingdetailview--staff-preview-published',
  'patterns-mantine-listingdetailview--archived-listing',
  'patterns-mantine-listingcontactpattern--default',
  'patterns-mantine-listingdetailpattern--default',
]

server.listen(6211, async () => {
  const browser = await chromium.launch()
  const out = []
  for (const id of STORIES) {
    const tuples = [320, 390, 1024, 1440].map(w => ['en', w])
    if (id.endsWith('public-listing')) tuples.push(['uk', 320], ['uk', 1440])
    for (const [loc, w] of tuples) {
      const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 })
      await page.goto(`http://127.0.0.1:6211/iframe.html?id=${id}&viewMode=story&globals=locale:${loc}`)
      await page.waitForSelector('#storybook-root *', { state: 'attached', timeout: 30000 })
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(800)
      const r = await page.evaluate(() => {
        const root = document.querySelector('#storybook-root')
        const vw = document.documentElement.clientWidth
        // visible content boxes: text-bearing leaves, images, and bordered/filled papers
        const clipRect = e => { let b = e.getBoundingClientRect(); let L=b.left,R=b.right,T=b.top,B=b.bottom; for (let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const c=getComputedStyle(a); if(c.overflowX!=='visible'||c.overflowY!=='visible'){const r=a.getBoundingClientRect(); if(c.overflowX!=='visible'){L=Math.max(L,r.left);R=Math.min(R,r.right)} if(c.overflowY!=='visible'){T=Math.max(T,r.top);B=Math.min(B,r.bottom)}}} return {left:L,right:R,top:T,bottom:B,width:R-L,height:B-T} }
        const els = [...root.querySelectorAll('*')].filter(e => {
          const cs = getComputedStyle(e)
          if (cs.visibility === 'hidden' || cs.opacity === '0') return false
          const hasText = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
          const painted = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderTopWidth !== '0px' || cs.borderBottomWidth !== '0px' || cs.backgroundImage !== 'none'
          const fullBleed = !hasText && e.getBoundingClientRect().width >= document.documentElement.clientWidth - 1
          if (fullBleed) return false
          return hasText || painted || ['IMG', 'svg', 'BUTTON', 'INPUT', 'IFRAME'].includes(e.tagName)
        })
        const rects = els.map(clipRect).filter(b => b.width > 0 && b.height > 0)
        const firstTop = els.map(e=>({e,b:clipRect(e)})).filter(x=>x.b.width>0&&x.b.height>0).sort((a,b)=>a.b.top-b.b.top)[0]
        const topEl = firstTop ? firstTop.e.tagName + '.' + String(firstTop.e.className).slice(0,50) + ' ' + Math.round(firstTop.b.top) + ' w' + Math.round(firstTop.b.width) : ''
        const sh = document.documentElement.scrollHeight
        const gut = {
          top: Math.round(Math.min(...rects.map(b => b.top + scrollY))),
          right: Math.round(vw - Math.max(...rects.map(b => b.right))),
          bottom: Math.round(sh - Math.max(...rects.map(b => b.bottom + scrollY))),
          left: Math.round(Math.min(...rects.map(b => b.left))),
        }
        // padding/margin contributed by wrappers between body and the story's first element
        const chain = []
        let n = root.firstElementChild
        for (let i = 0; i < 3 && n; i++) { const cs = getComputedStyle(n); chain.push({ tag: n.tagName, cls: (n.className && n.className.baseVal === undefined ? n.className : '').slice(0, 60), pad: cs.padding, left: Math.round(n.getBoundingClientRect().left) }); n = n.firstElementChild }
        const rootPad = getComputedStyle(root).padding
        const bodyPad = getComputedStyle(document.body).padding
        const canvasWrap = !!root.querySelector(':scope > .container-wide')
        // contact card price block: the 20px/700 price and its siblings
        const blocks = []
        for (const el of root.querySelectorAll('p')) {
          const cs = getComputedStyle(el)
          if (cs.fontSize === '20px' && cs.fontWeight === '700' && /\d/.test(el.textContent) && el.textContent.length < 30) {
            blocks.push([...el.parentElement.children].map(c => `${c.textContent.trim()}|${getComputedStyle(c).textDecorationLine}|${getComputedStyle(c).fontSize}|${Math.round(c.getBoundingClientRect().top)}`))
          }
        }
        return { vw, topEl, gut, rootPad, bodyPad, canvasWrap, chain, blocks, hOverflow: document.documentElement.scrollWidth > vw }
      })
      out.push({ id: id.replace('patterns-mantine-', ''), loc, w, ...r })
      await page.close()
    }
  }
  await browser.close()
  server.close()
  console.log(JSON.stringify(out, null, 1))
})
