# Task 897 — Retire the three legacy governance scans that fail on correct Mantine code; stop the weekly bot push; CI on Node 22

**Sprint:** 57 — Delete what no longer earns its place · **Priority:** P2 · **QA profile:** Q1 Targeted ·
**Filed:** 2026-09-29 by Opus task design · **Status:** `KICKOFF FILED`

## 1. Mode and task type

`TASK DESIGN` → governance / CI tooling **removal** (scripts, workflows, package scripts, live operational docs).
No product UI, no `src/` change, no visible surface. Executor: Sonnet via `.claude/skills/execute-task/SKILL.md`.

## 2. Objective

The weekly `Scheduled Governance Scan` workflow ends red every Monday, and `governance-pr.yml` runs the same failing
steps. The failures come from three legacy scanners (`scan-primitives`, `scan-responsive`, `scan-tailwind`). They
enforce shadcn/Tailwind rules across all of `src/`, including Mantine code that breaks those rules on purpose.
Retire the three scanners and everything that only exists for them. Keep the SSR and localization scans blocking.
Stop the weekly workflow pushing bot commits to `main`. Move CI to Node 22 from one source (`.nvmrc`).

**Owner decisions, 2026-09-29 (this session, answers verbatim):**

- **D897-1** — question *"What should happen to the three legacy governance scans (primitives, responsive,
  tailwind) that flag Mantine code?"* → **"Retire them (Recommended)"**. The option text: *"Remove the three scans
  from both workflows and delete them, their npm scripts, baseline keys and live references. Mantine code stays
  covered by its own gates (check:enrolled-tailwind, check:design-tokens, story coverage). SSR and localization
  scans stay blocking."*
- **D897-2** — question *"Should the weekly workflow keep pushing its report commit straight to main?"* → **"Stop
  pushing (Recommended)"**. The option text: *"The report goes to the run summary and an uploaded artifact only. No
  bot commits on main, so your local pushes aren't rejected every Monday."*
- Standing owner rule 2026-09-18 (memory `no-legacy-tests-migrate-instead`): *"у проекті не треба створювати тести,
  які будуть перевіряти legacy компоненти та елементи. Ми мігруємо на Minetine увесь проект."* That rule is why these
  scanners are **not** narrowed or re-baselined.

## 3. Verified context

All measured 2026-09-29 by Opus, `node.exe -p process.platform` = `win32`, Node `v22.22.3`, on the current dirty
worktree. The executor re-measures at I0 as a **freshness check** only.

