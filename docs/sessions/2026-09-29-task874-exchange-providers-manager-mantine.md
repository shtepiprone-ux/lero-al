# Task 874 — exchange-provider manager on canonical Mantine (executor session log)

Status: **IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW** (revision 2). First pass was `PARTIALLY IMPLEMENTED` (R5 deletions
refused by the classifier); the owner then deleted the three files and this session re-entered at kickoff §17.
Kickoff: `tasks/Archive/Sprint_78_kickoff_prompt_Task_874_Exchange_Providers_Manager_On_Mantine.md` (revisions 1–2; archived on approval).
Evidence root: `docs/sessions/evidence/task874/`.

## I0 (revision 1 re-entry)
- Platform `win32 v22.22.3`; HEAD `cd08e02ce`; dirty tree = the untracked evidence folder only.
- `02a`/`02b`: manager census 10 nodes (F3); page census FAIL set = F3 (15 nodes).
- `02c-references-rev1.txt`: 42 lines / 16 files, equal to the revised F8. `02c-references.txt` is the **superseded**
  witness of the first drift.
- `FIXTURE_PROVIDERS`: `1 BankOfAlbania auto enabled, api_key null` · `2 ExchangeRatesAPI hybrid enabled, api_key set` ·
  `3 ManualRates manual disabled, api_key null` (matches F10).
- Line numbers moved with the named rows unchanged (not drift): realmode `:8`, rendered `:128/:161`, tailwind
  allowlist entry `:116-125`, baseline `:307`.

## Receipts
- `GR-0 CANONICAL REUSE PREFLIGHT — request: AdminExchangeProvidersView; semantic queries: admin data table to cards, confirm dialog bottom sheet, row action icons/badges; inspected candidates: src/design-system/mantine/patterns/MantineDataTableToCards.tsx, MantineModal.tsx, src/components/admin/AdminUsersTable.tsx (precedent), src/stories/mantine/primitives/Modal.stories.tsx; decision: COMPOSE; selected canonical owner: MantineDataTableToCards + MantineModal; Mantine/TailAdmin token path: theme.other.iconSize.compact, theme.other.touchTarget, pattern tokens; new hardcoded visual values: NONE; rationale: every piece has a canonical owner.`
- `GR-0 CANONICAL REUSE PREFLIGHT — request: ProviderFormDialogView; semantic queries: form dialog bottom sheet, password field reveal, segmented mode; inspected candidates: MantineModal.tsx, src/modules/auth/components/ResetPasswordView.tsx (PasswordInput labelling precedent), src/stories/mantine/primitives/{PasswordInput,SegmentedControl,Modal}.stories.tsx; decision: COMPOSE; selected canonical owner: MantineModal + native TextInput/PasswordInput/SegmentedControl/Button; token path: MantineProvider theme; new hardcoded visual values: NONE; rationale: no new pattern needed.`
- `GR-3a`: both Views → CREATE; grep of `src/stories` for imports of the two Views before the write returned no canonical candidate.
- `GR-3 STORY PROVEN — AdminExchangeProvidersView ← src/stories/patterns/mantine/AdminExchangeProvidersView.stories.tsx; ProviderFormDialogView ← src/stories/patterns/mantine/ProviderFormDialogView.stories.tsx` (source-level; not rendered — see gaps).
- `GR-1 CENSUS`: `16a` = 6 nodes, both Views `manifest:yes story:yes`, no `ui/*` node, no `AdminTable`/`AdminCardList`; the only FAIL is the container-exempt manager (0 className, 0 ui imports). `16b` FAIL set = F3's page set minus `ui/PasswordInput.tsx`. `03-baseline-diff.txt` removes exactly the `…/currency/page.tsx :: …/ui/PasswordInput.tsx :: tier2-legacy-primitive` key.

## Gate results (unpiped transcripts, `EXIT_CODE` appended)
| File | Command | Exit |
|---|---|---|
| 03a | census `--update-baseline` | 0 |
| 11 / 11b | smoke test (4 cases) | 0 / 0 |
| 13 | typecheck | 0 |
| 14 | lint | 0 |
| 15 | check:story-coverage | 0 |
| 16a / 16b | census manager / page | 1 / 1 (expected FAIL sets, see above) |
| 17 / 18 | rendered-scope, :verify | 0 / 0 |
| 19 / 20 | census-changed, :verify | 0 / 0 |
| 21 / 22 | i18n, i18n-dynamic | 0 / 0 |
| 23 | check:stories | **1** — only `AdminExchangeProvidersManager.stories.tsx:22 [viewport-width-export]`, i.e. the legacy Story R5 deletes |
| 23b | governance:tailwind | 1 — recorded, not asserted (red at HEAD per F8; `H15` vs baseline `H10`; no violation names the changed files) |
| 24 | build-storybook | **1** — stopped by the same `check:stories` failure |
| 25 | check:file-integrity | 0 after the evidence files' BOMs (PowerShell `*>`) were stripped |
| 26 | check:mojibake | 0 |
| 27 | npm run build | 0 |

