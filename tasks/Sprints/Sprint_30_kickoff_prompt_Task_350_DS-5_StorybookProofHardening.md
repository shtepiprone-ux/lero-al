# Sprint 30 — Task 350 kickoff (Sonnet) — DS-5: Storybook responsive/locale proof hardening (NO route migration)

> **Status: QUEUED.** Runs only AFTER DS-2, DS-3, DS-4 (Tasks 347/348/349) have all shipped, been
> reviewed, and been **owner-approved + committed** — DS-5 hardens the rendered proof for the FULL
> primitive set (PageShell, Section, PageHeader, ActionBar, FilterBar). Do not start until the
> orchestrator releases this slice.
> **Dependency:** all five Tier-2 layout primitives must exist on disk. If any is missing → STOP & ASK.
>
> **You are Sonnet 4.6 executor.** Write code per the literal acceptance criteria below. Do NOT change
> scope. Do NOT invent architecture. If anything is ambiguous or a required decision is missing, **STOP
> and ASK the orchestrator** — do not improvise.
>
> **Single-writer git:** you do NOT run `git add` / `git commit`. End your session with a "Files
> Changed" table only; the ORCHESTRATOR (Opus) emits commit commands during review.

```
Type:     QA tooling / Storybook proof hardening (NO new primitives, NO route migration)
Priority: high
Area:     design-system / responsive / QA tooling / Storybook
Phase:    DS-5 of the design-system foundation queue
          (see docs/sessions/2026-06-01-task-344-design-system-implementation-path.md §6 and
           docs/sessions/2026-06-01-task-346-ds-remaining-phases-planning.md)

Area (ALLOWED to touch — confirm exact files via STOP & ASK if a non-story file seems required):
          src/components/layout/PageShell.stories.tsx     (UPDATE — add/normalize missing-width coverage; NO change to PageShell.tsx)
          src/components/layout/Section.stories.tsx        (UPDATE — same)
          src/components/layout/PageHeader.stories.tsx     (UPDATE — same)
          src/components/layout/ActionBar.stories.tsx      (UPDATE — same)
          src/components/layout/FilterBar.stories.tsx      (UPDATE — same)
          docs/responsive-screenshot-matrix.md             (UPDATE — record the 14×4 evidence matrix for the 5 primitives, IF this is the canonical evidence doc; confirm first)
          docs/component-catalog.md                        (UPDATE — mark the 5 primitives' story-coverage / screenshot status if the catalog tracks it)
          docs/backlog.md                                  (UPDATE — Last Session block, 2–4 lines)
          docs/sessions/2026-06-01-task-350-ds5-storybook-proof-hardening.md (NEW — session log + Files Changed table + the rendered 14×4 evidence)

Area (FORBIDDEN to touch):
          src/components/layout/PageShell.tsx · Section.tsx · PageHeader.tsx · ActionBar.tsx · FilterBar.tsx  (PRIMITIVE CODE — do NOT change; this slice changes ONLY stories + docs)
          src/components/layout/index.ts                                          (no export change)
          .storybook/preview.tsx                                                  (do NOT edit preset list unless explicitly approved — see STOP & ASK)
          src/app/** (ANY route/page/layout)  ·  src/app/globals.css
          src/components/admin/** · ui/** · shared/** · listing/** · auth/**  ·  src/modules/**
          messages/*.json  ·  DB / Supabase / SQL / migrations / server actions / business logic
```

## Role contract

You are **Sonnet 4.6, the executor**. You harden the RENDERED responsive/locale proof for the five Tier-2
layout primitives — you do NOT change any primitive's runtime code, do NOT migrate or adopt any route, do NOT
edit `.storybook/preview.tsx` presets (unless explicitly approved), do NOT touch product code, and do NOT run
git. This slice exists because DS-1..DS-4 each recorded `OWNER QA REQUIRED` for the 14×4 matrix and because 5
of the 14 canonical widths (560/680/810/960/1200) have no Storybook preset. Outside-allowlist = scope
violation = STOP & ASK. Opus reviews the real diff and emits git commands.

## Pre-read (load ONLY these)

**Always required:** `docs/agent-contract.md`, `docs/backlog.md`.
**Required:**
1. `docs/design-system.md` — **§3 (14×4 canon — ADDENDUM), §19–§21 (QA + PASS/FAIL; rendered proof, not code-level).**
2. `docs/responsive-governance.md`, `docs/responsive-screenshot-governance.md`, `docs/responsive-screenshot-matrix.md`, `docs/storybook-governance.md`, `docs/storybook-visual-snapshots.md` — to learn the canonical evidence format and where screenshots/matrix records live. **Follow whatever the existing governance docs prescribe; do NOT invent a new evidence format.**
3. `docs/ui-rules.md` §17 pre-flight checklist; `docs/qa-rules.md`.
4. The DS-1..DS-4 session logs (each lists the widths that were `OWNER QA REQUIRED`).
5. `.storybook/preview.tsx` (READ ONLY) — to confirm the exact preset names and which 5 widths have no preset.

## Problem

