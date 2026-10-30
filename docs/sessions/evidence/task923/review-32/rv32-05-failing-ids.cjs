/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS evidence script (Task 923), not product code */ const BS = String.fromCharCode(92);
const r = require(require('path').resolve(process.argv[2]));
const root = process.cwd().split(BS).join('/') + '/';
for (const s of r.testResults) {
  const f = s.name.split(BS).join('/').replace(root, '');
  if (s.status === 'failed' && s.assertionResults.length === 0) console.log(f + ' > [SUITE] ' + (s.message || '').split('\n')[0].slice(0, 120));
  for (const a of s.assertionResults) if (a.status === 'failed') console.log(f + ' > ' + [...a.ancestorTitles, a.title].join(' > '));
}
