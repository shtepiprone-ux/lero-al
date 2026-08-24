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
| 763 — `AppImage` | ✅ `APPROVED WITH NOTES` 2026-08-22 | `AppImage.tsx`, `appImageConfig.ts` and `AppImage.module.css` stay byte-unmodified in 766-768 — **subject to D65-D**, which must decide before 768 whether that file's one `var(--space-0)` reference is carved out or excluded from the level-3 claim. Task 766 is unaffected. |
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
| **D65-D** | ⚠️ **PENDING — must be resolved before Task 768 is filed** | §4 freezes `AppImage.module.css` for 766-768, but that file **is** a level-3 consumer: `src/components/ui/AppImage.module.css:142` declares `inset: var(--space-0)`, and its own header at `:34` documents `--space-0` as living in `@theme inline` at `globals.css:128`. The freeze and the level-3 exit claim cannot both stand. Resolve one way or the other: either grant Task 768 a **narrow** carve-out for exactly that one spacing reference (Task 763's motion/radius work stays untouched), or exclude `AppImage.module.css` from the level-3 exit claim and say so in level 3's definition. Does **not** affect Task 766, whose §8 excludes the file outright. |

## 6. Tasks

| # | State | What |
|---|---|---|
| **766** | 📝 **FILED 2026-08-24 — ready for executor** | **Level 1 — remove the last production Tailwind utility strings.** Six live occurrences in three files → zero, no visual change, plus a narrow AST-based `check:homepage-literal-utilities` guard over exactly those three files. Kickoff: `Sprint_65_kickoff_prompt_Task_766_Homepage_Literal_Utility_Exit.md` |
| 767 | candidate — **not filed** | **Level 2 — runtime-token exit.** `check:tailwind-runtime-tokens` must see TS/TSX and hold an empty baseline; the Class-2 references inside route scope must be gone. Re-measure the Sprint 63 count of 20 before filing. |
| 768 | candidate — **not filed**, blocked on **D65-D** | **Level 3 — `@theme inline` runtime exit.** Each Class-3 `(file, token)` pair inside route scope gets an exact `:root` replacement, proven by a new gate. Re-measure the Sprint 63 counts (43 unique pairs / 80 occurrences) before filing, and resolve D65-D first — one of those pairs lives in the `AppImage.module.css` this sprint otherwise freezes. |
| 769 | candidate — **not filed** | **Level 4 — global Tailwind retirement readiness.** Produces a decision, not a deletion. |
| 667 | reserved / BLOCKED in **Sprint 59** | Route-level inventory and certification. Referenced here, owned there. See D65-C. |

**Numbers 767-769 are not reserved by this sprint.** Before each is filed, its owner re-reads the registry in
`docs/backlog.md` and takes the then-next free number. Only 766 is registered.

**Sequencing.** 766 → 767 → 768 → 769, strictly. Each step's output is the next step's precondition, and running two
of them concurrently would put both inside `globals.css` and the same three source files at once — the collision
rule 5 exists to prevent.

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
