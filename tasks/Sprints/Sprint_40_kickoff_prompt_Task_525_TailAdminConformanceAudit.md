# Task 525 — TailAdmin conformance AUDIT of ALL Storybook Mantine primitives (Sprint 40 Slice 0)

> **Program:** `tasks/Sprints/Sprint_40_TailAdmin_Conformance_AllPrimitives.md` → Slice 0.
> **Executor:** Sonnet 4.6. **Orchestrator:** Opus (reviews the audit doc + a sample of the rendered side-by-sides).
> **Type:** AUDIT / governance — **NO primitive code changes.** Output is a rendered comparison + a delta table that
> drives the correction slices. This is the owner's demanded "повне рев'ю стилів з demo_tailadmin_com.zip".

## Why this task
The owner has repeatedly rejected UI that does not visually match TailAdmin and is not confident the earlier per-primitive
styling (Tasks 486–523) actually renders like the reference. Primitives were themed but **never verified side-by-side
against `demo_tailadmin_com.zip`.** Before we "fix everything," we must know precisely WHAT is off. This task produces that
evidence: for every Storybook → Mantine → Primitives component, the rendered Mantine primitive next to the TailAdmin
reference, with a concrete PASS / DELTA verdict per style dimension. **Do not restyle anything in this task** — only audit.

## Pre-read (agent-contract clause 16 + UI)
**Always:** `docs/agent-contract.md` (clause 16 = TailAdmin mandatory; clause 12 = rendered evidence), `docs/backlog.md`,
`docs/critical-flow-registry.md` (SCAN — audit only, no product/flow touched → no registry row; confirm in log).
**Required:** `docs/tailadmin-style-reference.md` (the full extraction — §1–§6x), `docs/mantine-responsive-design-system.md`
(§16 acceptance gates, §18 CSS pitfalls), `docs/orchestrator-role.md` → "TailAdmin conformance gate",
`docs/mantine-tailadmin-migration-tracker.md`, `docs/storybook-governance.md`, `docs/qa-rules.md`.
**Source of truth to inspect:** `demo_tailadmin_com.zip` (repo root) — unzip locally; read `css/style.css` (tokens) and the
component class markup in `index.html` / `html/*.html`. The Mantine theme lives in the project theme file(s) under
`src/design-system/mantine/` (locate via grep for `createTheme`/`components:`); the primitive stories are under
`src/stories/mantine/primitives/*.stories.tsx`.

## Scope (exactly this — no more)
1. **Enumerate** every primitive in Storybook → Mantine → Primitives (20 today): Avatar · Badge · Button · Card · Checkbox ·
   Drawer · DropdownMenu · Label · Modal · NavigationMenu · PasswordInput · Popover · Radio · SegmentedControl · Select ·
   Switch · Table · Tabs · TextInput · Textarea. (Tooltip is added once Task 524 lands — note it, do not block on it.)
2. **For EACH primitive, render its Storybook story and compare it to the TailAdmin reference** for that component (the
   matching component in the zip's HTML, rendered/inspected). Capture a **side-by-side**: the TailAdmin reference (screenshot
   or the exact class markup + the compiled visual) next to the rendered Mantine primitive. Breakpoints for controls that
   change with width: at least 375 + one ≥640; **uk** locale mandatory (Outfit + Cyrillic), plus one non-Latin stress.
3. **Score each primitive across these style dimensions** (each = PASS or DELTA with the specific mismatch + the correct
   value cited to a `tailadmin-style-reference.md` §-row or a `css/style.css`/HTML line):
   - border **color** + width (resting) — e.g. `border-gray-300 #d0d5dd`
   - **radius** — e.g. `rounded-lg .5rem`
   - **background** (resting/hover/checked/selected)
   - **focus** treatment — `focus:border-brand-300` + `focus:ring-brand-500/10 focus:ring-3` (the ring is the most-missed)
   - **shadow** — `shadow-theme-xs` on controls / flat on cards / `shadow-theme-lg` on overlays
   - **typography** — Outfit family, `text-sm`/`text-theme-sm` 14px, `font-medium` 500, label color `gray-700`
   - **density / size** — `h-11` / 44px min-height, `px-4 py-2.5`
   - **color values** — semantic success/error/warning, brand `#EC5447`, gray ramp (flag any raw/invented hex or px)
   - **states** — resting / hover / focus / **disabled (field + label + icon together)** / error / checked-selected
