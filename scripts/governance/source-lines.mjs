/**
 * Shared source reader for the line-based governance scanners.
 *
 * `codeLines(content)` returns the file split into lines with every comment blanked out:
 * `// line` comments, `/* block *\/` comments (JSDoc included) and JSX `{/* … *\/}` comments.
 * String and template-literal contents are kept, because class names live there. Line count and
 * line numbers are preserved, so a finding still points at the real source line.
 *
 * Why (2026-10-07): the scheduled governance scan failed three weeks running on findings that were
 * all comments — TailAdmin provenance notes such as `bg-gray-100` in a JSDoc block and the word
 * `useMediaQuery` in a doc comment. A scanner that reads comments as code reports documentation,
 * not violations. Matching code only is a scanner-correctness fix, not an exemption: nothing a
 * comment says can ship to the browser.
 */

/**
 * @param {string} content
 * @returns {string[]}
 */
export function codeLines(content) {
  let out = '';
  let state = 'code'; // code | line | block | single | double | template
  const templateDepth = []; // brace depth for each open `${` inside a template literal
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (state === 'line') {
      if (ch === '\n') {
        state = 'code';
        out += ch;
      }
      continue;
    }
    if (state === 'block') {
      if (ch === '*' && next === '/') {
        state = 'code';
        i++;
      } else if (ch === '\n') {
        out += ch;
      }
      continue;
    }
    if (state === 'single' || state === 'double') {
      out += ch;
      if (ch === '\\') {
        if (next !== undefined) out += next;
        i++;
      } else if ((state === 'single' && ch === "'") || (state === 'double' && ch === '"') || ch === '\n') {
        state = 'code';
      }
      continue;
    }
    if (state === 'template') {
      out += ch;
      if (ch === '\\') {
        if (next !== undefined) out += next;
        i++;
      } else if (ch === '`') {
        state = 'code';
      } else if (ch === '$' && next === '{') {
        out += next;
        i++;
        templateDepth.push(0);
        state = 'code';
      }
      continue;
    }

    // state === 'code'
    if (ch === '\\') {
      // Only regex literals carry a backslash in code position: keep the escaped char so `\/\/`
      // inside a regex is never read as the start of a `//` comment.
      out += ch;
      if (next !== undefined && next !== '\n') {
        out += next;
        i++;
      }
      continue;
    }
    if (ch === '/' && next === '/') {
      state = 'line';
      i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      state = 'block';
      i++;
      continue;
    }
    if (ch === "'") state = 'single';
    else if (ch === '"') state = 'double';
    else if (ch === '`') state = 'template';
    else if (templateDepth.length > 0 && ch === '{') templateDepth[templateDepth.length - 1]++;
    else if (templateDepth.length > 0 && ch === '}') {
      if (templateDepth[templateDepth.length - 1] === 0) {
        templateDepth.pop();
        state = 'template';
      } else {
        templateDepth[templateDepth.length - 1]--;
      }
    }
    out += ch;
  }
  return out.split('\n');
}

/** True for unit/smoke test sources, which never ship to the browser. */
export function isTestSource(relPath) {
  return /\.test\.(ts|tsx)$/.test(relPath) || /[/\\]__tests__[/\\]/.test(relPath);
}
