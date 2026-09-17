// Task 829 executor-time measurement (scratch probe, not a deliverable).
// Measures R7's four computed color/flex-shrink values (MantineListingDetailPattern's meta-row
// icons + features-grid icon span) and the ContactPattern loading Button's rect, at 1440x900 en,
// against a running storybook-static server. House pattern for serving/URL borrowed from
// scripts/check-stories-rendered.mjs (startStaticServer, iframe.html?id=...&globals=locale:...).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.argv[2];
const LABEL = process.argv[3] || 'probe';
const staticDir = join(ROOT, 'storybook-static');

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };

function startStaticServer(dir, port) {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      try {
        const data = await readFile(join(dir, urlPath));
        res.writeHead(200, { 'Content-Type': MIME[extname(urlPath)] ?? 'application/octet-stream' });
        res.end(data);
      } catch {
        try {
          const data = await readFile(join(dir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        } catch {
          res.writeHead(404); res.end('Not found');
        }
      }
    });
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function waitReady(base) {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`${base}/iframe.html`); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('static server never became ready');
}

const server = await startStaticServer(staticDir, 0);
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;
await waitReady(base);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const out = { label: LABEL };

// ── DetailPattern: 3 meta-row icons + features-grid icon span ──────────────────
await page.goto(`${base}/iframe.html?id=patterns-mantine-listingdetailpattern--default&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForSelector('svg', { timeout: 10000 });

out.detail = await page.evaluate(() => {
  const root = document.querySelector('#storybook-root') || document.body;
  const svgs = Array.from(root.querySelectorAll('svg'));
  function findByStrokeIcon(className) {
    // lucide sets a class like "lucide-map-pin" on the svg
    return svgs.find((s) => s.getAttribute('class') && s.getAttribute('class').includes(className));
  }
  const mapPin = findByStrokeIcon('lucide-map-pin');
  const eye = findByStrokeIcon('lucide-eye');
  const calendar = findByStrokeIcon('lucide-calendar-days');
  // Features grid's first feature icon (demoFeatures() in the story: BedDouble, Bath, Maximize2,
  // Building2, in that order) -> lucide-bed-double, the wrapping span/Box the R7 (Box component=
  // "span") change targets.
  const featureSvg = findByStrokeIcon('lucide-bed-double');
  function measure(svg) {
    if (!svg) return null;
    const cs = getComputedStyle(svg);
    const wrapper = svg.parentElement;
    const wrapperCs = wrapper ? getComputedStyle(wrapper) : null;
    return {
      svgColor: cs.color,
      svgStroke: cs.stroke,
      svgFlexShrink: cs.flexShrink,
      wrapperColor: wrapperCs ? wrapperCs.color : null,
      wrapperFlexShrink: wrapperCs ? wrapperCs.flexShrink : null,
      strokeAttr: svg.getAttribute('stroke'),
      classAttr: svg.getAttribute('class'),
    };
  }
  return {
    mapPin: measure(mapPin),
    eye: measure(eye),
    calendarDays: measure(calendar),
    featureIcon: measure(featureSvg),
    totalSvgCount: svgs.length,
  };
});

// ── ContactPattern: loading-state Call/WhatsApp button rect ────────────────────
await page.goto(`${base}/iframe.html?id=patterns-mantine-listingcontactpattern--default&globals=locale:en&viewMode=story`, { waitUntil: 'networkidle', timeout: 20000 });
await page.getByRole('button', { name: 'Call', exact: true }).first().waitFor({ timeout: 10000 });

out.contact = await page.evaluate(() => {
  // Locate the "Loading —" section label (messages/en.json listing_detail_section_loading),
  // walk up to its labelled Stack wrapper, then find that section's own Call button (never a
  // buttons-wide search — the story renders "Call" in five sections).
  const all = Array.from(document.querySelectorAll('p, span, div'));
  const label = all.find((el) => el.children.length === 0 && /^Loading\s*—/.test(el.textContent || ''));
  if (!label) return { error: 'loading section label not found', bodyText: document.body.textContent.slice(0, 200) };
  let section = label.parentElement;
  for (let i = 0; i < 6 && section; i++) {
    const btn = Array.from(section.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Call');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const hasLoader = !!btn.querySelector('svg[class*="Loader"], [class*="mantine-Loader"], svg.lucide-loader-circle');
      return { height: rect.height, width: rect.width, text: btn.textContent.trim(), hasLoader, outerHTMLSnippet: btn.outerHTML.slice(0, 500) };
    }
    section = section.parentElement;
  }
  return { error: 'Call button not found within 6 ancestor levels of the loading label' };
});

await browser.close();
server.close();
console.log(JSON.stringify(out, null, 2));
