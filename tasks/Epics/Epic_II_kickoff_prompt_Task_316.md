# Epic II — Task 316 kickoff — Project-wide dynamic-key + missing-key i18n AUDIT (audit/spec only, ZERO product code)

> **You are Claude Code Sonnet 4.6 in `lero-al`. Read `docs/agent-contract.md` (clauses 1–14) FIRST.** Conforms to the
> current P0 contract. **AUDIT-ONLY: produces ONE documentation file, NO product-code changes, NO new/edited scripts
> (Task 317 writes the scanner), NO `messages/*.json` edits (Task 320 fills gaps), NO new rules doc (the canonical rules
> doc is Task 317/323 and extends the EXISTING `docs/i18n-governance.md` — do not create `docs/i18n-rules.md`).**
> **This file is the single source of truth for Task 316** — supersedes `tasks/Sprints/Sprint_24_kickoff_prompt_Task_316.md`.

```
Type:        audit / spec (no product code, no scripts, no locale edits)
Priority:    HIGH (Epic II Phase 1 #1; blocks Phase 2 remediation 319/320/321/322)
Area:        whole repo — every dynamic t() call site (admin + public + notifications + emails + toasts + DB labels)
Output:      docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md (NEW; use the ACTUAL run date if later)
```

## Why this task exists
Task 288 burned down STATIC hardcoded strings. Task 300 hotfixed ONE missing-key class (`admin.support.role_*` /
`support_status_*`). The underlying systemic bug — **dynamic `t()` calls with no parity guard** — is unaudited
project-wide. Every `t(\`role_${role}\`)`, `t(\`status_${state}\`)`, `t(\`property_type_${kind}\`)` is a runtime
`MISSING_MESSAGE` (or silent raw-key leak) waiting to happen the next time a new enum value lands without all four
locale files being updated. This task produces the evidence base that Task 317 (scanner) and Task 320 (remediation)
consume. **316 only IDENTIFIES the gaps; it fixes nothing.**

## Goal
Statically enumerate every **dynamic** `t()` call (`t(\`...${var}\`)`, `t(\`prefix_${enum}\`)`, `t(variableExpr)`),
resolve each to its full set of possible keys from the source enum / union / array / object, and cross-reference against
`messages/{sq,en,uk,it}.json` to produce a **per-file, per-call-site missing-key matrix** + a raw-key-leakage risk list,
in a single NEW report: `docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md`.

The report MUST contain these sections:
1. **Per-call-site inventory** — every dynamic `t()` call: file:line · the `useTranslations()`/`getTranslations()`
   **namespace** in scope at that call · the template expression · the source enum/union/array/DB column that drives the
   variable. The grep-verifiable total count MUST equal the inventory row count.
2. **Per-call-site enumeration** — every possible resolved key (namespace-qualified) for each call site, derived from the
   cited source-of-truth enum/union. No "unknown source" rows (see Negative flow for the exception handling).
3. **Per-locale missing-key matrix** — for each enumerated key, ✅/❌ in `sq` · `en` · `uk` · `it`. Note `uk.json` is
   ~30% larger than the others — call out whether that is extra (orphan) keys, drift, or legitimately more content.
4. **Raw-key-leakage risk list** — per call site, classify the failure mode if a key is missing: (a) `MISSING_MESSAGE`
   thrown/logged, (b) raw dot-path rendered to the user, (c) silent fallback string. Cite how next-intl v4 behaves here.
5. **Remediation buckets for Task 320** — group missing keys by namespace + by source enum into concrete Phase-2 batches
   (e.g. "admin.support: 6 keys × 4 locales", "listings.status_banner: N keys"), with the per-bucket key list.
6. **Cross-reference** the notification wrong-locale class (the `sq`-locale "Скарга на ваш аккаунт" Ukrainian-text bug)
   to **Task 318** (notification locale-binding audit) — note it is a binding bug, distinct from a missing-key gap.

## Pre-read (mandatory — rule-index: governance/audit + i18n)
1. `docs/agent-contract.md` (clauses 1–14) · `docs/backlog.md` · `docs/orchestrator-role.md`.
2. `docs/ai-behavior.md` → "Localization (i18n) Rules" + Note 18 (self-validation). `docs/qa-rules.md`.
3. `docs/i18n-governance.md` (EXISTING governance from Task 396 — the static-hardcode + locale-leak gates; this audit is
   the dynamic-key layer above it, and must reference it, not duplicate or contradict it).
4. `tasks/Epics/Epic_II_Global_i18n_Hardening.md` (Task 316 spec + phase sequencing).
5. `scripts/check-i18n-parity.mjs` (what `check:i18n` parity already catches vs. the dynamic-key gap it does NOT).
6. `docs/integrations.md` → "Outbound email language policy" (email is sq-only — relevant to bucket scoping for 321).
7. Task 288 session log (`docs/sessions/2026-05-29-task-288-i18n-hardcode-audit.md`) — the static precedent + report style.

