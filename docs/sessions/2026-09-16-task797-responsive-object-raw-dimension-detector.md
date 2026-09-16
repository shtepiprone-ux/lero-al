# Task 797 — `raw-dimension-responsive-prop` detector + tokenize the 2 live sites

Sprint 75 · P2 · QA profile **Q4**. Status: `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`.

## 1. Requirement and acceptance-criteria evidence

| Req | Evidence |
|---|---|
| R1 | New blocking category `raw-dimension-responsive-prop` in `scripts/check-design-tokens.mjs` (`findResponsiveDimensionFindings` + wiring in `scanContent`). Prop list = `DIMENSION_PROP_NAMES` minus `offset`. `tsx`/`ts` only (never `.css`), never for `storyOnly` passes — same convention every other regular category uses. |
| R2 | False-positive boundary tests: token string, `0`, percentage, `theme.*` identifier, `span`/`order`/`offset`/`cols`, `{/* */}` JSX comment, `/** */` JSDoc comment — all 0 findings. Nested object body → 1 finding, `rawValue` = `<prop>: unparsed-object`. All in `scripts/__tests__/check-design-tokens.test.ts`, describe block `raw-dimension-responsive-prop — Task 797, Mantine responsive-object coverage`. |
| R3 | `rawValue` format `<prop>.<key>: <value>` verified byte-for-byte (`mt.base: 12`, `triggerWidth.sm: '7rem'`). Marker suppression test: one of three entries suppressed by its own marker, the other two still report. Multi-line object test: `base` reports on its own line (4), `md` on its own line (5), not the prop's opening line (3). |
| R4 | Two-armed plant tests: `pb={{ base: 176, md: 80, lg: 32 }}` → 3 findings (`docs/sessions/evidence/task797/02_vitest_RED_before_arm.txt` shows it FAILING pre-arm, `03_vitest_GREEN_after_arm.txt` shows it PASSING post-arm); `pb={{ base: 'md', lg: 0 }}` → 0. |
| R5 | `HeroSearchFallback.tsx` `h` now reads `theme.other.layout.heroSearchFallbackHeight.{base,sm,md}` (new role, `theme.ts`). `PhoneField.tsx` `triggerWidth` now reads `theme.other.boxSize.phoneCountryTrigger` at both keys (new role); its now-unneeded `design-tokens-allow` marker removed. Both roles typed in the `MantineThemeOther` augmentation with source comments. |
| R6 | `MantineAuthFormPattern.tsx:29` (JSDoc) not touched — `git diff` confirms, and the R2 JSDoc test reproduces its exact shape and confirms 0 findings. |
| R7 | `docs/design-system.md` new §23.1.d — category, prop list (minus `offset`), boundary, and stated remaining blind spot (variable/function-built value, spread object, unlisted prop name). |

## 2. Current versus required behavior

