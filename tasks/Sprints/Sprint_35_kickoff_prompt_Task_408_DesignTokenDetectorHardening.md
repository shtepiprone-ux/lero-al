# Sprint 35 — Task 408 — `check:design-tokens` detector hardening (close blind spots; make the gate trustworthy before the strict flip)

> **Read `docs/agent-contract.md` (clauses 1–14) FIRST. STOP & ASK if ambiguous.**
> Implements **Epic JJ** detector-hardening step. The whole tree is at **`check:design-tokens` = 0** (Tasks 403–406
> committed). Before **Task 407** flips the gate to **strict/blocking**, the detector must be proven free of the
> **false-positives** (which would block commits on harmless/commented code) and **false-negatives** (which would let raw
> values slip past a blocking gate) that were logged as blind spots during 404–406. **408 is the HARD prerequisite for
> 407** (`docs/agent-contract.md` clause 13 detector lineage; `docs/orchestrator-role.md`).

```
Type:        Tooling / governance — detector script + tests + docs. Product code ONLY if §D tokenizes (owner-gated).
Priority:    HIGH — hard prerequisite for Task 407 (strict flip).
Depends on:  403–406 committed (whole-tree design-tokens=0). Independent of Task 410 (no overlap); sequencing per owner
             (410 first, then 408).
Area:        scripts/check-design-tokens.mjs (detection + suppression logic) + scripts/design-tokens-allowlist.json (only
             if a justified entry is required) + a NEW test fixtures/harness (scripts/__tests__ or the project's test
             location) + docs/design-system.md (§23 detector taxonomy) + docs/backlog.md + docs/sessions/.
             §D ONLY (if owner approves tokenizing): src/app/globals.css + src/components/admin/AdminTable.tsx.
NON-goal:    Flipping the gate to strict/blocking (that is Task 407). Re-refactoring already-tokenized values. Any visual
             redesign. Adding new design tokens beyond the §D decision. Changing detector category SCOPE (length/color/
             z-index/shadow/duration) — this is precision hardening, not a rewrite.
```

## The blind spots to close (logged across 404–406)
1. **(FALSE POSITIVE) JSX `{/* … */}` comment content is scanned as live violations** (Task 405, `page.tsx:375`).
   `shouldSkipLine()` only skips line-leading `//`, `*`, `/*`; it does NOT strip JSX `{/* … */}` blocks (incl. multi-line)
   before detection, so a commented-out arbitrary value is flagged as real. Under a strict gate this would BLOCK a commit
   on dead/commented code. **Must fix.**
2. **(PRECISION) Inline `zIndex: N` in JS/TS style objects** (Task 404/405). Raw numeric z-index inside `style={{ zIndex:
   9999 }}` is handled inconsistently and **cannot be exact-suppressed with a marker** the way className arbitrary values
   can. Define and implement deterministic behavior: detect raw numeric inline z-index AND support an inline suppression
   marker for it. **Must fix.**
3. **(AUDIT/AMBIGUITY) Negative-offset & function-wrapped arbitrary values** (Task 404/405). It was logged ambiguously
   whether `shadow-[0_-2px_12px_rgba(...)]` (negative Y) and `*-[calc(...)]` / `*-[min()/max()/clamp(...)]` EVADE the
   regex or are caught-but-un-tokenizable. **Resolve definitively with tests** (see §C). Conversely, the approved
   token-consumption form `*-[var(--token)]` MUST NOT be flagged.

Plus a token-design decision carried from Task 406: **§D — `--z-table-sticky` candidate** for AdminTable `z-[1]/z-[2]`.

---

