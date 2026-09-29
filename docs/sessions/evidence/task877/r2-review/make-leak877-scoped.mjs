// Task 877 review 2 — writes a title-scoped copy of the LIVE scripts/check-locale-leak.mjs (same PER_STORY_TOKENS,
// same detector) to argv[2]. Run from the project root:
//   node.exe docs/sessions/evidence/task877/r2-review/make-leak877-scoped.mjs .screenshots/leak877-scoped.mjs
// (Review 4: ESM form of the former make-leak877-scoped.cjs, whose require() failed `npm run lint`.)
import { readFileSync, writeFileSync } from 'node:fs'

let s = readFileSync('scripts/check-locale-leak.mjs', 'utf8')
const rep = (a, b) => {
  if (!s.includes(a)) throw new Error('missing: ' + a)
  s = s.split(a).join(b)
}
rep("import { fileURLToPath } from 'node:url';", "import { fileURLToPath, pathToFileURL } from 'node:url';")
rep(
  "import { MANTINE_STORY_TITLE_PREFIXES, isCanonicalMantineTitle } from './lib/mantine-story-scope.mjs';",
  "// Task 877 review 2: a read-only, title-scoped copy of scripts/check-locale-leak.mjs, run from the project root.\nconst { MANTINE_STORY_TITLE_PREFIXES, isCanonicalMantineTitle } = await import(pathToFileURL(resolve(process.cwd(), 'scripts/lib/mantine-story-scope.mjs')).href);",
)
rep("const ROOT = resolve(__dirname, '..');", 'const ROOT = process.cwd();')
rep("await import('playwright')", "await import(pathToFileURL(resolve(process.cwd(), 'node_modules/playwright/index.mjs')).href)")
rep(
  'const scopedStories = MANTINE_ONLY ? allStories.filter(s => isCanonicalMantineTitle(s.title)) : allStories;',
  "const RE = new RegExp('^(Patterns.Mantine.(AdminTable|AdminPageHeader|AdminCurrenciesView|CurrencyFormDialogView|CurrencyDetailDialogView|AdminCurrencyTabs|DashboardHeader)|Mantine.Primitives.Table)' + String.fromCharCode(36));\n  const scopedStories = allStories.filter(s => isCanonicalMantineTitle(s.title) && RE.test(s.title));",
)
rep(
  "const outputDir = join(ROOT, '.screenshots', 'locale-leak', timestamp);",
  "const outputDir = join(ROOT, '.screenshots', 'locale-leak-877', timestamp);",
)
writeFileSync(process.argv[2], s, 'utf8')
