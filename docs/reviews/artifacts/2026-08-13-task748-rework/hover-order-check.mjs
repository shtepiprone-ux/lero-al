import { readFileSync } from 'node:fs';
const css = readFileSync('.next/static/css/3b5759d2e996cb5d.css', 'utf8');
const muted = css.indexOf('.hover\\:bg-muted:hover');
const overlay = css.indexOf('.hover\\:bg-overlay\\/70:hover');
console.log('hover:bg-muted at', muted);
console.log('hover:bg-overlay/70 at', overlay);
if (muted >= 0) console.log(css.slice(muted, muted + 60));
if (overlay >= 0) console.log(css.slice(overlay, overlay + 60));
console.log('overlay wins (later in source order):', overlay > muted);
