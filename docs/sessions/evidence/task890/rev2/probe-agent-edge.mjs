import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'
const require = createRequire(import.meta.url); const { chromium } = require('playwright')
const ROOT = path.resolve('storybook-static')
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'}
const s=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(new URL(q.url,'http://x').pathname));if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':MIME[path.extname(f)]??'application/octet-stream'});fs.createReadStream(f).pipe(r)})
await new Promise(r=>s.listen(0,'127.0.0.1',r)); const B=`http://127.0.0.1:${s.address().port}`
const br=await chromium.launch(); const lines=[]
for (const w of [768,1024,1440]) {
 const p=await (await br.newContext({viewport:{width:w,height:1000}})).newPage()
 await p.goto(`${B}/iframe.html?id=patterns-mantine-agentstatisticsview--default&viewMode=story&globals=locale:en`); await p.waitForTimeout(2500)
 const r=await p.evaluate(()=>[...document.querySelectorAll('#storybook-root .mantine-Card-root')].map(c=>{const b=c.getBoundingClientRect();return `${Math.round(b.left)}-${Math.round(b.right)} w${Math.round(b.width)} ${c.textContent.trim().slice(0,24)}`}))
 lines.push(`${w}: `+JSON.stringify(r))
}
console.log(lines.join('\n')); await br.close(); s.close()
