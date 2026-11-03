// Task 941 review 2, self-audits 2 and 3 (2026-11-02): proxy for the real hook that applies the Task 943 R12 triggers to every
// command, Write/Edit path and transcript a gate self-test passes to the hook, and appends each input a trigger would extend to
// the file named by R12_SCAN_LOG (with the caller's file and line). Used by run-scan.mjs; it never changes the hook.
import { appendFileSync } from 'node:fs';
import * as hook from '../../../../../../scripts/workflow-gates/security-hook.mjs';
import { isPolicyPath, isProductPath } from '../../../../../../scripts/workflow-gates/contract.mjs';
export * from '../../../../../../scripts/workflow-gates/security-hook.mjs';
const WRITE_WORD = /\b(?:Set-Content|Add-Content|Out-File|apply_patch|writeFileSync|write_text|writeFile|appendFile|appendFileSync|copyFile|copyFileSync|cpSync|renameSync|rmSync|unlinkSync|truncateSync|createWriteStream|WriteAllText|WriteAllLines|WriteAllBytes|AppendAllText|AppendAllLines|write_bytes)\b/i;
// R12 (e), third self-audit: a run of path characters that ends in an extension of the PROJECT_FILE pattern (C82), or that
// isProductPath accepts (project-root files such as .nvmrc). Every other character, `=`, braces, backticks, `$` and quotes
// included, separates words.
const EXTENSION = /\.(?:[cm]?[jt]sx?|sql|css|json|md|ps1|py|sh|ya?ml|svg)$/i;
const PATH_WORD = /[A-Za-z0-9_.~/\\-]+/g;
// Independent-audit follow-up: a folder-change word anywhere in the raw text, also inside quotes and interpreter calls.
const FOLDER_CHANGE = /(?:^|[\s;&|('"])(?:cd|chdir|pushd|set-location|sl|push-location)(?=[\s(])|\b(?:process|os)\.chdir\(/i;
// R12 (a) after the audit: absolute, MSYS, device and UNC spellings are canonicalised too.
const absolute = path => /^(?:[A-Za-z]:|[\\/])/.test(path);
const dotted = path => /[. ]$/.test(path) || /\.[\\/]/.test(path.replace(/(^|[\\/])\.\.?(?=[\\/]|$)/g, '')) || /~\d/.test(path)
  || absolute(path);
export function triggers(root, command) {
  if (typeof command !== 'string') return [];
  const found = [];
  const readOnly = hook.isReadOnlyShellCommand(command);
  const result = hook.shellWriteTargets(root, command);
  if (FOLDER_CHANGE.test(command)) found.push('(c) folder change');
  for (const m of command.matchAll(/(?<![=<>])>{1,2}(?![=>])\s*(?:"([^"]+)"|'([^']+)'|([^\s;|]+))/g)) {
    const target = m[1] || m[2] || m[3];
    if (/[*?[]/.test(target)) found.push(`(b) glob target ${target}`);
    if (dotted(target)) found.push(`(a) spelling target ${target}`);
    if (/['"]$/.test(target) && !m[1] && !m[2]) found.push(`(f) trailing quote target ${target}`);
  }
  if (!readOnly && WRITE_WORD.test(command)) {
    for (const { 0: word, index } of command.matchAll(PATH_WORD)) {
      if (command[index - 1] === '$') continue; // a variable name such as $PWD, not a path
      const path = word.replaceAll('\\', '/');
      if (result.includes(path)) continue;
      if (EXTENSION.test(path) || isProductPath(path)) found.push(`(e) word ${path}`);
    }
  }
  return found;
}
function caller() {
  const frame = new Error().stack.split('\n').find(line => /\.selftest\.mjs|copy\.test\.mjs/.test(line)) || '';
  return (frame.match(/([\w.-]+\.(?:selftest|copy\.test)\.mjs:\d+)/) || [])[1] || '?';
}
const record = (where, input, extra) => {
  if (extra.length) appendFileSync(process.env.R12_SCAN_LOG, `${caller()}\t${where}\t${JSON.stringify(input)}\t${extra.join('; ')}\n`);
};
export function shellWriteTargets(root, command) {
  record('shellWriteTargets', command, triggers(root, command));
  return hook.shellWriteTargets(root, command);
}
export function evaluateHook(root, event, transcript) {
  const input = event?.tool_input || {};
  const extra = typeof input.command === 'string' ? triggers(root, input.command) : [];
  const file = input.file_path || input.path;
  if (typeof file === 'string' && dotted(file)) extra.push(`(a) Write/Edit spelling ${file}`);
  if (typeof event?.cwd === 'string') extra.push(`(d) event cwd ${event.cwd}`);
  if (typeof transcript === 'string' && /"cwd"\s*:/.test(transcript)) extra.push('(d) transcript cwd');
  record('evaluateHook', input.command ?? file, extra);
  return hook.evaluateHook(root, event, transcript);
}
export function governanceIndependenceErrors(root, contract, receiptPath, transcript) {
  const extra = [];
  for (const line of String(transcript).split('\n')) {
    let entry; try { entry = JSON.parse(line); } catch { continue; }
    if (typeof entry?.cwd === 'string') extra.push('(d) transcript cwd');
    for (const block of Array.isArray(entry?.message?.content) ? entry.message.content : []) {
      if (block?.type !== 'tool_use') continue;
      if (typeof block.input?.command === 'string') extra.push(...triggers(root, block.input.command));
      const file = block.input?.file_path || block.input?.path;
      if (typeof file === 'string' && dotted(file)) extra.push(`(a) Write/Edit spelling ${file}`);
    }
  }
  record('governanceIndependenceErrors', '<transcript>', [...new Set(extra)]);
  return hook.governanceIndependenceErrors(root, contract, receiptPath, transcript);
}
