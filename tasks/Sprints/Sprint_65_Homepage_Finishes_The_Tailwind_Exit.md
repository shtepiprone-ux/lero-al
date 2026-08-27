# Sprint 65 — Homepage finishes the Tailwind exit

**Opened:** 2026-08-24 · **Status:** 🟠 OPEN · **Baseline:** `main` / `origin/main` @ `7b9a13c37`
**Filed from:** the owner's Homepage → Mantine completion package (2026-08-24)

---

## 1. The problem this sprint exists for

"The Homepage is migrated" has been claimed and retracted more than once in this project. The claim keeps failing
because the word *migrated* has been used for four different, independently falsifiable properties, and evidence for
one has been offered as evidence for the others.

Measured on `7b9a13c37`, 2026-08-24 (`FACT`, census re-run at sprint open — see §7):

- Six live Tailwind utility strings still execute in the `/[locale]` production render graph, in **three** files:
  `MantineListingCardPattern.tsx` (four), `LocaleSwitcher.tsx` (one), `src/app/[locale]/layout.tsx` (one).
- Sprint 63's measurement on `201683f9d` recorded **20** references to Tailwind-owned runtime property names and
  **43** `@theme inline` references that `check:tailwind-runtime-tokens` classifies `project` and does not flag.
  Those two counts are Sprint 63 baselines carried into this sprint as **starting** numbers to re-measure, not as
  verified current state.
- `page.tsx`'s body is already a Mantine composition. That fact proves none of the four properties below, and
  treating it as proof is the specific error that produced the earlier false "complete" states.

## 2. Goal

Establish, level by level and with a control at each level, what is actually true about the Homepage's relationship
to Tailwind — and end with an honest decision about the global compiler rather than an experiment.

**Definition of Homepage readiness — four independent levels**

1. The production render graph for `/[locale]` contains no Tailwind utility strings.
2. No consumer of that graph reads a Tailwind-owned runtime property (`--text-*`, `--container-3xl`, `--radius-lg`,
   `--font-mono`).
3. No consumer of that graph reads a property that exists only through `@theme inline`.
4. The global Tailwind compiler may be retired only after an app-wide readiness audit. **Satisfying levels 1-3 is
   not authorization to delete the three `@import` lines from `src/app/globals.css`.**

**Exit criteria**

1. Levels 1, 2 and 3 are each closed by a task whose control has been shown able to fail on the same class of defect.
2. `check:tailwind-runtime-tokens` runs with an empty baseline — no allowlist row, no `design-tokens-allow:` marker,
   and no baseline entry was added to reach green.
3. Level 4 ends in a written decision: either app-wide Tailwind removal is ready, or the external route blockers are
   named. "Remove the import and see what breaks" is not an outcome this sprint accepts.
4. Route-level certification is **not** claimed by this sprint. Only a live Task 667 can issue it (§6).

## 3. Binding rules

1. **The control ships before or with the fix.** Inherited from Sprint 62 and unchanged. Every new or modified
   detector needs two actually-executed failing plants, a restored tree, and a clean re-run. A comment, a regex over
   comments, or a self-authored marker is not a control.
2. **No author-applied exemption.** No new `design-tokens-allow:` marker, no allowlist row, no baseline row may be
   added to turn a gate green. After the level-2 task the runtime-token baseline must be **empty**.
3. **Mechanism only, never restyle.** Every migration here is D28: computed styles or rendered evidence prove
   equivalence. A build that passed proves nothing about UI parity.
4. **New runtime values live in `:root`,** or are documented Mantine runtime variables. `@theme inline` may remain an
   alias layer for still-live Tailwind utilities, but it is not a source the Homepage reads from.
5. **`globals.css` is high-risk after Task 765.** A change to it is never combined in one PR with AppImage work, card
   hover work, or global Tailwind removal.
6. **No new permanent Storybook stories to satisfy a detector.** Use an existing story, or a reversible probe whose
   restoration is proven by its pre-probe `git hash-object` value and its absence from `git status --porcelain`.

## 4. Closed work this sprint may not reopen

| Work | Actual state | Boundary this sprint enforces |
|---|---|---|
| 757 / 757R — `AuthSheet` | ✅ `APPROVED WITH NOTES` 2026-08-21 | Not touched, except for an explicitly new defect. |
| 763 — `AppImage` | ✅ `APPROVED WITH NOTES` 2026-08-22 | `AppImage.tsx` and `appImageConfig.ts` stay byte-unmodified. D65-D permits Task 768's sole `AppImage.module.css` exception — `.imageLayer` `inset: var(--space-0)` → `inset: 0` — then the freeze resumes; no other AppImage declaration is in scope. |
| 764 — listing hover / trigger area | ✅ `APPROVED` 2026-08-24, in `main` (`3bf769858`, `d652faad9`) | `listing` hover, `.cardGrid` scale and the `imageActions` slot are not re-derived. |
| 765 — motion/radius runtime tokens | ✅ `APPROVED WITH NOTES` 2026-08-24, in `main` (`7b9a13c37`) | Its `:root` tokens are consumed, never rewritten; its P3″ control is not re-litigated. |

