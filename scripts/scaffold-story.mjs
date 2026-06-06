#!/usr/bin/env node
/**
 * scaffold-story.mjs — Story scaffold generator (Task 398, Sprint 34).
 *
 * Generates a *.stories.tsx skeleton for a given component path.
 * The output is pre-wired to the canonical withCanvas/storyT/LocaleStress
 * patterns and passes check:stories immediately (no raw strings, fullscreen
 * layout, toolbar-reactive locale, no Ukrainian export).
 *
 * The developer fills in the TODO placeholders with REAL localized fixtures
 * using storyT(locale, 'storybook.NAMESPACE.key'). Leaving a raw English
 * string literal in a prop WILL fail check:stories — by design.
 *
 * Usage:
 *   node scripts/scaffold-story.mjs src/components/shared/MyComponent.tsx
 *   npm run new:story src/components/shared/MyComponent.tsx
 *
 * Output: <componentDir>/<ComponentName>.stories.tsx  (colocated)
 *
 * After scaffolding:
 *   1. Fill in props using storyT(locale, 'storybook.NAMESPACE.key').
 *   2. Add the storybook.NAMESPACE.* keys to messages/{sq,en,uk,it}.json.
 *   3. Run: npm run check:stories   (must exit 0 before committing)
 *   4. Remove the new component from scripts/story-coverage-exempt.json
 *      (if it was exempted) — the story now provides coverage.
 *
 * Docs: docs/storybook-governance.md §15
 * Added by Task 398 (Sprint 34, 2026-06-06).
 */

import { existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── CLI ───────────────────────────────────────────────────────────────────────
const inputArg = process.argv[2];
if (!inputArg) {
  console.error('Usage: npm run new:story <ComponentPath>');
  console.error('Example: npm run new:story src/components/shared/MyComponent.tsx');
  process.exit(1);
}

// Accept both absolute and relative paths
const compAbsPath = resolve(ROOT, inputArg);
const compRelPath = relative(ROOT, compAbsPath).replace(/\\/g, '/');

if (!existsSync(compAbsPath)) {
  console.error(`❌  Component not found: ${compRelPath}`);
  console.error('    Make sure the file exists before scaffolding a story.');
  process.exit(1);
}

if (!compAbsPath.endsWith('.tsx')) {
  console.error(`❌  Expected a .tsx file, got: ${compRelPath}`);
  process.exit(1);
}

if (compAbsPath.endsWith('.stories.tsx')) {
  console.error(`❌  Input is already a stories file: ${compRelPath}`);
  process.exit(1);
}

// ── Derive names ──────────────────────────────────────────────────────────────
const compDir = dirname(compAbsPath);
const compBaseName = basename(compAbsPath, '.tsx');    // e.g. "MyComponent"
const storyPath = join(compDir, `${compBaseName}.stories.tsx`);
const storyRelPath = relative(ROOT, storyPath).replace(/\\/g, '/');

if (existsSync(storyPath)) {
  console.error(`❌  Story file already exists: ${storyRelPath}`);
  console.error('    Delete it first if you want to regenerate.');
  process.exit(1);
}

// ── Derive Storybook category from directory name ──────────────────────────────
// src/components/ui/ → "Primitives"
// src/components/shared/ → "Shared"
// src/components/layout/ → "Layout"
// src/components/admin/ → "Admin"
// src/components/auth/ → "Auth"
// src/components/listing/ → "Listing"
// src/components/<other>/ → "<Other>" (titlecase)

function deriveCategory(absDir) {
  const rel = relative(join(ROOT, 'src', 'components'), absDir).replace(/\\/g, '/');
  const topDir = rel.split('/')[0] ?? '';
  const MAP = {
    ui: 'Primitives',
    shared: 'Shared',
    layout: 'Layout',
    admin: 'Admin',
    auth: 'Auth',
    listing: 'Listing',
  };
  if (MAP[topDir]) return MAP[topDir];
  return topDir.charAt(0).toUpperCase() + topDir.slice(1);
}

const category = deriveCategory(compDir);
const storyTitle = `${category}/${compBaseName}`;

// ── Import path (relative from story to component) ────────────────────────────
// Since story is colocated, always './<CompName>'
const importPath = `./${compBaseName}`;

// ── Generate story content ────────────────────────────────────────────────────
const content = `import type { Meta, StoryObj } from '@storybook/nextjs-vite'
// import { storyT } from '@/stories/_storyI18n'
// Uncomment storyT when you add localized props.
// All user-facing strings MUST come through storyT() — never raw literals.
// Example: storyT(locale, 'storybook.${compBaseName.toLowerCase()}.my_key')
// Then add the key to messages/{sq,en,uk,it}.json under storybook.${compBaseName.toLowerCase()}.*

import { ${compBaseName} } from '${importPath}'

const meta: Meta<typeof ${compBaseName}> = {
  title: '${storyTitle}',
  component: ${compBaseName},
  tags: ['autodocs'],
  // layout:'fullscreen' is the canonical default; withCanvas in preview.tsx provides the gutter.
  // Do NOT change to 'centered' or 'padded' — that breaks the mobile full-width gate (§14.1).
}

export default meta
type Story = StoryObj<typeof meta>

// ── Default ───────────────────────────────────────────────────────────────────
// TODO: add component props.
// All user-facing strings must use storyT(locale, 'storybook.NAMESPACE.key').
// Adding a raw English literal to a watched prop (title/label/placeholder/aria-label/…)
// will make check:stories FAIL — that is intentional and by design.
export const Default: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    void locale // remove this line once locale is used in props
    return (
      <${compBaseName}
        // TODO: add props here — use storyT(locale, 'storybook.${compBaseName.toLowerCase()}.KEY')
        // Example:
        //   label={storyT(locale, 'storybook.${compBaseName.toLowerCase()}.label')}
      />
    )
  },
}

// ── LocaleStress ──────────────────────────────────────────────────────────────
// One locale-stress story per component (toolbar-reactive, pinned to mobile320).
// Verify: no label clip, no horizontal scroll, all text wraps at uk@320.
// Do NOT pin locale to 'uk' here — use the Storybook toolbar instead.
export const LocaleStress: Story = {
  render: (_, context) => {
    const locale = (context?.globals?.locale as string) ?? 'en'
    void locale // remove this line once locale is used in props
    return (
      <${compBaseName}
        // TODO: add longest-string props here (same storyT calls as Default)
        // The uk locale values from messages/uk.json ARE the stress content.
      />
    )
  },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
}
`;

// ── Write ─────────────────────────────────────────────────────────────────────
writeFileSync(storyPath, content, 'utf8');

console.log(`✅  Story scaffold created: ${storyRelPath}`);
console.log('');
console.log('Next steps:');
console.log('  1. Fill in component props using storyT(locale, "storybook.NAMESPACE.key").');
console.log(`  2. Add the storybook.${compBaseName.toLowerCase()}.* keys to messages/{sq,en,uk,it}.json.`);
console.log('  3. Run: npm run check:stories   (must exit 0 before committing)');
console.log(`  4. If ${compRelPath} was in story-coverage-exempt.json, remove it.`);
console.log('');
console.log('Docs: docs/storybook-governance.md §15');
