# Session: Task 624 — Clear the Mantine-only locale-leak errors — 2026-07-19

**Status: IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW**

Task: `tasks/kickoff_prompt_Task_624_LocaleLeak_MantineAllowlist.md`

## Requirement ledger (from the kickoff)

| Item | Requirement | Verified |
|---|---|---|
| AC1 | Every leak resolved by action 1/2/3/4, decision recorded | ✅ token→action table below |
| AC2 | `build-storybook` + `check:locale-leak:mantine-only` → 0 leaks, exit 0 | ✅ verbatim output below |
| AC3 | Action-3 translations keep 4-locale key parity | ✅ `check:i18n` — 2203/2203, no keys added/removed |
| AC4 | Planted violation FAILS naming it; restore; re-pass | ✅ transcript below |
| AC5 | `git diff` shows only messages/it.json, the two LEAK_ALLOWLIST/PER_STORY_TOKENS blocks, and the action-4 stories | ✅ diff below — see note on story count |

## Deviation from the kickoff's stated scope — read first

The kickoff was written against a **97-leak** baseline captured during Task Q0R. Since that capture, commit
`7bc4550b9` ("migrate legacy footer to Mantine FooterView + primitive story") added a new canonical Mantine story
(`Mantine/Primitives/FooterView`) that is now in-scope for `--mantine-only`. Re-running the detector at the start
of this session produced **107 leaks** (the extra 10 are `Lero`/`Facebook`/`Instagram`/`Home` in the new
`FooterView` story). All 107 were classified and resolved using the exact same action-1/2/3/4 framework the
kickoff specifies — no new mechanism was invented. This is reported as a deviation, not hidden in the final count.

`AC5` says "the two action-4 stories" — there are actually **three** story files touched, because the kickoff's
own action-4 list names three items (`Secret1`, the `FilterMultiToggle` annotation, and the malformed
`Arben RichardsonMontgomery` fixture), even though the third is introduced in a different bullet than the
"Fix at the story, never allowlist" header. All three are genuine fix-at-the-story items per the kickoff's own
text ("fix the fixture, don't allowlist a broken name") — flagging this as a wording note, not a scope violation.

## Current behavior to preserve / required after behavior