`PerfDevOverlay.tsx` is deliberately **not** in this sprint. It returns `null` outside development. Whether a
dev-only overlay belongs to the production exit criterion is an **open owner decision** (D65-A, §5). Until it is
decided, no task in this sprint may quietly add it to scope.

## 5. Owner decisions

| ID | State | Decision |
|---|---|---|
| **D65-A** | ⚠️ **PENDING** | Does `PerfDevOverlay.tsx` (dev-only, returns `null` in production) belong to the Homepage production exit criterion? Until decided, it is out of scope for every task here. |
| **D65-B** | ✅ **DECIDED 2026-08-24** | The 766-769 package is filed as Sprint 65, not as an extension of Sprint 63. Sprint 63's goal (`763`/`764`) is closed; a task is assigned by goal fit, not by adjacent number. Supersedes the draft header of the Task 766 kickoff, which read "Sprint 63". |
| **D65-C** | ✅ **DECIDED 2026-08-24** | Task 667 is not duplicated by a file in this sprint. Either the owner re-scopes/unblocks 667, or Sprint 59 closes with it. Route-level certification stays with 667. |
| **D65-D** | ✅ **CLOSED 2026-08-26** | Permit Task 768's one narrow AppImage change: replace `.imageLayer` `inset: var(--space-0)` with `inset: 0`. The computed 0px value is preserved; motion, radius, variants, loading, markup and every other declaration remain frozen. No later task may cite this decision to touch a second AppImage line. |
| **D65-E** | ✅ **DECIDED 2026-08-26** | One-task exception to rule 1 for Task 768 only: it adds no permanent detector. It must retain fail-closed pre/post comparator evidence; durable expected-zero AppImage control transfers to Task 770's fixed-manifest ownership gate. |
| **D65-F** | ✅ **DECIDED 2026-08-26** | Task 769's Mantine-theme ownership exception is applied **globally in `classifyName`**, not only to the TSX arm: `theme.ts` is the source of the key's ownership, not a peculiarity of TSX syntax, and the same `--button-padding-x` must not be `external` in TSX and Tailwind debt in a CSS Module. Its source set is the **nine** non-`--mantine-` literal custom-property keys declared in `theme.ts`'s Mantine `vars` **and** `styles` objects, AST-extracted — not arbitrary strings or comments. `--mantine-color-default-border` is excluded; the existing prefix rule covers it. `--verify-gate` must carry a separate module-CSS plant for this rule. This supersedes the interim "only 7 keys from `vars` callbacks" wording recorded in the same decision. |

## 6. Tasks

| # | State | What |
|---|---|---|
| **766** | ✅ **APPROVED WITH NOTES 2026-08-25**, merged to `main` @ `792588a3f` | **Level 1 — last production Tailwind utility strings.** Six live occurrences in three files → zero with no visual change; the bounded AST control is `check:homepage-literal-utilities`. |
| 767 | ✅ **APPROVED WITH NOTES 2026-08-26**, merged to `main` @ `39dafa795` | **Level 2 — runtime-token exit.** 20 pairs/26 refs → 0/0; the scanner now sees its TSX inputs and holds an empty baseline. |
| 768 | ✅ **APPROVED WITH NOTES 2026-08-26**, merged to `main` @ `6b43b9676` | **D65-D AppImage spacing closure.** The one permitted `AppImage.module.css` read moved from `var(--space-0)` to native `0`; Level-3 census is now 42 pairs / 79 uses. Ledger: `docs/reviews/2026-08-26-task768-appimage-d65d-spacing-closure.review-ledger.json`. |
| **769** | ✅ **APPROVED WITH NOTES 2026-08-26**, merged to `main` @ `06091ba1d` — 11/11 VERIFIED, 0 open P0/P1/P2, 6 P3 notes | **Task-767 scanner hardening.** Missing configured TSX inputs are fatal in every mode, and the nine AST-extracted `theme.ts` `vars`/`styles` keys classify `external` globally, per **D65-F**. `--verify-gate` 4 → 10 asserted outcomes, all passing; the shipped scan's output is byte-identical. Kickoff: `tasks/Sprints/Sprint_65_kickoff_prompt_Task_769_Runtime_Token_Scanner_Hardening.md`; ledger: `docs/reviews/2026-08-26-task769-runtime-token-scanner-hardening.review-ledger.json`. |
| **770** | ✅ **APPROVED WITH NOTES 2026-08-27** | **Level 3 — `@theme inline` runtime exit.** The fixed 42-pair / 79-use twelve-file manifest migrated to nineteen `--homepage-runtime-*` `:root` tokens of identical value. `check:homepage-theme-runtime-deps` supplies the thirteen-input ownership control, D65-E expected-zero AppImage arm and six passing `--verify-gate` outcomes. The retained 244-cell comparison has no verdict changes; the final ledger has six verified requirements and no findings. `@theme inline` stays byte-identical; eighteen non-manifest references still depend on it. Ledger: `docs/reviews/2026-08-27-task770-homepage-theme-inline-runtime-exit.review-ledger.json`. |
| **771** | 📋 **KICKOFF FILED 2026-08-27** | **Level 4 — global Tailwind retirement readiness.** Read-only `Q0` decision record, no deletion and no detector: verdict `NOT_READY` against five separately measured blocker classes — **B1** build wiring (3 `@import` + 3 `@source` + `@custom-variant` + the sole PostCSS plugin), **B2** the ten live `@apply` rules, **B3** the 185 `@theme inline`-only names none of which `:root` shadows, with 8 files / 18 pairs / 27 uses still reading them, **B4** the 152-file / 2350-occurrence literal-`className` surface (census, explicitly not a certification), **B5** Task 667. Corrects the candidate brief, whose rule made the verdict a function of 667 alone. Kickoff: `tasks/Sprints/Sprint_65_kickoff_prompt_Task_771_Global_Tailwind_Retirement_Readiness_Decision.md`. |
| 667 | reserved / BLOCKED in **Sprint 59** | Route-level inventory and certification. Referenced here, owned there. See D65-C. |