## §A — Fix JSX comment false-positive (blind spot 1)
- Before per-line detection, **strip JSX comment blocks** `{/* … */}` (including multi-line spans) from the scanned
  source, in addition to the existing `//` / `/* */` / `*` handling. Do it without corrupting line/column reporting for
  REAL violations on other lines (strip-to-whitespace, don't delete lines).
- **Tests (both directions):**
  - planted live `className="text-[10px]"` → **flagged**;
  - planted `{/* className="text-[10px]" */}` (single AND multi-line JSX comment) → **NOT flagged**;
  - a line that has BOTH a real arbitrary value AND a trailing `{/* … */}` → the real value is **still flagged**;
  - existing `//` / `/* */` / leading-`*` comment skipping unchanged.

## §B — Inline `zIndex: N` detection + suppressibility (blind spot 2)
- Detect raw **numeric literal** z-index in JS/TS style objects: `zIndex: 9999`, `zIndex:9999`, `'z-index': 9999` (object
  literals / inline `style={{…}}`). Report under the `z-index` category with file:line.
- Support an **inline suppression marker** for it, mirroring the className mechanism, e.g.
  `// design-tokens-allow: zIndex:9999 — <reason>` (define the exact accepted marker form and document it in §23).
  Missing-reason → exit 1; stale marker (value no longer present) → exit 1 (same semantics as className suppressions).
- **Do NOT flag** non-literal z-index: `zIndex: Z_TOKEN`, `zIndex: 'var(--z-toast)'`, `zIndex: someVar` — only raw numeric
  literals are violations.
- **Tests:** planted `zIndex: 9999` (no marker) → flagged; with marker → suppressed; `zIndex: 'var(--z-toast)'` → clean;
  ensure the Combobox / any current inline z-index in the tree stays correctly classified (no new false positive on the
  committed tree → whole-tree must remain 0, see §F).

## §C — Negative-offset & function/var arbitrary-value audit (blind spot 3) — RESOLVE with tests
Define and lock expected behavior, then prove it:
| Form | Expected detector behavior |
|---|---|
| `shadow-[0_-2px_12px_rgba(0,0,0,0.1)]` (negative Y offset) | **FLAGGED** (arbitrary shadow) → resolve via token or exact-suppress. If it currently EVADES the regex, fix the regex so it is caught. |
| `w-[calc(100%-2rem)]`, `h-[min(90dvh,500px)]`, `text-[clamp(...)]` (function-wrapped, contains literal px/rem) | Decide & document: FLAGGED (default — contains raw literals) unless owner rules a function-form exemption. Add the chosen behavior as a test. If FLAGGED, they become suppress/token candidates (none should remain in-tree — confirm via §F). |
| `h-[var(--listing-gallery-h-mobile)]`, any `*-[var(--token)]` | **NOT FLAGGED** (approved token-consumption form). Lock with a test so future regex changes can't regress it. |
- If the audit reveals a real EVASION (false negative), fix it and re-run §F to ensure no previously-hidden true violation
  now appears un-resolved — if one does, **STOP & ASK** (resolve/escalate; never mask).
- Document the taxonomy (negative-offset shadows un-tokenizable → exact-suppress; function vs var forms) in design-system §23.

## §D — `--z-table-sticky` token decision (carried from Task 406) — STOP & ASK, with recommendation
AdminTable `z-[1]/z-[2]` are currently exact-suppressed as "local sticky-cell stacking, not a global elevation layer".
- **Orchestrator recommendation: KEEP them exact-suppressed; do NOT add a token.** `z-[1]/z-[2]` are local micro-stacking
  inside one component, not a semantic global layer; minting `--z-table-sticky`=1/2 tokens would over-extend the z-scale
  for no reuse. The existing suppressions already pass the gate cleanly.
- **STOP & ASK the owner** to confirm KEEP-SUPPRESSED (recommended) vs ADD-TOKEN. **Only if the owner chooses ADD-TOKEN:**
  add the token(s) to `globals.css`, replace the AdminTable suppressions with the token utility, and prove computed
  `z-index` is **identical (1 / 2)** (inert) — and that the change is reflected in the Task 410 AdminTable story render.
  Otherwise make NO product-code change here.

## §E — Negative-flow test harness (proves the gate is REAL — required before 407)
- Add a fixtures/test set (under the project's test location) that, for EVERY category and EVERY blind spot above, contains
  a **planted violation** (must be caught → non-zero exit in strict) AND a **planted valid/commented/var case** (must NOT
  be caught). Wire it as a runnable check (e.g. `npm run test:design-tokens` or into the existing test runner).
- Include the existing semantics in the harness: missing-reason marker → exit 1; stale marker → exit 1; report mode exit 0
  while strict mode exits non-zero on the same planted violation.
- This harness is the evidence the orchestrator/CI need to trust a BLOCKING gate. A hardening change without paired
  planted-violation + planted-valid tests is INCOMPLETE.

## §F — Re-validate whole-tree 0 + strict dry-run (no regression, no new masking)
- After all hardening, run `node scripts/check-design-tokens.mjs --report` → must show **0 false positives** and the same
  true-violation set as before (i.e. still **0 unsuppressed across `src/**`**).
- Run `--strict` as a **DRY-RUN** (do NOT wire it blocking — that's 407) → must exit **0** on the current clean tree.
- If hardening surfaces NEW true violations that were previously false-negatives, **STOP & ASK**: resolve them properly
  (token/suppress with reason) or escalate — **never** hide them with allowlist/blanket suppression to force a green.

## Positive flow
1. Reproduce each blind spot with a failing/false case first (paste the BEFORE behavior).
2. Implement §A (JSX comment strip), §B (inline zIndex detect + suppress), §C (negative/function/var audit + fixes).
3. Resolve §D via STOP & ASK (default: keep suppressed → no product change).
4. Add §E planted-violation + planted-valid test harness for every category/blind spot; wire a runnable script.
5. §F: `--report` = 0 false positives + whole-tree still 0; `--strict` dry-run = 0. Paste BEFORE/AFTER.
6. `node --check scripts/check-design-tokens.mjs`; `npx tsc --noEmit` (if TS touched) = 0; `npm run lint` = 0 new; NATIVE
   `check:file-integrity` on every touched file (0 NUL / no BOM — sandbox mount produces phantom NUL; native is truth).
7. Update `docs/design-system.md §23` (detector taxonomy: JSX-comment handling, inline-zIndex marker form, negative/
   function/var rules) + `docs/backlog.md` + session log (blind-spot-by-blind-spot resolution, test harness transcript,
   §D decision, §F before/after, confirmation that 407 strict flip is now safe). **No `git add`/`commit` from the
   executor** (Files-Changed table only).

## Negative flow (must be proven)
- **JSX comment:** commented arbitrary value NOT flagged; real value on a comment-bearing line STILL flagged.
- **Inline zIndex:** raw numeric flagged; marker-suppressed → clean (missing-reason → exit 1; stale → exit 1); `var(...)`/
  identifier z-index → not flagged.
- **Shadow/calc/var:** negative-offset shadow flagged; function-wrapped-with-literal flagged (per §C decision); `var(--token)`
  NOT flagged.
- **No regression:** whole-tree `--report` stays 0 (no new false positive); `--strict` dry-run = 0.
- **No masking:** any newly-found true violation is resolved/escalated via STOP & ASK, never allowlist-hidden.
- **Marker integrity:** missing-reason and stale-marker both exit 1 in the appropriate modes (existing behavior preserved).
- **Integrity:** native `check:file-integrity` green on all touched files.

## Acceptance criteria (machine-proven)
- §A/§B/§C each closed with a paired planted-violation (caught) + planted-valid/commented/var (not caught) test.
- §E harness present + runnable; covers every category + all three blind spots + marker semantics (missing-reason/stale).
- §D decision recorded (default keep-suppressed; token only if owner-approved, with inert computed `z-index`=1/2 proof +
  410 story render if tokenized).
- §F: `--report` 0 false positives AND whole-tree unsuppressed = 0; `--strict` dry-run exit 0 on the clean tree.
- `node --check` OK; `tsc=0` (if TS); `lint=0 new`; NATIVE `check:file-integrity` green.
- `docs/design-system.md §23` updated with the hardened taxonomy; `docs/backlog.md` + session log updated; Files-Changed
  table matches the real diff.
- Explicit statement that the detector is now safe to flip to strict/blocking in **Task 407** (the three blind spots are
  closed and tested).

## Pre-read (mandatory — governance/tooling bundle, per `docs/rule-index.md`)
- `docs/agent-contract.md` (1–14) · `docs/rule-index.md` · `docs/backlog.md`
- `docs/governance-enforcement.md` (governance-gate internals — read when changing a gate) · `docs/tailwind-governance.md`
- `docs/design-system.md` (§22 token registry + §23 detector taxonomy — the section you are updating) · `docs/qa-rules.md`
- `scripts/check-design-tokens.mjs` · `scripts/design-tokens-allowlist.json` · the committed Task 402 (detector birth) +
  403–406 diffs (suppression-marker patterns + the exact blind-spot occurrences referenced above)

## Out of scope
- The strict/blocking flip itself (Task 407 — flips the CI gate on the clean tree AFTER 408 lands). Any new token beyond
  the §D owner-gated decision. Re-refactoring already-tokenized values. Visual redesign. Admin render harness (Task 410).
  Broadening detector category coverage (this is precision hardening, not a scope change).

> **Sequencing.** Owner directive: **410 first, then 408.** After 408 lands (blind spots closed + tested + whole-tree
> still 0 + strict dry-run 0), the JJ critical path concludes at **Task 407** (flip to strict/blocking). 408 is the gate
> that makes 407 safe.
