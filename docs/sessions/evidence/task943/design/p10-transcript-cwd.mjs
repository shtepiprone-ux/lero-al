// Task 943 revision 2 design probe (2026-11-02): a Claude Code transcript entry records the shell folder of its tool call.
// Prints, for the given 1-based lines of a session transcript, the entry type, its `cwd` (the project root written as
// <root>), the tool name and the first 60 characters of a shell command; no other entry content is printed.
//   node docs/sessions/evidence/task943/design/p10-transcript-cwd.mjs <transcript.jsonl> <line> [<line> ...]
import { readFileSync } from 'node:fs';

const [transcriptPath, ...numbers] = process.argv.slice(2);
const root = process.cwd();
const entries = readFileSync(transcriptPath, 'utf8').split('\n');
for (const number of numbers.map(Number)) {
  const entry = JSON.parse(entries[number - 1]);
  const blocks = Array.isArray(entry.message?.content) ? entry.message.content : [];
  const use = blocks.find(block => block.type === 'tool_use');
  const result = blocks.find(block => block.type === 'tool_result');
  const cwd = typeof entry.cwd === 'string' ? entry.cwd.replace(root, '<root>').replaceAll('\\', '/') : String(entry.cwd);
  const what = use ? `tool_use ${use.name}: ${JSON.stringify(String(use.input?.command ?? '').slice(0, 60))}` : result ? 'tool_result' : '';
  console.log(`line ${number} | ${entry.type} | cwd=${cwd} | ${what}`);
}
