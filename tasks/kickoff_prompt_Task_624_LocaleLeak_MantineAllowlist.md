# Task 624 — Clear the 97 Mantine-only locale-leak errors (allowlist internationally-canonical words; translate only the real gaps)

- **Task number:** 624
- **Epic:** MM — Mantine/TailAdmin Restyle (`tasks/Epics/Epic_MM_Mantine_UI_Migration.md`)
- **Sprint:** 45 (Mantine-migration governance tail — next after the landed Sprint 44; CI-gate follow-up to Task Q0R)
- **Parent:** Task Q0R (`tasks/kickoff_prompt_Task_Q0R_MantineOnlyCIScope.md`) — this closes Q0R's blocking discovery (97 pre-existing leaks surfaced when the locale-leak job was scoped to `--mantine-only`).

## Mode and task type

- Mode: implementation kickoff for a fresh Sonnet session (execute via `.claude/skills/execute-task/SKILL.md`).
- Task type: **i18n / locale-gate configuration.** Low product-code surface. Deliverable = allowlist entries + a
  few real translations + one gate proof.

## Objective

`npm run check:locale-leak:mantine-only` currently reports **97 leaks across 18 canonical Mantine stories**. Most are
false positives: internationally-canonical words (like "Email", which is already allowlisted) and proper nouns/brand
names that are the same string in every locale. Make these into **narrow, justified allowlist exceptions**. Only the
handful that are genuine missing translations get a real translated value. End state: the gate exits 0, and it still
fails on a newly planted real leak.

## Verified context (owner native run, 2026-07-19)

- Command to reproduce (build Storybook first): `npm run build-storybook` then
  `npm run check:locale-leak:mantine-only`. Composition line: `Mantine selected: 59; non-Mantine excluded: 236`.
- The detector logic was not changed by the Q0R scoping work — these 97 are pre-existing.
- **Two allowlist mechanisms already exist in `scripts/check-locale-leak.mjs` — use them, do not invent a new one:**
  - `LEAK_ALLOWLIST` (line ~84): global regex list for universally non-translatable tokens. **"Email" already lives
    here** (`/^(EUR|URL|DELETE|SMS|HTTP|HTTPS|WhatsApp|Email|SEO|API|ID|QA)$/i`) — this is the model to extend for
    other internationally-canonical words and universal brands. `isAllowlisted(token)`.
  - `PER_STORY_TOKENS` (line ~129): object keyed by **story-ID prefix** → allowed tokens, for loanwords/fixtures
    scoped to one story so they can't mask a real hardcode elsewhere. `isPerStoryAllowlisted(storyId, token)`.
- **Root cause of most leaks (verified):** existing per-story entries are keyed to *legacy* prefixes
  (`'primitives-badge'`, `'admin-admintable'`). The canonical Mantine stories have **new** IDs
  (`mantine-primitives-badge--default`, `mantine-primitives-table--default`,
  `patterns-mantine-appshellfoundation--default`), which those legacy prefixes never match — so the same
  loanword/fixture allowances were simply never applied to the Mantine stories.

## The 97 tokens — how to classify each

Go token by token. Three actions only:

**1. Global allowlist (`LEAK_ALLOWLIST`) — internationally-canonical words + universal brand.** The "Email" class:
words used identically across locales in a modern UI. Add each with a one-line comment. Candidates observed in the
report (Sonnet confirms each is genuinely canonical/loanword in `sq`+`it` before adding; if a standard local term
exists and is actually used in the product, translate it instead per action 3):

- Tech/UI canonical: **"Password", "Dashboard", "Admin", "Home", "Info", "Panel"**
- Real-estate loanwords: **"Premium", "Studio", "Duplex", "Penthouse"**
- Design-system variant labels (precedent: `Outline`/`Neutral` already allowlisted): **"Brand"**
- Abbreviations: **"Min", "Max"** (verify no localized short form is expected)
- Brand: **"Lero", "Lero.al"**