Current: `npm run check:locale-leak:mantine-only` (after building Storybook) exits 1 with 107 leaks across 12
canonical Mantine story files (up from the kickoff's 97/18 baseline — fewer *files* now because several of the
kickoff's example stories, e.g. `Checkbox`, `FilterBar`'s legacy story path, no longer appear in the current
Mantine-only scope; the delta is accounted for by the FooterView addition and the current Storybook content, not
by any detector-scope change — the detector algorithm and `--mantine-only` prefixes were not touched, matching the
kickoff's guardrail).
Required after: gate exits 0 with the same story set scanned (60 Mantine stories, 236 excluded), and still fails on
a planted violation.

## Token → action table (all 107 leak rows, deduplicated to 34 unique tokens)

| Token | Action | Where it leaked | Evidence |
|---|---|---|---|
| Password | 1 — global allowlist | PasswordInput (it), AuthFormPattern (it) | `auth.password`/`pw_*` keys: it="password" (loanword) at every real key; sq always translates to "Fjalëkalim(i)" |
| Dashboard | 1 — global | UserMenu (it), AppShellFoundation (it) | `nav.admin_dashboard`/`admin.sidebar.item_dashboard`/`admin.dashboard.title` = it:"Dashboard" everywhere; sq translates to "Paneli kryesor" |
| Admin | 1 — global | AppShellFoundation (sq, it) | sq: product-wide "Administrator"/"Admin" loanword convention (6+ real `admin.*` keys); it: "pannello admin" casual-loanword precedent |
| Panel | 1 — global | FiltersPanelShell (sq) | `listing.wall_panel`: sq="Panel" (matches en); it="Pannello" (real, different — never leaks) |
| Brand | 1 — global | Badge (sq, it) | `admin.settings.tab_brand`/`admin.footer.section_brand` = "Brand" in both sq and it product-wide |
| Premium | 1 — global | CardGrid, ListingDetailPattern (sq, it) | `listing.premium`: sq/it="Premium" (loanword); uk="Преміум" (never leaks) |
| Studio | 1 — global | FiltersPanelShell (sq only) | `listing.layout_studio`: sq="Studio" (loanword); it="Monolocale" (real, never renders "Studio") |
| Duplex | 1 — global | FiltersPanelShell (sq, it) | `listing.layout_duplex`: sq/it="Duplex" (genuine cognate in both) |
| Penthouse | 1 — global | FiltersPanelShell (sq only) | `listing.layout_penthouse`: sq="Penthouse" (loanword); it="Attico" (real, never renders "Penthouse") |
| Min | 1 — global | FilterControls, FiltersPanelShell (sq, it) | `common.min`/`storybook.filtercontrols.price_min`: sq/it="Min" in both real keys, consistently |
| Max | 1 — global | FilterControls, FiltersPanelShell (it only) | `common.max`/`price_max`: it="Max" (loanword); sq="Maks" (real distinct spelling, never leaks) |
| Lero | 1 — global | FooterView, HeaderView (sq, uk, it) | Brand name, identical by design |
| Lero.al | 1 — global | AppShellFoundation (sq, uk, it) | Brand name, identical by design |
| Facebook | 1 — global | FooterView (sq, uk, it) | Universal social-brand name |
| Instagram | 1 — global | FooterView (sq, uk, it) | Universal social-brand name |
| Info | 3 — translate | Badge (it only) | `badge_purple`/`badge_sale`/`badge_blocked` all show the intended pattern is real per-locale translation, not a loanword; sq already has "Informacion" — it was missing. Fixed: it `badge_info` "Info"→"Informazioni" |
| Home | 3 — translate | FooterView, HeaderView, MobileNavDrawer, AppShellFoundation (it only) | `nav.home` was the **only** untranslated key in the whole `nav` namespace (13 siblings all real Italian) — genuine gap, not a loanword. Fixed: it `nav.home` and `storybook.mantine.app_shell_nav_home` "Home"→"Homepage" (precedent: `admin.locations.featured_col`="Homepage") |
| Administrator | 2 — per-story | Avatar, SegmentedControl (sq only) | `avatar_demo_subtitle`/`seg_demo_role_admin`: it/uk translate ("Amministratore"/"Адміністратор"); sq is the established loanword convention (mirrors legacy `admin-admintable` entry) |
| Agent | 2 — per-story | Table, AdminSurfacePattern (sq, uk, it) | Raw fixture role string, not routed through the real (translated) `role_agent` key — mirrors legacy `admin-admintable`'s "Agent" entry, same "not via storyT" precedent |
| Tirana RE | 2 — per-story | Table, AdminSurfacePattern | Fixture agency name |
| Antonio Berluskoni | 2 — per-story | Table | Fixture person name |
| Roma Immobili | 2 — per-story | Table, AdminSurfacePattern | Fixture agency name |
| Albhome | 2 — per-story | Table, AdminSurfacePattern | Fixture agency name |
| Arben RichardsonMontgomery | 4 — fix at story | Table | Malformed concatenated fixture (two mashed English-looking surnames) — renamed to a real hyphenated Albanian surname `Arben Krasniqi-Marashi` (still stress-tests the same compound-surname wrap); the new name is per-story allowlisted like the other Table fixture names |
| Driton Berisha | 2 — per-story | UserMenu | Fixture person name |
| Giulia Romano | 2 — per-story | AdminSurfacePattern | Fixture person name |
| Alba Krasniqi | 2 — per-story | HeaderView, MobileNavDrawer, UserMenu | Fixture authenticated-user name |
| Elira Hoxha | 2 — per-story | ListingContactPattern, ListingDetailPattern | Fixture agent name |
| Prime Realty Tirana | 2 — per-story | ListingContactPattern, ListingDetailPattern | Fixture agency name |
| Tirana, Albania | 2 — per-story | ListingCardPattern, ListingDetailPattern | Fixture place name |
| Gas | 2 — per-story | FiltersPanelShell (it only) | `listing.heating_gas`: it="Gas" — genuine Italian cognate for the pre-selected heating-type fixture; scoped per-story (not global) since "Gas" is a common short word with higher generic-collision risk |
| Secret1 | 4 — fix at story | PasswordInput | Demo password value was literally quoted in a rendered caption (`&quot;{DEMO_VALUE}&quot;`). Removed the quoted echo from the rendered `<Text>` — the value/rule-breakdown documentation stays in the existing source comment. `checkPasswordRules(DEMO_VALUE)` behavior is unchanged |
| FilterMultiToggle — Mantine Button toggles (§6a chrome, filled=selected / default=unselected) | 4 — fix at story | FilterControls | Developer annotation was rendered as a live `<Text>` child in every locale. Moved into a source comment, no longer rendered (matches kickoff instruction verbatim: "stop rendering the description string") |

## Files Changed

| File | Rationale |
|---|---|
| `scripts/check-locale-leak.mjs` | Added 4 global `LEAK_ALLOWLIST` regex groups (14 tokens) + 11 `PER_STORY_TOKENS` entries (Mantine-prefix mirrors of legacy role/fixture allowances + new fixture names), each with a justification comment |
| `messages/it.json` | 3 value-only translation fixes: `nav.home`, `storybook.mantine.app_shell_nav_home` ("Home"→"Homepage"), `storybook.mantine.badge_info` ("Info"→"Informazioni"). No keys added/removed |
| `src/stories/mantine/primitives/PasswordInput.stories.tsx` | Removed the literal quoted echo of the `Secret1` demo password from the rendered caption (action 4) |
| `src/stories/mantine/primitives/FilterControls.stories.tsx` | Stopped rendering the `FilterMultiToggle` developer annotation as visible text; kept as a source comment (action 4) |
| `src/stories/mantine/primitives/Table.stories.tsx` | Renamed the malformed `Arben RichardsonMontgomery` fixture to a real compound surname `Arben Krasniqi-Marashi` (action 4) |

No other files were touched. (`git status` also shows pre-existing uncommitted changes from Task Q0R —
`.github/workflows/governance-pr.yml`, `docs/backlog.md`, `docs/storybook-governance.md`, `package.json`,
`scripts/check-stories-rendered.mjs`, `scripts/check-story-coverage.mjs`, `scripts/lib/`,
`scripts/mantine-migration-scope.json`, `docs/sessions/2026-07-19-taskQ0R-*.md`,
`tasks/kickoff_prompt_Task_Q0R_MantineOnlyCIScope.md` — these predate this session, are Task Q0R's own diff still
awaiting orchestrator review, and were not modified by this task.)

## Validation evidence

**1. `npx tsc --noEmit`** → 0 errors (silent exit).

**2. `npm run check:i18n`** (key-parity):
```
✅ en  — 2203 keys (matches sq)
✅ uk  — 2203 keys (matches sq)
✅ it  — 2203 keys (matches sq)
✅ Parity PASSED — all 4 locale files have identical key sets (2203 keys).
```

**3. File integrity** — `npm run check:file-integrity`:
```
🔍  check:file-integrity — git-changed + untracked (default)
    Checking 15 file(s) — NUL bytes · BOM · JSON parse · node --check · truncation
✅  check:file-integrity PASSED — all 15 file(s) clean
```

**4. `npm run build-storybook`** → exit 0, "Storybook build completed successfully" (run 3× across this session:
baseline capture, post-fix verification, post-restore re-verification).

**5. AC2 — `npm run check:locale-leak:mantine-only` after the fix, verbatim:**
```
🔍  Locale leak detector — full mode (mantine-only)
Mantine selected: 60; non-Mantine excluded: 236
    Stories: 60 scanned (0 multi-locale demo stories excluded) | Locales: sq/uk/it | Viewports: 3
    Output: .screenshots/locale-leak/2026-07-19T10-19/

✅  Locale leak detector: ZERO leaks across 60 stories × sq/uk/it.
    Report: .screenshots/locale-leak/2026-07-19T10-19/report.json
```
`report.json`: `"leakCount": 0, "leaks": []`.

**6. AC4 — planted-violation proof.** Planted `<Text size="xs">{'PlantedLeakViolationTask624'}</Text>` inside
`Avatar.stories.tsx`'s negative-flow section, as a JS expression child (a plain JSX text child is caught by the
separate static `prestorybook` lint (`check-stories.mjs` → `jsx-text-literal`) before the build even runs — using
an expression child reproduces the exact class of hardcode the rendered detector exists to catch, per its own
docblock: "JSX string props, args-object literals, ... expression children ... — because it reads rendered
output, not source"). Rebuilt Storybook (exit 0, the lint did not flag the expression-child form), then ran the
detector in `--fast` mode for the plant/restore round-trip:
```
🔍  Locale leak detector — fast mode (mantine-only)
Mantine selected: 60; non-Mantine excluded: 236
    Stories: 60 scanned (0 multi-locale demo stories excluded) | Locales: sq/uk/it | Viewports: 1

❌  Locale leak detector: 3 leak(s) found:

  Story: Mantine/Primitives/Avatar/Default
    [sq] "PlantedLeakViolationTask624"
    [uk] "PlantedLeakViolationTask624"
    [it] "PlantedLeakViolationTask624"

    Report: .screenshots/locale-leak/2026-07-19T10-35/report.json
EXIT=1
```
Restored `Avatar.stories.tsx` (`git diff` against the file shows empty — byte-identical to the pre-plant state).
Rebuilt Storybook (exit 0) and re-ran the detector in full mode:
```
✅  Locale leak detector: ZERO leaks across 60 stories × sq/uk/it.
    Report: .screenshots/locale-leak/2026-07-19T10-41/report.json
EXIT=0
```

**7. AC5 — `git diff` scope check.** `git diff -- messages/it.json src/stories/mantine/primitives/{PasswordInput,FilterControls,Table}.stories.tsx` shows exactly the 3 value edits + 3 story edits described above, nothing else. `git diff scripts/check-locale-leak.mjs` (148 lines) is additive-only inside the two named blocks (`LEAK_ALLOWLIST`, `PER_STORY_TOKENS`) — no detector-algorithm lines changed, no `--mantine-only` scope change, no baseline/known-failure mechanism introduced.

## Self-review findings

- No unscoped revert: `check:locale-leak:mantine-only` remains the command; `--mantine-only`/`MANTINE_ONLY` flag,
  `isEnglishish`, `isCanonicalMantineTitle`, and the `DEMO_STORY_SKIP` regex are byte-identical to before this
  session (confirmed by diff — only the two allowlist data blocks changed).
- No blanket baseline / known-failure list was added — every exception is a specific regex/token with a comment
  stating its class and evidence.
- Verified each action-1 "loanword" candidate against real `messages/*.json` product keys rather than trusting the
  kickoff's suggested list at face value — this changed two of the kickoff's own candidates: "Info" and "Home"
  were moved from the suggested global-allowlist bucket to action-3 (real translation), because the actual
  `it.json`/`sq.json` data showed they are genuine gaps (surrounding sibling keys are fully translated), not
  established loanword conventions like "Password"/"Dashboard"/"Admin" turned out to be.
- "Gas" (a token not named in the kickoff's example list, surfaced by the actual 107-leak run) was scoped
  per-story rather than global, to keep the exception narrow given the word's generic-collision risk.

## Assumptions, deviations, and limitations

- Deviation: 107 leaks resolved, not 97 — see "Deviation from the kickoff's stated scope" above (new FooterView
  story landed after the kickoff was written; same framework applied, no shortcuts).
- Deviation: 3 story files touched for action-4 fixes, not 2 — the kickoff's own action-4 text names all three;
  flagged as a kickoff wording nuance, not scope creep.
- The `nav.home` fix touches a real, shared production i18n key (not story-only). Verified all 11 real-code
  consumers (`Footer.tsx`, `HeaderView.tsx`, `MobileNavDrawer.tsx`, `UserMenu.tsx`, `HeaderActions.tsx`,
  `MobileBottomNav.tsx`, `LocaleSwitcher.tsx`, `AdminSettings.tsx`, etc.) only render the translated string as
  display text — grepped for any `=== 'Home'` / `== 'Home'` string comparisons in `src/` and found none, so this
  is a pure content fix with no logic dependency.
- A second, unrelated `"home": "Home"` key exists in `it.json` under a nested `sheet` object (line ~1825,
  legacy/non-Mantine mobile-sheet nav path) — left untouched, out of this task's Mantine-only scope.
- `npm run lint` was not run as part of this session (not required by the Q1 Targeted profile for this task type);
  the `prestorybook` static hardcode lint (`check-stories.mjs`) ran implicitly on every `build-storybook` call in
  this session and stayed green throughout except for the intentionally-planted literal-JSX-text variant, which
  was corrected to an expression-child form before proceeding (documented in AC4 evidence above).

## Self-validation verdict

`Self-validation: tsc=0 errors · build-storybook=passes (×3) · AC table=all green · i18n parity=2203/2203 · locale-leak(full)=0 leaks/exit 0 · planted-violation=3 leaks/exit 1 naming exact story+locale+token, restored to byte-identical + re-verified 0 leaks · integrity=PASS (15/15 files) · scope=clean (AC5 diff confirmed)`

## Opus handoff — what to inspect

1. **Precedent judgment calls worth a second look:** "Info"→translate vs. task's suggested global-allowlist
   (justified above by sq already having "Informacion"); "Home"→"Homepage" translation choice for `nav.home`
   (real, shared production key — please confirm "Homepage" is the preferred product term over an alternative
   Italian phrasing; precedent used: `admin.locations.featured_col`="Homepage").
2. **The 97→107 count deviation** — confirm this is acceptable evidence of "same framework, current reality"
   rather than a scope problem, given the new `FooterView` story landed between kickoff-writing and execution.
3. **`Arben Krasniqi-Marashi`** as the replacement fixture name — a real hyphenated Albanian surname stress-testing
   the same compound-surname wrap the original malformed value was for; confirm no product/brand conflict.
4. Governance-PR wiring of `check:locale-leak:mantine-only` as CI-blocking (the actual open item from Task Q0R) is
   **not** part of this task's scope and was not touched — that decision still belongs to Q0R's own review.
