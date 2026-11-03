// Review 2 adversarial probe, part 2: corrected forms and the shell-keyword and open() families.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const hook = await import(pathToFileURL(process.argv[2]).href);
const root = mkdtempSync(join(tmpdir(), 'r2-adv2-'));
const put = (p, t = 'a\n') => { mkdirSync(join(root, p, '..'), { recursive: true }); writeFileSync(join(root, p), t); };
const X = 'scripts/workflow-gates/fixture-scope.mjs', D = 'scripts/workflow-gates', N = 'fixture-scope.mjs';
put(X); put(`docs/${N}`); put('package.json', '{}');
const writes = [
  `cp -t ${D} docs/${N}`, `mv -t ${D} docs/${N}`,
  `echo '${D}/*.mjs'; rm ${D}/*.mjs; echo '`,
  `if true; then rm ${X}; fi`, `if true; then echo; else rm ${X}; fi`, `for f in a; do rm ${X}; done`, `until true; do cp docs/${N} ${X}; done`,
  `if true; then cp docs/${N} ${X}; fi`, `case a in a) rm ${X};; esac`, `true || { rm ${X}; }`,
  `python -c "f = open('${X}', 'w'); f.write('x')"`, `python -c "with open('${X}', 'wb') as f: pass"`,
  `node -e "require('fs').open('${X}', 'w', () => 0)"`,
  `bash -lc 'cp docs/${N} ${X}'`, `bash -c -- 'rm ${X}'`, `sh -ec "rm ${X}"`,
];
const executor = command => ({ hook_event_name: 'PreToolUse', agent_type: 'executor', tool_name: 'Bash', cwd: root, tool_input: { command } });
for (const c of writes) console.log(`${hook.shellWriteTargets(root, c).includes(X) ? 'REPORTED' : 'MISSED  '} :: ${c}`);
for (const c of [`if true; then rm package.json; fi`, `python -c "open('package.json','w').write('{}')"`, `bash -lc 'rm package.json'`,
  `for f in a; do echo x > package.json; done`]) {
  console.log(`executor ${JSON.stringify(hook.evaluateHook(root, executor(c), ''))} :: ${c}`);
}
rmSync(root, { recursive: true, force: true });