Plants: `plant-p1-run` `EXIT_CODE=1` (case 1); `plant-p2-run` `EXIT_CODE=1` (`Unable to find … "Show password"`);
each post-hash equals its pre-hash (`9eef007f…`, `d2f5c424…`), and `11b` passes.

## §10.4 reference edits (one line each)
- `story-realmode-allowlist.json:8` row deleted; `check-stories-rendered.mjs:161` + `:128` rows deleted (script not run);
  `i18n-dynamic-manifest.json:36` site → `ProviderFormDialogView.tsx:131`; `tailwind-entropy.allowlist.json` entry
  (`:116-125`) deleted, JSON parses.
- `component-coverage-matrix.md:25` → canonical Mantine PasswordInput Story path.
- `responsive-storybook-inventory.md`: rows `:37/:64/:127/:147` removed, two new Story rows added at `:64`, legacy ids removed
  from `:338/:352/:367/:378/:439-442` (lines left empty were dropped); `:237/:245` untouched.
- `admin-ux-rules.md` `:96/:352/:393/:394`, `component-catalog.md:107`, `component-risk-register.md:13/:72/:245`,
  `design-system.md:424`, `mantine-responsive-design-system.md:467`, `mantine-tailadmin-migration-tracker.md:194`: migrated-state wording.

## Deviations / gaps
1. **R5 deletions not done.** `Remove-Item` of `src/components/ui/PasswordInput.tsx`, `src/components/ui/PasswordInput.stories.tsx`,
   `src/components/admin/AdminExchangeProvidersManager.stories.tsx` was denied by the auto-mode classifier
   ("Irreversible Local Destruction"); not retried through another route. **Owner action:** delete the three files
   (they are tracked). Then re-run `23`, `23c`, `24`, `29` and the GR-3b/GR-3c browser measurements.
2. **AC5/AC6 (partially), GR-3b/GR-3c receipts, AC10** — Stories not rendered/measured (Storybook build blocked). No
   `GR-3b`/`GR-3c` receipt is claimed. Type-scale note: the Views use only Mantine default `Text` sizes (`xs`/`sm`), no headings.
3. The smoke test fires `mouseDown` on the reveal toggle because Mantine's `PasswordInput` toggles on mouse-down.
4. Mantine `Text` has no wrap prop, so long endpoint/notes in the card use `truncate="end"` (no `style`/`className` in the Views).
5. Backlog state cell for 874 not updated by this session.

## Files Changed
| Path | Change |
|---|---|
| `src/components/admin/AdminExchangeProvidersManager.tsx` | containers only (0 className, 0 ui imports) |
| `src/components/admin/AdminExchangeProvidersView.tsx` | new |
| `src/components/admin/ProviderFormDialogView.tsx` | new |
| `src/stories/patterns/mantine/AdminExchangeProvidersView.stories.tsx`, `ProviderFormDialogView.stories.tsx` | new |
| `src/components/admin/__tests__/AdminExchangeProvidersManager.smoke.test.tsx` | new |
| `messages/{sq,en,uk,it}.json` | `api_key_placeholder` |
| `scripts/mantine-migration-scope.json`, `surface-census-baseline.json`, `i18n-dynamic-manifest.json`, `story-realmode-allowlist.json`, `check-stories-rendered.mjs`, `governance/tailwind-entropy.allowlist.json` | §10.4 / R8 rows |
| `docs/{admin-ux-rules,component-catalog,component-coverage-matrix,component-risk-register,design-system,mantine-responsive-design-system,mantine-tailadmin-migration-tracker,responsive-storybook-inventory}.md` | §10.4 rows |
| `docs/sessions/evidence/task874/**`, this log | evidence |
| **Not done:** 3 deletions (R5) | owner action |