**2. Per-story allowlist (`PER_STORY_TOKENS`) — proper nouns / fixture data scoped to one story.** Person, agency,
and place names in fixtures. Key them to the **Mantine** story-ID prefix (e.g. `mantine-primitives-table`,
`patterns-mantine-adminsurfacepattern`, `mantine-primitives-headerview`), each with a comment:

- People: "Alba Krasniqi", "Driton Berisha", "Antonio Berluskoni", "Giulia Romano", "Elira Hoxha"
- Agencies: "Tirana RE", "Roma Immobili", "Albhome", "Prime Realty Tirana"
- Place: "Tirana, Albania"
- Roles (mirror the existing `admin-admintable` entry onto the Mantine prefixes): "Agent", "Administrator"
- **"Arben RichardsonMontgomery"** looks like malformed concatenated fixture data — fix the fixture, don't
  allowlist a broken name.

**3. Translate (real missing value) — only where a standard local term exists and is used in the product.** If
Sonnet confirms, e.g., that Italian product copy uses a real word rather than the loanword for any of the action-1
candidates, add the correct value with 4-locale key parity instead of allowlisting it.

**4. Fix at the story, never allowlist.** Do not put these in any allowlist:

- **"Secret1"** (PasswordInput placeholder fixture) — make the placeholder locale-neutral (non-word) or a narrow
  per-story fixture entry; do not globally allowlist a credential-looking token.
- **"FilterMultiToggle — Mantine Button toggles (§6a chrome, filled=selected / default=unselected)"**
  (FilterControls) — a developer annotation leaking as rendered text; stop rendering the description string.

## Constraints (guardrails)

- Do **not** revert the CI gate to unscoped `check:locale-leak` and do **not** add a blanket baseline / known-failure
  list. Each exception is a specific, commented token — no catch-all, no whole-story mute, no wildcard.
- Do **not** touch the detector algorithm (`isEnglishish`, token-diff) or the `--mantine-only` scope / prefixes.
- Every allowlist entry carries a one-line justification comment stating which class it belongs to.

## Acceptance criteria

- `AC1` Every one of the 97 leaks is resolved by action 1, 2, 3, or 4 — with the token→action decision recorded.
- `AC2` `npm run build-storybook` then `npm run check:locale-leak:mantine-only` → **0 leaks, exit 0** (capture the
  output).
- `AC3` Any action-3 translations keep 4-locale key parity (`sq/en/uk/it`).
- `AC4` Gate still enforces: plant a raw English string into one `Mantine/Primitives/*` story, rebuild, confirm the
  gate FAILS naming it; restore, rebuild, confirm pass.
- `AC5` `git diff` shows only `messages/*.json` (action 3), the `LEAK_ALLOWLIST`/`PER_STORY_TOKENS` blocks in
  `check-locale-leak.mjs`, and the two action-4 stories — nothing else; no unscoped revert, no baseline file.

## QA profile and verification plan

Profile: **Q1 Targeted** + the mandatory planted-violation gate proof (agent-contract clause 13).

1. `npm run build-storybook` → exit 0.
2. `npm run check:locale-leak:mantine-only` → 0 leaks, exit 0 (verbatim) — AC2.
3. Locale key-parity check for any action-3 additions — AC3.
4. Planted-violation fail + restore — AC4.
5. `git diff` review — AC5.

## Completion report contract

Session log `docs/sessions/<date>-locale-leak-mantine-allowlist.md` + concise `docs/backlog.md` line. Include: a
Files Changed table; the token→action table for all 97; the verbatim 0-leak run; the planted-violation proof;
confirmation no unscoped revert and no baseline mechanism were introduced. Final status
`IMPLEMENTED - AWAITING ORCHESTRATOR REVIEW` / `PARTIALLY IMPLEMENTED` / `BLOCKED` — never self-approval. Do not run
or emit mutating git.

Handoff: execute via `.claude/skills/execute-task/SKILL.md` against this file path.
