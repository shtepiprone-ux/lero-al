# Task 426 kickoff — Add a "canonical-first / no-duplicate-class" AC clause to the Canonical Task Template

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–14) FIRST.** Conforms to the
> current P0 contract. This is a **docs-only / governance task** — NO product code, NO UI, NO locale files, NO scripts.
> **The orchestrator (Opus) emits all `git add`/`git commit` commands at review; you NEVER run git.**

> **Origin:** Task 425 review (2026-06-14). The Task 425 kickoff AC demanded a *literal local class diff*
> (`max-sm:w-full max-sm:min-h-11`) inside `StatusChangeControl.tsx`, but the behavior was already inherited from the
> canonical `<Button size="sm">` (Task 421, `button.tsx:26`). Sonnet correctly proved this and did NOT duplicate the
> classes (duplicating would diverge the consumer from the canonical single-source and risk the desktop `h-7` look).
> The AC was over-strict: it had no "canonical-first" escape hatch, creating a contract conflict. This task codifies the
> escape hatch so future kickoffs cannot reproduce the conflict.

```
Type:        docs (governance — Canonical Task Template clause)
Priority:    low (process hardening; no runtime behavior change)
Area:        docs/ai-behavior.md   → "Canonical Task Template" (PRIMARY: add the clause)
             docs/orchestrator-role.md → "Review checklist" (add ONE cross-ref checkbox)
Output:      Canonical Task Template gains a "Canonical-first / no-duplicate-class" AC rule; the orchestrator
             review checklist gains a matching one-line verification item. No other files touched.
```

## 1. Scope (exactly two files — nothing else)

1. **`docs/ai-behavior.md` → "Canonical Task Template"** — add a new clause/bullet named **"Canonical-first / no-duplicate-class AC"** with this normative content (wording may be lightly adapted to match surrounding style, meaning preserved):

   > **Canonical-first / no-duplicate-class.** For any control rendered by a canonical primitive (`Button`, `Combobox`,
   > `Input`, `Select`, `Dialog`, `Sheet`, `Popover`, …), acceptance criteria are *canonical-first*: a task adds a local
   > responsive/utility class ONLY if the required behavior is **not already inherited** from the canonical primitive. If
   > the primitive already provides the behavior, the deliverable is **canonical-source proof** (primitive `file:line`)
   > **+ rendered evidence** — duplicating the class locally is a **rejection, not a pass** (it diverges the consumer from
   > the canonical single-source per Note 14 and can regress the primitive's other size/state variants). Kickoffs MUST
   > phrase such ACs conditionally, e.g.: *"add `max-sm:w-full max-sm:min-h-11` locally **only if not already inherited**
   > from canonical `Button`; otherwise provide canonical-source proof + rendered evidence and **do not duplicate** the
   > classes."* A flat "the class must appear in the local diff" AC, where a canonical primitive already satisfies it, is
   > a kickoff defect.

2. **`docs/orchestrator-role.md` → "Review checklist"** — add ONE checkbox item, consistent with the existing list style:

   > - [ ] **Canonical-first respected (Task 426):** where a canonical primitive already provides the required behavior,
   >   the diff does NOT duplicate the class locally; closure is canonical-source proof (`file:line`) + rendered evidence.
   >   A duplicated class that diverges a consumer from the canonical single-source = route back.

**Out of scope (do NOT touch):** `agent-contract.md` clauses (no renumbering), any `src/`/`app/`/`components/`/`scripts/`
file, locale `messages/*.json`, the design-system docs, the rule-index. This is a two-file docs change only.

## 2. Positive flow (happy path)

Actor: a future orchestrator writing a kickoff for a control rendered by a canonical primitive.
1. Orchestrator reads the Canonical Task Template before writing the kickoff.
2. The new clause is present → the orchestrator phrases the responsive AC conditionally ("only if not inherited …").
3. Sonnet executes: if inherited, it ships canonical-source proof + rendered evidence with ZERO local class duplication and is approved; if not inherited, it adds the local class.
4. At review, the new checklist item is verified → no duplicate-class divergence is approved.

## 3. Negative flow (every off-happy-path branch)

- **Wording drift:** the executor must NOT weaken the rule to "may duplicate if convenient" — the rule is "duplicating where canonical already covers = rejection." If the surrounding template style forces a rephrase, preserve that exact meaning; if genuinely ambiguous, STOP and ASK the orchestrator rather than soften it.
- **Scope creep:** if the executor is tempted to also edit `agent-contract.md` or add a new ESLint/gate, STOP — this task is docs-only, two files. Renumbering `agent-contract.md` clauses is forbidden here.
- **Cross-ref mismatch:** the `orchestrator-role.md` checkbox must reference the same rule name ("Canonical-first") as the `ai-behavior.md` clause; no divergent naming.
- **No locale/UI/breakpoint impact:** this task touches no user-facing string and no rendered surface, so no i18n/responsive matrix applies — state this explicitly in the session log instead of pasting an empty matrix.

## 4. Pre-read (rule-index: docs-only / governance / task-template)

- `docs/agent-contract.md` (always)
- `docs/orchestrator-role.md`
- `docs/backlog.md` (always)
- Only if relevant: `docs/ai-behavior.md` (the file being edited — read the "Canonical Task Template" + "Note 14 global-change" sections in full before editing).

## 5. Acceptance criteria

1. `docs/ai-behavior.md` "Canonical Task Template" contains the new **"Canonical-first / no-duplicate-class"** clause with the normative meaning above (canonical-first; duplicate-where-inherited = rejection; conditional AC phrasing example). — verifiable at `docs/ai-behavior.md:<line>`.
2. `docs/orchestrator-role.md` "Review checklist" contains the matching one-line checkbox referencing the same rule name. — verifiable at `docs/orchestrator-role.md:<line>`.
3. No other file changed (diff = exactly these two docs). No `agent-contract.md` clause renumber. No `src/`/`scripts/`/`messages/` change.
4. File-integrity green on both touched files (0 NUL, parses/renders as markdown, not truncated mid-token).
5. `docs/backlog.md` + a `docs/sessions/` log added with a **Files Changed** table (one row per touched path + rationale). Session log states explicitly "no i18n / no responsive surface — N/A" with reasoning (not an empty matrix). Executor does NOT emit `git add`/`git commit`.

## 6. Self-validation (before claiming complete)

Read both edited files back in full; confirm the clause + checkbox read correctly and the cross-ref names match; confirm the diff is exactly two files; paste an AC-by-AC self-audit table + the "Self-validation: …" verdict line into the session log. Note: `tsc`/`build`/`screenshots:assert` are **N/A** for a pure-docs change — say so explicitly rather than claiming a green run that wasn't relevant.

## 7. Commit hand-off

Add a "Files Changed" table to the session log. Do NOT run git. The orchestrator reviews the real diff against the table and emits explicit-path `git add`/`git commit` at review (single-writer rule).
