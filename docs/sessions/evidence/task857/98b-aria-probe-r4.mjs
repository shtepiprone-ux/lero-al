import { createRequire } from 'node:module'
const require = createRequire('C:/Claude_Code_Projects/lero-al/package.json')
const { chromium } = require('playwright')
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'
const ROOT='C:/Claude_Code_Projects/lero-al/storybook-static'
const srv=http.createServer((q,r)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'}[path.extname(p)]??'application/octet-stream'});r.end(d)})}).listen(6097)
const b=await chromium.launch();const pg=await b.newPage();await pg.setViewportSize({width:1280,height:900})
await pg.goto('http://127.0.0.1:6097/iframe.html?id=patterns-mantine-agentstatisticsview--default&globals=locale:en&viewMode=story')
await pg.waitForSelector('#storybook-root table',{timeout:15000,state:'attached'});await pg.waitForTimeout(500)
console.log(JSON.stringify(await pg.evaluate(()=>{const row=[...document.querySelectorAll('#storybook-root table')].find(t=>t.getBoundingClientRect().width>0).querySelector('tbody tr');return [...row.querySelectorAll('td')].map((td,i)=>[i,[...td.querySelectorAll('[aria-label]')].map(e=>[e.tagName,e.getAttribute('role'),e.getAttribute('aria-label').slice(0,20)])])})))
await b.close();srv.close()