**Before.** `h={{ base: 279, sm: 175, md: 123 }}` (and any other prop in the dimension list, written in Mantine's `{{ }}` responsive-object form) satisfied none of the three existing dimension arms and shipped at `check:design-tokens:strict` exit 0 regardless of content.

**After.** The same expression fails `--strict`, naming `h.base: 279` etc. The two real production sites (`HeroSearchFallback`, `PhoneField`) now read named `theme.other` roles instead of raw literals; the gate is green on the real tree (`0 violations`, exit 0). The one comment site (`MantineAuthFormPattern.tsx:29`) is unaffected, confirmed by both the diff and a dedicated test.

**Negative flows** (from the kickoff's own table) — all verified: token/zero/percent/identifier values → no finding; `span`/`order`/`offset`/`cols` object props → no finding; expression inside a comment → no finding; nested object body → `unparsed-object` finding (visible, not silently skipped); marker for one of three entries → only that entry suppressed; multi-line object → finding on the entry's own line.

## 3. Files Changed

| Path | Reason |
|---|---|
| `scripts/check-design-tokens.mjs` | New `raw-dimension-responsive-prop` category (bracket-aware scanner, not a per-line regex); extracted `DIMENSION_PROP_NAMES` as a shared constant consumed by the existing numeric/unit single-brace arms AND the new arm (no behavior change to the existing arms — proven by the full pre-existing suite staying green). |
| `scripts/__tests__/check-design-tokens.test.ts` | New describe block: R1/R2/R3/R4/R6 tests (14 new tests). |
| `src/design-system/mantine/theme.ts` | +2 `theme.other` roles: `boxSize.phoneCountryTrigger` ('7rem') and `layout.heroSearchFallbackHeight` (`{base:279,sm:175,md:123}`), typed in the `MantineThemeOther` augmentation with source comments. |
| `src/components/shared/HeroSearchFallback.tsx` | `Skeleton h` reads the new `heroSearchFallbackHeight` role per breakpoint key instead of the raw literal triple. |
| `src/components/shared/PhoneField.tsx` | `MantineCombobox triggerWidth` reads the new `phoneCountryTrigger` role at both keys; removed the now-unneeded `design-tokens-allow` marker (the literal it suppressed no longer exists). |
| `docs/design-system.md` | New §23.1.d documenting the category, prop list, boundary, and stated blind spot. |
| `docs/backlog.md` | Task 797 registry row + Last Session line updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW`, with a note on the unrelated pre-existing `theme.d69-18.test.tsx` failure hit during validation (already tracked at row 790). |

## 4. Validation evidence

All commands run from the project root, `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` set first per the kickoff. Transcripts under `docs/sessions/evidence/task797/` (Node UTF-8 I/O; BOM stripped from every transcript; exit codes appended, unpiped).

**§13.1 Census (before any detector edit):**
- `node -p process.platform` → `win32`
- `git log -1 --oneline -- scripts/check-design-tokens.mjs` → `5ea1e2fe5` (Task 822's commit — matches the kickoff's sequencing precondition)
- `git status --porcelain` → clean
- `node docs/sessions/evidence/task797/design/90_797_scan.mjs` → `HITS 3 FILES 3`, exactly the kickoff's §3.2 table (`HeroSearchFallback.tsx:24`, `PhoneField.tsx:165`, `MantineAuthFormPattern.tsx:29`)
- `npm run check:design-tokens:strict` → `0 violations`, exit 0 (`00_pre_strict.txt`)

**AC1 — red-then-green (retained transcripts):**
- New tests written first. `npx vitest run` against the **unmodified** detector (temporarily restored via read-only `git show HEAD:scripts/check-design-tokens.mjs`, a plain file write — no mutating git used): **6 failed, 138 passed**, exit 1 (`02_vitest_RED_before_arm.txt`).
- Arm restored. Same command: **144 passed**, exit 0 (`03_vitest_GREEN_after_arm.txt`).
- Full pre-existing 129-test suite also re-verified green immediately after the refactor, before the new tests existed (`01_vitest_after_arm_before_new_tests.txt`) — proves `DIMENSION_PROP_NAMES` extraction changed no existing arm's behavior.

**AC2 — test names and summary:** `npx vitest run scripts/__tests__/check-design-tokens.test.ts` → **144 passed**, exit 0 (`10_final_vitest.txt`). New test names (14): "flags each raw numeric entry…", "flags each raw unit-bearing quoted entry…", "the numeric single-brace arm does NOT see the responsive-object form…", "does NOT flag a token string value", "does NOT flag zero", "does NOT flag a percentage string", "does NOT flag a theme.* identifier value", "does NOT flag span/order/offset/cols object props…", "does NOT flag inside a {/* */} JSX comment", "does NOT flag inside a /** */ JSDoc comment (…R6)", "a nested object body is NOT skipped silently — it reports unparsed-object", "a marker for one entry of three suppresses only that entry", "a multi-line responsive object reports each finding on the entry's own physical line", "two-armed plant: … exactly 3 findings", "two-armed plant reverted: … 0 findings".

**AC3 — real-tree gate + role grep + diff + rendered proof:**
- `npm run check:design-tokens:strict` on the real tree → `0 violations`, exit 0 (`04_strict_after_tokenize.txt`, `11_final_strict.txt`).
- `Select-String -Path theme.ts -Pattern "phoneCountryTrigger|heroSearchFallbackHeight"` → both role definitions found (type + value + comment sites).
- `git diff` of the two components → value-expression-only change (plus PhoneField's marker removal); quoted above and in the raw diff.
- Rendered proof: `npm run build-storybook` (exit 0, `05`/`07`/`09_build_storybook_*.txt`) + a targeted Playwright script (`92_hero_fallback_height_check.mjs`) measuring `[data-testid="hero-search-fallback"]`'s `getBoundingClientRect().height` in the `Mantine/Primitives/HeroSearch` `Fallback` story at 390/640/1440px, **before** (HeroSearchFallback.tsx temporarily reverted to `git show HEAD` content, no git mutation) and **after** (the shipped diff): both `{390: 279, 640: 175, 1440: 123}` — byte-equal (`06_hero_height_after.txt`, `08_hero_height_before.txt`, `hero-fallback-height-{before,after}.json`).

**AC4:** §23.1.d added to `docs/design-system.md`, quoted in full in the diff; category name, prop list (minus `offset`), boundary, and stated blind spot all present.

**§13.2 final gate block** (all commands, actual exit codes):

| Command | Exit | Evidence |
|---|---|---|
| `npx vitest run scripts/__tests__/check-design-tokens.test.ts` | 0 | `10_final_vitest.txt` |
| `npm run check:design-tokens:strict` | 0 | `11_final_strict.txt` |
| `npm run typecheck` | 0 | `12_final_typecheck.txt` |
| `npm run lint` | 0 (0 errors, 75 pre-existing warnings, none in touched files) | `13_final_lint.txt` |
| `npx vitest run src/design-system/mantine/__tests__` | **1** — one pre-existing, unrelated failure (see §5) | `14_final_mantine_tests.txt` |
| `npm run build-storybook` | 0 | `09_build_storybook_final.txt` |
| `npm run build` | 0 | `15_final_build.txt` |
| `npm run check:file-integrity` | 0 (after stripping stray BOM from my own PowerShell-captured `.txt` transcripts — real source files were never affected) | `17_file_integrity_final.txt` |
| `npm run check:mojibake` | 0 (5145 files, 0 artifacts) | `22_mojibake_final.txt` |
| `git diff --stat` | — | quoted above |
| `git hash-object` (7 paths) | — | quoted above |

## 5. Pre-existing, unrelated defect surfaced by §13.2 (not caused by, not fixed by this task)

`npx vitest run src/design-system/mantine/__tests__` fails 1/55: `theme.d69-18.test.tsx` asserts `FooterView.tsx` contains the literal substring `theme.other.layout.footerGridGap`, but the real source (untouched by this task — `git diff --stat` for both paths is empty) reads `theme.other!.layout!.footerGridGap` (non-null assertions added by an unrelated prior hotfix, commit `34faa47a9`, "FooterView is a Server Component"). This exact defect is **already tracked** in `docs/backlog.md` at task row **790** (filed 2026-09-06), which names the identical line numbers and root cause. Confirmed pre-existing and out of Task 797's scope; not remediated here.

## 6. Visual source trace

Not applicable — R5's two edits are value-preserving (same numbers, new source expression); AC3's assumption ("Mantine converts the same numbers to the same CSS regardless of source") is independently proven, not just assumed, by the before/after rendered measurement in §4. §15 of the kickoff states GR-1/16d is not applicable (no visible change) — agreed: no new/changed visible component, no new Story required.

## 7. Canonical UI decision record

Not applicable — no new visible artifact created; both edits swap a literal for an existing prop's value source only, consuming existing `useMantineTheme()` calls (`HeroSearchFallback.tsx` already had one; `PhoneField.tsx` already had one too — see §8 deviation).

## 8. Implementation validation notes, assumptions, deviations, limitations

- **Deviation from kickoff §3.4/Implementation requirement #3:** the kickoff states `PhoneField.tsx` "does not call `useMantineTheme()` today" and says to add it. Measured: it already does (`const theme = useMantineTheme()` at line 70, and `theme.other.layout.phoneCountryDropdownMinWidth` already consumed at line 169) — added by Task 822, which the kickoff's own §3.2 predates in its drafting. No new hook call was needed; `theme.other.boxSize.phoneCountryTrigger` was added to the existing `theme` reference. This is a stale kickoff fact, not a contradiction — flagging for the record.
- **Limitation:** §13.1's census step (`90_797_scan.mjs`) reproduced the kickoff's exact §3.2 table (3 hits, 3 files) — no additional code site beyond the two named in R5, so the kickoff's §5 stop condition ("add it to R5 only when an existing role holds the exact value... otherwise stop with BLOCKED") never triggered.
- **Assumption confirmed, not just inherited:** the kickoff's own §5 assumption (same numbers → same CSS regardless of literal-vs-token-reference source) was independently re-verified by rendering, not taken on faith — see §4 AC3 rendered proof.
- No owner decision was required; no `POLICY-EDIT AUTHORITY REQUIRED` situation arose.

## 9. Opus handoff

- Evidence root: `docs/sessions/evidence/task797/` (`00`–`22` transcripts, `design/` census scripts, `92_hero_fallback_height_check.mjs`, both `hero-fallback-height-*.json` result files).
- Please independently re-inspect: (a) the `findResponsiveDimensionFindings` bracket-depth walk in `scripts/check-design-tokens.mjs` for correctness on the real two-armed plant and the multi-line-entry line-number claim; (b) that `DIMENSION_PROP_NAMES` extraction is byte-identical in its two existing regex call sites (both are `new RegExp(...)` constructions now, not literals — I re-verified the full pre-existing 129-test suite stayed green both before and after adding the new tests, but a second look at the interpolated regex source is warranted since this refactor touches every existing dimension-prop arm); (c) whether the pre-existing `theme.d69-18.test.tsx` FooterView failure (§5) should block this review or is correctly treated as pre-existing/out-of-scope (task row 790 already owns it).
- No git commands were run beyond read-only inspection (`status`, `log`, `diff`, `show`, `hash-object`, `grep`) per the executor's git boundary.

## 10. Backlog update

`docs/backlog.md` Task 797 registry row updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a one-line evidence pointer and the pre-existing-defect note; "Last Session" line updated similarly. File remains **79 physical lines** (no growth — both edits replaced existing line content) — no `BACKLOG LIMIT BREACH`.
