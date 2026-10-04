// Task 741 owner return — pixel-level corner comparison. For the filled active control of lero.al (corner-probe crops)
// and TailAdmin (tailadmin-corner-probe crops) at DPR 1, read the top-left 12×12 px of the control and print each
// pixel's coverage (0 = background, 100 = fill), next to the coverage an ideal 8px-radius quarter circle gives.
import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
const D = 'docs/sessions/evidence/task741r3/rev3g/owner-return/crops/'
const browser = await chromium.launch()
const page = await browser.newPage()
const report = {}
for (const [name, file] of [['lero-active-1440-dpr1', '1440-dpr1-active.png'], ['tailadmin-active-1440-dpr1', 'tailadmin-1440-dpr1-active.png'], ['lero-active-390-dpr1', '390-dpr1-active.png']]) {
  const b64 = (await readFile(D + file)).toString('base64')
  report[name] = await page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode()
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const px = (x, y) => g.getImageData(x, y, 1, 1).data
    // background = top-left crop pixel; fill = the crop centre
    const bg = px(0, 0), fill = px(Math.floor(img.width / 2), Math.floor(img.height / 4))
    const cov = p => { const d = [0, 1, 2].map(i => (p[i] - bg[i]) / ((fill[i] - bg[i]) || 1)); return Math.round(100 * d.reduce((a, b) => a + b) / 3) }
    // find the control's left and top edge: first column/row whose middle pixel is >50% fill
    let left = 0; while (left < img.width && cov(px(left, Math.floor(img.height / 2))) < 50) left++
    let top = 0; while (top < img.height && cov(px(Math.floor(img.width / 2), top)) < 50) top++
    const rows = []
    for (let y = 0; y < 12; y++) { const r = []; for (let x = 0; x < 12; x++) r.push(cov(px(left + x, top + y))); rows.push(r) }
    return { left, top, size: [img.width, img.height], rows }
  }, b64)
}
// ideal coverage of an 8px-radius corner, supersampled
const ideal = []
for (let y = 0; y < 12; y++) { const r = []; for (let x = 0; x < 12; x++) { let n = 0; for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { const px = x + (i + 0.5) / 16, py = y + (j + 0.5) / 16; const inside = (px >= 8 || py >= 8) ? true : Math.hypot(8 - px, 8 - py) <= 8; if (inside) n++ } r.push(Math.round(100 * n / 256)) } ideal.push(r) }
report.ideal8 = { rows: ideal }
await browser.close()
await writeFile('docs/sessions/evidence/task741r3/rev3g/owner-return/corner-pixels.json', JSON.stringify(report, null, 1) + '\n')
for (const [k, v] of Object.entries(report)) { console.log(k, v.left !== undefined ? `edge at ${v.left},${v.top}` : ''); for (const r of v.rows) console.log('  ' + r.map(n => String(Math.max(0, Math.min(100, n))).padStart(4)).join('')) }