| # | Fact | Evidence | Status |
|---|---|---|---|
| F1 | `node.exe scripts\governance\governance.mjs all` exits **1**. primitives C0/H37 vs baseline H57 (OK), ssr C0/H0/M7 (OK), **responsive C0/H34 vs H30 (+4)**, **tailwind C0/H15 vs H10 (+5)**, localization C0/H0/M5 (OK). | command output | VERIFIED |
| F2 | The failure logic is `governance.mjs:57` (`counts.HIGH > base.HIGH` → `hasHigh`) → `:193-197` `process.exit(1)`. The scheduled workflow turns that into `GOVERNANCE_FAILED=true` (`governance-scheduled.yml:46`) and `exit 1` (`:76-81`). | source | VERIFIED |
| F3 | **All 15** tailwind HIGH findings are in `src/design-system/mantine/`: `theme.ts` ×9 (913, 937, 1067, 1317, 1342, 1343, 1538, 1553, 1554), `MantineDashboardStatCard.tsx` ×5 (57 ×2, 59, 60, 61), `MantineDataTableToCards.tsx:261`. The inspected ones (`theme.ts:913`, `:1067`, `MantineDashboardStatCard.tsx:55-61`) are TailAdmin provenance **comments** (e.g. `` `rounded-2xl border border-gray-200 bg-white p-5 md:p-6` → theme `Card` default``). Provenance comments are required by `docs/agent-contract.md` 16/16a. | scan output + source | VERIFIED |
| F4 | Responsive R1 (`scan-responsive.mjs:42-49`) flags any line containing `useWindowSize\|useViewportSize\|useMediaQuery`. 27 of the 34 HIGH findings are in `src/design-system/mantine/**` or `src/stories/mantine/**`. `docs/mantine-responsive-design-system.md:252` permits `useMediaQuery` *"when Mantine responsive props cannot solve the requirement"*. | scan output + doc | VERIFIED |
| F5 | The two findings reported as new in CI, `MantineAppShellFoundation.tsx:21` and `:96`, were added by Task 852 (`b9c8c09fe`, approved, owner D852-1 drawer contract). They are **not** defects and are **not** changed by this task. The local count is 34 rather than CI's 32 because uncommitted Task 891 work adds `RangeDatePicker.tsx:22`/`:872`. | `git log -S` + scan | VERIFIED |
| F6 | Scan-primitives flags raw `<button>` in Mantine patterns/tests (e.g. `MantinePopover.tsx:25`, `theme.ts:955`) and tells the author to use `@/components/ui/button`. That is a legacy rule applied to Mantine code; it passes today only because its baseline (57) is stale-high. | scan output | VERIFIED |
| F7 | `governance-pr.yml:91-101` runs `governance:primitives`, `governance:responsive` and `governance:tailwind` as blocking steps. `:184-186` runs `npm run governance` (`if: always()`). | source | VERIFIED |
| F8 | Node is pinned to `'20'` at `governance-scheduled.yml:37` and `governance-pr.yml:39, 204, 240, 301`. `.nvmrc` = `20`. Installed engines: `lighthouse` `>=22.19`, `sanitize-html` `>=22.12.0`. Local dev is `v22.22.3`. | source + `node_modules/*/package.json` | VERIFIED |
| F9 | The scheduled workflow has `permissions: contents: write, pull-requests: write` (`:24-26`) and a step that runs `git add/commit/push` of `docs/governance-reports/weekly/weekly-<date>.md` (`:49-62`). | source | VERIFIED |
| F10 | Files that exist **only** for the three scans: `scripts/governance/scan-primitives.mjs`, `scan-responsive.mjs`, `scan-tailwind.mjs`, `tailwind-entropy.mjs` (imported only by `scan-tailwind.mjs:171`), `primitives.allowlist.json` (read only by `scan-primitives.mjs:15`), `tailwind-entropy.allowlist.json` (read only by `scan-tailwind.mjs:59` and `tailwind-entropy.mjs:33`). `scripts/governance/reports/*.latest.json` is gitignored. | `git grep` over live paths (excluding `docs/sessions`, `docs/backlog-archive.md`, `tasks/Archive`, `docs/governance-reports`, `docs/reviews`) | VERIFIED — executor re-runs the grep at I0 |
| F11 | Live references outside those files (the same `git grep`): `package.json:19-21` (three scripts); `governance.mjs:5-10, 77-80`; `baseline.json` keys `primitives`/`responsive`/`tailwind` and its `_docs`; `component-catalog.mjs:477-480` (it generates `docs/component-coverage-matrix.md:84-87`); docs `governance-enforcement.md` (21 hits), `maintenance-playbook.md` (11), `tailwind-governance.md` (5), `tailwind-entropy-audit.md` (6), `component-coverage-matrix.md` (3), `eslint-debt-taxonomy.md` (3), `ai-behavior.md:634-635`, `governance-checklists.md:344, 353`, `component-catalog-governance.md:202`, `storybook-governance.md:195`, `ui-rules.md:435`, `mantine-migration-plan.md:33`, `rule-index.md:198-206`. Active kickoffs 741, 874, 877 and 665 also name `governance:tailwind` / `tailwind-entropy.allowlist.json`. | `git grep` | VERIFIED |
| F12 | `eslint.config.mjs` has no `useMediaQuery`/`useWindowSize` rule. | grep | VERIFIED |
| F13 | After removal, the remaining scans on today's tree give ssr C0/H0 and localization C0/H0, so `npm run governance` is expected to exit 0. `scan-ssr.mjs:97` emits CRITICAL for `suppressHydrationWarning` outside `app/layout.tsx`, which gives a working planted arm. | source + F1 counts | VERIFIED (counts) · ANALYTICAL (post-change exit, proven at AC4) |
| F14 | Starting worktree: **93** porcelain entries (Task 854/891 work, evidence folders). **None** intersects this task's write set (§7). | `git status --porcelain` filtered against §7 paths → empty | VERIFIED |
| F15 | The 2026-09-28 CI run and its bot commit are known only from the owner's pasted report. `gh` is not installed and a fetch is not a permitted agent command. | — | UNKNOWN (owner-native, §13.3) |

