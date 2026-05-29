# Session Log — Task 290 (Opus 4.7 orchestration): Project-wide no-ellipsis UX audit kickoff

**Date:** 2026-05-29
**Task:** 290 (UX / i18n / responsive audit planning)
**Sprint:** 17
**Role:** Opus 4.7 — orchestrator / architect / reviewer (no production code written; read-only grounding + kickoff authoring)
**Trigger:** Owner report + screenshot — listing owner contact card truncates the Ukrainian phrase to `"Дані власника наразі недосту…"`. Owner requires a project-wide audit, not a single-component fix.

---

## Task number selection

Highest filed task number = 289 (`Sprint_17_kickoff_prompt_Task_289.md`). **Next free global number = 290.**

---

## Grounding investigation (so the kickoff cites real files, not assumptions)

### Root cause of the known symptom
`messages/uk.json:135` → `listing.owner_name_unavailable = "Дані власника наразі недоступні."`
(parity present in `sq`/`en`/`it` at the same key). Rendered in
`src/modules/listings/components/ListingContact.tsx`:
- **line ~125:** `<p className="font-semibold text-sm truncate">` — wraps the owner name OR the
  `owner_name_unavailable` sentence (avatar header block).
- **line ~292:** `<p className="text-xs text-muted-foreground truncate">` — second render of the same
  fallback in the compact block.

Tailwind `truncate` = `overflow:hidden; text-overflow:ellipsis; white-space:nowrap`, so any localized
phrase wider than its container is cut. Because `sq`/`en`/`uk`/`it` differ in length, a width tuned for
English silently cuts Ukrainian/Italian. → **group-1 (must fix, must wrap).**

### Audit size (orchestrator pre-scan, `grep -RInE … src`)
| Pattern | Hits |
|---|---|
| `truncate` | ~51 |
| `line-clamp` | ~15 |
| `whitespace-nowrap` | ~10 |
| `overflow-hidden` | ~75 (many group-3 false positives — gallery/rounded clips) |
| `text-ellipsis`/`text-overflow`/`ellipsis` | ~7 |
| CSS `clamp(` | ~15 (mostly group-3 — fluid font-sizing) |
| **Total matched lines** | **~157** |

Files containing `truncate` are spread across: `src/components/admin` (11), `src/modules/listings/components`
(5), `src/components/shared` (3), `src/modules/cabinet/components` (2), plus `src/components/ui`,
`src/components/layout`, `src/modules/locations/components`, `src/app/admin`, `src/app/[locale]/listings/[slug]`,
`src/stories`. → Confirms a **genuine project-wide scope**, not a one-file fix.

### Repo layout correction
The owner's draft grep targeted top-level `app,src,components,modules,lib`. In `lero-al` everything is
nested under `src/` (`src/app`, `src/components`, `src/modules`, `src/lib`). The kickoff corrects both
the PowerShell and Git-Bash commands to scan `src` only, preserving the owner's full pattern set.

---

## Decisions baked into the kickoff

- **Classification model (owner's):** group 1 = user-facing text → must wrap; group 2 = technical/data
  value → truncation allowed ONLY with accessible full text; group 3 = false positive (layout clip /
  fluid font `clamp()`).
- **Accessibility guardrails:** hover-only reveal is NOT acceptable; `aria-label`/`title` alone is NOT
  acceptable for normal labels/headings/descriptions — visible wrapping required.
- **Design-system rule:** fix the shared primitive once, not each call-site; no new duplicate local
  primitives; no new visual style — only allow wrapping.
- **Mandatory audit matrix** in the session log (file · component · pattern · classification · action ·
  reason-if-retained · localization risk · responsive risk). Acceptance fails without it.
- **Site and admin verified separately**; `sq`/`en`/`uk`/`it`; 7 breakpoints (320/375/390 emphasized).
- Aligned to canonical contract: clauses 1–10 + 6a (positive + every negative flow), Notes 18/19/20.
- **Git discipline (Task 264):** Sonnet provides a Files Changed table and does NOT emit/run git; the
  orchestrator emits commit commands during diff review.

---

## Files changed by Opus (this orchestration task)

| File | Change | Rationale |
|---|---|---|
| `tasks/Sprints/Sprint_17_kickoff_prompt_Task_290.md` | NEW | Full project-wide no-ellipsis audit kickoff (audit commands, classification, fix rules, audit matrix, AC, fail conditions, validation). |
| `docs/backlog.md` | Added Task 290 archive row | Task tracking + traceability. |
| `docs/sessions/2026-05-29-task-290-opus-orchestration-no-ellipsis-audit.md` | NEW | This session log. |

No production code modified by Opus (orchestrator role).

---

## Ready-to-run git commands for the owner (run ONLY in PowerShell)

> Explicit paths only — never `git add -A`/`-u`/wildcards. If `git status` shows phantom mods first run:
> `Remove-Item .git\index -ErrorAction SilentlyContinue; git reset`

```
git add tasks/Sprints/Sprint_17_kickoff_prompt_Task_290.md docs/backlog.md "docs/sessions/2026-05-29-task-290-opus-orchestration-no-ellipsis-audit.md"
git commit -m "docs(Task290): project-wide no-ellipsis UX audit kickoff (wrap localized UI text instead of truncating)"
```
