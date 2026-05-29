# Sprint 18 — Task 297 kickoff (text-[11px] mono-ID reconciliation — canonical token vs. allowlist)

> **Mandatory rules:** `docs/agent-contract.md` clauses 1, 2, 6a, 9, 10 (Task 264 commit hand-off).

> **Shared hard contract:** You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` FIRST. This is a **UI/typography governance** task — pre-read `ui-rules.md` §2 (canonical type scale), `tailwind-governance.md`, `tailwind-canonical-fragments.md`, `component-rules.md`, `qa-rules.md`. No scope change; STOP & ASK if ambiguous.

---

```
Type:        decision + narrow refactor (canonical token choice for 11px mono ID)
Priority:    LOW (small, but closes the only allowlist-down ambiguity from Task 283 review)
Area:        type scale — mono ID sub-caption (text-[11px])
```

## Why this task exists (2026-05-29 orchestrator review of Task 283)

Task 283 added two `text-[11px]` allowlist entries that the orchestrator review flagged as "could be canonical":

1. `src/components/admin/AdminUsersTable.tsx` — `text-[11px]` on admin row's Public ID mono sub-caption (`#12345`).
2. `src/modules/cabinet/components/ProfileTab.tsx` — `text-[11px]` on cabinet profile's Public ID mono sub-caption (`#{public_id}`).

Sonnet's allowlist justification (both): *"11px mono ID — between text-xs (12px) and text-[10px], no canonical equivalent. Intentional density for compact identity line."*

The kickoff for Task 283 said: *"map each `text-[Npx]` to the canonical type scale ... For any value with NO canonical equivalent ... add an allowlist entry ... rather than forcing a wrong token"*. `text-xs` (12px) IS a canonical equivalent, 1px above `text-[11px]`. Whether forcing it to `text-xs` is "wrong" (cramps the identity line) or "right" (canonical wins, 1px is invisible at body-text density) is a **visual decision**.

This task makes that decision and lands the outcome. **Two valid endings:**

- **Outcome A — Canonical wins:** replace `text-[11px]` with `text-xs` (12px) at both sites. Remove the two allowlist entries. Net allowlist shrinks by 2.
- **Outcome B — Density wins:** keep `text-[11px]`. Add a SINGLE new canonical fragment to `docs/tailwind-canonical-fragments.md` named e.g. `text-mono-id` (or stylistically a CSS custom-prop-backed utility) documenting that 11px is the canonical mono-ID size project-wide. Replace the two allowlist entries with a class that names the intent (e.g. add `.text-mono-id` in globals.css → 11px monospace, or document the bare `text-[11px]` with the new canonical-fragment reference).

**STOP & ASK before committing to A or B.** The decision needs a visual side-by-side at the two sites in `uk` at 320 / 768 / 1440 — paste screenshots OR a narrative comparison in your question to the orchestrator.

## Investigation required (PASTE in session log BEFORE deciding)

```
sed -n '<the line ranges around the text-[11px] usage>' src/components/admin/AdminUsersTable.tsx
sed -n '<the line ranges around the text-[11px] usage>' src/modules/cabinet/components/ProfileTab.tsx
# Render the page in dev mode at uk, 320px:
# - /uk/admin/users  (Public ID column)
# - /uk/cabinet      (profile identity card with #public_id)
# Paste a narrative description: how the ID line looks at text-[11px] vs how text-xs would look.
# If you have screenshot tooling, attach two side-by-side images per site.
grep -rn 'text-\[11px\]' src/ 2>&1
# Confirm exactly these two sites are the only consumers. If a third surfaces, expand the decision to cover it.
grep -rn 'mono\|monospace\|font-mono' src/components/admin/AdminUsersTable.tsx src/modules/cabinet/components/ProfileTab.tsx
# Verify both sites currently use a mono font on the ID — that's part of why 11px reads OK.
cat docs/ui-rules.md | sed -n '<§2 type-scale lines>'
# Confirm the canonical type scale and whether 11px exists. Currently: text-xs=12px, text-sm=14px; no text-[11px] canonical.
```

## Decision rubric

Use this rubric in your STOP & ASK to the orchestrator (do not pre-decide):

| Question | If YES → Outcome A | If NO → Outcome B |
|----------|-------------------|-------------------|
| At 320px `uk`, does `text-xs` (12px) on the ID line cause visible wrap / overflow into the next row? | (no risk — push to canonical) | (density matters — keep 11px, name it) |
| Is the ID line adjacent to other `text-xs` content (e.g. user role, status pill)? | (matching size = canonical) | (intentional contrast — keep 11px) |
| Does any other surface in the codebase render a mono ID at `text-xs`? | (consistency — push to canonical at the two outliers) | (project-wide pattern is 11px — codify it) |
| Is the ID line load-bearing for identity disambiguation (admin row, profile header)? | (canonical is fine) | (compact density matters more) |

## Goal

After orchestrator approval of A or B:

**If A:** edit both files (one className change per file), delete the two allowlist entries, verify entropy report MEDIUM count is unchanged (these are LOW, but the LOW count drops by 2), governance gate stays `C0/H0/M0`.

**If B:** add a canonical fragment to `docs/tailwind-canonical-fragments.md` — name it (suggested `mono-id-density`), describe the use case, list the two consumers, keep `text-[11px]` in the className at both sites but with an `// canonical: mono-id-density` comment above each. Update the two allowlist entries' `reason` to cite the new canonical fragment name. Net allowlist size stays at +2 but is now linked to a project-wide documented convention rather than ad-hoc per-file justification.

## Current behavior to preserve

- Both ID sub-captions remain mono-font, monospaced-numerals, sub-caption role.
- Both sites remain unchanged in everything except the chosen font-size class.
- No padding/margin change, no color change, no layout change.

## Out of scope (do NOT touch)

- Anything beyond the two `text-[11px]` sites and (Outcome B only) `docs/tailwind-canonical-fragments.md` + the two allowlist entries.
- Task 283's other 8 new font-size entries — they ship as legitimate badge/micro-label exceptions.
- Task 295's lint baseline files. Task 296's MEDIUM/LOW audit files.
- Adding any new locale key (no copy change).
- Changing the mono font itself (Geist Mono / current stack is fine).

## Acceptance criteria (literal)

- The orchestrator has approved either Outcome A or Outcome B (via your STOP & ASK response).
- The chosen outcome is implemented exactly as approved.
- `npm run governance:tailwind` → still `C0/H0/M0` (no regression).
- `tailwind-entropy.mjs --report` AFTER → LOW count drops by exactly 2 (Outcome A) OR unchanged (Outcome B) vs Task-283 post-state.
- `npx tsc --noEmit` → 0. `npm run build` → passes. `npm run lint` → unchanged baseline.
- At 320px `uk`, both ID lines render without overflow / wrap (mandatory regardless of outcome — paste a one-line confirmation in the session log).
- Note 18 self-validation + AC self-audit + "Files Changed" table in session log.
- Verdict line: `Self-validation: tsc=0 · build=passes · governance=C0/H0/M0 · outcome=A|B · uk 320 = no overflow · scope=clean · PASS`.

## Final report required

1. Files Changed table. 2. Outcome chosen + orchestrator-approval reference. 3. Two sites BEFORE/AFTER className snippet. 4. Outcome A: confirmation allowlist entries removed (paste deleted lines). Outcome B: confirmation new canonical fragment documented + allowlist entries updated. 5. 320 `uk` visual evidence (narrative or screenshot). 6. Confirmation no other file touched.

Do NOT emit git commands. Do NOT run git. Do NOT pre-decide A vs B. STOP & ASK first.