## 4. Requirements

| ID | Source | Observable requirement | Priority | Verification | Status |
|---|---|---|---|---|---|
| R1 | D897-1 | The primitives, responsive and tailwind scans no longer run in any workflow, npm script or `governance.mjs` scan map. | P1 | AC1, AC2 | Confirmed |
| R2 | D897-1 | The six scan-only files in F10 are deleted, after a live-reference audit proves they have no other consumer. | P1 | AC3 | Confirmed |
| R3 | D897-1 | SSR and localization scans keep running, stay blocking in both workflows, and still fail on a regression. | P1 | AC4 | Confirmed |
| R4 | D897-1 · agent-contract 9 | Every live operational reference in F11 is removed or marked retired. Nothing live tells a reader to run a removed command or edit a removed file. | P2 | AC5 | Confirmed |
| R5 | D897-2 | The weekly workflow never commits or pushes. It needs only `contents: read`, publishes the report as an uploaded artifact plus the step summary, and still exits non-zero when the remaining scans fail. | P1 | AC6 | Confirmed |
| R6 | F8 | Every `actions/setup-node` step reads `node-version-file: '.nvmrc'`, and `.nvmrc` = `22`. | P2 | AC7 | Confirmed |
| R7 | agent-contract 9 | `npm run build` exits 0. `npm run governance:components`, `npm run check:backlog-active` and a YAML parse of both workflows all exit 0. | P1 | AC8 | Confirmed |
| R8 | agent-contract 1, 14 | No file outside §7 changes. The 93 starting entries are content-identical at the end, and touched files stay UTF-8 without a BOM. | P1 | AC9 | Confirmed |

## 5. Assumptions and open questions

- **A1 (ASSUMED, reversible):** `22` in `.nvmrc`. It matches local dev (`v22.22.3`) and the engines floor in F8. The
  Vercel project's Node version is **not** changed here and is not read by these workflows.
- **A2 (ASSUMED):** historical records are left alone. That covers closed kickoffs under `tasks/Sprints/` (Sprints
  0–35, Epics A/B/D/E/Z/II/JJ), `tasks/Archive/`, `docs/sessions/`, `docs/backlog-archive.md`, `docs/reviews/` and
  `docs/governance-reports/**`. They describe what happened, not what to run.
- No open owner question. D897-1 and D897-2 fix the route.

## 6. Pre-read rule bundle

`docs/golden-rules.md` · `docs/agent-contract.md` (clauses 1, 9, 10, 14) · `docs/qa-profiles.md` (Q1) ·
`docs/rule-index.md` → "Docs / Governance / Task Template" · `docs/governance-enforcement.md` §9–§10 (the text you
edit) · `docs/orchestrator-procedures.md` → "Corollary (818/819)", the PowerShell `Get-Content -Raw` mojibake hazard.
**Not** the legacy Tailwind bundle: this task removes that tooling and never applies its rules.

## 7. Scope — exact allowed write set

**Edit:**
- `.github/workflows/governance-scheduled.yml`
- `.github/workflows/governance-pr.yml`
- `.nvmrc`
- `package.json` (delete only `governance:primitives`, `governance:responsive`, `governance:tailwind`)
- `scripts/governance/governance.mjs`
- `scripts/governance/baseline.json` (delete only the `primitives`, `responsive`, `tailwind` keys; update `_comment`/`_docs`)
- `scripts/governance/component-catalog.mjs` (lines 477–480 only)
- `docs/component-coverage-matrix.md` (the matching rows 84–87 only, **hand-edited**; do **not** run `catalog:components`/`--write`, which rewrites three whole docs)
- live docs from F11: `docs/governance-enforcement.md`, `docs/maintenance-playbook.md`, `docs/tailwind-governance.md`,
  `docs/tailwind-entropy-audit.md`, `docs/eslint-debt-taxonomy.md`, `docs/ai-behavior.md`, `docs/governance-checklists.md`,
  `docs/component-catalog-governance.md`, `docs/storybook-governance.md`, `docs/ui-rules.md`, `docs/mantine-migration-plan.md`,
  `docs/rule-index.md`