4. **Produce the audit deliverable** `docs/sessions/2026-07-02-task525-tailadmin-conformance-audit.md` containing:
   - a **per-primitive table** (rows = primitives, columns = the dimensions above) with PASS/DELTA per cell;
   - for every DELTA: the current rendered value, the correct TailAdmin value, and the §-row (or zip line) it comes from;
   - the **attached rendered side-by-sides** (or their capture paths) — uk mandatory;
   - a **priority-ordered correction list**: which primitives need a correction slice and what each must change;
   - a note of any primitive whose TailAdmin chrome is **not yet an authoritative row** in `tailadmin-style-reference.md`
     (so the correction slice will extract it first).
5. **Update** `docs/mantine-tailadmin-migration-tracker.md` with an "Audit status" column/section reflecting PASS vs
   NEEDS-CORRECTION per primitive, and `docs/backlog.md` Last Session. Add the Files Changed table.

**OUT OF SCOPE:** ANY change to a primitive's `.tsx`, the Mantine theme, or `*.stories.tsx` styling (this is audit-only —
the corrections are separate slices opened from your findings); product surfaces; dark mode; behavior/API.

## 🛑 STOP-and-ASK triggers
- If a TailAdmin component has no clear single reference in the zip (ambiguous which variant is canonical) → **STOP and ASK**
  rather than guessing which to audit against.
- If the project intentionally diverges from TailAdmin somewhere (beyond the known brand `#EC5447` override) and you cannot
  tell whether a difference is a bug or an intentional decision → **flag it in the audit as "OWNER DECISION" — do not score it
  PASS/DELTA silently.**
- Dark mode: the zip has `dark:` classes but the project renders light — **do NOT audit dark; note it as owner-decision.**

## Acceptance criteria
1. All 20 primitives enumerated and audited; none skipped. *(Scope 1–3)*
2. Per-primitive × per-dimension PASS/DELTA table present, every DELTA with current value → correct TailAdmin value → cited
   §-row / zip line. *(Scope 3–4)*
3. Rendered **side-by-side** evidence attached (Mantine primitive vs TailAdmin reference), uk mandatory, ≥1 ≥640 cell.
   **A table of self-reported verdicts without the rendered side-by-sides = INCOMPLETE.** *(clause 12/16)*
4. Priority-ordered correction list produced; primitives needing a new §6x extraction flagged. *(Scope 4)*
5. Tracker "Audit status" + backlog updated; audit doc at the named path with a Files Changed table. *(Scope 5)*
6. NO primitive/theme/story styling changed (audit-only) — diff touches only docs. *(scope discipline)*
7. Gates green on the docs change: `check:mojibake`, file-integrity clean; `tsc`/`check:stories`/`check:i18n` unaffected.

## Self-validation & hand-off (hard contract)
Confirm the diff touches ONLY docs (no `src/` styling). Paste an AC-by-AC self-audit; attach the rendered side-by-sides (uk
mandatory). Update `docs/backlog.md` Last Session + the tracker Audit status; add the Files Changed table to
`docs/sessions/2026-07-02-task525-tailadmin-conformance-audit.md`. **Emit NO `git add`/`git commit`** — the orchestrator emits
commits after review. Do NOT start until you have unzipped `demo_tailadmin_com.zip` and confirmed you can render both the
TailAdmin reference and the Storybook primitives for a true side-by-side (else STOP-and-ASK).
