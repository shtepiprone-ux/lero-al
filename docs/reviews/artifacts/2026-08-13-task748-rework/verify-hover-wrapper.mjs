import { readFileSync, readdirSync } from 'node:fs';
const dir = '.next/static/css';
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.css')) continue;
  const css = readFileSync(`${dir}/${f}`, 'utf8');
  const idx = css.indexOf('ListingGallery_photoCountButton');
  if (idx === -1) continue;
  console.log('file:', f);
  console.log(css.slice(Math.max(0, idx - 100), idx + 400));
}