- `docs/backlog.md` (897's registry cell only) · new session log `docs/sessions/2026-09-DD-task897-retire-legacy-governance-scans.md`
- evidence folder `docs/sessions/evidence/task897/`

**Delete:** `scripts/governance/scan-primitives.mjs`, `scan-responsive.mjs`, `scan-tailwind.mjs`,
`tailwind-entropy.mjs`, `primitives.allowlist.json`, `tailwind-entropy.allowlist.json`.

**Temporary, must not survive:** one plant file `src/__task897_plant__.tsx` (AC4) and one generated
`docs/governance-reports/weekly/weekly-<today>.md` (AC6 local proof). Both are removed through Node, and their
absence from `git status --porcelain` is recorded.

`package-lock.json` must **not** change: no dependency is added or removed.

## 8. Out of scope

- Any `src/` change. In particular, `MantineAppShellFoundation.tsx` and every `useMediaQuery` site stay as they are (F5, D852-1).
- Narrowing, re-scoping or re-baselining the retired scanners (owner rule 2026-09-18, D897-1).
- `scan-ssr.mjs`, `scan-localization.mjs`, `component-catalog.mjs` beyond lines 477–480, and any other `check:*` gate.
- The `ssr` baseline (M0 vs current M7). MEDIUM never fails the gate, so it stays as it is.
- The Vercel runtime Node version.
- **Opus-owned, at 897's review (not the executor):** amending the active kickoffs 741, 874, 877 and 665 where they name
  `governance:tailwind` or `tailwind-entropy.allowlist.json`, and verifying the first green scheduled run (§13.3).

## 9. Current and required behavior

| Area | Current (preserve / replace) | Required after |
|---|---|---|
| Weekly workflow | Runs 5 scans, commits and pushes the report to `main`, ends red on responsive/tailwind | Runs ssr + l10n with `--report`; the report is uploaded as artifact `governance-weekly-report` and written to the step summary; no git write; `permissions: contents: read`; red **only** if ssr/l10n exceed baseline |
| PR workflow | 5 scan steps, 3 of them legacy | ssr + l10n steps and the final `npm run governance` summary stay; the 3 legacy steps are gone; **every other step is byte-identical** |
| `npm run governance*` | 8 scripts | `governance`, `governance:ssr`, `governance:localization`, `governance:report`, `governance:update-baseline` keep working; the 3 legacy scripts are gone; `governance:storybook`, `governance:screenshots*`, `governance:components` are untouched |
| `governance.mjs` | 5-entry scan map, usage text lists 5 | 2-entry map (`ssr`, `l10n`); the usage text and the unknown-scan error message list only `all, ssr, l10n`; report and baseline logic unchanged |
| Node in CI | `'20'` hard-coded ×5 | `node-version-file: '.nvmrc'` ×5, `.nvmrc` = `22` |

## 10. Implementation requirements

1. **I0 — freshness and start state.** Record the platform, Node version and cwd. Save
   `git status --porcelain` to `docs/sessions/evidence/task897/start-porcelain.txt` and SHA-256 every existing
   start-entry path to `start-hashes.txt`, using Node (see §13.1). Re-run the F10/F11 `git grep` and save it. If it
   shows a live consumer not listed in F10/F11, stop and report `BLOCKED — UNLISTED CONSUMER <path>`.
2. **Removal** follows the §7 write set. Edit JSON and YAML with the Edit tool, or with Node
   `readFileSync`/`writeFileSync`. **Never** use PowerShell `Get-Content -Raw` without `-Encoding utf8`.
3. **Scheduled workflow:** delete the commit/push step. Set `permissions: contents: read`. Add
   `actions/upload-artifact@v4` (`if: always()`, name `governance-weekly-report`, path
   `docs/governance-reports/weekly/`, `if-no-files-found: warn`). Keep the summary step and the final fail step.
4. **Live docs (R4):** in each F11 doc, delete every instruction to run a removed command or edit a removed file.
   Where the section explains a rule's history, replace it with one line: *"Retired 2026-09-29 by Task 897 (owner
   decision D897-1): legacy scans fired on correct Mantine code; Mantine work is governed by `check:enrolled-tailwind`,
   `check:design-tokens` and story coverage."* Do not rewrite unrelated sections. In `rule-index.md`, remove the
   "Legacy Tailwind Styling Governance" bundle's reference to *"governance tooling that still scans them"* and leave
   the rest of that bundle alone.