DS-1..DS-4 each shipped with `OWNER QA REQUIRED` for the full 14-width × 4-locale matrix because (a) Storybook
could not be rendered in the executor session and (b) **560 / 680 / 810 / 960 / 1200 have no exact preset** in
`.storybook/preview.tsx` (presets exist only for 320/375/390/480/768/1024/1440/1920/2560). The five layout
primitives therefore lack a single consolidated, rendered, owner-verifiable 14×4 proof. `docs/design-system.md
§21` defines a code-level-only "PASS" as a FAIL, so this proof must be real and rendered.

## Goal

Produce a CONSOLIDATED, rendered 14×4 (×5 primitives) responsive/locale proof: normalize the story coverage
so every canonical width and locale is reachable (via presets where they exist + documented manual-resize
steps for the 5 preset-less widths, OR via `npm run screenshots:responsive` if that is the canonical path),
capture the evidence in the governance-prescribed location, and record a single authoritative matrix that flips
DS-1..DS-4's `OWNER QA REQUIRED` to PASS (or escalates any real defect found as a STOP & ASK follow-up).

## Current behavior to preserve (Note 19 + Note 20)

- **All five primitives' runtime code is byte-identical** after this slice — you change ONLY `*.stories.tsx` + docs. → `git diff src/components/layout/*.tsx` (the non-story files) empty.
- **The barrel `index.ts` is unchanged.** → `git diff` empty.
- **`.storybook/preview.tsx` is unchanged** unless the orchestrator explicitly approves adding the 5 missing presets (see STOP & ASK). → `git diff .storybook/preview.tsx` empty by default.
- **Zero route adoption** — no route imports any layout primitive. → grep = 0 hits.
- Admin/ui/shared/globals.css unchanged. No existing control removed anywhere.

## Required after behavior

