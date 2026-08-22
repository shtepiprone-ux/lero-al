import { chromium } from 'playwright';

const SLUG = process.argv[2] || '11-mr7ucly4';
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 1000 });
await page.goto(`http://localhost:3000/en/listings/${SLUG}`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(500);

const info = await page.evaluate(() => {
  const gallery = document.querySelector('.listing-gallery');
  if (!gallery) return { error: 'no .listing-gallery found' };
  const imgs = Array.from(gallery.querySelectorAll('img'));
  return {
    imgCount: imgs.length,
    imgs: imgs.map((img, i) => ({ i, className: img.className, parentClassName: img.parentElement.className })),
  };
});
console.log('gallery info:', JSON.stringify(info, null, 1));

if (info.imgCount > 0) {
  const box = await page.evaluate(() => {
    const gallery = document.querySelector('.listing-gallery');
    const img = gallery.querySelector('img');
    const r = img.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const restFilter = await page.evaluate(() => getComputedStyle(document.querySelector('.listing-gallery img')).filter);
  await page.mouse.move(box.x + box.w / 2, box.y + box.h / 2);
  await page.waitForTimeout(400);
  const hoverFilter = await page.evaluate(() => getComputedStyle(document.querySelector('.listing-gallery img')).filter);
  console.log('rest filter:', restFilter);
  console.log('hover filter:', hoverFilter);
}

await browser.close();