## 11. Positive and negative flows

**Positive:** on the changed tree, `npm run governance` runs ssr + l10n, prints them both in the baseline comparison,
and exits 0. `npm run governance:report` writes the weekly report.

| Negative branch | Applicable | Handling |
|---|---|---|
| A remaining scan regresses (SSR CRITICAL planted) | **Yes** | exits 1 (AC4 arm A), and exits 0 again once the plant is removed (arm B) |
| `node governance.mjs primitives` (retired name) | **Yes** | exits 1 with the unknown-scan message listing `all, ssr, l10n` |
| Report file missing at upload | **Yes** | `if-no-files-found: warn`, and the workflow result stays governed by the fail step |
| Stale reference to a deleted file | **Yes** | the AC5 grep catches it |
| Dependency drift | No — no package added or removed; `package-lock.json` hash unchanged (AC9) |
| UI / locale / viewport | No — no visible surface |

## 12. Acceptance criteria

GR-4 AC AUDIT — 9 criteria; each states an observable property; absolutes: none (the zero-hit greps in AC1/AC5/AC6
target strings a correct implementation cannot contain).

- **AC1 [R1]** Given the changed tree, when `git grep -n -E "governance:(primitives|responsive|tailwind)|scan-(primitives|responsive|tailwind)" -- .github package.json scripts` runs, then it prints no line.
- **AC2 [R1]** Given `node.exe scripts\governance\governance.mjs primitives`, when it runs, then it exits 1 and prints `Valid: all, ssr, l10n`.
- **AC3 [R2]** Given the six F10 paths, when `Test-Path` checks each one, then each returns `False`. The I0 grep shows no consumer outside F11.
- **AC4 [R3]** Given arm A (the plant file containing `<div suppressHydrationWarning />` at `src/__task897_plant__.tsx`), when `npm run governance` runs, then it exits 1 and names the plant. Given arm B (the plant removed), when it runs again, then it exits 0. Both transcripts are saved, and the plant path is absent from the final porcelain.
- **AC5 [R4]** Given the F11 docs, when `git grep -n -E "governance:(primitives|responsive|tailwind)|tailwind-entropy.(mjs|allowlist|latest)|primitives\.allowlist|scan-(primitives|responsive|tailwind)" -- docs ':!docs/sessions' ':!docs/backlog-archive.md' ':!docs/reviews' ':!docs/governance-reports'` runs, then every remaining hit is a "Retired 2026-09-29 by Task 897" line. Each remaining hit is listed in the session log.
- **AC6 [R5]** Given `governance-scheduled.yml`, when it is parsed with `js-yaml`, then the job's `permissions` equal `{ contents: 'read' }`, no step `run` contains `git commit` or `git push`, one step `uses` `actions/upload-artifact@v4`, and the fail step still keys on the governance exit. `npm run governance:report` writes `weekly-<today>.md`, which contains no `Primitive`, `Responsive` or `Tailwind` scan row.
- **AC7 [R6]** Given both workflows parsed with `js-yaml`, when every `actions/setup-node` step is listed, then each has `node-version-file: '.nvmrc'` and no `node-version`. `.nvmrc` reads `22`.
- **AC8 [R7]** Given the final tree, when `npm run build`, `npm run governance:components`, `npm run check:backlog-active` and the §13.1 YAML parse run, then each exits 0.
- **AC9 [R8]** Given the start manifest, when the end manifest is compared, then the changed path set equals the §7 write set, every one of the 93 start entries has an identical SHA-256, `package-lock.json` has an identical `git hash-object`, and no touched file starts with a BOM.

## 13. QA profile and verification plan

**Q1 Targeted:** no UI, so no rendered or Storybook matrix; the final build is required.
GR-2 SCOPE STATED — `npm run governance` inspects only ssr + l10n after this task; it cannot see Tailwind/shadcn debt
on legacy surfaces, which is intentionally ungoverned by owner decision D897-1 and removed by migration, not scanning.