**Numbers 769-771 are not reserved by this sprint.** Before each is filed, its owner re-reads the registry in
`docs/backlog.md` and takes the then-next free number. Tasks 766-768 are registered.

**Sequencing.** 766 → 767 → 768 → 769 → 770 → 771, strictly. Each step's output is the next step's precondition;
Task 768 is the isolated AppImage exception, Task 769 hardens the scanner before Task 770 widens Level-3 scope, and
Task 771 is read-only decision work after the migration evidence is complete.

## 7. Preconditions verified at sprint open

Re-run on `7b9a13c37`, 2026-08-24, read-only, from the project root (`FACT`):

- `git --no-optional-locks status --short --branch` → `## main...origin/main`, one untracked path (`Codex-tasks/`),
  unrelated to this sprint.
- `git --no-optional-locks log -1 --oneline` → `7b9a13c37 feat(Task765): runtime motion/radius tokens in :root, AppImage.module.css migrated, P3-double-prime control`.
- Utility census over the three named files → exactly **6** live source occurrences (4 + 1 + 1), matching the
  package's stated baseline.
- `docs/backlog.md` registry → last used **765**, next free **766** at sprint open.

## 8. What this sprint does not authorize

It does not authorize removing `@import "tailwindcss"`, `@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`,
`@custom-variant`, `@source`, or the ten `@apply` rules in `src/app/globals.css`. That is a separate app-wide release
operation, after Task 769.

It does not replace the owner decision on Task 667, does not make any other route Mantine-first, and does not certify
the `/[locale]` render graph.

## 9. Goal-fit test against the open sprints

| Open sprint | Its goal | Why this package does not belong there |
|---|---|---|
| 46 — ListingCard de-Tailwind + overlay exit | Retained follow-ups 743/744/745 | Its delivery rows are archived; this package is a route-scoped exit, not a card follow-up. |
| 55 — ARIA semantics no gate sees | 730/731 accessibility semantics | No ARIA scope here. |
| 56 — Raw enum leaks | Enum leak + blind detector | Unrelated detector and defect class. |
| 57 — Delete what no longer earns its place | Proven-inert removal (676/682) | 766-768 are migrations, not removals; 769 explicitly refuses a removal-first framing. |
| 59 — Route-level inventory | 667 route inventory | This package must **not** claim route certification; folding it in would blur exactly that boundary (D65-C). |
| 61 — The projection layer no gate reads | 747, document-state gates | Reads documents, not code or rendered output. |
| 62 — Tailwind runtime tokens outlive Tailwind | 762's gate | Its written out-of-scope boundary excludes consumer migration; 762 built the gate, this sprint consumes it. |
| 63 — Homepage exits Tailwind | 763/764, both approved | Its scoped work is complete and pushed. Reopening it to hold four new tasks would re-open a closed sprint's boundary. |
| 64 — Runtime design tokens that survive Tailwind removal | 765's `:root` tokens | 765 is approved and in `main`; this package **consumes** those tokens and is barred from rewriting them. |

None fits. Sprint 65 is opened per the `create-task` sprint-assignment rule.
