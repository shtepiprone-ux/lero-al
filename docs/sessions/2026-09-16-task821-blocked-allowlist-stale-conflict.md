# Task 821 — `ListingFeatureIcon`/`FavoriteButton` tier-3 allowlist ownership transfer

**Status: ✅ `APPROVED WITH NOTES` 2026-09-16 (Opus review — see the closing section).**

Kickoff: `tasks/Sprints/Sprint_75_kickoff_prompt_Task_821_Last_Two_Tier3_Allowlist_Entries.md`.

This session ran in two revisions. Revision 1 stopped at `BLOCKED — OWNER DECISION REQUIRED` per the kickoff's own
§5 second bullet, after R2's read-only projection showed both allowlist entries would go stale on enrolment.
Revision 2 resumed after an explicit owner decision authorizing removal of the two stale entries (amending R5/AC6),
and completed the task. Sonnet ran no mutating git command and self-approves nothing; this handoff is not an approval.

## Revision 1 — R1/R2, stop condition fired, no tracked file changed

### §5 prerequisite — Task 820's committed allowlist blob

```
git --no-optional-locks log -1 --oneline -- scripts/rendered-scope-allowlist.json
  d5031fa4a feat(Task820): enrol all 33 pattern-directory files, retire the 11 transitional tier-3 allowlist
            entries, add the blocking check:pattern-enrolment gate
git --no-optional-locks log -1 --format=%H -- scripts/rendered-scope-allowlist.json
  d5031fa4a1f0742688df69cbd3f735586ab040a6
git --no-optional-locks hash-object scripts/rendered-scope-allowlist.json
  bf09fd2f63b542faa14a63bfb44253203422b026
```

Matches AC6's required hash `bf09fd2f63b542faa14a63bfb44253203422b026` exactly — committed, verified before the
working tree was read in its place. Transcript: `docs/sessions/evidence/task821/Rev1_baseline.txt`.

### AC1 — R1 census, re-derived at execution, reconciled against §3.2

| Property | `ListingFeatureIcon.tsx` | `FavoriteButton.tsx` | §3.2 dated figure | Reconciled? |
|---|---|---|---|---|
| Line count | 27 (`split('\n').length`, trailing-newline true) | 184 (same method) | 27 / 184 | **Match, exactly.** (A `Get-Content \| Measure-Object -Line` run under `-Encoding utf8` returned 23/164 for the same files — an unreliable artifact of that cmdlet, not a real count; the Node-measured figure is authoritative and is what §3.2 already matches.) |
| `className` JSX-attribute count | 1 (AST count, `check:surface-census`) | 0 (same) | 1 / 0 | **Match.** `FavoriteButton.tsx`'s one `className:` is an object property inside the spread `commonProps` (line 156), never a literal JSX attribute — the AST counter correctly reports 0. |
| Imports `@/components/ui/*` | No (`grep` 0 hits; `ui-imports:0`) | No (same) | `UNKNOWN` in §3.3 | Resolved: neither does. No tier-2 `CONFLICT` path applies. |
| In `scripts/mantine-migration-scope.json` | No (`manifest:no`) | No (same) | "None is in the manifest" | **Match.** |
| A canonical Mantine story imports **its own path** | No (`story:no`) | Mechanically **yes** (`story: storyImportedPaths.has(path)`) — `ListingCardPattern.stories.tsx:11` directly imports `FavoriteButton` (no barrel hop) to fill the `favorite` slot | "appears only inside `ListingCardPattern.stories.tsx` as a composition — not its own" | **Explained, not contradicted.** The mechanical flag cannot distinguish a component's own Story from a composition import; GR-3/16d still hold that import is not `FavoriteButton`'s own Story, which is exactly why R3/AC3/AC4 required (and this session built) a real standalone Story regardless of what the flag reports. |
| Owner in allowlist | `813` (tier3) | `813` (tier3) | matches §3.1 | **Match.** |