## Revision 2 (kickoff §17) — re-entry, evidence root `docs/sessions/evidence/task874/r2/`
The top-level `13`–`29` files above are **SUPERSEDED by r2/** (kept unchanged). No product, Story, test, script or doc file was edited in this pass.

Three deletions confirmed by `r2/29-status-after.txt` (` D`): `src/components/ui/PasswordInput.tsx`, `src/components/ui/PasswordInput.stories.tsx`, `src/components/admin/AdminExchangeProvidersManager.stories.tsx`.

| r2 file | Command | Exit |
|---|---|---|
| 03a / 03 | census update-baseline / diff (removes exactly the one `PasswordInput` key) | 0 |
| 10 | platform `win32 v22.22.3` | 0 |
| 11 | smoke test | 0 |
| 13 / 14 / 15 | typecheck / lint / story-coverage | 0 / 0 / 0 |
| 16a / 16b | census manager / page | 1 / 1 (manager = container-exempt only; page = F3 set minus PasswordInput, 14 nodes) |
| 17 / 18 / 19 / 20 | rendered-scope, :verify, census-changed, :verify | 0 |
| 21 / 22 / 23 | i18n / i18n-dynamic / check:stories | 0 |
| 23b | governance:tailwind | 1 (recorded, not asserted) |
| 23c | reference grep after (--untracked) | empty (grep exit 1) |
| 24 | build-storybook | 0 |
| 25 / 26 / 27 | file-integrity / mojibake / npm run build | 0 |
| 28 | hash-object | equals top-level `28-hash-object.txt` |
| 29 | status | three ` D` lines |

Plants were not re-run (files unchanged; the `28` equality proves it).

### GR-3b / GR-3c (real Chromium via repo Playwright on `storybook-static`; script + JSON: `r2/measure-gr3.mjs`, `r2/gr3-measurements.json`; locale `en`)
Root width = viewport at every width for all 8 Stories; `documentElement.scrollWidth` = viewport (no horizontal overflow). Modals at 320/390: width = viewport, left 0, bottom = viewport height (bottom sheet); at 768/1024/1440: centred 440px `Modal`. Modal title 16px, body 14px (list/DeleteConfirm) or 14–16px (form labels/inputs); largest text node in any Story 16px (< 24px, no heading step needed).
- `GR-3b STORY RESPONSIVE CHECK — AdminExchangeProvidersView/Default: 320 320/320 · 390 390/390 · 1024 1024/1024 (modal 440 centred) · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — AdminExchangeProvidersView/Default: computed fontSize at 320/390/768/1440: title 16 · body 14–16 · max text 16 (no text ≥24px); rich text: none.`
- `GR-3b STORY RESPONSIVE CHECK — AdminExchangeProvidersView/Empty: 320 320/320 · 390 390/390 · 1024 1024/1024 (modal 440 centred) · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — AdminExchangeProvidersView/Empty: computed fontSize at 320/390/768/1440: title 16 · body 14–16 · max text 16 (no text ≥24px); rich text: none.`
- `GR-3b STORY RESPONSIVE CHECK — AdminExchangeProvidersView/Pending: 320 320/320 · 390 390/390 · 1024 1024/1024 (modal 440 centred) · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — AdminExchangeProvidersView/Pending: computed fontSize at 320/390/768/1440: title 16 · body 14–16 · max text 16 (no text ≥24px); rich text: none.`
- `GR-3b STORY RESPONSIVE CHECK — AdminExchangeProvidersView/DeleteConfirm: 320 320/320 · 390 390/390 · 1024 1024/1024 (modal 440 centred) · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — AdminExchangeProvidersView/DeleteConfirm: computed fontSize at 320/390/768/1440: title 16 · body 14–16 · max text 16 (no text ≥24px); rich text: none.`
- `GR-3b STORY RESPONSIVE CHECK — ProviderFormDialogView/New: 320 320/320 · 390 390/390 · 1024 1024/1024 (modal 440 centred) · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — ProviderFormDialogView/New: computed fontSize at 320/390/768/1440: title 16 · body 14–16 · max text 16 (no text ≥24px); rich text: none.`
- `GR-3b STORY RESPONSIVE CHECK — ProviderFormDialogView/Edit: 320 320/320 · 390 390/390 · 1024 1024/1024 (modal 440 centred) · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — ProviderFormDialogView/Edit: computed fontSize at 320/390/768/1440: title 16 · body 14–16 · max text 16 (no text ≥24px); rich text: none.`
- `GR-3b STORY RESPONSIVE CHECK — ProviderFormDialogView/ApiKeyRevealed: 320 320/320 · 390 390/390 · 1024 1024/1024 (modal 440 centred) · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — ProviderFormDialogView/ApiKeyRevealed: computed fontSize at 320/390/768/1440: title 16 · body 14–16 · max text 16 (no text ≥24px); rich text: none.`
- `GR-3b STORY RESPONSIVE CHECK — ProviderFormDialogView/Submitting: 320 320/320 · 390 390/390 · 1024 1024/1024 (modal 440 centred) · 1440 1440/1440; overflow: none; fixed-width containers: NONE; style objects: NONE; viewport pins: NONE.`
- `GR-3c TYPE RESPONSIVE CHECK — ProviderFormDialogView/Submitting: computed fontSize at 320/390/768/1440: title 16 · body 14–16 · max text 16 (no text ≥24px); rich text: none.`

AC10 (owner matrix O78-5, 64 tuples incl. `sq`/`uk`/`it` wrapping at 320) stays **MISSING EVIDENCE** — owed by the owner. Only `en` was measured here.

Files Changed additions: the three deletions above are `D`. Backlog: the 874 state cell is `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## Orchestrator review (Opus)

| Review | Decision | Basis |
|---|---|---|
| I0 stop | revision 1 | F8 was incomplete and AC6 could not pass within §7 (kickoff §16) |
| 1 | `NEEDS REVISION` | Code was kept. The R5 deletions were blocked by the agent classifier, so the owner ran them (kickoff §17) |
| 2 | `PARTIALLY VERIFIED` | The r2 gate block, census 16a/16b, the 28/03 equality and the GR-3b/GR-3c JSON were verified. Only AC10 was open |
| 3 | `APPROVED` | The owner accepted O78-5 on 2026-09-29 (*"accepted"*). The implementation hashes equal `r2/28-hash-object.txt` |

The top-level `13`–`29` transcripts are superseded by `r2/`. `02c-references.txt` is superseded by `02c-references-rev1.txt`.
