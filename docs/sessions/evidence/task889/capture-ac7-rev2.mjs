import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://127.0.0.1:6130';
const tag = process.argv[2]; // 'before' | 'after'
if (!tag) { console.error('usage: node capture-ac7.mjs before|after'); process.exit(2); }

const STORIES = [
  { id: 'patterns-mantine-admindashboardview--default', name: 'AdminDashboardView' },
  { id: 'patterns-mantine-agentstatisticsview--default', name: 'AgentStatisticsView' },
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 1400 });

for (const story of STORIES) {
  await page.goto(`${BASE}/iframe.html?id=${story.id}&viewMode=story`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const html = await page.evaluate(() => {
    const root = document.getElementById('storybook-root') || document.body;
    // Normalize ApexCharts' own generated ids/gradient/clip-path ids, which change per mount.
    let s = root.outerHTML;
    s = s.replace(/apexcharts[a-zA-Z0-9]{6,}/g, 'apexcharts-ID');
    s = s.replace(/gridRectMask[a-zA-Z0-9]+/g, 'gridRectMask-ID');
    s = s.replace(/gridRectBarMask[a-zA-Z0-9]+/g, 'gridRectBarMask-ID');
    s = s.replace(/SvgjsSvg\d+/g, 'SvgjsSvg-ID');
    s = s.replace(/id="[a-zA-Z-]*\d{6,}"/g, 'id="ID"');
    return s;
  });
  fs.writeFileSync(`docs/sessions/evidence/task889/ac7-before/${story.name}.${tag}.html`, html);
  console.log(`${story.name}: ${html.length} chars written (${tag})`);
}

await browser.close();
