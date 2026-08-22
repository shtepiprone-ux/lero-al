import fs from 'fs';

const utilities = [
  { name: 'relative', sel: '.relative' },
  { name: 'absolute', sel: '.absolute' },
  { name: 'inset-0', sel: '.inset-0' },
  { name: 'w-full', sel: '.w-full' },
  { name: 'h-full', sel: '.h-full' },
  { name: 'aspect-[4/3]', sel: '.aspect-[4/3]' },
  { name: 'aspect-[16/9]', sel: '.aspect-[16/9]' },
  { name: 'aspect-square', sel: '.aspect-square' },
  { name: 'overflow-hidden', sel: '.overflow-hidden' },
  { name: 'bg-muted', sel: '.bg-muted' },
  { name: 'rounded-full', sel: '.rounded-full' },
  { name: 'object-cover', sel: '.object-cover' },
  { name: 'object-contain', sel: '.object-contain' },
  { name: 'transition', sel: '.transition' },
  { name: 'duration-300', sel: '.duration-300' },
  { name: 'opacity-100', sel: '.opacity-100' },
  { name: 'opacity-0', sel: '.opacity-0' },
  { name: 'group-hover:scale-105', sel: '.group:hover .group-hover:scale-105' },
  { name: 'group-hover:brightness-95', sel: '.group:hover .group-hover:brightness-95' },
];

// Build the ESCAPED literal that would appear in the actual minified CSS
// Tailwind escapes: [ -> \[, ] -> \], / -> \/, : -> \:
function escapeForCss(sel) {
  return sel.replace(/([[\]/:])/g, '\\$1');
}

function extractAll(data, selText) {
  const results = [];
  let searchFrom = 0;
  while (true) {
    const idx = data.indexOf(selText, searchFrom);
    if (idx === -1) break;
    const before = idx === 0 ? '' : data[idx - 1];
    if (!(before === '' || before === '{' || before === '}' || before === ',' || before === undefined)) {
      searchFrom = idx + selText.length;
      continue;
    }
    const braceIdx = data.indexOf('{', idx);
    if (braceIdx === -1) { searchFrom = idx + selText.length; continue; }
    // Ensure nothing weird (like a semicolon) between idx and braceIdx that would mean it's not a selector
    const between = data.slice(idx, braceIdx);
    if (between.includes(';') || between.includes('}')) { searchFrom = idx + selText.length; continue; }
    let depth = 1;
    let p = braceIdx + 1;
    while (depth > 0 && p < data.length) {
      if (data[p] === '{') depth++;
      else if (data[p] === '}') depth--;
      p++;
    }
    const fullSelector = data.slice(idx, braceIdx);
    const body = data.slice(braceIdx + 1, p - 1);
    results.push({ idx, fullSelector, body });
    searchFrom = p;
  }
  return results;
}

// find enclosing @layer / @media wrapper for a given index by scanning backward brace depth
function findContext(data, idx) {
  // walk backward tracking brace balance to find unmatched '{' openers, and check preceding @-rule text
  let depth = 0;
  const contexts = [];
  for (let i = idx - 1; i >= 0; i--) {
    const c = data[i];
    if (c === '}') depth++;
    else if (c === '{') {
      if (depth === 0) {
        // found an unmatched opening brace enclosing idx; extract the at-rule name right before it
        let j = i - 1;
        while (j >= 0 && /\s/.test(data[j])) j--;
        let end = j + 1;
        while (j >= 0 && data[j] !== '}' && data[j] !== '{' && data[j] !== ';') j--;
        const atRule = data.slice(j + 1, end).trim();
        contexts.unshift(atRule);
      } else {
        depth--;
      }
    }
  }
  return contexts;
}

for (const file of ['.next/static/css/bc88661d53d0076e.css', 'storybook-static/assets/iframe-D4qckTjS.css']) {
  const data = fs.readFileSync(file, 'utf8');
  console.log('=== ' + file + ' (' + data.length + ' bytes) ===');
  for (const u of utilities) {
    const literal = escapeForCss(u.sel);
    const res = extractAll(data, literal);
    console.log('--- ' + u.name + ' (selector-in-css: ' + literal + ') -> ' + res.length + ' match(es) ---');
    for (const r of res) {
      const ctx = findContext(data, r.idx);
      console.log('  context:', ctx.filter(c => c.startsWith('@')).join(' > ') || '(top-level)');
      console.log('  selector:', r.fullSelector);
      console.log('  body:', r.body);
    }
  }
  console.log();
}