## Required investigation (paste the grep + counts into the session log)
1. Grep for dynamic `t()` patterns across `src/app`, `src/components`, `src/modules`, and any notification/email/toast
   layer. The template-literal form `t(\`...${\`) yields ~58 candidate sites today — verify the live count yourself and
   reconcile every row. Also catch `t(variableExpr)` (bare-variable arg) calls.
2. For each call site, resolve the **namespace** (the `useTranslations('x.y')` / `getTranslations` scope) so the
   enumerated keys are namespace-qualified the way next-intl resolves them.
3. For each variable, find its source-of-truth (e.g. `UserRole` union, `listing.status`, `property_type`,
   `complaint_type`, inquiry/report status, permission `keySlug` source) and enumerate ALL values.
4. Cross-reference every enumerated key against all four locale files; mark missing per locale.
5. Spot-verify a sample of ≥8 enumerated keys by grepping the actual `messages/*.json` so the matrix is evidence-backed,
   not inferred.

## Positive flow (the audit, happy path)
Actor: Sonnet executor. Preconditions: clean tree, all 4 locale files parse.
1. Enumerate every dynamic `t()` call site (count matches grep). → inventory section populated.
2. For each, cite the source enum and enumerate all resolved namespace-qualified keys. → enumeration section populated.
3. Cross-reference against `messages/{sq,en,uk,it}.json`. → missing-key matrix populated, sample-verified.
4. Classify leakage failure mode per site; group missing keys into Task 320 buckets. → sections 4 + 5 populated.
5. Success state: the report exists with all 6 sections; `git diff --stat src messages scripts` is EMPTY; the
   self-audit table maps every AC to a report section:line.

## Negative flow (audit edge cases — each MUST be handled explicitly in the report, not skipped)
- **Variable not statically resolvable** (driven by free-text DB content, an external API, or an unbounded string, not a
  finite enum/union): do NOT guess an enumeration. List the site in a dedicated **"Non-enumerable / runtime-only"**
  subsection with the reason, and flag it for a different remediation strategy (runtime fallback, not key-fill). If the
  source genuinely cannot be determined, **STOP & ASK the orchestrator** — do not invent a source.
- **Partial parity** (key present in some locales, missing in others — likely given `uk.json` size skew): mark each
  locale cell independently; never collapse to a single ✅/❌.
- **`as`-cast call sites** (e.g. `t(\`support_status_${s}\` as \`support_status_open\`)`): the TS cast hides the real
  resolved set — enumerate from the SOURCE enum, not from the single literal in the cast. Note the cast as a smell.
- **Orphan keys** (present in locale files but no call site resolves to them): list separately as informational; not a
  Task 320 fill target, but feeds the scanner design in 317.
- **Namespace mismatch** (a call's namespace doesn't contain the prefix): flag as a likely live bug for 320.
- **No matching messages at all** for an enumerated prefix: highest-priority leak — top of the bucket list.

## Scope (files Sonnet MAY touch — nothing else)
- `docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md` (NEW; adjust date to actual run date — task # stays 316)
- `docs/sessions/2026-06-13-task316-i18n-dynamic-key-audit.md` (NEW session log)
- `docs/backlog.md` (closure entry only)

**MUST NOT touch:** anything under `src/`, `messages/`, `scripts/`; any Sprint 21–35 file; canonical primitives; DB/RLS;
and do NOT create `docs/i18n-rules.md` (defer to 317/323, extending `docs/i18n-governance.md`).
**Maximum src/messages/scripts delta = 0.** If you would touch any of them, STOP & ASK.

## Mobile / rendered / no-hardcode gates
- Clauses **11/12/13 are N/A** (no UI rendered, no stories/components touched) — state this explicitly in the session log
  so the reviewer confirms it was considered, not skipped. Any UI remediation is Task 320 (out of scope here).

## Clause 14 — file-integrity (MANDATORY)
- Read back the audit report + session log after writing; confirm complete (intended final line present), **0 NUL bytes**
  (`tr -cd '\000' < <file> | wc -c` = 0), no BOM, not truncated. Paste the green integrity transcript into the session log.

## Acceptance criteria (literal — each maps to a report section:line in the self-audit table)
- The report exists with all 6 Goal sections; inventory row count == grep count of dynamic `t()` sites.
- Every enumeration row cites a concrete source enum/union; non-enumerable sites are in the dedicated subsection (no
  silent gaps, no invented sources).
- Per-locale missing-key matrix is exhaustive (every enumerated key × 4 locales) and ≥8 cells are grep-verified against
  `messages/*.json`.
- Raw-key-leakage failure modes classified per site with next-intl v4 behavior cited.
- Task 320 remediation buckets are concrete (namespace + key list per bucket); notification class cross-referenced to 318.
- `git diff --stat src messages scripts` is EMPTY (audit doc + session log + backlog only).
- `docs/backlog.md` + `docs/sessions/` updated; **Files Changed table** present; **no `git add`/`git commit` from executor**.
- Clause 14 integrity transcript green for both new files.
- Verdict line: `Self-validation: src/messages/scripts diff=empty · dynamic-t inventory complete (N sites, count==grep) · per-locale missing-key matrix shipped (≥8 cells grep-verified) · non-enumerable sites flagged · Task 320 buckets ready · clauses 11/12/13 N/A documented · clause 14 green · PASS`.

## Out of scope
- Filling any missing key (Task 320). Writing/editing the scanner script (Task 317). Touching notification render code
  (Task 319). Email-template audit (321). Toast/modal audit (322). CI gate wiring (323). Creating `docs/i18n-rules.md`.
  Adding languages beyond sq/en/uk/it. Changing email language scope (stays sq-only). Re-litigating Task 288 static work.

Do NOT emit git commands. Do NOT run git. Do NOT touch source / locale / scripts. STOP & ASK if any call-site source
cannot be statically resolved.
