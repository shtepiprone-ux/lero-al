// Task 943 revision 2 feasibility prototype (Task 941 review 2, owner: "close every UNVERIFIED item", 2026-11-02).
// This is design evidence, not the Task 943 implementation: it reads the real scripts/workflow-gates/security-hook.mjs,
// applies R12 (a)-(f) (plus the Task 941 revision 2 R1 (b) cd/Set-Location rule that AC13 relies on) as checked text edits,
// and writes the result to test-results/task943-prototype/security-hook.mjs (gitignored). The real hook is never changed.
//   node docs/sessions/evidence/task943/design/p12-r12-prototype.mjs     (from the project root; prints the output path)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const gates = join(root, 'scripts/workflow-gates');
const out = join(root, 'test-results/task943-prototype');
mkdirSync(out, { recursive: true });
let source = readFileSync(join(gates, 'security-hook.mjs'), 'utf8');
const edit = (find, replace) => {
  if (!source.includes(find)) throw new Error(`prototype edit anchor not found: ${find.slice(0, 80)}`);
  source = source.replace(find, replace);
};
// Imports of sibling modules point at the real files.
source = source.replace(/from '\.\/([\w.-]+\.mjs)'/g, (_, file) => `from '${pathToFileURL(join(gates, file)).href}'`);
edit("import { readFileSync, existsSync, realpathSync } from 'node:fs';",
  "import { readFileSync, existsSync, realpathSync, globSync } from 'node:fs';");

// R12 (a): Win32 spellings and canonicalisation before the outside test; a missing drive keeps the lexical result.
edit('function projectPath(root, file) {\n  if (typeof file !== \'string\') return \'\';\n  const target = resolve(root, file);',
  `function win32Spelling(file) {
  let f = file.replaceAll('\\\\', '/');
  f = f.replace(/^\\/([A-Za-z])\\//, '$1:/').replace(/^\\/\\/[?.]\\//, '').replace(/^\\/\\/[^/]+\\/([A-Za-z])\\$\\//, '$1:/');
  const parts = f.split('/');
  return parts.map((s, i) => (s === '.' || s === '..' || s === '') ? s
    : i === parts.length - 1 ? (s.replace(/[. ]+$/, '') || s) : s.replace(/\\.$/, '')).join('/');
}
function canonical(path) {
  let ancestor = path;
  const tail = [];
  while (!existsSync(ancestor) && dirname(ancestor) !== ancestor) { tail.unshift(basename(ancestor)); ancestor = dirname(ancestor); }
  if (!existsSync(ancestor)) return null;
  return join(realpathSync.native(ancestor), ...tail);
}
function projectPath(root, file, folder = root) {
  if (typeof file !== 'string') return '';
  if (process.platform === 'win32') {
    const target = resolve(folder, win32Spelling(file));
    const real = canonical(target);
    if (real === null) return relative(root, target).replaceAll('\\\\', '/');
    return relative(realpathSync.native(root), real).replaceAll('\\\\', '/');
  }
  const target = resolve(folder, file);`);

// Task 941 revision 2 R1 (b) emulation: a cd/Set-Location command with a > or >> target is not read-only.
edit('export function isReadOnlyShellCommand(command) {\n  const commands = shellCommands(command);\n  return Boolean(commands) && commands.every(readOnlySimpleCommand);',
  `export function isReadOnlyShellCommand(command) {
  const commands = shellCommands(command);
  if (commands && commands.some(words => /^(?:cd|set-location)$/i.test(redirections(words).args[0]?.text || ''))
    && commands.some(words => redirections(words).targets.length)) return false;
  return Boolean(commands) && commands.every(readOnlySimpleCommand);`);

// R12 (b)-(f) on top of the unchanged base result (order and duplicates of the base are kept): p12-r12-additions.txt.
edit('export function shellWriteTargets(root, command) {', 'function baseShellWriteTargets(root, command) {');
source += readFileSync(join(root, 'docs/sessions/evidence/task943/design/p12-r12-additions.txt'), 'utf8');

// R12 (d): the shell folder of each tool call (transcript entry cwd) and of the PreToolUse event.
edit('if (event.type === \'assistant\' && block.type === \'tool_use\' && block.id) pending.set(block.id, block);',
  'if (event.type === \'assistant\' && block.type === \'tool_use\' && block.id) pending.set(block.id, { ...block, shellFolder: event.cwd });');
edit(`  const written = [...calls.filter(call => ['Write', 'Edit'].includes(call.name)).map(call => projectPath(root, call.input?.file_path || call.input?.path)),
    ...calls.filter(call => ['PowerShell', 'Bash'].includes(call.name) && typeof call.input?.command === 'string')
      .flatMap(call => shellWriteTargets(root, call.input.command))];`,
`  const folderOf = call => (typeof call.shellFolder === 'string' && isAbsolute(call.shellFolder) ? call.shellFolder : undefined);
  const written = [...calls.filter(call => ['Write', 'Edit'].includes(call.name)).flatMap(call => [projectPath(root, call.input?.file_path || call.input?.path),
      ...(folderOf(call) ? [projectPath(root, call.input?.file_path || call.input?.path, folderOf(call))] : [])]),
    ...calls.filter(call => ['PowerShell', 'Bash'].includes(call.name) && typeof call.input?.command === 'string')
      .flatMap(call => shellWriteTargets(root, call.input.command, folderOf(call)))];`);
edit('    files = shellWriteTargets(root, input.command);',
  "    files = shellWriteTargets(root, input.command, typeof event.cwd === 'string' && isAbsolute(event.cwd) ? event.cwd : undefined);");

writeFileSync(join(out, 'security-hook.mjs'), source);
console.log(join(out, 'security-hook.mjs'));
