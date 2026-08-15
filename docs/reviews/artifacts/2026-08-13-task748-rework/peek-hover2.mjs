import { readFileSync } from 'node:fs';
const css = readFileSync('.next/static/css/3b5759d2e996cb5d.css', 'utf8');
const target = css.indexOf('.hover\\:bg-overlay\\/70:hover');
console.log('target idx', target);

// Walk backward tracking brace balance to find the enclosing top-level block start.
let depth = 0;
let i = target;
for (; i >= 0; i--) {
  const ch = css[i];
  if (ch === '}') depth++;
  else if (ch === '{') {
    if (depth === 0) break; // this is the innermost unmatched '{' before target
    depth--;
  }
}
console.log('innermost enclosing { at', i);
console.log(css.slice(Math.max(0, i - 60), i + 5));

// Now check the next enclosing block level up (skip past this rule's own selector/brace)
let depth2 = 0;
let j = i - 1;
for (; j >= 0; j--) {
  const ch = css[j];
  if (ch === '}') depth2++;
  else if (ch === '{') {
    if (depth2 === 0) break;
    depth2--;
  }
}
console.log('next enclosing { at', j);
console.log(css.slice(Math.max(0, j - 60), j + 5));