### 13.1 Executor commands (Windows PowerShell, project root)

```powershell
$ev = "docs\sessions\evidence\task897"
New-Item -ItemType Directory -Force $ev
node.exe -p "process.platform + ' ' + process.version + ' ' + process.cwd()" *>&1 | Tee-Object "$ev\00-env.txt"
git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\01-start-porcelain.txt"
node.exe -e "const fs=require('fs'),c=require('crypto');const L=fs.readFileSync('docs/sessions/evidence/task897/01-start-porcelain.txt','utf8').split(/\r?\n/).filter(Boolean);const out=L.map(l=>{const p=l.slice(3).replace(/^\"|\"$/g,'');let h='MISSING';try{const s=fs.statSync(p);h=s.isFile()?c.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):'DIR'}catch{}return h+'  '+p});fs.writeFileSync('docs/sessions/evidence/task897/02-start-hashes.txt',out.join('\n')+'\n')"
git hash-object package-lock.json *>&1 | Tee-Object "$ev\03-lockfile-hash-start.txt"
git grep -n -E "scan-primitives|scan-responsive|scan-tailwind|tailwind-entropy|primitives\.allowlist|governance:(primitives|responsive|tailwind|report|update-baseline)|governance/baseline\.json|governance\.mjs" -- . ":!docs/sessions" ":!docs/backlog-archive.md" ":!tasks/Archive" ":!docs/governance-reports" ":!docs/reviews" *>&1 | Tee-Object "$ev\04-reference-audit-before.txt"
node.exe scripts\governance\governance.mjs all *>&1 | Tee-Object "$ev\05-governance-before.txt"
```

Expected: `00-env` starts with `win32`. `05` exits 1 with responsive/tailwind `REGRESSION`. That is the baseline, not a failure.

After implementation:

```powershell
$ev = "docs\sessions\evidence\task897"
git grep -n -E "governance:(primitives|responsive|tailwind)|scan-(primitives|responsive|tailwind)" -- .github package.json scripts *>&1 | Tee-Object "$ev\10-ac1-grep.txt"
node.exe scripts\governance\governance.mjs primitives *>&1 | Tee-Object "$ev\11-ac2-retired-name.txt"
node.exe -e "for (const p of ['scan-primitives.mjs','scan-responsive.mjs','scan-tailwind.mjs','tailwind-entropy.mjs','primitives.allowlist.json','tailwind-entropy.allowlist.json']) console.log(p, require('fs').existsSync('scripts/governance/'+p))" *>&1 | Tee-Object "$ev\12-ac3-deleted.txt"
node.exe -e "require('fs').writeFileSync('src/__task897_plant__.tsx','export const P = () => <div suppressHydrationWarning />\n')"
npm.cmd run governance *>&1 | Tee-Object "$ev\13-ac4-armA-planted.txt"
node.exe -e "require('fs').unlinkSync('src/__task897_plant__.tsx')"
npm.cmd run governance *>&1 | Tee-Object "$ev\14-ac4-armB-clean.txt"
git grep -n -E "governance:(primitives|responsive|tailwind)|tailwind-entropy.(mjs|allowlist|latest)|primitives\.allowlist|scan-(primitives|responsive|tailwind)" -- docs ":!docs/sessions" ":!docs/backlog-archive.md" ":!docs/reviews" ":!docs/governance-reports" *>&1 | Tee-Object "$ev\15-ac5-docs-grep.txt"
node.exe -e "const y=require('js-yaml'),fs=require('fs');for(const f of ['governance-scheduled.yml','governance-pr.yml']){const d=y.load(fs.readFileSync('.github/workflows/'+f,'utf8'));for(const [j,job] of Object.entries(d.jobs)){console.log(f,j,'permissions',JSON.stringify(job.permissions||null));for(const s of job.steps){if((s.uses||'').startsWith('actions/setup-node'))console.log(' setup-node',JSON.stringify(s.with));if(/git (commit|push)/.test(s.run||''))console.log(' GIT-WRITE',s.name);if((s.uses||'').startsWith('actions/upload-artifact'))console.log(' upload',s.with&&s.with.name)}}}" *>&1 | Tee-Object "$ev\16-ac6-ac7-yaml.txt"
Get-Content .nvmrc *>&1 | Tee-Object "$ev\17-nvmrc.txt"
npm.cmd run governance:report *>&1 | Tee-Object "$ev\18-ac6-report-run.txt"
npm.cmd run governance:components *>&1 | Tee-Object "$ev\19-governance-components.txt"
npm.cmd run check:backlog-active *>&1 | Tee-Object "$ev\20-backlog-active.txt"
npm.cmd run build *>&1 | Tee-Object "$ev\21-build.txt"
```

