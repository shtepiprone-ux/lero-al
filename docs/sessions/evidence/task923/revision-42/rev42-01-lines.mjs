// Task 923 Revision 42 (Opus, 2026-10-24), after revision-41/rev41-01-lines.mjs: copies the working-tree lines that Revision 42's claim rows cite into rev42-01-lines.txt,
// each under a header with its path, line and file sha256, and records the registry and contract facts R139 depends on. The copy holds the literal after R139 changes
// the files. Usage: node rev42-01-lines.mjs <repo root>
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = path.resolve(process.argv[2] ?? '.')
const cites = [
  ['src/app/admin/users/[id]/page.tsx', 'if (!user) notFound()'],
  ['src/app/admin/users/[id]/page.tsx', 'if (user.deleted_at) notFound()'],
  ['src/app/admin/users/[id]/page.tsx', 'await requireStaffPage()'],
  ['src/app/admin/users/page.tsx', "const t = await getTranslations('admin.pages')"],
  ['src/app/admin/users/page.tsx', 'const sp = await searchParams'],
  ['src/app/admin/users/page.tsx', "title={t('users_title')}"],
  ['src/components/admin/AdminPageHeader.tsx', '<Box mb="xl">'],
  ['src/components/admin/AdminPageHeader.tsx', 'action?: ReactNode'],
  ['src/design-system/mantine/patterns/MantineDashboardHeader.tsx', 'gap="md"'],
  ['src/design-system/mantine/theme.ts', 'warning→yellow, error→red, info→blueLight'],
  ['src/design-system/mantine/theme.ts', "defaultProps: { radius: 'xl', variant: 'light' }"],
  ['src/components/admin/AdminPagesView.tsx', 'icon={<AlertTriangle size={theme.other.iconSize.standard} />}'],
  ['src/stories/mantine/primitives/Alert.stories.tsx', '<Alert color="blueLight"'],
  ['src/stories/patterns/mantine/AdminPageHeader.stories.tsx', "title: 'Patterns/Mantine/AdminPageHeader'"],
  ['src/lib/auth/__tests__/staffPage.security.test.ts', "else if (entry.name === 'page.tsx') out.push(full)"],
  ['node_modules/@mantine/core/esm/components/Alert/Alert.mjs', 'role: role || "alert"'],
]
const out = ['# Working-tree lines cited by Task 923 Revision 42 (Opus, 2026-10-24), copied by rev42-01-lines.mjs']
for (const [rel, needle] of cites) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8')
  const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex')
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const hits = lines.flatMap((l, i) => (l.includes(needle) ? [i + 1] : []))
  if (!hits.length) throw new Error(`not found in ${rel}: ${needle}`)
  for (const n of hits) out.push(`== ${rel} line ${n}, working tree, file sha256 ${sha}`, lines[n - 1])
}
const json = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))
const D8D9 = 'tasks/Sprints/Sprint_78_Task_923_security_record_D8_D9.security.json'
const contract = json(D8D9)
out.push(`== scope of ${D8D9} (${contract.scope.length} paths)`)
for (const p of ['src/app/admin/users/[id]/page.tsx', 'src/app/admin/users/page.tsx', 'messages/en.json', 'src/components/admin/AdminPageHeader.tsx', 'src/stories/patterns/mantine/AdminPageHeader.stories.tsx']) {
  out.push(`scope has ${p}: ${contract.scope.includes(p)}`)
}
out.push(`case SEC-X-SRV-ADMINPAGE-GUARD in ${D8D9}: ${contract.cases.some((c) => c.id === 'SEC-X-SRV-ADMINPAGE-GUARD')}`)
const families = json('scripts/mobile-adaptation-patterns.json').componentFamilies
const fam = families.find((f) => f.id === 'structural-layout-and-feedback')
out.push('== scripts/mobile-adaptation-patterns.json, family structural-layout-and-feedback',
  `patternIds ${fam.patternIds.join(', ')}; mantineMechanismIds ${fam.mantineMechanismIds.join(', ')}`,
  `members has MantineDashboardHeader.tsx: ${fam.members.includes('src/design-system/mantine/patterns/MantineDashboardHeader.tsx')}`)
out.push('== scripts/mantine-migration-scope.json', `lists src/components/admin/AdminPageHeader.tsx: ${fs.readFileSync(path.join(root, 'scripts/mantine-migration-scope.json'), 'utf8').includes('src/components/admin/AdminPageHeader.tsx')}`)
out.push('== scripts/ui-contract-registry.json', `names AdminPageHeader: ${fs.readFileSync(path.join(root, 'scripts/ui-contract-registry.json'), 'utf8').includes('AdminPageHeader')}`)
for (const l of ['sq', 'en', 'uk', 'it']) {
  const pages = json(`messages/${l}.json`).admin.pages
  out.push(`== messages/${l}.json admin.pages`, `users_title: ${pages.users_title}; has users_gone_notice: ${'users_gone_notice' in pages}`)
}
fs.writeFileSync(path.join(root, 'docs/sessions/evidence/task923/revision-42/rev42-01-lines.txt'), out.join('\n') + '\n')
console.log(out.join('\n'))
