// Task 852 review-8 remediation — AC43 "before" capture, run against the storybook-static build
// that predates the R32 source edit (built 2026-09-26 13:40, review-7 remediation's own build).
// node <this file>
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = 'C:/Claude_Code_Projects/lero-al';
const staticDir = join(ROOT, 'storybook-static');
const OUT = join(ROOT, 'docs/sessions/evidence/task852/ac43-before.json');
const PORT = 6058;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };

function startStaticServer(dir, port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = join(dir, decodeURIComponent(urlPath));
      try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(dir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });
    server.listen(port, '127.0.0.1', () => resolvePromise(server));
    server.on('error', reject);
  });
}

function storyUrl(baseUrl, id, locale = 'uk') {
  return `${baseUrl}/iframe.html?id=${id}&globals=locale:${locale}&viewMode=story`;
}

async function measureDrawer(page) {
  return page.evaluate(() => {
    const content = document.querySelector('.mantine-Drawer-content');
    const body = document.querySelector('.mantine-Drawer-body');
    const header = document.querySelector('.mantine-Drawer-header');
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const c = cs(content);
    const b = cs(body);
    const h = cs(header);
    return {
      content: content ? { display: c.display, flexDirection: c.flexDirection, overflowY: c.overflowY } : null,
      body: body ? { flexGrow: b.flexGrow, minHeight: b.minHeight, paddingTop: b.paddingTop, overflowY: b.overflowY } : null,
      headerBorderBottomWidth: header ? h.borderBottomWidth : null,
    };
  });
}

async function main() {
  console.log('ac43-before.mjs — Task 852 review-8 remediation (AC43 "before" values)');
  console.log(`platform: ${process.platform}`);
  console.log(`node: ${process.version}`);
  const server = await startStaticServer(staticDir, PORT);
  const baseUrl = `http://127.0.0.1:${PORT}`;
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const results = {};

  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(storyUrl(baseUrl, 'mantine-primitives-drawer--default'), { waitUntil: 'load', timeout: 30000 });
    await page.getByRole('button', { name: 'Відкрити панель', exact: true }).click();
    await page.waitForSelector('.mantine-Drawer-content', { timeout: 10000 });
    await page.waitForTimeout(300);
    results['mantine-primitives-drawer--default'] = await measureDrawer(page);
    console.log('drawer--default (before):', JSON.stringify(results['mantine-primitives-drawer--default']));
    await page.close();
  }

  {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(storyUrl(baseUrl, 'mantine-primitives-mobilenavdrawer--default'), { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('.mantine-Drawer-content', { timeout: 10000 });
    await page.waitForTimeout(300);
    results['mantine-primitives-mobilenavdrawer--default'] = await measureDrawer(page);
    console.log('mobilenavdrawer--default (before):', JSON.stringify(results['mantine-primitives-mobilenavdrawer--default']));
    await page.close();
  }

  await browser.close();
  await new Promise((r) => server.close(r));
  await writeFile(OUT, JSON.stringify(results, null, 2));
  console.log(`\nWritten: ${OUT}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
