// Task 889 revision 2 (§18.4 AC4-R2) — pixel-sampled WCAG contrast of white text against the
// `accentHeroGradient` background of `DashboardStatCard` -> `Accent`, at sq/en x
// 320/390/768/1024/1440. For each (locale, width): the label, value and caption Text elements are
// located, their `color` is set to `transparent` (restored afterwards), the card is screenshotted at
// `deviceScaleFactor: 1` (so screenshot pixels map 1:1 to CSS px), and the minimum WCAG contrast of
// #FFFFFF against every background pixel under each element's own bounding box is computed with
// `sharp` raw-pixel decoding. White's relative luminance is always 1, so contrast = 1.05 / (Lbg +
// 0.05); the minimum contrast occurs at the brightest background pixel in the box.
import { chromium } from 'playwright';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:6130';
const STORY_ID = 'patterns-mantine-dashboardstatcard--accent';
const LOCALES = ['en', 'sq'];
const WIDTHS = [320, 390, 768, 1024, 1440];
const HEIGHT = 900;

function srgbToLinear(c) {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4;
}
function relLuminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrastVsWhite(r, g, b) {
  const Lbg = relLuminance(r, g, b);
  return 1.05 / (Lbg + 0.05);
}

async function main() {
  const browser = await chromium.launch();
  const results = [];

  for (const locale of LOCALES) {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: HEIGHT }, deviceScaleFactor: 1 });
      await page.goto(`${BASE}/iframe.html?id=${STORY_ID}&viewMode=story&globals=locale:${locale}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.mantine-Card-root', { timeout: 10000 });
      await page.waitForTimeout(400);

      const boxes = await page.evaluate(() => {
        const card = document.querySelector('.mantine-Card-root');
        const texts = Array.from(card.querySelectorAll('.mantine-Text-root'));
        // DOM order per MantineDashboardStatCard.tsx textStack: label, value, caption.
        const roles = ['label', 'value', 'caption'];
        return texts.slice(0, 3).map((el, i) => {
          const r = el.getBoundingClientRect();
          return { role: roles[i], x: r.x, y: r.y, width: r.width, height: r.height, fontSize: parseFloat(getComputedStyle(el).fontSize) };
        });
      });

      // Hide only the three text nodes (and their descendants) so the sampled pixels are pure background.
      const hidden = await page.evaluate(() => {
        const card = document.querySelector('.mantine-Card-root');
        const texts = Array.from(card.querySelectorAll('.mantine-Text-root')).slice(0, 3);
        const touched = [];
        for (const el of texts) {
          for (const node of [el, ...el.querySelectorAll('*')]) {
            node.style.setProperty('color', 'transparent', 'important');
            touched.push(node);
          }
        }
        return touched.length;
      });

      const cardBox = await page.evaluate(() => {
        const r = document.querySelector('.mantine-Card-root').getBoundingClientRect();
        return { x: Math.floor(r.x), y: Math.floor(r.y), width: Math.ceil(r.width), height: Math.ceil(r.height) };
      });

      const shotPath = `docs/sessions/evidence/task889/ac4r2-${locale}-${width}-bgonly.png`;
      await page.screenshot({ path: shotPath, clip: cardBox });

      // Restore.
      await page.evaluate(() => {
        const card = document.querySelector('.mantine-Card-root');
        const texts = Array.from(card.querySelectorAll('.mantine-Text-root')).slice(0, 3);
        for (const el of texts) {
          for (const node of [el, ...el.querySelectorAll('*')]) {
            node.style.removeProperty('color');
          }
        }
      });

      const { data, info } = await sharp(shotPath).raw().toBuffer({ resolveWithObject: true });
      const channels = info.channels;

      const elementResults = boxes.map((box) => {
        const bx0 = Math.max(0, Math.floor(box.x - cardBox.x));
        const by0 = Math.max(0, Math.floor(box.y - cardBox.y));
        const bx1 = Math.min(info.width, Math.ceil(box.x - cardBox.x + box.width));
        const by1 = Math.min(info.height, Math.ceil(box.y - cardBox.y + box.height));
        let minContrast = Infinity;
        let sampled = 0;
        for (let py = by0; py < by1; py++) {
          for (let px = bx0; px < bx1; px++) {
            const idx = (py * info.width + px) * channels;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const c = contrastVsWhite(r, g, b);
            if (c < minContrast) minContrast = c;
            sampled++;
          }
        }
        return { role: box.role, fontSize: box.fontSize, sampledPixels: sampled, minContrast: Number.isFinite(minContrast) ? Math.round(minContrast * 100) / 100 : null };
      });

      results.push({ locale, width, hiddenNodeCount: hidden, cardBox, elements: elementResults });
      await page.close();
    }
  }

  await browser.close();
  writeFileSync('docs/sessions/evidence/task889/ac4-r2-contrast-results.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