Expected: `10` is empty. `11` exits 1 and lists `all, ssr, l10n`. `12` prints `false` ×6. `13` exits 1 and names
`src\__task897_plant__.tsx`. `14` exits 0. Every `15` hit is a "Retired 2026-09-29 by Task 897" line. `16` shows
the scheduled job `{"contents":"read"}`, 5 `setup-node` lines with `node-version-file`, no `GIT-WRITE` and one
`upload`. `17` is `22`. `18` writes the weekly file: record its path, open it and confirm no removed scan row, then
delete it through Node. `19`, `20` and `21` exit 0 (`21`'s exit code is recorded).

Final state, after deleting the generated report:

```powershell
$ev = "docs\sessions\evidence\task897"
git --no-optional-locks status --porcelain *>&1 | Tee-Object "$ev\30-end-porcelain.txt"
git hash-object package-lock.json *>&1 | Tee-Object "$ev\31-lockfile-hash-end.txt"
node.exe -e "const fs=require('fs'),c=require('crypto');const L=fs.readFileSync('docs/sessions/evidence/task897/02-start-hashes.txt','utf8').split(/\r?\n/).filter(Boolean);let bad=0;for(const l of L){const [h,...r]=l.split('  ');const p=r.join('  ');let n='MISSING';try{const s=fs.statSync(p);n=s.isFile()?c.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):'DIR'}catch{}if(n!==h){bad++;console.log('CHANGED',p)}}console.log('start entries',L.length,'changed',bad);process.exit(bad?1:0)" *>&1 | Tee-Object "$ev\32-ac9-start-entries.txt"
node.exe -e "const fs=require('fs');const {execSync}=require('child_process');const files=execSync('git --no-optional-locks diff --name-only',{encoding:'utf8'}).split(/\r?\n/).filter(f=>f&&fs.existsSync(f));let bom=0;for(const f of files){const b=fs.readFileSync(f);if(b[0]===0xEF&&b[1]===0xBB&&b[2]===0xBF){bom++;console.log('BOM',f)}}console.log('checked',files.length,'bom',bom);process.exit(bom?1:0)" *>&1 | Tee-Object "$ev\33-ac9-bom.txt"
git hash-object .github/workflows/governance-scheduled.yml .github/workflows/governance-pr.yml .nvmrc package.json scripts/governance/governance.mjs scripts/governance/baseline.json scripts/governance/component-catalog.mjs *>&1 | Tee-Object "$ev\34-final-hashes.txt"
```

Expected: `30` minus `01` equals the §7 write set, with no plant or report path. `31` equals `03`. `32` exits 0 with
`changed 0`. `33` exits 0. `34` is captured in the same pass (orchestrator-procedures, Corollary 818).

### 13.2 Two-armed control

AC4 is this task's falsifiable control. Arm A must fail, so the remaining gate can still fail after the retirement.
Arm B must pass, so the retirement did not leave a permanently red gate. A scan that exits 0 in both arms proves nothing.

### 13.3 Owner-native, after the owner pushes (UNKNOWN until then, F15)

1. GitHub → Actions → *Scheduled Governance Scan* → **Run workflow** (`workflow_dispatch`).
2. Expected: green; no Node 20 deprecation warning for `lighthouse`/`sanitize-html`; an artifact named
   `governance-weekly-report`; **no** new `chore(governance): weekly scan report` commit on `main`.
3. Return the run URL to Opus. It closes 897 only together with that run.

## 14. Completion report contract

Session log `docs/sessions/2026-09-DD-task897-retire-legacy-governance-scans.md` with:
- a Files Changed table that equals `30-end-porcelain` minus `01-start-porcelain`;
- R1–R8 status;
- each §13.1 command with its real exit code and evidence path;
- the AC5 residual-hit list;
- deviations, assumptions and limitations.

Update 897's cell in `docs/backlog.md` to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, or to
`PARTIALLY IMPLEMENTED` / `BLOCKED` with the reason. No git commands. No approval language.

## 15. Task quality gate

**Evidence preflight (template §1–§7, condensed).** Mode `TASK DESIGN`; execution state `from-scratch`; start step
I0; no owner decision outstanding (D897-1, D897-2 above). §3 is the requirement-to-evidence map. Command contract:
`governance.mjs all` writes nothing, while `--report` writes `docs/governance-reports/weekly/weekly-<date>.md`
(scheduled after the I0 manifest, deleted before `30`). `--update-baseline` is **not** run, because it would rewrite
`baseline.json` from live counts. Falsification log: F5's "new defect" premise was falsified by `git log -S` (it is
852's approved code). F3's "Tailwind debt" premise was falsified by opening the lines (they are provenance comments).
F13's post-change exit is analytical until AC4 runs. Write-scope viability: F14 shows no intersection with the dirty
set, and no capped file is edited except `docs/backlog.md` (80/80 lines; 897 is merged into an existing registry row,
so the count does not grow).

**Rule-compliance ledger.**

| Rule | Applicability | Mandatory outcome | Evidence | Result |
|---|---|---|---|---|
| agent-contract 1 (bounded scope) | edits scripts/workflows/docs | only §7 paths change | AC9 | COMPLIANT |
| agent-contract 9 (deletion audit) | deletes 6 files | every live consumer updated, gates run | I0 grep, AC1/AC3/AC5/AC8 | COMPLIANT |
| agent-contract 10 (git ownership) | executor | no git mutation, no approval | §14 | COMPLIANT |
| agent-contract 14 (encoding, manifest) | multi-file write | explicit path manifest; UTF-8 without BOM | §7, AC9 `33` | COMPLIANT |
| agent-contract 15 (critical flows) | `docs/critical-flow-registry.md` has no governance-workflow row | — | grep 2026-09-29 | NOT APPLICABLE |
| GR-0/GR-1/GR-3* (UI) | no visible component, Story or surface changes | — | §8: no `src/` write | NOT APPLICABLE |
| GR-2 | a gate result closes R3 | scope printed | §13 GR-2 line | COMPLIANT |
| GR-4 | kickoff | AC audit receipt | §12 | COMPLIANT |
| GR-5 / GR-6 | Opus response | state synced, commit-only handoff | design response | COMPLIANT |
| Owner rule 2026-09-18 (no legacy detectors) | the alternative "narrow + re-baseline" is legacy baseline work | retire, don't narrow | D897-1 | COMPLIANT |

**Execution contract.** One route (D897-1 + D897-2). Starting mode: dirty with manifest (`01`/`02`). Final write
set: §7.

| Checkpoint | Allowed writes | Producer / artifact | Comparator / failure |
|---|---|---|---|
| 0 I0 | evidence folder only | `00`–`05` | unlisted consumer → `BLOCKED` |
| 1 removal + edits | §7 edit/delete set | files | AC1/AC3 greps non-empty → fix before continuing |
| 2 plant A/B | temp plant only | `13`/`14` | arm A exit 0 or arm B exit 1 → `BLOCKED` |
| 3 docs + YAML | §7 docs | `15`/`16`/`17` | AC5/AC6/AC7 mismatch → fix |
| 4 report + gates + build | temp report only | `18`–`21` | any non-zero → `PARTIALLY IMPLEMENTED` |
| 5 final state | none | `30`–`34` | changed start entry, lockfile drift, BOM or extra path → `BLOCKED` |

Counterexamples: an alternate route (narrowing) is excluded by D897-1. For an empty-vs-non-empty manifest, the
`02` script records `MISSING` for absent paths, so a valid empty start set still produces a file. An unexpected new
path is caught because `30` minus `01` is compared with §7. The new gate behaviour is covered by arms A/B. A
task-created artifact (plant, report) is scheduled after `01` and deleted before `30`.