Full output: `docs/sessions/evidence/task821/Rev1_check-surface-census.txt`,
`Rev1_check-story-coverage.txt`, `Rev1_check-rendered-scope.txt` (manifest 70 entries; 4 allowlisted edges, matching
§3.1's `FACT` exactly).

### AC2 — R2's read-only frontier projection, before any tracked file changed

Method: a temporary, untracked scratch script (`scripts/_task821-scratch-projection.mjs`, deleted immediately after
capture, confirmed absent and `git status --short` clean before any further step) copied verbatim the pure
`walkEnrolledSubgraph`/`dedupeEdges`/`compareToBaseline` functions from `scripts/check-rendered-scope.mjs`
(unmodified — R7 forbids editing it) and ran them against an **in-memory** projected manifest (the real 70 entries +
the two Task 821 paths), reading — never writing — the manifest, allowlist and baseline files. Transcript:
`docs/sessions/evidence/task821/Rev1_R2_frontier-projection.txt`.

Result: **0 new frontier edges** anywhere in the projected graph (neither component renders any further unenrolled
child of its own — every local import resolves to an external package or a non-rendered binding). The projection's
one `tier2-legacy-primitive` finding (`AuthSheet.tsx -> PasswordRequirementsHint.tsx`) was pre-existing baselined
debt unrelated to either new root — not a new edge, so §5's `CONFLICT` bullet did not fire. **Both allowlist entries
would go stale**: their only two consumers, `ListingCard.tsx`/`ListingDetailView.tsx`, are already-enrolled, so once
the target path is itself enrolled the edge resolves enrolled-to-enrolled before the allowlist is ever consulted,
and neither entry is matched. This is exactly the kickoff §5 second-bullet stop condition — not a boundary case, an
unconditional one for this task as scoped.

Revision 1 stopped here per the kickoff's own instruction. Nothing past R2 was started.

## Owner decision, 2026-09-16 — quoted verbatim

Recorded in full at `docs/sessions/evidence/task821/Rev2_00_owner-decision.txt`. Summary: Task 821 is **APPROVED TO
RESUME**; the two stale allowlist entries are **authorized for removal** as part of Task 821 rather than kept, because
the 2026-09-11 "keep them governed by their explicit entries" instruction applied to the transitional pre-enrolment
state, not to a resolved tier-3 exception. No gate exception, no gate-logic edit, no component-source edit authorized.
The `owner` `813`→`821` transfer remains required as the first tracked-file write with its hash/diff evidence
(AC6a unchanged). R5/AC6 amended only to drop the "entries remain in the final tree" requirement.

## Revision 2 — resumed execution, in kickoff order

### R5 (unchanged) — allowlist `owner` field edit, first tracked-file write

`git diff` shows exactly two changed lines (`"owner": "813"` → `"owner": "821"`, both entries), path/reason
byte-identical. Hash before (Task 820's committed blob, re-stated): `bf09fd2f63b542faa14a63bfb44253203422b026`. Hash
after: `a3e48ab38f722bc2160df08ed9971adfb9e7868c`. Immediately after, `check:rendered-scope` exits **0** with
`Allowlisted edges (tier3, owner-filed): 4` unchanged — both entries still matched, neither stale yet (nothing else
had changed). AC6a satisfied. Transcripts: `Rev2_01_R5_owner-field-edit.txt`, `Rev2_02_R5_post-edit_check-rendered-scope.txt`.

### R3 — canonical Stories, own path, real production component

- `src/stories/mantine/primitives/ListingFeatureIcon.stories.tsx` — `title: 'Mantine/Primitives/ListingFeatureIcon'`
  (satisfies `isCanonicalMantineTitle`), `import { ListingFeatureIcon } from '@/modules/listings/components/ListingFeatureIcon'`
  (direct file path, no barrel). Renders all 7 `PresentationIcon` names the real `ICON_MAP` resolves, each through
  both real production sizing paths verbatim (not invented): `ListingCard.tsx:184/282`'s `className={styles.featureIcon}`
  (its own co-located `ListingCard.module.css`, reused directly) and `ListingDetailView.tsx:271`'s
  `size={theme.other.iconSize.compact}`.
- `src/stories/mantine/primitives/FavoriteButton.stories.tsx` — `title: 'Mantine/Primitives/FavoriteButton'`,
  `import { FavoriteButton } from '@/modules/listings/components/FavoriteButton'` (direct file path). Wrapped in
  the real `AuthContext.Provider` with a signed-in fixture (same technique as `ListingCard.stories.tsx`, since
  `useAuth()` is called unconditionally and the real `AuthProvider` cannot mount in a story). States rendered, all
  through real production call-site values:
  - **AC4's required minimum** — icon shape, inline (`ListingCard.tsx`'s list variant, `styles.inlineFavorite`):
    unsaved/enabled, saved/enabled, unsaved/disabled, saved/disabled (`disabledLabel` from the real
    `listing.action_disabled_sold` key).
  - Bonus, same real contract: icon shape `overlay` (`ListingCard.tsx`'s grid variant, `overlay` +
    `styles.overlayFavorite`) unsaved/saved, over a representative positioned image area; pill shape
    (`shape="pill"`) unsaved/saved.

Both titles/imports quoted above satisfy AC3. AC4's four required states are named and expressed as shown.

Validation: `typecheck` 0, `lint` 0 (two `react/no-unescaped-entities` errors found and fixed —
`Rev2_03_R3_typecheck-lint-stories.txt` records the original findings; `Rev2_04_R3_lint-recheck.txt` confirms both
files clean after the fix), `check:stories` — 153 files, 0 violations (`Rev2_05_R3_check-stories.txt`).

### R4 — manifest enrolment

`scripts/mantine-migration-scope.json`: 70 → 72, exactly the two paths appended (matches the file's existing
chronological, non-alphabetical convention), no other entry changed. `git diff` quoted in full in
`Rev2_06_R4_manifest-diff.txt`. `check:story-coverage` immediately after: **72/72 covered**, 0 unproven
(`Rev2_07_R4_check-story-coverage.txt`).

### R2 confirmed live, then the amended R5 — allowlist entry removal

`check:rendered-scope` on the just-enrolled tree reproduced R2's projection exactly: `Allowlisted edges: 0`, both
`ListingFeatureIcon.tsx`/`FavoriteButton.tsx` reported `FAIL 2 stale rendered-scope-allowlist.json entry(ies)`, exit 1
(`Rev2_08_post-enrolment_check-rendered-scope_expect-stale.txt`). Per the owner decision, both entries were then
removed: hash before `a3e48ab38f722bc2160df08ed9971adfb9e7868c`, after `fe51488c7066f6687ef680d6bfaa4f7768ef205c`; the
cumulative diff against Task 820's committed blob (`Rev2_09_amended-allowlist-removal.txt`) shows the file going from
the original two `owner: "813"` entries to `[]`. `check:rendered-scope` immediately after: **PASS**, exit 0
(`Rev2_10_post-removal_check-rendered-scope.txt`).

### R6 — both baselines via their own `--update-baseline`

- `check:rendered-scope:update-baseline`: hash before/after identical (`fa8338634f8d34bf59deb70101e9e959eee28238`),
  `git diff --stat` empty, "entries written: 28" (unchanged from before) — confirmed idempotent, because the
  enrolment introduced 0 new edges (`Rev2_11_R6_rendered-scope_update-baseline.txt`).
- `check:surface-census:changed` (run with `--base HEAD`, diffing the working tree against the last commit, since
  every change this session made is uncommitted): 0 surfaces censused (the three tracked diffs —
  `docs/backlog.md`, both JSON config files — are all outside `src/`; neither new Story file is tracked/diffed by
  `git diff`, and Storybook-only files are outside this mapper's scope anyway), 0 new / 0 stale, exit 0
  (`Rev2_13_R6_surface-census-changed_pre-update.txt`). `check:surface-census:changed:update-baseline`: hash
  before/after identical (`2faf21bac845b1d468c0d01806c79e785806cb42`), `git diff --stat` empty, "entries written: 653"
  (unchanged) — confirmed idempotent (`Rev2_14_R6_surface-census-changed_update-baseline.txt`).

### §13.2 final gate block

All commands re-run on the final tree (`Rev2_15_gates-block.txt`):

| Command | Result |
|---|---|
| `typecheck` | exit 0 |
| `lint` | exit 0 (72 pre-existing warnings elsewhere in the repo, 0 errors) |
| `check:story-coverage` | 72/72 covered, exit 0 |
| `check:stories` | 153 files, 0 violations, exit 0 |
| `check:rendered-scope` | 0 new / 0 stale, `Allowlisted edges: 0`, exit 0 |
| `check:rendered-scope:verify` | 5/5 arms pass, exit 0 |
| `check:surface-census:changed --base HEAD` | 0 new / 0 stale, exit 0 |
| `check:surface-census:changed:verify` | 8/8 arms pass, exit 0 |
| `check:pattern-enrolment:verify` | 5/5 arms pass, exit 0 |
| `check:media-enrolment:verify` | 5/5 arms pass, exit 0 |

**`npm run build`** — exit 0, clean production build (`Rev2_16_build.txt`), mandatory per agent-contract clause 9.

**Hygiene**: `check:file-integrity` — 30 files checked, PASSED; `check:mojibake` — 4912 files scanned, 0 artifacts
(`Rev2_17_hygiene-final.txt`).

### AC8/AC9 — empty diffs where required

```
git diff --stat -- scripts/check-rendered-scope.mjs scripts/check-surface-census.mjs
  scripts/check-surface-census-changed.mjs scripts/map-changed-surfaces.mjs
  scripts/audit-design-system-patterns.mjs scripts/check-pattern-enrolment.mjs
  scripts/check-media-enrolment.mjs
  (empty)

git diff --stat -- src/modules/listings/components/ListingFeatureIcon.tsx
  src/modules/listings/components/FavoriteButton.tsx
  (empty)
```

None of the seven R7-named gate scripts, and neither component's source, were touched at any point in either
revision. Full transcript: `docs/sessions/evidence/task821/Rev2_18_final-status.txt`.

### R9 — docs

- `docs/design-system-pattern-ownership.md` — new §9 records the transfer, the amendment, and the final
  `2 → 0` allowlist state, closing the "transitional snapshot" language Task 820's §7/§8 and this task's own kickoff
  used.
- `docs/backlog.md` — Task 821's state line updated to `IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` with a concise
  summary and the AC10 owner-QA pointer (line count held at 80 throughout).

## AC10 — `OWNER VISUAL QA REQUIRED`

Six tuples, not reviewed by this session (owner-only, per `docs/qa-profiles.md`'s retirement of automated visual
assertion as a substitute):

1. `ListingFeatureIcon/Default` — 390px, `en`
2. `ListingFeatureIcon/Default` — 1440px, `en`
3. `FavoriteButton/Default` — saved — 390px, `en`
4. `FavoriteButton/Default` — unsaved — 390px, `en`
5. `FavoriteButton/Default` — saved — 1440px, `en`
6. `FavoriteButton/Default` — unsaved — 1440px, `en`

Both stories are single `Default` exports covering every listed state in one render (states distinguished by their
own labelled sub-sections, per the story content above) — the owner reviews the two named viewport/locale
combinations and records accepted or returned for each state visible within them.

## Files changed

| Path | Change |
|---|---|
| `scripts/rendered-scope-allowlist.json` | `owner` `813`→`821` (first tracked-file write), then both entries removed → `[]`. Hash: `fe51488c7066f6687ef680d6bfaa4f7768ef205c`. |
| `scripts/mantine-migration-scope.json` | +2 entries (70→72), no other change. Hash: `9320321d638bf3775a1e8cc966bc82962bebdf0a`. |
| `src/stories/mantine/primitives/ListingFeatureIcon.stories.tsx` | New canonical Story. Hash: `295481528a3163c8eca64d684949f3adb066b9d3`. |
| `src/stories/mantine/primitives/FavoriteButton.stories.tsx` | New canonical Story. Hash: `c9558f196e4f1d2359fe6318606f9b785611dfa1`. |
| `docs/design-system-pattern-ownership.md` | New §9. Hash: `951c320e6fac1d5f0ae425c4c63807a62d4a9142`. |
| `docs/backlog.md` | Task 821 state line updated (80 lines held). Hash: `4f9ddb874cbac1b899fb5b562d952d7cfce2ae17`. |
| `docs/sessions/2026-09-16-task821-blocked-allowlist-stale-conflict.md` | This session log. |
| `docs/sessions/evidence/task821/*` | New — all evidence transcripts, both revisions. |

`scripts/rendered-scope-baseline.json` and `scripts/surface-census-baseline.json` were each run through their own
`--update-baseline` (R6) and are byte-identical before/after (confirmed by matching hash and empty `git diff --stat`)
— no tracked change, because the enrolment introduced 0 new debt into either ledger. Neither component's source nor
any of the seven R7-named gate scripts changed (AC8/AC9, confirmed above).

## Assumptions, deviations, limitations

- **No deviation from kickoff order**, amended only where the owner decision explicitly authorized it (entry
  removal instead of retention, after Stories/manifest made retention impossible under the unmodified gate logic).
- **Limitation, same as Revision 1**: R2's frontier projection was produced by a byte-for-byte copy of
  `check-rendered-scope.mjs`'s pure functions run against an in-memory manifest, not a CLI override of the shipped
  script (which has none, and adding one would violate R7). Revision 2 independently confirmed the projection's
  predicted outcome by running the real, unmodified gate against the real, enrolled tree twice (once showing the
  predicted stale failure, once showing the clean pass after removal) — so the projection's accuracy is now verified
  empirically, not resting on the copy alone.
- **`check:surface-census:changed`** required an explicit `--base HEAD` (the kickoff's §13.2 command line omits it;
  the script hard-fails without one, and the working tree — not a commit — is where every change in this session
  lives, so `--head` was correctly left to its "current working tree" default).

## QA profile

`Q3 Full Visual Matrix`. Full non-visual evidence above; AC10's six-tuple owner visual review is the outstanding
requirement before approval, per `docs/qa-profiles.md`'s "Q3 cannot be approved without full visual proof."

Sonnet ran no mutating git command and emits none; this task is not self-approved.

## Orchestrator review — 2026-09-16

**`APPROVED WITH NOTES`.** First pass `PARTIALLY VERIFIED` (AC10 outstanding). Re-verified natively (win32, Node
v22.22.3): `check:rendered-scope` 72 roots, 0 new / 0 stale, allowlisted 0; `check:story-coverage` 72/72;
`check:stories` 153/0; `check-surface-census --surface` on `ListingFeatureIcon.tsx`, `FavoriteButton.tsx` and
`ListingCard.tsx` all exit 0 with `manifest:yes story:yes`; Task 820's committed blob re-hashed to `bf09fd2f…`;
`map-changed-surfaces.mjs:194` excludes `src/stories/` from the CI mapper. Owner re-ran typecheck, lint (0 errors),
check:stories, check:story-coverage, build, check:file-integrity and check:mojibake on the final tree, with Story blobs
unchanged; owner accepted all six AC10 tuples. Notes (P3) → Task **826**.
