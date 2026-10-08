// Review 9 (Opus) copy of r7-scroll.mjs, all Stories. Task 859 Revision 7 (Sonnet) - AC45. Copy of review-8/r8-scroll.mjs, extended and corrected:
//  - runs on the final storybook-static at 1440x900, 1440x600 and 390x844 (sq, DPR 1);
//  - `bad` = a scroller contains the dialog title, OR a scroller contains the footer buttons (r8 flagged only a scroller that
//    held both, which let a footer-only scroller pass), OR the modal content/sheet shell itself scrolls;
//  - the footer is the shell's last direct child when it is neither the header nor the body (structured dialogs), so a
//    button that is plain body content of a footer-less dialog is not mistaken for a footer.
// Output: r9-scroll.json + r9-scroll-<story>-<w>x<h>.png (a top-right corner crop of every offender and of the two
// corner stories named in AC45).
import { createRequire } from 'node:module'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const ROOT = 'C:/Claude_Code_Projects/lero-al/storybook-static'
const DIR = path.dirname(fileURLToPath(import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] ?? 'application/octet-stream' }); res.end(d) })
}).listen(6192)
// Review 9 (Opus): every Story in the final build, not only the review-5 matrix list (the owner: "усіх модальних вікон").
const CORNER = ['ticketdetaildialogview--with-timeline', 'modal--detail']
const ids = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8')).entries).filter(e => e.type === 'story').map(e => e.id)
const SIZES = [[1440, 900], [1440, 600], [390, 844]]

const probe = () => {
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const shells = [...document.querySelectorAll('.mantine-Modal-content, .mantine-Drawer-content, [role=dialog]')].filter(vis)
  if (!shells.length) return { open: false }
  const shell = shells.find(s => s.matches('.mantine-Modal-content, .mantine-Drawer-content')) ?? shells[0]
  const title = shell.querySelector('.mantine-Modal-title, .mantine-Drawer-title, h2, [id$=-title]')
  const header = shell.querySelector('.mantine-Modal-header, .mantine-Drawer-header')
  const last = shell.lastElementChild
  const body = shell.querySelector('.mantine-Modal-body, .mantine-Drawer-body')
  // Desktop structured/plain dialog: the footer is the last direct child when it is neither the header nor the body.
  let footer = last && last !== header && last !== body && last.querySelector('button') ? last : null
  // Bottom sheet: the footer is the sheet's own pinned footer.
  footer = footer ?? shell.querySelector('[data-testid="mantine-drawer-footer"]')
  const footerBtn = footer ? [...footer.querySelectorAll('button')].filter(vis)[0] ?? null : null
  const lastBtn = [...shell.querySelectorAll('button')].filter(b => vis(b) && !(header && header.contains(b))).pop() ?? null
  const scrollers = [shell, ...shell.querySelectorAll('*')].filter(el => {
    const s = getComputedStyle(el)
    return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1 && vis(el)
  }).map(el => ({
    cls: (el.className?.baseVal ?? el.className ?? '').toString().split(' ').filter(c => c.startsWith('mantine-')).join(' ') || el.tagName,
    clientH: el.clientHeight, scrollH: el.scrollHeight,
    holdsTitle: !!title && el.contains(title), holdsFooter: !!footerBtn && el.contains(footerBtn),
    isShell: el === shell,
    // Review 9: with no detected footer, does the scroller hold the dialog's last button (a footer rendered inside the
    // body, e.g. MantineModal's plain path below 640)? Informational, not part of `bad`.
    holdsLastBtn: !footerBtn && !!lastBtn && el.contains(lastBtn),
  }))
  const r = shell.getBoundingClientRect()
  return { open: true, shellCls: shell.className.toString().split(' ').filter(c => c.startsWith('mantine-')).join(' '), radius: getComputedStyle(shell).borderTopRightRadius, shellOverflowY: getComputedStyle(shell).overflowY, hasFooter: !!footerBtn, box: { x: r.x, y: r.y, w: r.width, h: r.height }, scrollers }
}

// Playwright's headless default hides scrollbars (`--hide-scrollbars`), which would make the AC45 corner crops show no
// scrollbar at all. The owner sees real scrollbars, so this run keeps them.
const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] })
const out = []
let next = 0
const jobs = ids.flatMap(id => SIZES.map(([w, h]) => ({ id, w, h })))
async function worker() {
  while (next < jobs.length) {
    const { id, w, h } = jobs[next++]
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
    const page = await ctx.newPage()
    try {
      await page.goto(`http://127.0.0.1:6192/iframe.html?id=${id}&globals=locale:sq&viewMode=story`, { timeout: 30000 })
      await page.waitForSelector('[role=dialog]', { timeout: 12000 }).catch(() => null)
      await page.waitForTimeout(1500)
      const record = async (m, trigger) => {
        const bad = m.open && (m.scrollers.some(s => s.holdsTitle || s.holdsFooter || s.isShell))
        const named = CORNER.some(c => id.endsWith(c)) && w === 1440 && h === 600
        let crop = null
        if (m.open && (bad || named)) {
          crop = `r9-scroll-${id.replace(/^.*?--/, id.split('--')[0].split('-').pop() + '-')}${trigger === undefined ? '' : '-t' + trigger}-${w}x${h}.png`
          await page.screenshot({ path: path.join(DIR, crop), clip: { x: Math.max(0, m.box.x + m.box.w - 160), y: Math.max(0, m.box.y), width: 160, height: Math.min(200, m.box.h) } })
        }
        out.push({ id, w, h, trigger, ...m, bad, crop })
      }
      const m = await page.evaluate(probe)
      if (!m.open && /primitives-modal--/.test(id)) {
        // The Modal primitive Stories show trigger buttons; open each dialog in turn (Esc between), as the owner did.
        const n = await page.locator('#storybook-root button').count()
        let opened = 0
        for (let i = 0; i < n; i += 1) {
          const btn = page.locator('#storybook-root button').nth(i)
          if (!(await btn.isVisible().catch(() => false))) continue
          await btn.click({ timeout: 3000 }).catch(() => null)
          await page.waitForTimeout(900)
          const mm = await page.evaluate(probe)
          if (mm.open) { opened += 1; await record(mm, i); await page.keyboard.press('Escape'); await page.waitForTimeout(600) }
        }
        if (!opened) await record(m)
      } else {
        await record(m)
      }
    } catch (e) { out.push({ id, w, h, error: String(e.message).slice(0, 160) }) }
    await ctx.close()
  }
}
await Promise.all([worker(), worker(), worker(), worker()])
await browser.close(); server.close()
fs.writeFileSync(path.join(DIR, 'r9-scroll.json'), JSON.stringify({ platform: process.platform, node: process.version, out }, null, 1))
const open = out.filter(o => o.open)
console.log('jobs', jobs.length, 'open dialogs', open.length, 'with a scroller', open.filter(o => o.scrollers.length).length, 'bad', open.filter(o => o.bad).length, 'shell scrolls', open.filter(o => o.scrollers.some(s => s.isShell)).length, 'errors', out.filter(o => o.error).length, 'not open', out.filter(o => !o.open && !o.error).length)
for (const o of open.filter(o => o.bad)) console.log('BAD', o.id, o.w + 'x' + o.h, JSON.stringify(o.scrollers))