Anyone can open Storybook (or run the canonical screenshot script) and reach all 14 canonical widths × sq/en/
uk/it for each of the five primitives, with explicit instructions for the 5 preset-less widths; a single
recorded matrix shows PASS/▲/FAIL per cell with rendered evidence; DS-1..DS-4's outstanding `OWNER QA
REQUIRED` items are resolved to a documented verdict.

## Positive flow (happy path)

- **Actor:** developer / Storybook / screenshot tooling.
- **Steps & expected responses:**
  1. Open each of the five `Layout/*` story sets → all 14 canonical widths reachable (preset or documented manual-resize) and all 4 locales toggleable.
  2. Render/capture each primitive at all 56 cells → no horizontal overflow, no clipping, correct wrapping; uk@320 wraps for every primitive.
  3. Record the matrix in the governance-prescribed evidence doc with rendered proof.
- **Success state:** `tsc --noEmit`=0; `build` ✅; `lint` 0/0 new; `check:i18n` PASS (no-op); the consolidated 14×4×5 matrix is rendered + recorded; no primitive runtime code changed.
- **Post-conditions:** zero route files changed; primitives byte-identical; `globals.css`/preview.tsx byte-identical (unless approved); evidence doc + catalog + backlog + session log updated.

## Negative flow (every off-happy-path branch)

- **A real responsive defect is found** at some cell (e.g. overflow at uk@320 for one primitive) → do NOT silently "fix" the primitive (that is out of scope); RECORD it as FAIL in the matrix and **STOP & ASK** — the orchestrator opens a targeted follow-up fix task. → documented in log.
- **A width genuinely cannot be rendered** (tooling limit even after manual resize / screenshot script) → record that cell as `OWNER QA REQUIRED` with the exact reason; do NOT claim PASS. → documented.
- **The screenshot script is unavailable/broken** → fall back to documented manual Storybook resize steps for all 14 widths and record which path was used. → documented.
- **A missing-width story would require touching primitive code** → STOP (stories must exercise the primitive via props only).

## Scope

UPDATE the five `*.stories.tsx` to guarantee all 14 canonical widths × 4 locales are reachable (add explicit
viewport-parameter stories or documented manual-resize notes for 560/680/810/960/1200), capture/record the
rendered 14×4×5 evidence in the governance-prescribed doc, update catalog coverage flags if tracked, update
backlog (2–4 lines), write the session log containing the consolidated matrix. Nothing else.

## Out of scope (DO NOT)

- Do NOT change any primitive's runtime code (`PageShell/Section/PageHeader/ActionBar/FilterBar.tsx`) — stories + docs only.
- Do NOT edit `.storybook/preview.tsx` presets unless the orchestrator explicitly approves (STOP & ASK first).
- Do NOT adopt any primitive in any route (`src/app/**`).
- Do NOT "fix" a discovered defect here — record it + STOP & ASK for a targeted follow-up.
- Do NOT edit admin/ui/shared/listing/auth/modules code, `globals.css`, or `messages/*`.
- Do NOT touch DB / Supabase / SQL / server actions / business logic.
- Do NOT run `git add` / `git commit`. Do NOT present code-level analysis as rendered QA (§21).

## Acceptance criteria (each is diff-verifiable)

- **AC-1** All five `*.stories.tsx` updated so every one of the 14 canonical widths (320/375/390/480/560/680/768/810/960/1024/1200/1440/1920/2560) × sq/en/uk/it is reachable — preset where it exists, explicit documented manual-resize (or screenshot-script) path for 560/680/810/960/1200. → file:line per story.
- **AC-2** All five primitives' runtime `.tsx` files **byte-identical** — `git diff` on the non-story files empty. → diff in log.
- **AC-3** `.storybook/preview.tsx` **byte-identical** (unless explicitly approved + noted). → diff in log.
- **AC-4** Consolidated **14×4 × 5-primitive** rendered evidence captured in the governance-prescribed location, in the existing evidence format (cite which doc/format). → file:line / artifact path.
- **AC-5** A single authoritative matrix in the session log shows PASS/▲/FAIL per cell with rendered proof; DS-1..DS-4 `OWNER QA REQUIRED` items resolved to a documented verdict (PASS or escalated FAIL). → session-log section.
- **AC-6** Any defect found is recorded as FAIL + a STOP & ASK follow-up note — NOT silently patched. → session-log section (or "none found").
- **AC-7** **Zero route adoption:** grep = 0 hits. → in log.
- **AC-8** Self-validation block (Note 18): `tsc --noEmit`=0; `build` ✅; `lint` 0/0 new; `check:i18n` PASS; `ui-rules.md §17` pre-flight; scope=clean.
- **AC-9** "Files Changed" table; **no git commands emitted**.

## Required validation (run; adapt to PowerShell / Git Bash; paste output in the session log)

```
git status --short
git diff src/components/layout/PageShell.tsx src/components/layout/Section.tsx src/components/layout/PageHeader.tsx src/components/layout/ActionBar.tsx src/components/layout/FilterBar.tsx   # MUST be empty (no primitive code change)
git diff src/components/layout/index.ts            # MUST be empty
git diff .storybook/preview.tsx                     # MUST be empty unless explicitly approved
rg -n "from ['\"]@/components/layout" src/app src/modules   # MUST be 0 hits (zero route adoption)
git diff src/app/globals.css                       # MUST be empty
npm run build
npx tsc --noEmit
npm run lint
npm run check:i18n
# Canonical screenshot path (run if this is the prescribed evidence route):
npm run screenshots:responsive   # if present; otherwise document the manual Storybook resize path used
```

If a script name differs, report the exact available scripts from `package.json` and use the closest canonical path.

## Required responsive QA (MANDATORY — `docs/design-system.md §19`; rendered, not code-level)

- Render/capture all five primitives at **320 / 375 / 390 / 480 / 560 / 680 / 768 / 810 / 960 / 1024 / 1200 / 1440 / 1920 / 2560** × **sq / en / uk / it** (= 56 cells × 5 = 280 cells).
- **Preset gap is the whole point of this slice:** 560 / 680 / 810 / 960 / 1200 have NO exact preset in `.storybook/preview.tsx` — capture them via documented manual resize or the screenshot script, and record HOW each was obtained.
- **uk @ 320 is the longest-locale overflow stress check** for every primitive — must wrap, never overflow.
- **Real rendered browser/Storybook QA is required — code-level analysis is NOT proof of responsive PASS** (§21). Paste/attach the rendered evidence; a cell without rendered proof is `OWNER QA REQUIRED`, not PASS.

## Required localization QA (sq / en / uk / it)

This slice adds NO user-facing strings and changes NO `messages/*.json` (it edits stories + docs only), so
`check:i18n` is a no-op PASS. Locale coverage = proving, with rendered evidence across **sq / en / uk / it**,
that every primitive's longest-locale (uk, then sq/it) content does not overflow at any of the 14 widths,
especially **uk @ 320**. `en`-only proof is insufficient (§6). If any story harness needs translated sample
text, supply it inline in the story (NOT via `messages/*.json`).

## STOP & ASK triggers

- Any of the five primitives is missing on disk → STOP.
- Hardening a width appears to require changing primitive runtime code → STOP (stories exercise props only).
- You believe the 5 missing widths must be added to `.storybook/preview.tsx` → STOP & ASK (default is to NOT edit preview.tsx; get explicit approval).
- A real responsive defect is found → record FAIL + STOP & ASK (do not patch the primitive here).
- The screenshot tooling cannot render the matrix and manual resize is also blocked → STOP and record `OWNER QA REQUIRED` with the exact reason.
- Any required change would touch a FORBIDDEN path → STOP.

## Final report requirements (session log + 2–4 line `docs/backlog.md` "Last Session" block)

Verdict; Files Changed table; the consolidated 14×4 × 5-primitive matrix with rendered evidence + how each
preset-less width was captured; resolution of DS-1..DS-4 `OWNER QA REQUIRED`; any defects found (or "none");
confirmation primitive code + preview.tsx + globals.css untouched. End with the Files Changed table.

## Files Changed table requirement

The session log MUST end with a "Files Changed" table — one row per touched path + 1-line rationale — for
every file created/edited. The orchestrator validates it against the real diff.

## No git commands emitted by Sonnet

You do NOT emit `git add` / `git commit`. End with the Files Changed table only. Opus reads the real diff
and emits explicit-path commit commands during review; the owner runs them in PowerShell.
