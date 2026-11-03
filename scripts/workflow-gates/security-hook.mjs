#!/usr/bin/env node
import { readFileSync, existsSync, realpathSync, globSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, relative, isAbsolute, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContract, validateReport, validateGovernanceReport, isProductPath, isPolicyPath as policyPath, isTaskDocument, safePath, planDigest, workflowRuleInputs,
  isEvidencePath, rebaseChain, rulesEntryErrors } from './contract.mjs';
import { readJson, allContracts } from './cli.mjs';
import { sessionRole } from './session-role.mjs';
import { blockedResponse, plainResponseLines, hasGitHandoff } from './response-state.mjs';

function assistantMessages(transcript) {
  const messages = [];
  for (const [index, line] of transcript.split('\n').entries()) {
    let event; try { event = JSON.parse(line); } catch { continue; }
    if (event?.type === 'assistant' && Array.isArray(event.message?.content)) messages.push({ index, content: event.message.content });
  }
  return messages;
}
export function assistantContent(transcript) {
  return assistantMessages(transcript).flatMap(message => message.content);
}
export function completedReads(root, transcript, required) {
  const pending = new Map(), coverage = new Map();
  const expected = new Map(required.map(file => [file, readFileSync(safePath(root, file), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n')]));
  for (const line of transcript.split('\n')) {
    let event; try { event = JSON.parse(line); } catch { continue; }
    for (const block of event?.message?.content || []) {
      if (event.type === 'assistant' && block?.type === 'tool_use' && block.name === 'Read' && block.id) {
        const path = projectPath(root, block.input?.file_path);
        if (required.includes(path)) pending.set(block.id, { path, start: block.input?.offset ?? 1, limit: block.input?.limit ?? 2000 });
      }
      if (block?.type === 'tool_result' && block.is_error !== true && pending.has(block.tool_use_id)) {
        const read = pending.get(block.tool_use_id); pending.delete(block.tool_use_id);
        if (Number.isInteger(read.start) && read.start > 0 && Number.isInteger(read.limit) && read.limit > 0) {
          const content = typeof block.content === 'string' ? block.content : Array.isArray(block.content)
            ? block.content.filter(b => b.type === 'text').map(b => b.text || '').join('\n') : '';
          const lines = coverage.get(read.path) || new Set();
          for (const match of content.matchAll(/^\s*(\d+)(?:→|\t)([^\r\n]*)\r?$/gm)) {
            const number = Number(match[1]);
            if (number >= read.start && number < read.start + read.limit && expected.get(read.path)[number - 1] === match[2]) lines.add(number);
          }
          coverage.set(read.path, lines);
        }
      }
    }
  }
  return required.filter(file => {
    // Only validated task/rule paths are opened, never arbitrary transcript paths or environment files.
    return expected.get(file).every((_, i) => coverage.get(file)?.has(i + 1));
  });
}
function successfulCalls(transcript) {
  const pending = new Map(), completed = [];
  for (const [index, line] of transcript.split('\n').entries()) {
    let event; try { event = JSON.parse(line); } catch { continue; }
    for (const block of event?.message?.content || []) {
      // Task 943 R12 (d): the transcript entry records the shell folder the call started in.
      if (event.type === 'assistant' && block.type === 'tool_use' && block.id) pending.set(block.id, { ...block, shellFolder: event.cwd });
      if (block.type === 'tool_result' && pending.has(block.tool_use_id)) {
        const call = pending.get(block.tool_use_id); pending.delete(block.tool_use_id);
        if (block.is_error !== true) completed.push({ ...call, result: block.content, index });
      }
    }
  }
  return completed;
}
function executorContractEdit(root, file, event) {
  try {
    const previous = readJson(root, file);
    let content = event.tool_input.content;
    if (event.tool_name === 'Edit') {
      const old = readFileSync(safePath(root, file), 'utf8');
      const { old_string: before, new_string: after, replace_all: all } = event.tool_input;
      if (typeof before !== 'string' || !before || typeof after !== 'string' || !old.includes(before)) return ['Contract authority cannot verify this edit'];
      content = all ? old.replaceAll(before, after) : old.replace(before, after);
    }
    const next = JSON.parse(content);
    if (!['planned', 'implemented'].includes(previous.stage) || !['planned', 'implemented'].includes(next.stage)
      || JSON.stringify(previous.review) !== JSON.stringify(next.review) || planDigest(root, previous) !== planDigest(root, next)) {
      return ['CONTRACT AUTHORITY: Sonnet cannot change planned expectations or independent review'];
    }
    return [];
  } catch { return ['CONTRACT AUTHORITY: Sonnet may only edit implementation stage on an existing plan with Write/Edit']; }
}
// Task 943 R12 (a): Windows spellings that reach the same file. MSYS `/c/…`, the `\\?\` and `\\.\` prefixes and an
// administrative share `\\<host>\c$\…` (reported as the local drive, fail-closed) become a drive path; Windows drops the
// trailing dots and spaces of the last segment and one trailing dot of every other segment.
function win32Spelling(file) {
  const parts = file.replaceAll('\\', '/').replace(/^\/([A-Za-z])\//, '$1:/').replace(/^\/\/[?.]\//, '')
    .replace(/^\/\/[^/]+\/([A-Za-z])\$\//, '$1:/').split('/');
  return parts.map((segment, i) => {
    if (segment === '' || segment === '.' || segment === '..') return segment;
    const trimmed = i === parts.length - 1 ? segment.replace(/[. ]+$/, '') : segment.replace(/\.$/, '');
    return trimmed && trimmed !== '.' && trimmed !== '..' ? trimmed : segment;
  }).join('/');
}
const spelling = file => (process.platform === 'win32' ? win32Spelling(file) : file);
// Path results are memoised for the duration of one top-level call (`withPathCache`): a directory walk can resolve tens of
// thousands of paths against the same ancestors and scope entries, and the file system is read, never changed, meanwhile.
let pathCache = null;
const withPathCache = fn => (...args) => {
  if (pathCache) return fn(...args);
  pathCache = new Map();
  try { return fn(...args); } finally { pathCache = null; }
};
const memo = (key, compute) => {
  if (!pathCache) return compute();
  if (!pathCache.has(key)) pathCache.set(key, compute());
  return pathCache.get(key);
};
// The long canonical path of the deepest existing ancestor (8.3 aliases, junctions and links resolved) joined with the
// missing tail, or null when no ancestor exists.
function canonicalPath(target) {
  return memo(`canonical\0${target}`, () => {
    if (existsSync(target)) { try { return realpathSync.native(target); } catch { return null; } }
    const parent = dirname(target);
    if (parent === target) return null;
    const base = canonicalPath(parent);
    return base === null ? null : join(base, basename(target));
  });
}
function projectPath(root, file, folder = root) {
  if (typeof file !== 'string') return '';
  return memo(`project\0${root}\0${folder}\0${file}`, () => uncachedProjectPath(root, file, folder));
}
function uncachedProjectPath(root, file, folder) {
  if (typeof file !== 'string') return '';
  if (process.platform === 'win32') {
    // Canonicalise before deciding inside or outside the root; a missing drive keeps the lexical result.
    const target = resolve(folder, win32Spelling(file));
    const real = canonicalPath(target);
    const base = real === null ? null : canonicalPath(resolve(root));
    if (real === null || base === null) return relative(root, target).replaceAll('\\', '/');
    return relative(base, real).replaceAll('\\', '/');
  }
  const target = resolve(folder, file);
  const lexical = relative(root, target).replaceAll('\\', '/');
  if (lexical === '..' || lexical.startsWith('../') || isAbsolute(lexical)) return lexical;
  let ancestor = target;
  const tail = [];
  while (!existsSync(ancestor) && dirname(ancestor) !== ancestor) { tail.unshift(basename(ancestor)); ancestor = dirname(ancestor); }
  return relative(realpathSync(root), join(realpathSync(ancestor), ...tail)).replaceAll('\\', '/');
}
const pathKey = file => process.platform === 'win32' ? file.toLowerCase() : file;
function inScope(root, scope, file) {
  return Array.isArray(scope) && scope.some(path => typeof path === 'string' && pathKey(projectPath(root, path)) === pathKey(file));
}
function registeredWrites(root, files) {
  const candidates = files.filter(file => !isProductPath(file) && !policyPath(file) && !/^tasks\/.+\.security\.json$/.test(file));
  const enrolled = new Set();
  // R14 (b), sub-review F5: the scope keys of every contract are built once per call (the comparison of `inScope`), so a
  // directory walk stays linear.
  if (candidates.length) {
    const keys = new Set();
    for (const path of allContracts(root)) {
      // Enrollment requires preflight; it never authorizes a write. Authorization uses only the current valid plan.
      let contract; try { contract = readJson(root, path); } catch { continue; }
      if (Array.isArray(contract?.scope)) for (const entry of contract.scope) if (typeof entry === 'string') keys.add(pathKey(projectPath(root, entry)));
    }
    for (const file of candidates) if (keys.has(pathKey(file))) enrolled.add(file);
  }
  return enrolled;
}
// Task 941 (owner D10, 2026-11-01): programs whose invocation, as checked below, only reads. A command made only of
// them writes nothing but its unquoted redirection targets; every other command keeps the write-word detection.
const READ_ONLY_PROGRAMS = new Set(['cd', 'pwd', 'ls', 'cat', 'head', 'tail', 'wc', 'cut', 'grep', 'egrep', 'fgrep',
  'set-location', 'get-location', 'get-content', 'get-childitem', 'get-item', 'select-string', 'test-path', 'resolve-path',
  'select-object', 'measure-object']);
const READ_ONLY_GIT = new Set(['log', 'show', 'diff', 'status', 'rev-parse', 'ls-files', 'blame', 'grep', 'cat-file']);
// Task 941 revision 1, R1 (a): an allowlist, because each review pass over a list of forbidden forms found another
// one. Outside single-quoted spans only these characters occur (the quote characters delimit spans); this rejects
// comments (`#`, `<#`), every expansion (`$`), splatting and here-strings (`@`), subexpressions and script blocks
// (`(`, `{`), history and negation (`!`) and every non-ASCII character. A double-quoted span also has no `$` or `\`.
const UNQUOTED_CHAR = /[A-Za-z0-9 \t\r\n\-_./:=,+%~;|&<>*?[\]\\]/;
const DOUBLE_QUOTED_CHAR = /[A-Za-z0-9 \t\r\n\-_./:=,+%~;|&<>*?[\]]/;
// R1 (d): every argument of rg, sed and git uses only these characters, read as the shell reads it. This rejects the
// globs and brace lists an MSYS program started from PowerShell expands itself, `@file` arguments and inner quotes.
const ARGUMENT_CHARS = /^[A-Za-z0-9 \-_./:=,+%|$\\~^]*$/;
// Characters that end a word in both shells.
const WORD_END = /[ \t\r\n;|&<>]/;
// Splits a command into simple commands of words whose characters are marked quoted or unquoted; null when the
// command cannot be classified safely. Besides the allowlist it refuses backticks, substitutions, heredocs and
// unterminated quotes, and what Bash and PowerShell read differently: a backslash before a quote (a Bash escape, a
// PowerShell literal) or before a separator, a backslash or the end (a Bash escape or line continuation, a
// PowerShell literal), typographic quotes (PowerShell quotes), a doubled quote (PowerShell reads `''` and `""` inside
// a span as one literal quote, Bash as two spans), a word that begins with a quoted span and continues after it
// (PowerShell ends that word at the closing quote: `'x'-i` reaches a native program as `x` and `-i`, Bash as `x-i`)
// and a `--%` word (PowerShell stop-parsing). Revision 2 (C73-C82): a carriage return not directly before a line feed
// is refused anywhere, because Bash keeps it inside a word (the next words stay arguments of the same program) while
// PowerShell 5.1 reads it as a line break.
function shellCommands(command) {
  if (typeof command !== 'string' || /`|\$\(|<\(|>\(|<<|\\['"]|[‘-„]|\r(?!\n)/.test(command)) return null;
  const commands = [[]];
  let word = null, quote = '', quoteBeganWord = false;
  const end = () => { if (word) commands.at(-1).push(word); word = null; };
  for (let i = 0; i < command.length; i++) {
    const ch = command[i], next = command[i + 1];
    if (quote) {
      if (ch !== quote) {
        if (quote === '"' && !DOUBLE_QUOTED_CHAR.test(ch)) return null;
        word.push({ ch, quoted: true }); continue;
      }
      quote = '';
      if (next === ch || (quoteBeganWord && next !== undefined && !WORD_END.test(next))) return null;
      continue;
    }
    if (ch === "'" || ch === '"') { quoteBeganWord = !word; word ||= []; quote = ch; continue; }
    if (!UNQUOTED_CHAR.test(ch)) return null;
    if (ch === '\\' && (next === undefined || next === '\\' || WORD_END.test(next))) return null;
    // `&` directly after `>` or `<` belongs to the redirection (`2>&1`); every other `&` separates commands.
    if (/[;|\r\n]/.test(ch) || (ch === '&' && !/[<>]/.test(command[i - 1] || ''))) { end(); commands.push([]); continue; }
    if (ch === ' ' || ch === '\t') { end(); continue; }
    (word ||= []).push({ ch, quoted: false });
  }
  if (quote) return null;
  end();
  const words = commands.filter(list => list.length).map(list => list.map(chars => ({ chars, text: chars.map(c => c.ch).join(''),
    redirect: chars.some(c => !c.quoted && (c.ch === '>' || c.ch === '<')) })));
  return words.some(list => list.some(w => w.text.includes('--%'))) ? null : words;
}
// Separates the arguments of a simple command from its redirections; returns the files its `>`/`>>` redirections
// write (`>&1` duplicates a stream; `>&file` and `<>file` still write the file). Text before the first operator of a
// redirection word is an argument unless it is a stream number or PowerShell's `*` (`rg --pre=x>out` passes
// `--pre=x` to rg).
function redirections(words) {
  const args = [], targets = [];
  for (let i = 0; i < words.length; i++) {
    if (!words[i].redirect) { args.push(words[i]); continue; }
    let op = '', text = '';
    const finish = target => { if (target && (op === 'write' || (op === 'dup' && !/^\d*-?$/.test(target)))) targets.push(target); };
    const { chars } = words[i];
    for (let j = 0; j < chars.length; j++) {
      const { ch, quoted } = chars[j];
      if (quoted || (ch !== '>' && ch !== '<')) { text += ch; continue; }
      if (op) finish(text);
      else if (!/^(?:\d*|\*)$/.test(text)) args.push({ chars: chars.slice(0, j), text });
      text = '';
      if (ch === '<') op = 'read';
      else if (chars[j + 1]?.ch === '&' && !chars[j + 1].quoted) { op = 'dup'; j++; }
      else op = 'write';
    }
    if (text) finish(text);
    else if (words[i + 1] && !words[i + 1].redirect) finish(words[++i].text);
  }
  return { args, targets };
}
const gitWriteOption = arg => {
  const name = arg.split('=')[0];
  return /^-[^-]*O/.test(arg) || (name.length > 2 && name.startsWith('--')
    && ['--output', '--open-files-in-pager'].some(option => option.startsWith(name) || name.startsWith(option)));
};
// R1 (c)–(d) for one reading of the words: the text as written, or with each unquoted backslash dropped (Bash).
function readOnlyArguments([program, ...rest]) {
  const name = program.toLowerCase();
  if (READ_ONLY_PROGRAMS.has(name)) return true;
  if (!['rg', 'sed', 'git'].includes(name) || !rest.every(arg => ARGUMENT_CHARS.test(arg))) return false;
  // `--pre` and `--hostname-bin` make ripgrep run a program.
  if (name === 'rg') return !rest.some(arg => arg.startsWith('--pre') || arg.startsWith('--hostname-bin'));
  if (name === 'sed') return rest.length >= 3 && rest[0] === '-n' && /^[0-9]+(,([0-9]+|\$))?p$/.test(rest[1]) && rest.slice(2).every(arg => !arg.startsWith('-'));
  return READ_ONLY_GIT.has(rest[0]) && !rest.some(gitWriteOption);
}
function readOnlySimpleCommand(words) {
  if (words[0].redirect) return false;
  const { args } = redirections(words);
  return readOnlyArguments(args.map(arg => arg.text))
    && readOnlyArguments(args.map(arg => arg.chars.filter(c => c.quoted || c.ch !== '\\').map(c => c.ch).join('')));
}
// Revision 2, R1 (b) (C83-C87): after `cd` or `Set-Location` a relative redirection target names a file in another
// folder, which the hook cannot resolve; such a command is not read-only when any of its simple commands writes a target.
const changesFolder = words => words.length > 0 && !words[0].redirect && [words[0].text,
  words[0].chars.filter(c => c.quoted || c.ch !== '\\').map(c => c.ch).join('')].some(name => ['cd', 'set-location'].includes(name.toLowerCase()));
export function isReadOnlyShellCommand(command) {
  const commands = shellCommands(command);
  if (!commands || !commands.every(readOnlySimpleCommand)) return false;
  return !(commands.some(changesFolder) && commands.some(words => redirections(words).targets.length > 0));
}
const PROJECT_FILE = /(?:src|public|messages|tasks|database|migrations|supabase|\.claude|\.github|scripts|docs)[/\\][^\s'";|<>]+\.(?:[cm]?[jt]sx?|sql|css|json|md|ps1|py|sh|ya?ml|svg)/g;
const PROJECT_FILE_SUFFIX = new RegExp(`${PROJECT_FILE.source}$`);
// Task 943 R3: the C2 write words plus the Node, .NET and Python APIs that copy, move, delete, truncate or append.
const WRITE_WORD = new RegExp(`\\b(?:${['Set-Content', 'Add-Content', 'Out-File', 'apply_patch', 'writeFileSync', 'write_text', 'writeFile',
  'appendFileSync', 'appendFile', 'copyFileSync', 'copyFile', 'cpSync', 'renameSync', 'rmSync', 'unlinkSync', 'truncateSync',
  'createWriteStream', 'fs\\.rename', 'fs\\.rm', 'fs\\.unlink', 'fs\\.truncate', 'fs\\.cp', 'fs\\.promises', 'WriteAllText',
  'WriteAllLines', 'WriteAllBytes', 'AppendAllText', 'AppendAllLines', 'File\\]::Copy', 'File\\]::Move', 'File\\]::Delete',
  'File\\]::Replace', 'shutil\\.copy', 'shutil\\.copyfile', 'shutil\\.move', 'os\\.remove', 'os\\.unlink', 'os\\.replace',
  'os\\.rename', 'write_bytes'].join('|')})\\b`, 'i');
// Task 943 section 5: programs that copy, move, delete, create or edit the files they name.
const COPY_PROGRAMS = new Set(['cp', 'copy', 'cpi', 'copy-item', 'install', 'ln']);
const MOVE_PROGRAMS = new Set(['mv', 'move', 'mi', 'move-item']);
const DELETE_PROGRAMS = new Set(['rm', 'del', 'erase', 'ri', 'unlink', 'remove-item']);
const TEE_PROGRAMS = new Set(['tee', 'tee-object']);
const CONTENT_PROGRAMS = new Set(['clear-content', 'clc', 'sc', 'ac', 'set-content', 'add-content', 'out-file']);
const RENAME_PROGRAMS = new Set(['rename-item', 'ren', 'rni']);
const WRITE_PROGRAMS = new Set([...COPY_PROGRAMS, ...MOVE_PROGRAMS, ...DELETE_PROGRAMS, ...TEE_PROGRAMS, ...CONTENT_PROGRAMS,
  ...RENAME_PROGRAMS, 'sed', 'touch', 'truncate', 'dd', 'new-item', 'ni', 'xargs', 'find']);
// Revision 4, R15: other programs that write the files they name (formatters, package managers, archivers, `Export-*`,
// downloads and remote copies). They are not section 5 words of the R1 fallback of a command the parser rejects.
const OTHER_WRITERS = new Set(['prettier', 'eslint', 'npm', 'pnpm', 'yarn', 'bun', 'tar', 'unzip', 'expand-archive', 'compress-archive',
  'export-csv', 'export-clixml', 'curl', 'wget', 'invoke-webrequest', 'iwr', 'invoke-restmethod', 'irm', 'scp', 'rsync']);
// R1: a section 5 program name as a separate word of a command the parser rejects. `sed`, `find` and `xargs` are section 5
// programs only with the condition of their row: an in-place option, an action that deletes or runs a program, and a
// following write program.
const WORD = name => `(?<![^\\s;|&(){}'"])(?:${name})(?![^\\s;|&(){}'"])`;
const UNCONDITIONAL_PROGRAMS = [...WRITE_PROGRAMS].filter(name => !['sed', 'find', 'xargs'].includes(name));
const WRITE_PROGRAM_WORDS = [
  new RegExp(WORD(UNCONDITIONAL_PROGRAMS.join('|')), 'i'),
  // Revision 4, R13 (c): the in-place or action option also counts inside quotes (`"-i"`, `'-delete'`).
  new RegExp(`${WORD('sed')}[^;|&\\r\\n]*?\\s['"]?(?:-[A-Za-z]*i|--in-place)`, 'i'),
  new RegExp(`${WORD('find')}[^;|&\\r\\n]*?\\s['"]?-(?:delete|exec|execdir|ok|okdir)(?![\\w-])`, 'i'),
  new RegExp(`${WORD('xargs')}[^;|&\\r\\n]*?${WORD(UNCONDITIONAL_PROGRAMS.join('|'))}`, 'i'),
];
const namesWriteProgram = command => WRITE_PROGRAM_WORDS.some(pattern => pattern.test(command));
const PS_ALIASES = new Set(['copy', 'cpi', 'move', 'mi', 'del', 'erase', 'ri', 'ni', 'clc', 'sc', 'ac', 'ren', 'rni']);
const PS_VALUE = ['path', 'literalpath', 'destination', 'filepath', 'argumentlist', 'name', 'newname', 'value', 'encoding', 'itemtype', 'filter',
  'include', 'exclude', 'credential', 'stream', 'width', 'inputobject', 'delimiter', 'target', 'variable'];
const PS_SWITCH = ['force', 'recurse', 'append', 'nonewline', 'passthru', 'whatif', 'confirm', 'noclobber', 'container'];
// A PowerShell named parameter: its full name in any program (PowerShell aliases `cp`, `mv`, `rm`), or a unique prefix of
// it in a PowerShell cmdlet or alias.
function psParameter(head, powershell) {
  const name = head.toLowerCase();
  const all = [...PS_VALUE, ...PS_SWITCH];
  if (all.includes(name) && name.length > 1) return name;
  const prefixed = powershell && name ? all.filter(parameter => parameter.startsWith(name)) : [];
  return prefixed.length === 1 ? prefixed[0] : null;
}
// Options are tokens starting with `-`; a PowerShell named parameter or a listed short (`short`) or long (`long`) option
// takes the next token (or its attached value) as its value; the remaining tokens are positionals.
function parseArguments(program, args, short = '', long = []) {
  const powershell = program.includes('-') || PS_ALIASES.has(program);
  const named = new Map(), flags = new Set(), positionals = [];
  const set = (key, value) => { if (value !== undefined && value !== '') named.set(key, [...(named.get(key) || []), value]); };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') { positionals.push(...args.slice(i + 1)); break; }
    if (!arg.startsWith('-') || arg === '-') { positionals.push(arg); continue; }
    const [head, ...attached] = arg.slice(1).split(':');
    const parameter = arg.startsWith('--') ? null : psParameter(head, powershell);
    if (parameter) {
      if (PS_VALUE.includes(parameter)) set(parameter, attached.length ? attached.join(':') : args[++i]);
      else flags.add(parameter);
      continue;
    }
    if (arg.startsWith('--')) {
      const equals = arg.indexOf('=');
      const option = arg.slice(2, equals === -1 ? undefined : equals);
      if (long.includes(option)) set(`--${option}`, equals === -1 ? args[++i] : arg.slice(equals + 1));
      else flags.add(`--${option}`);
      continue;
    }
    for (let j = 1; j < arg.length; j++) {
      if (short.includes(arg[j])) { set(`-${arg[j]}`, arg.slice(j + 1) || args[++i]); break; }
      flags.add(`-${arg[j]}`);
    }
  }
  const values = (...keys) => keys.flatMap(key => named.get(key) || []);
  return { named, flags, positionals, values };
}
// "Every file under a directory": never enters node_modules, .next or .git, which are reported as the directory itself.
const GENERATED_DIRECTORY = /^(?:node_modules|\.next|\.git)$/i;
function filesUnder(root, directory) {
  if (directory.split('/').some(segment => GENERATED_DIRECTORY.test(segment))) return [];
  const files = [];
  const walk = dir => {
    let entries; try { entries = readdirSync(resolve(root, dir), { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const path = dir ? `${dir}/${entry.name}` : entry.name;
      if (entry.isDirectory() && !GENERATED_DIRECTORY.test(entry.name)) walk(path); else files.push(path);
    }
  };
  walk(directory);
  return files;
}
const insideProject = path => path !== '' && path !== '..' && !path.startsWith('../') && !isAbsolute(path);
function isDirectory(target) { try { return statSync(target).isDirectory(); } catch { return false; } }
// R13 (d): programs that take their paths from the pipeline when they name none.
const PIPED_PROGRAMS = new Set([...DELETE_PROGRAMS, ...MOVE_PROGRAMS, ...RENAME_PROGRAMS, 'clear-content', 'clc', 'set-content', 'sc', 'add-content', 'ac']);
const PACKAGE_FILES = ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb'];
const PACKAGE_WRITE = /^(?:install|i|ci|add|remove|uninstall|rm|un|update|up|upgrade|dedupe|prune|link)$/;
const urlName = url => { try { return basename(new URL(url).pathname) || undefined; } catch { return undefined; } };
// R15: the targets of the R15 row of section 5 for one simple command, with the helpers of `programTargets`.
function otherWriterTargets(program, args, { folder, paths, withFiles, joined, leaf }) {
  const lower = args.map(arg => arg.toLowerCase());
  const plain = args.filter(arg => !arg.startsWith('-'));
  // The value of the first of `names`, attached (`--prefix=x`, `-OutFile:x`) or the next word.
  const valueOf = (...names) => {
    for (let i = 0; i < args.length; i++) {
      const [name, attached] = lower[i].split(/[=:](.*)/s);
      if (names.includes(name)) return attached !== undefined ? args[i].slice(name.length + 1) : args[i + 1];
    }
    return undefined;
  };
  const valueWords = names => args.filter((arg, i) => i > 0 && names.includes(lower[i - 1]));
  const files = list => list.filter(word => !word.startsWith('-')).flatMap(withFiles);
  const inFolder = (prefix, names) => names.map(name => (prefix ? joined(prefix, name) : name)).flatMap(paths);
  if (program === 'prettier') return lower.some(arg => arg === '--write' || arg === '-w') ? files(plain) : [];
  if (program === 'eslint') {
    if (!lower.includes('--fix')) return [];
    const values = valueWords(['--config', '-c', '--ext', '--format', '-f', '--rule', '--plugin', '--parser', '--output-file', '-o']);
    return [...files(plain.filter(word => !values.includes(word))), ...paths(valueOf('--output-file', '-o'))];
  }
  // Downloads write their output file; a remote copy writes a local destination (a `host:path` word is remote).
  const remote = word => /^[^/\\]{2,}:/.test(word);
  if (program === 'curl') {
    // `-o` (lower case) names the output file; `-O` writes the last segment of the URL.
    const out = args.find((arg, i) => args[i - 1] === '-o') ?? valueOf('--output');
    const named = args.some(arg => arg === '-O' || arg === '--remote-name') ? plain.map(urlName).filter(Boolean) : [];
    return [...paths(out), ...named.flatMap(paths)];
  }
  if (program === 'wget') {
    const out = args.find((arg, i) => args[i - 1] === '-O') ?? valueOf('--output-document');
    if (out) return paths(out);
    const directory = args.find((arg, i) => args[i - 1] === '-P') ?? valueOf('--directory-prefix');
    return plain.map(urlName).filter(Boolean).flatMap(name => paths(directory ? joined(directory, name) : name));
  }
  if (['invoke-webrequest', 'iwr', 'invoke-restmethod', 'irm'].includes(program)) return paths(valueOf('-outfile'));
  if (program === 'scp' || program === 'rsync') {
    const positionals = plain.filter(word => !valueWords(['-p', '-i', '-o', '-e', '-f', '-l']).includes(word));
    const destination = positionals.length >= 2 ? positionals.at(-1) : undefined;
    if (!destination || remote(destination)) return [];
    const folderLike = /[\\/]$/.test(destination) || isDirectory(resolve(folder, spelling(destination)));
    return [...paths(destination), ...(folderLike ? positionals.slice(0, -1).filter(source => !remote(source))
      .flatMap(source => paths(joined(destination, leaf(source)))) : [])];
  }
  if (program === 'npm' && /^(?:pkg|version)$/i.test(plain[0] || '')) {
    // `npm pkg set|delete|fix` edits package.json; `npm version` also the lockfile.
    const pkg = plain[0].toLowerCase() === 'pkg';
    if (pkg && !/^(?:set|delete|fix)$/i.test(plain[1] || '')) return [];
    return inFolder(valueOf('--prefix'), pkg ? ['package.json'] : ['package.json', 'package-lock.json']);
  }
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(program)) {
    const sub = (plain[0] || (program === 'yarn' ? 'install' : '')).toLowerCase();
    if (lower.includes('-g') || lower.includes('--global') || !PACKAGE_WRITE.test(sub)) return [];
    // `--prefix`, `-C`, `--dir` or `--cwd` names the folder whose manifest and lockfile change.
    return inFolder(valueOf('--prefix', '-c', '--dir', '--cwd'), PACKAGE_FILES);
  }
  if (program === 'tar') {
    const bundle = args.findIndex((arg, i) => /^-?[A-Za-z]+$/.test(arg) && (i === 0 || arg.startsWith('-')) && /[cxrut]/.test(arg.replace(/^-/, '')));
    const modes = bundle === -1 ? '' : args[bundle].replace(/^-/, '');
    const extract = modes.includes('x') || lower.includes('--extract') || lower.includes('--get');
    const create = /[cru]/.test(modes) || ['--create', '--append', '--update'].some(flag => lower.includes(flag));
    const archive = valueOf('--file', '-f') ?? (modes.includes('f') ? args[bundle + 1] : undefined);
    return [...(create ? paths(archive) : []), ...(extract ? withFiles(valueOf('-c', '--directory') ?? '.') : [])];
  }
  if (program === 'unzip') return withFiles(valueOf('-d') ?? '.');
  if (program === 'expand-archive') return withFiles(valueOf('-destinationpath') ?? plain[1] ?? '.');
  if (program === 'compress-archive') return paths(valueOf('-destinationpath') ?? plain[1]);
  // `Export-Csv` and `Export-Clixml`.
  return paths(valueOf('-path', '-literalpath') ?? plain[0]);
}
// The index of the program word of a simple command (section 5). A leading `sudo`, `env`, `command`, `nohup` or `time` is
// skipped with its own options (`sudo -u admin`, `env -i`) and the variable assignments before the program; revision 4,
// R13 (a): also the runners `exec`, `nice`, `ionice`, `timeout` (with its duration), `stdbuf`, `builtin` and `doas`, and
// (R15) `npx`, `pnpx` and `bunx`.
const WRAPPER_VALUES = { sudo: /^-[ugCDhpRrTt]$/, env: /^-[uCS]$/, nice: /^-n$/, ionice: /^-[cnp]$/, timeout: /^-[sk]$/,
  stdbuf: /^-[ioe]$/, doas: /^-[uC]$/, npx: /^-p$/, pnpx: /^-p$/, bunx: /^-p$/ };
function programIndex(texts) {
  let index = 0, wrapper = null;
  while (index < texts.length) {
    const word = texts[index];
    if (/^(?:sudo|env|command|nohup|time|exec|nice|ionice|timeout|stdbuf|builtin|doas|npx|pnpx|bunx)$/i.test(word)) {
      wrapper = word.toLowerCase(); index++;
      // R13 (a): `timeout` takes its options and then a duration before the program.
      if (wrapper === 'timeout') { while (texts[index]?.startsWith('-')) index += WRAPPER_VALUES.timeout.test(texts[index]) ? 2 : 1; index++; }
      continue;
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(word)) { index++; continue; }
    if (wrapper && word.startsWith('-')) { index += WRAPPER_VALUES[wrapper]?.test(word) ? 2 : 1; continue; }
    break;
  }
  return index;
}
// Targets of one simple command of section 5 and R15, resolved in `folder`: [project paths]. `all` holds every simple
// command's words for `xargs` and the R13 (d) pipeline rule, whose paths arrive through the pipeline.
function programTargets(root, folder, texts, all) {
  const index = programIndex(texts);
  if (index >= texts.length) return [];
  const program = basename(texts[index].replaceAll('\\', '/')).toLowerCase().replace(/\.exe$/, '');
  const args = texts.slice(index + 1);
  if (!WRITE_PROGRAMS.has(program) && !OTHER_WRITERS.has(program)) return [];
  // R12 (b): a target with `*`, `?` or `[` also adds every path the glob matches in its folder.
  const paths = raw => {
    if (typeof raw !== 'string' || !raw) return [];
    const found = [projectPath(root, raw, folder)];
    if (/[*?[]/.test(raw) && !LITERAL_WORDS.has(raw)) {
      try {
        for (const match of globSync(spelling(raw), { cwd: folder, exclude: entry => GENERATED_DIRECTORY.test(basename(String(entry?.name ?? entry))) })) {
          found.push(projectPath(root, match, folder));
        }
      } catch { /* an invalid pattern adds only its literal */ }
    }
    return found;
  };
  // The project root itself (`.`, project path '') is a directory of the project too.
  const projectDirectory = path => (path === '' || insideProject(path)) && isDirectory(resolve(root, path));
  const withFiles = raw => paths(raw).flatMap(path => [path, ...(projectDirectory(path) ? filesUnder(root, path) : [])]);
  const joined = (directory, name) => `${directory.replace(/[\\/]+$/, '')}/${name}`;
  const leaf = source => basename(source.replaceAll('\\', '/').replace(/\/+$/, ''));
  const under = source => paths(source).filter(projectDirectory)
    .flatMap(path => filesUnder(root, path).map(file => (path ? file.slice(path.length + 1) : file)));
  if (OTHER_WRITERS.has(program)) return otherWriterTargets(program, args, { folder, paths, withFiles, joined, leaf });
  // R13 (d): a delete, move, rename or content cmdlet with no path takes its paths from the pipeline: every project path
  // named by the other simple commands and every file under each named project directory (the xargs rule); a move also
  // keeps its destination.
  const piped = [];
  if (PIPED_PROGRAMS.has(program) && all.length > 1) {
    const parsed = parseArguments(program, args);
    if (!parsed.values('path', 'literalpath').length && !parsed.positionals.length) {
      piped.push(...all.filter(words => words.join('\0') !== texts.join('\0')).flatMap(words => words.slice(1))
        .filter(word => !word.startsWith('-')).flatMap(withFiles));
      if (!MOVE_PROGRAMS.has(program)) return piped;
    }
  }
  if (COPY_PROGRAMS.has(program) || MOVE_PROGRAMS.has(program)) {
    const parsed = parseArguments(program, args, program === 'install' ? 'tSmog' : 'tS', ['target-directory', 'suffix', 'mode', 'owner', 'group']);
    const sources = [...parsed.values('path', 'literalpath'), ...parsed.positionals];
    const destinations = parsed.values('destination', '-t', '--target-directory');
    if (!destinations.length && parsed.positionals.length && sources.length >= 2) destinations.push(sources.pop());
    const move = MOVE_PROGRAMS.has(program);
    const recursive = move || ['recurse', '-r', '-R', '-a', '--recursive', '--archive'].some(flag => parsed.flags.has(flag));
    const found = move ? sources.flatMap(withFiles) : [];
    for (const destination of destinations) {
      found.push(...paths(destination));
      const folderLike = /[\\/]$/.test(destination) || isDirectory(resolve(folder, spelling(destination)));
      for (const source of sources) {
        if (folderLike) found.push(...paths(joined(destination, leaf(source))));
        if (!recursive) continue;
        for (const file of under(source)) {
          if (folderLike) found.push(...paths(joined(joined(destination, leaf(source)), file)));
          found.push(...paths(joined(destination, file)));
        }
      }
    }
    return [...piped, ...found];
  }
  if (DELETE_PROGRAMS.has(program)) {
    const parsed = parseArguments(program, args);
    return [...parsed.values('path', 'literalpath'), ...parsed.positionals].flatMap(withFiles);
  }
  if (TEE_PROGRAMS.has(program)) {
    const parsed = parseArguments(program, args);
    return [...parsed.values('filepath', 'literalpath'), ...parsed.positionals].flatMap(paths);
  }
  if (CONTENT_PROGRAMS.has(program)) {
    const parsed = parseArguments(program, args);
    return [...parsed.values('path', 'literalpath', 'filepath'), ...parsed.positionals].flatMap(paths);
  }
  if (program === 'sed') {
    let inPlace = false, script = false;
    const positionals = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--') { positionals.push(...args.slice(i + 1)); break; }
      if (arg.startsWith('--')) {
        const option = arg.slice(2).split('=')[0];
        if (option === 'in-place') inPlace = true;
        else if (['expression', 'file', 'line-length'].includes(option)) { script ||= option !== 'line-length'; if (!arg.includes('=')) i++; }
        continue;
      }
      if (arg.startsWith('-') && arg.length > 1) {
        for (let j = 1; j < arg.length; j++) {
          if (arg[j] === 'i') { inPlace = true; break; } // the rest of the word is the backup suffix
          if ('efl'.includes(arg[j])) { script ||= arg[j] !== 'l'; if (j === arg.length - 1) i++; break; }
        }
        continue;
      }
      positionals.push(arg);
    }
    return inPlace ? (script ? positionals : positionals.slice(1)).flatMap(paths) : [];
  }
  if (program === 'touch' || program === 'truncate') {
    const parsed = program === 'touch' ? parseArguments(program, args, 'dtr', ['date', 'reference', 'time'])
      : parseArguments(program, args, 'sr', ['size', 'reference']);
    return parsed.positionals.flatMap(paths);
  }
  if (program === 'dd') return args.filter(arg => /^of=/i.test(arg)).map(arg => arg.slice(3)).flatMap(paths);
  if (program === 'new-item' || program === 'ni') {
    const parsed = parseArguments(program, args);
    const locations = [...parsed.values('path', 'literalpath'), ...parsed.positionals];
    const names = parsed.values('name');
    if (!names.length) return locations.flatMap(paths);
    return (locations.length ? locations : ['.']).flatMap(location => names.map(name => joined(location, name))).flatMap(paths);
  }
  if (RENAME_PROGRAMS.has(program)) {
    const parsed = parseArguments(program, args);
    const positionals = [...parsed.positionals];
    const sources = parsed.values('path', 'literalpath');
    if (!sources.length && positionals.length) sources.push(positionals.shift());
    const names = [...parsed.values('newname'), ...positionals];
    return sources.flatMap(source => [...paths(source),
      ...names.flatMap(name => paths(joined(dirname(source.replaceAll('\\', '/')), name)))]);
  }
  // `xargs` followed by a program above, or `find` with an action that deletes or runs a program.
  const run = program === 'xargs' ? args.some(arg => WRITE_PROGRAMS.has(basename(arg.replaceAll('\\', '/')).toLowerCase().replace(/\.exe$/, '')))
    : args.some(arg => /^-(?:delete|exec|execdir|ok|okdir)$/i.test(arg));
  if (!run) return [];
  const named = program === 'xargs' ? all.flat() : texts.slice(index + 1);
  return named.filter(word => !word.startsWith('-')).flatMap(withFiles);
}
// R12 (e) W3: literal path arguments of the API write calls (both arguments of a copy, move or replace).
// R14 (c), sub-review F7: a generic name (`rm`, `copy`, `replace`, …) is an API call only after `fs.`, `fs.promises.`,
// `fsp.`, `os.`, `shutil.`, `]::` or `).`, so a string method such as `'a'.replace('x','y')` is no write.
const API_QUALIFIER = String.raw`(?:\bfs\.(?:promises\.)?|\bfsp\.|\bos\.|\bshutil\.|\]::|\)\.)`;
const API_ONE = new RegExp(String.raw`(?:\b(?:writeFileSync|writeFile|appendFileSync|appendFile|createWriteStream|truncateSync|rmSync|unlinkSync|WriteAllText|WriteAllLines|WriteAllBytes|AppendAllText|AppendAllLines)|${API_QUALIFIER}(?:truncate|rm|unlink|Delete|remove))\s*\(\s*r?['"]([^'"]+)['"]`, 'gi');
const API_TWO = new RegExp(String.raw`(?:\b(?:copyFileSync|copyFile|cpSync|renameSync)|${API_QUALIFIER}(?:cp|rename|Copy|Move|Replace|copyfile|copy|move|replace))\s*\(\s*r?['"]([^'"]+)['"]\s*,\s*r?['"]([^'"]+)['"]`, 'gi');
const API_PATHLIB = /Path\(\s*r?['"]([^'"]+)['"]\s*\)\s*\.\s*write_(?:text|bytes)/g;
function apiArguments(text) {
  return [...[...text.matchAll(API_ONE)].map(m => m[1]), ...[...text.matchAll(API_TWO)].flatMap(m => [m[1], m[2]]),
    ...[...text.matchAll(API_PATHLIB)].map(m => m[1])];
}
// R12 (c): folder changes.
const FOLDER_PROGRAM = /^(?:cd|chdir|pushd|set-location|sl|push-location)$/i;
const RAW_FOLDER_WORD = /(?:^|[\s;&|('"])(?:cd|chdir|pushd|set-location|sl|push-location)\s+(?:\/[dD]\s+)?(?:-(?:Path|LiteralPath)\s+)?['"]?([A-Za-z0-9_.~/\\:-]+)|\b(?:process|os)\.chdir\(\s*['"]([^'"]+)['"]/gi;
const NESTED_SHELL = /(?:^|[\s;&|('"])(?:bash|sh|cmd(?:\.exe)?|powershell(?:\.exe)?|pwsh)\s+(?:\/d\s+)?(?:-c|\/c|-Command)\b|(?:^|[\s;&|('"])(?:node|python3?)\s+(?:-e|-c|--eval)\b/i;
// R13 (e): words of the lenient reading that held a quoted character; their glob characters are literal.
const LITERAL_WORDS = new Set();
// Revision 4, R13 (b): programs that run a command given as text, or a program with an argument list.
const EVALUATOR = /^(?:eval|iex|invoke-expression)$/i;
const SHELL_PROGRAM = /^(?:bash|sh|zsh|dash|cmd|powershell|pwsh)(?:\.exe)?$/i;
const START_PROCESS = /^(?:start-process|saps)$/i;
const SHELL_TEXT_FLAG = /^(?:-c|\/c|\/k|-com(?:m(?:a(?:n(?:d)?)?)?)?)$/i;
// The command text an evaluator, nested shell or Start-Process runs, or null. Its program is the section 5 program word,
// after the wrappers and runners of `programIndex` (`sudo bash -c …`, `timeout 5 sh -c …`).
function evaluatedText(words) {
  const texts = words.slice(programIndex(words));
  const program = basename((texts[0] || '').replaceAll('\\', '/'));
  if (EVALUATOR.test(program)) return texts.slice(1).filter(word => !/^-command$/i.test(word)).join(' ');
  if (START_PROCESS.test(program)) {
    const parsed = parseArguments('start-process', texts.slice(1));
    const file = [...parsed.values('filepath'), ...parsed.positionals][0];
    const list = parsed.named.get('argumentlist') || parsed.positionals.slice(1);
    return file ? [file, ...list.flatMap(value => value.split(/[\s,]+/))].filter(Boolean).join(' ') : null;
  }
  if (!SHELL_PROGRAM.test(program)) return null;
  const flag = texts.findIndex((word, i) => i > 0 && SHELL_TEXT_FLAG.test(word));
  return flag === -1 ? null : texts.slice(flag + 1).join(' ');
}
// R13 (f) (third self-audit): the string arguments of a child-process call (`execSync('…')`, `subprocess.run(['rm', 'x'])`,
// `os.system('…')`).
const CHILD_CALL = /\b(?:execSync|execFileSync|execFile|exec|spawnSync|spawn|system|popen|Popen|run|call|check_call|check_output)\s*\(\s*\[?((?:\s*r?(?:'[^']*'|"[^"]*")\s*,?)+)/g;
const RAW_REDIRECT = /(?<![=<>])>{1,2}(?![=>])\s*(?:"([^"]+)"|'([^']+)'|([^\s;|]+))/g;
// R12 (g): the Bash `>|` redirection (write despite noclobber), optionally after a stream number.
const RAW_NOCLOBBER = /(?<![=<>])>\|[ \t]*(?:"([^"]+)"|'([^']+)'|([^\s;|&<>'"]+))/g;
const movedFolder = value => typeof value === 'string' && value !== '' && value !== '-' && !value.startsWith('~') && !value.startsWith('$');
// R12 (g): the 941 split ends a simple command at the `|` of `>|`; the first word of the next one is its target and the
// rest are arguments of the first.
function noclobberCommands(commands) {
  const out = [];
  const endsWithRedirect = words => { const last = words.at(-1)?.chars.at(-1); return Boolean(last) && !last.quoted && last.ch === '>'; };
  for (let i = 0; i < commands.length; i++) {
    let words = [...commands[i]];
    const targets = [];
    while (endsWithRedirect(words) && i + 1 < commands.length) {
      const [target, ...rest] = commands[++i];
      targets.push(target.text);
      const operator = words.pop();
      words = [...words, ...rest, operator];
    }
    out.push({ words, noclobber: targets });
  }
  return out;
}
// The Task 941 result, with the R3 write words and, for a command the parser rejects, the R1 fallback.
function baseShellWriteTargets(root, command) {
  if (isReadOnlyShellCommand(command)) {
    // A target the hook cannot resolve itself (`$PWD/…`, `~/…`, a Git Bash `/c/…` path) also reports the project file
    // path it ends with, which the write-word branch reported before Task 941.
    return [...new Set(shellCommands(command).flatMap(words => redirections(words).targets).flatMap(target => {
      const embedded = target.match(PROJECT_FILE_SUFFIX)?.[0];
      return [projectPath(root, target), ...(embedded ? [projectPath(root, embedded.replaceAll('\\', '/'))] : [])];
    }))];
  }
  const files = [];
  if (WRITE_WORD.test(command)) {
    files.push(...[...command.matchAll(PROJECT_FILE)].map(m => projectPath(root, m[0].replaceAll('\\', '/'))));
  }
  // Redirection writes its target, not every source filename mentioned by a read/test command.
  for (const match of command.matchAll(RAW_REDIRECT)) {
    files.push(projectPath(root, match[1] || match[2] || match[3]));
  }
  if (!shellCommands(command) && namesWriteProgram(command)) {
    for (const match of command.matchAll(PROJECT_FILE)) {
      const path = projectPath(root, match[0].replaceAll('\\', '/'));
      if (!files.includes(path)) files.push(path);
    }
  }
  return files;
}
// Shell writes the PreToolUse guard recognizes: write cmdlets/APIs naming a project path, output redirection (Task 941),
// the programs of Task 943 section 5, and (R12) the spellings and folders that reach the same file. `start` is the
// absolute shell folder the command runs in (R12 (d)); resolution against the root always stays.
export const shellWriteTargets = withPathCache(uncachedShellWriteTargets);
function uncachedShellWriteTargets(root, command, start, depth = 0) {
  if (typeof command !== 'string') return [];
  const result = baseShellWriteTargets(root, command);
  // A directory walk can add tens of thousands of paths; a Set keeps the duplicate check linear.
  const seen = new Set(result);
  const add = path => { if (path && !seen.has(path)) { seen.add(path); result.push(path); } };
  const starts = [resolve(root), ...(typeof start === 'string' && isAbsolute(start) ? [resolve(start)] : [])];
  const readOnly = isReadOnlyShellCommand(command);
  const commands = shellCommands(command);
  const resolveIn = (raw, folders, glob) => {
    for (const folder of new Set([resolve(root), ...folders])) {
      add(projectPath(root, raw, folder));
      if (!glob || !/[*?[]/.test(raw)) continue;
      try {
        for (const match of globSync(spelling(raw), { cwd: folder, exclude: entry => GENERATED_DIRECTORY.test(basename(String(entry?.name ?? entry))) })) {
          add(projectPath(root, match, folder));
        }
      } catch { /* an invalid pattern adds only its literal */ }
    }
  };
  if (commands) {
    let folders = [...starts];
    const merged = noclobberCommands(commands);
    const all = merged.map(entry => redirections(entry.words).args.map(arg => arg.text));
    for (const { words, noclobber } of merged) {
      const { args, targets } = redirections(words);
      const texts = args.map(arg => arg.text);
      for (const target of [...targets, ...noclobber]) resolveIn(target, folders, true);
      // R13 (a): `builtin cd` and `command cd` change the folder too.
      const lead = /^(?:builtin|command)$/i.test(texts[0] || '') ? 1 : 0;
      if (FOLDER_PROGRAM.test(texts[lead] || '')) {
        const parsed = parseArguments(texts[lead].toLowerCase(), texts.slice(lead + 1));
        // R14 (a), sub-review F3: `cd /d <folder>` (cmd) names the folder after its `/d` option.
        const value = [...parsed.values('path', 'literalpath'), ...parsed.positionals.filter(word => !/^\/d$/i.test(word))][0];
        if (movedFolder(value)) folders = folders.map(folder => resolve(folder, spelling(value)));
        continue;
      }
      if (readOnly) continue;
      for (const folder of new Set([resolve(root), ...folders])) {
        for (const path of programTargets(root, folder, texts, all)) add(path);
      }
      for (const raw of apiArguments(texts.join(' '))) resolveIn(raw, folders, false);
      // R13 (b): the command text an evaluator, nested shell or Start-Process runs, in each current folder, at most three
      // levels deep.
      const inner = evaluatedText(texts);
      if (inner && depth < 3) {
        for (const folder of new Set([resolve(root), ...folders])) for (const path of uncachedShellWriteTargets(root, inner, folder, depth + 1)) add(path);
      }
    }
  }
  if (readOnly || (commands && !NESTED_SHELL.test(command))) return result;
  // A command the parser rejects, or a nested shell or interpreter: every folder-change word of the raw text, quoted
  // text included, adds a folder for the raw-text write positions.
  const folders = [...starts];
  // R14 (d), sub-review F8: each raw folder is kept once.
  const seenFolders = new Set(starts);
  for (const first of starts) {
    let current = first;
    for (const match of command.matchAll(RAW_FOLDER_WORD)) {
      const value = match[1] || match[2];
      if (!movedFolder(value)) continue;
      current = resolve(current, spelling(value));
      if (!seenFolders.has(current)) { seenFolders.add(current); folders.push(current); }
    }
  }
  for (const pattern of [RAW_REDIRECT, RAW_NOCLOBBER]) {
    for (const match of command.matchAll(pattern)) {
      const raw = match[1] || match[2] || match[3];
      resolveIn(raw, folders, false);
      // R12 (f): a nested shell leaves its closing quote on the target.
      if (match[3]) resolveIn(raw.replace(/^['"]+|['"]+$/g, ''), folders, false);
    }
  }
  for (const raw of apiArguments(command)) resolveIn(raw, folders, false);
  // R13 (f): the joined string literals of a child-process call are a command, read in every raw folder.
  if (depth < 3) for (const match of command.matchAll(CHILD_CALL)) {
    const inner = [...match[1].matchAll(/'([^']*)'|"([^"]*)"/g)].map(m => m[1] ?? m[2]).join(' ');
    if (inner.trim()) for (const folder of new Set(folders)) for (const path of uncachedShellWriteTargets(root, inner, folder, depth + 1)) add(path);
  }
  if (!commands) {
    // R13 (c): for a parser-rejected command naming a section 5 program, the R1 paths in every raw folder too.
    if (namesWriteProgram(command)) for (const match of command.matchAll(PROJECT_FILE)) resolveIn(match[0].replaceAll('\\', '/'), folders, false);
    for (const path of lenientTargets(root, command, starts)) add(path);
  }
  return result;
}
// R13 (e), sub-review F1, F2, F4: a parser-rejected command read leniently. A heredoc or here-string body is data for its
// command unless a shell reads it (`bash <<EOF`), so it is dropped first (review 1 second self-audit: prose in
// `cat >> file <<'EOF'` named a governance file). The rest is split at `;`, `|`, `&` and line breaks, and each part into
// words at blanks, unquoted brackets and backticks; a quoted span stays inside its word, and a word with a quoted character
// is never glob-expanded (a quoted `*` in a sed script is no glob; `"src/app/[locale]/x.tsx"` stays literal). A nested
// shell, evaluator or Start-Process part is read as the words it runs and a leading script-block caller is dropped; each
// part in order then changes the folder or gets the section 5 and R15 targets in the root and its current folder, of
// which only file-like targets (with `/`, `\` or `.`, never `.` or `..`) are kept. The pipeline and xargs rules do not
// apply: a `|` inside quoted text would make a false pipeline that walks the project root (p15-lenient-pipeline-noise.txt).
const SHELL_READER = /(?:^|[\s;&|(])(?:bash|sh|zsh|dash|pwsh|powershell)(?:\.exe)?(?:\s+-\S+)*\s*(?:-\s*)?<</i;
const HEREDOC = /^([^\n]*?<<-?\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?[^\n]*)\n[\s\S]*?\n[ \t]*\2[ \t]*(?=\n|$)/gm;
const HERE_STRING = /@(['"])\r?\n[\s\S]*?\r?\n\1@/g;
const SCRIPT_BLOCK_CALLER = /^(?:invoke-command|icm|start-job|sajb|start-threadjob|foreach-object|foreach|%|\.)$/i;
function lenientTargets(root, command, starts) {
  const text = command.replace(HEREDOC, (all, head) => (SHELL_READER.test(head) ? all : head)).replace(HERE_STRING, ' ');
  const found = [];
  LITERAL_WORDS.clear();
  try {
    const parts = text.split(/[;|&\r\n]+/).map(part => {
      const words = [];
      let word = '', quote = '', quoted = false;
      const end = () => { if (word) { words.push(word); if (quoted) LITERAL_WORDS.add(word); } word = ''; quoted = false; };
      for (const ch of part) {
        if (quote) { if (ch === quote) quote = ''; else word += ch; continue; }
        if (ch === "'" || ch === '"') { quote = ch; quoted = true; continue; }
        if (/[\s`(){}]/.test(ch)) { end(); continue; }
        word += ch;
      }
      end();
      return words;
    }).filter(words => words.length);
    const fileLike = word => /[\\/.]/.test(word) && !/^\.\.?$/.test(word);
    let current = [...starts];
    for (let words of parts) {
      for (let inner = evaluatedText(words); inner !== null && words.length > 1; inner = evaluatedText(words)) words = inner.split(/\s+/).filter(Boolean);
      while (words.length > 1 && SCRIPT_BLOCK_CALLER.test(words[0])) {
        words = words.slice(1);
        while (words.length > 1 && words[0].startsWith('-')) words = words.slice(1);
      }
      const lead = /^(?:builtin|command)$/i.test(words[0] || '') ? 1 : 0;
      if (FOLDER_PROGRAM.test(words[lead] || '')) {
        const value = words.slice(lead + 1).filter(word => !/^(?:\/d|-Path|-LiteralPath)$/i.test(word))[0];
        if (movedFolder(value)) current = current.map(folder => resolve(folder, spelling(value)));
        continue;
      }
      for (const folder of new Set([resolve(root), ...current])) {
        for (const path of programTargets(root, folder, words, [words])) if (fileLike(path)) found.push(path);
      }
    }
  } finally { LITERAL_WORDS.clear(); }
  return found;
}
// Owner decision 2026-11-01 (Task 935 D2): a session that wrote any governance scope file cannot approve it. The
// approver's rule-only rebase of another reviewed contract (a `rules` chain entry by the receipt contract and its
// evidence) is not such a write, but only while that entry passes its rules validation (Task 940 R5, review note N1).
// A `scope` entry never exempts a write.
export const governanceIndependenceErrors = withPathCache(uncachedGovernanceIndependenceErrors);
function uncachedGovernanceIndependenceErrors(root, contract, receiptPath, transcript) {
  const calls = successfulCalls(transcript);
  // Task 943 R12 (d): also resolve against the shell folder recorded for the call, inside or outside the root.
  const folderOf = call => (typeof call.shellFolder === 'string' && isAbsolute(call.shellFolder) ? call.shellFolder : undefined);
  const written = [...calls.filter(call => ['Write', 'Edit'].includes(call.name)).flatMap(call => [projectPath(root, call.input?.file_path || call.input?.path),
      ...(folderOf(call) ? [projectPath(root, call.input?.file_path || call.input?.path, folderOf(call))] : [])]),
    ...calls.filter(call => ['PowerShell', 'Bash'].includes(call.name) && typeof call.input?.command === 'string')
      .flatMap(call => shellWriteTargets(root, call.input.command, folderOf(call)))];
  // Task 943 R8: in a Git repository only a contract tracked at HEAD can exempt a write (no shell; any failure exempts nothing).
  const repository = existsSync(join(root, '.git'));
  const tracked = path => {
    try { execFileSync('git', ['cat-file', '-e', `HEAD:${path}`], { cwd: root, stdio: 'ignore' }); return true; } catch { return false; }
  };
  const exempt = new Set();
  for (const path of allContracts(root)) {
    if (path === receiptPath) continue;
    let other; try { other = readJson(root, path); } catch { continue; }
    for (const { kind, entry } of rebaseChain(other).entries) {
      if (kind !== 'rules' || !entry || typeof entry !== 'object' || typeof entry.by !== 'string' || pathKey(entry.by) !== pathKey(receiptPath)) continue;
      if (typeof entry.evidence !== 'string' || !isEvidencePath(entry.evidence)) continue;
      let problems; try { problems = rulesEntryErrors(root, other, entry); } catch { continue; }
      if (problems.length) continue;
      if (repository && !tracked(path)) continue;
      exempt.add(pathKey(path));
      exempt.add(pathKey(entry.evidence));
    }
  }
  const errors = [];
  for (const file of new Set(written.filter(Boolean))) {
    if (!exempt.has(pathKey(file)) && inScope(root, contract.scope, file)) {
      errors.push(`GOVERNANCE INDEPENDENCE: this session wrote ${file}; an implementing session cannot approve (owner decision 2026-11-01)`);
    }
  }
  return errors;
}
function currentReceipt(text) {
  const candidate = [...text.matchAll(/^SECURITY TASK PREFLIGHT COMPLETE - contract:[^\r\n]*$/gm)].at(-1);
  if (!candidate) return { error: 'No valid receipt: run `node scripts/workflow-gates/cli.mjs receipt --contract <path>` through the PowerShell tool for the current task.' };
  const receipt = candidate[0].match(/^SECURITY TASK PREFLIGHT COMPLETE - contract: (tasks\/[^\r\n;]+\.security\.json)\.?\s*$/);
  return receipt ? { path: receipt[1] } : { error: 'Current security task receipt is malformed; register a corrected receipt.' };
}

function reviewContinuationErrors(root, last, messages, transcript) {
  // A review's current turn must finish its transition. A later informational owner question is not a new review.
  let ownerIndex = -1;
  for (const [index, line] of transcript.split('\n').entries()) {
    let event; try { event = JSON.parse(line); } catch { continue; }
    const content = event?.message?.content;
    if (event?.type === 'user' && (typeof content === 'string'
      || Array.isArray(content) && content.some(block => block.type === 'text'))) ownerIndex = index;
  }
  const entries = [...messages.map(message => ({ index: message.index,
    text: message.content.filter(block => block.type === 'text').map(block => block.text || '').join('\n') })),
  { index: Infinity, text: last }];
  const mode = list => list.flatMap(entry => plainResponseLines(entry.text))
    .map(line => line.text.match(/^(REVIEW|TASK-DESIGN) PREFLIGHT COMPLETE\b/)?.[1]).filter(Boolean).at(-1);
  const currentMode = mode(entries.filter(entry => entry.index > ownerIndex));
  if (currentMode !== 'REVIEW' && (currentMode || mode(entries) !== 'REVIEW' || !hasGitHandoff(last))) return [];

  const plain = plainResponseLines(last).map(line => line.text);
  // Whole-task approval still takes the independent release-validation path below.
  if (plain.some(line => /^(?:APPROVED|APPROVED WITH NOTES)$/.test(line))) return [];
  const references = plain.filter(line => line.startsWith('NEXT EXECUTOR CONTRACT:'));
  const path = references.length === 1 && references[0].match(/^NEXT EXECUTOR CONTRACT: (tasks\/(?!Archive\/).+\.security\.json)$/i)?.[1];
  if (!path) return ['REVIEW CONTINUATION: a stage acceptance is not the end of the assigned task. Complete and save the next assigned route in this turn, then name exactly one NEXT EXECUTOR CONTRACT: tasks/<path>.security.json. If a concrete external dependency prevents progress, report it with plain BLOCKED and no Git handoff. Resume retained proof; do not restart completed checks.'];
  try {
    const contract = JSON.parse(readFileSync(safePath(root, path), 'utf8'));
    const errors = validateContract(root, contract, { phase: 'plan' });
    if (contract.executionStatus !== 'ready') errors.push('Next route must explicitly be ready');
    if (contract.stage === 'reviewed' || !isTaskDocument(contract.task || '')) errors.push('Next route must be active and open for execution');
    return errors.map(error => `REVIEW CONTINUATION: ${path}: ${error}`);
  } catch (error) { return [`REVIEW CONTINUATION: next route unavailable or invalid (${error.message})`]; }
}

export const evaluateHook = withPathCache(uncachedEvaluateHook);
function uncachedEvaluateHook(root, event, transcript) {
  const messages = assistantMessages(transcript);
  const durable = successfulCalls(transcript).filter(call => ['PowerShell', 'Bash'].includes(call.name)
    && /(?:^|[\\/])cli\.mjs\s+receipt\s+--contract\s/.test(call.input?.command || ''))
    .map(call => ({ index: call.index, text: typeof call.result === 'string' ? call.result : (call.result || []).filter(b => b.type === 'text').map(b => b.text || '').join('\n') }));
  const text = [...messages.map(message => ({ index: message.index, text: message.content.filter(b => b.type === 'text').map(b => b.text || '').join('\n') })), ...durable]
    .sort((a, b) => a.index - b.index).map(entry => entry.text).join('\n');
  const role = sessionRole(root, event);
  if (event.hook_event_name === 'Stop') {
    const last = typeof event.last_assistant_message === 'string' ? event.last_assistant_message
      : messages.map(message => message.content.filter(b => b.type === 'text').map(b => b.text || '').join('\n')).filter(Boolean).at(-1) || '';
    // Reporting an incomplete task is always possible; it cannot authorize merge or release.
    const incomplete = blockedResponse(last);
    if (incomplete.isBlocked) return incomplete.errors;
    const written = successfulCalls(transcript).filter(b => ['Write', 'Edit'].includes(b.name))
      .map(b => projectPath(root, b.input?.file_path || b.input?.path));
    const tasks = [...new Set(written.filter(isTaskDocument))];
    const errors = role === 'executor' ? [] : reviewContinuationErrors(root, last, messages, transcript);
    for (const task of tasks) {
      if (!existsSync(resolve(root, task))) continue;
      const contract = `${task.slice(0, -3)}.security.json`;
      try { errors.push(...validateContract(root, readJson(root, contract), { phase: 'plan' }).map(e => `${contract}: ${e}`)); }
      catch (error) { errors.push(error.message); }
    }
    if (/^\s*(?:APPROVED(?: WITH NOTES)?|IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW)\s*$/m.test(last)) {
      if (role === 'executor' && /^\s*APPROVED(?: WITH NOTES)?\s*$/m.test(last)) errors.push('Executor cannot issue an approval verdict');
      const receipt = currentReceipt(text);
      if (receipt.error) errors.push(`Completion/approval requires the current task security contract receipt: ${receipt.error}`);
      else {
        try {
          const contract = readJson(root, receipt.path);
          const approving = /^\s*APPROVED(?: WITH NOTES)?\s*$/m.test(last);
          errors.push(...validateContract(root, contract, { phase: approving ? 'release' : 'verify' }));
          if (contract.kind === 'product') errors.push(...validateReport(root, contract, readJson(root, contract.report)));
          if (contract.kind === 'governance') {
            if (approving) errors.push(...governanceIndependenceErrors(root, contract, receipt.path, transcript));
            errors.push(...validateGovernanceReport(root, contract, readJson(root, contract.report)));
          }
          if (approving && contract.stage !== 'reviewed') errors.push('Independent approval requires reviewed stage');
        } catch (error) { errors.push(error.message); }
      }
    }
    return errors;
  }
  if (event.hook_event_name !== 'PreToolUse') return ['Unsupported security hook event'];
  const input = event.tool_input;
  if (!input || typeof input !== 'object') return ['Missing tool_input'];
  let files = [];
  if (['Write', 'Edit'].includes(event.tool_name)) {
    // Revision 4, R12 (d): a relative path is also resolved in the event's working directory; the guard decides on both
    // resolutions and refuses the write as outside the project when either leaves the root.
    const raw = input.file_path || input.path;
    const file = projectPath(root, raw);
    if (!file) return ['Missing write path'];
    const folder = typeof event.cwd === 'string' && isAbsolute(event.cwd) ? event.cwd : null;
    files = [...new Set([file, ...(folder ? [projectPath(root, raw, folder)] : [])])];
    if (files.some(path => path === '..' || path.startsWith('../') || isAbsolute(path))) return ['Write outside the project cannot be verified'];
  } else if (['PowerShell', 'Bash'].includes(event.tool_name)) {
    if (typeof input.command !== 'string') return ['Missing shell command'];
    // Task 943 R12 (d): the event's working directory, which follows `cd`.
    files = shellWriteTargets(root, input.command, typeof event.cwd === 'string' && isAbsolute(event.cwd) ? event.cwd : undefined);
  }
  if (files.some(file => /^(?:\.git(?:\/|$))/i.test(file))) return ['OWNER GIT REQUIRED: agents cannot write Git metadata'];
  const explicitExecutor = role === 'executor';
  const explicitOpus = role === 'orchestrator';
  const enrolled = explicitOpus ? new Set() : registeredWrites(root, files);
  if (!role && files.some(file => isProductPath(file) || policyPath(file) || enrolled.has(file) || /^tasks\/.+\.security\.json$/.test(file))) {
    return ['ROLE UNKNOWN: guarded writes require supported session metadata or the configured executor/orchestrator agent'];
  }
  if (explicitExecutor) for (const file of files.filter(f => /^tasks\/.+\.security\.json$/.test(f))) {
    const errors = executorContractEdit(root, file, event);
    if (errors.length) return errors;
  }
  if (explicitOpus && files.some(isProductPath)) return ['ORCHESTRATOR BOUNDARY: product implementation belongs to the executor'];
  const executionReceipt = text.lastIndexOf('EXECUTION PREFLIGHT COMPLETE');
  const opusReceipt = Math.max(text.lastIndexOf('REVIEW PREFLIGHT COMPLETE'), text.lastIndexOf('TASK-DESIGN PREFLIGHT COMPLETE'));
  if (!explicitOpus && (explicitExecutor || executionReceipt > opusReceipt)
    && files.some(policyPath)) {
    return ['POLICY-EDIT AUTHORITY REQUIRED: Sonnet cannot edit workflow policy or enforcement'];
  }
  files = files.filter(file => isProductPath(file) || enrolled.has(file));
  if (!files.length) return [];
  const receipt = currentReceipt(text);
  let reason = receipt.error || '';
  if (!receipt.error) {
    try {
      safePath(root, receipt.path);
      const contract = readJson(root, receipt.path);
      const errors = validateContract(root, contract, { phase: 'plan' });
      if (contract.stage === 'reviewed') errors.push('Reviewed execution is frozen; Opus must reopen the affected route before another write');
      if (!isTaskDocument(contract.task || '')) errors.push('Execution requires an active task; archived receipts retain review evidence only');
      const outside = files.filter(file => !inScope(root, contract.scope, file));
      if (!errors.length && !outside.length) {
        const required = [...new Set([contract.task, ...workflowRuleInputs(root, contract.rules)])];
        const read = completedReads(root, transcript, required);
        const unread = required.filter(file => !read.includes(file));
        if (!unread.length) return [];
        reason = `${receipt.path}: these task/rule files are not fully read in their current content (a changed file must be read again in full): ${unread.join(', ')}.`;
      } else {
        reason = `${receipt.path}: ${errors.length ? `plan invalid (${errors.join('; ')})` : `outside its scope: ${outside.join(', ')} (Opus amends the contract)`}.`;
      }
    } catch (error) { reason = `${receipt.path}: current contract unavailable or invalid (${error.message}).`; }
  }
  return [`SECURITY TEST CONTRACT MISSING: load a valid saved task contract for these exact paths, then emit SECURITY TASK PREFLIGHT COMPLETE - contract: tasks/<kickoff basename>.security.json. ${reason}`];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let event;
  try {
    event = JSON.parse(readFileSync(0, 'utf8'));
    const root = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
    const transcript = event.transcript_path ? readFileSync(event.transcript_path, 'utf8') : '';
    const errors = evaluateHook(root, event, transcript);
    if (errors.length) {
      const reason = errors.join('\n');
      if (event.hook_event_name === 'Stop') { console.error(reason); process.exitCode = 2; }
      else console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
    }
  } catch {
    // Malformed input/runtime errors must not turn a guarded write into success. No event contents are logged.
    console.error('SECURITY GATE BLOCKED: hook input or required evidence could not be read.'); process.exitCode = 2;
  }
}
