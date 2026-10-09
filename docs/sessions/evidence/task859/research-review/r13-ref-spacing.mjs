import { chromium } from 'file:///C:/Claude_Code_Projects/lero-al/node_modules/playwright/index.mjs'
const pages = [
 ['tailadmin','https://demo.tailadmin.com/support-tickets'],['tailadmin','https://demo.tailadmin.com/products-list'],
 ['lahomes','https://techzaa.in/lahomes/admin/customers-list.html'],['lahomes','https://techzaa.in/lahomes/admin/orders.html'],
 ['omah','https://omah.dexignzone.com/xhtml/ecom-customers.html'],['omah','https://omah.dexignzone.com/xhtml/ecom-product-order.html'],
 ['kamr','https://kamr-vite.vercel.app/ecom-customers'],['kamr','https://kamr-vite.vercel.app/guest-list'],
]
const b = await chromium.launch(); const ctx = await b.newContext(); const out = []
for (const [ref, url] of pages) for (const w of [390, 1440]) {
  const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: 1200 })
  try {
    await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); await p.waitForTimeout(3500)
    if ((await p.locator('input[type="password"]').count()) > 0) { await p.locator('input[type="email"],input[name="email"]').first().fill('demo@example.com').catch(()=>{}); await p.locator('input[type="password"]').first().fill('123456').catch(()=>{}); await p.keyboard.press('Enter'); await p.waitForTimeout(5000); await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3500) }
    const r = await p.evaluate(() => {
      const vis = e => { const s = getComputedStyle(e), rc = e.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&rc.width>0&&rc.height>0 }
      const isBadge = e => { const s = getComputedStyle(e); const rc = e.getBoundingClientRect(); return /badge|chip|pill|status|label/i.test(e.className?.toString?.()||'') && rc.height>=14 && rc.height<=32 && s.backgroundColor!=='rgba(0, 0, 0, 0)' && e.textContent.trim().length>0 && e.textContent.trim().length<30 }
      const badges = [...document.querySelectorAll('span,div,a')].filter(e=>vis(e)&&isBadge(e)).filter(e=>![...e.querySelectorAll('*')].some(isBadge))
      const v = [], h = []
      for (const bd of badges.slice(0,60)) {
        const br = bd.getBoundingClientRect(); const box = bd.closest('td,tr,li,[class*="card"]') || bd.parentElement.parentElement
        const texts = [...box.querySelectorAll('*')].filter(t=>vis(t)&&t.children.length===0&&t.textContent.trim()&&!bd.contains(t)&&!t.contains(bd))
        for (const t of texts) { const tr = t.getBoundingClientRect()
          if (tr.bottom<=br.top+0.5 && tr.right>br.left && tr.left<br.right) v.push(br.top-tr.bottom)
          if (tr.right<=br.left+0.5 && tr.bottom>br.top && tr.top<br.bottom) h.push(br.left-tr.right) }
      }
      const cells = [...document.querySelectorAll('td, [class*="card"] h5, [class*="card"] h6')].filter(vis)
      const ellipsis = cells.filter(c => { const s = getComputedStyle(c); return (s.textOverflow==='ellipsis'&&c.scrollWidth>c.clientWidth+1) }).length
      const minOf = a => a.length? Math.round(Math.min(...a)*10)/10 : null
      const near = a => { const s = a.filter(x=>x<40).sort((x,y)=>x-y); return s.length? Math.round(s[Math.floor(s.length/2)]*10)/10 : null }
      return { badges: badges.length, vMin: minOf(v.filter(x=>x<40)), vMedian: near(v), hMin: minOf(h.filter(x=>x<60)), hMedian: near(h), cells: cells.length, ellipsisCells: ellipsis, url: location.href }
    })
    await p.screenshot({ path: `${process.argv[2]}/gr7-r13-${ref}-${url.split('/').pop().replace('.html','')}-${w}.png` })
    out.push({ ref, url, w, ...r })
  } catch (e) { out.push({ ref, url, w, error: String(e).slice(0,120) }) }
  await p.close()
}
await b.close(); console.log(JSON.stringify(out, null, 1))
