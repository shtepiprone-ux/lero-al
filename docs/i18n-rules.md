# i18n Dynamic-Key Rules — Lero.al

**Established:** 2026-06-13 (Task 317, Epic II Phase 1)
**Status:** PERMANENT GOVERNANCE REFERENCE

---

## §1 — PURPOSE

`npm run check:i18n` (`scripts/check-i18n-parity.mjs`) verifies that all four
locale files (`sq/en/uk/it`) contain the **same set of keys**. It cannot catch
the class of bug found by Task 316: a key that exists in `messages/*.json` but
under the **wrong namespace**, so a *dynamic* `t(\`prefix_${value}\`)` or
`t(variable)` call resolves to a key that doesn't exist anywhere — even though
parity (key counts) is perfectly green.

`npm run check:i18n-dynamic` (`scripts/check-i18n-dynamic.mjs`) closes this gap:
it verifies that every `namespace.key` pair **reachable from a dynamic `t()`
call site** actually exists in all 4 locale files.

---

## §2 — THE RULE

**Every dynamic `t()` call site MUST cite its source enum/union/array in a
code comment, and every value that enum/union/array can take MUST have a
corresponding `namespace.key` entry in `scripts/i18n-dynamic-manifest.json`.**

When you add a new value to one of these source enums (e.g. a new
`PropertyType`, `ComplaintType`, `ListingStatus`, filter option, etc.):

1. Add the translation key to **all 4** `messages/{sq,en,uk,it}.json` files
   (per `docs/ai-behavior.md` → "Localization (i18n) Rules").
2. Add the bare key to the matching entry's `keys` array in
   `scripts/i18n-dynamic-manifest.json` (or add a new entry if it's a new call
   site — see §4).
3. Run `npm run check:i18n-dynamic` — it must exit 0 (or only produce
   baselined WARNs for pre-existing, ticketed debt).

If you skip step 2, the new key silently passes `check:i18n` (parity is
unaffected — you added it to all 4 locales) but `check:i18n-dynamic` will not
know to check it. The manifest is the **reviewable source of truth**: a PR
diff to it is the signal "a dynamic key set changed."

If you skip step 1, `check:i18n-dynamic` fails with an `ERROR` line naming the
exact `namespace.key` and locale(s) missing it.

---

## §3 — SCANNER: `scripts/check-i18n-dynamic.mjs`

### What it does

1. Flattens `messages/{sq,en,uk,it}.json` to dot-path keys (reuses the
   `collectKeys()` helper from `scripts/check-i18n-parity.mjs`).
2. Loads `scripts/i18n-dynamic-manifest.json` — a checked-in list of
   `{ id, site, namespace, keys[], note? }` entries, one per dynamic `t()`
   call site (or group of sites resolving the same enum). The scanner checks
   `namespace.key` for every `key` in every entry's `keys[]`.
3. For each `namespace.key` × each of the 4 locales, checks presence.
4. Classifies misses against `scripts/i18n-dynamic-baseline.json`:
   - **Baselined** (key present in baseline with that locale listed) → `WARN`,
     prints the owning task, does not affect exit code.
   - **Not baselined** → `ERROR`, non-zero exit.
5. Prints stale-baseline `INFO` lines for baseline entries whose key is now
   present (advisory only — does not affect exit code).
6. Prints a summary line: `X keys checked · Y locales · Z baselined-warns · N errors`.

### Modes

| Command | Behavior |
|---|---|
| `npm run check:i18n-dynamic` | Default gate. Exits non-zero if `N errors > 0`. |
| `npm run check:i18n-dynamic:report` | Same report, **always exits 0** (advisory). |
| `npm run check:i18n-dynamic:update-baseline` | Regenerates `scripts/i18n-dynamic-baseline.json` from the current set of misses, preserving existing `owner` tags where the key is still missing. Use ONLY when intentionally accepting new, ticketed debt — never to hide a regression. |

### Fail-fast conditions (never a false green)

- `messages/{sq,en,uk,it}.json` missing or invalid JSON → exit 1.
- `scripts/i18n-dynamic-manifest.json` missing, invalid JSON, empty `entries`,
  or any entry missing a non-empty `id` (unique across entries), non-empty
  `site`, non-empty `namespace`, or non-empty `keys[]` → exit 1 naming the
  offending entry (Task 423).
- `scripts/i18n-dynamic-baseline.json` missing or invalid JSON, or any entry
  missing a non-empty `owner`, or whose `owner` matches `/UPDATE ME/i` (the
  `--update-baseline` placeholder) → exit 1 naming the offending key
  (Task 423).

---

## §4 — MAINTAINING THE MANIFEST

`scripts/i18n-dynamic-manifest.json` is **human-maintained**, not
auto-generated (AST-based enum discovery was explicitly rejected — Task 317
architecture decision: 83 heterogeneous TS enums/unions/arrays make robust
auto-resolution fragile and out of proportion). It was seeded from
`docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md` §2 (Task 316's
83-site inventory), grouped into entries by `(namespace, source enum/array)`.

When you add a **new** dynamic `t()` call site (a `t(\`prefix_${var}\`)` or
`t(variableExpr)` where `var`/`variableExpr` is typed by an enum/union/array):

- Add a new entry: `{ "id": "<kebab-case>", "site": "File.tsx:line",
  "namespace": "<ns>", "keys": [...bare keys from the enum...], "note": "..." }`.
- If the call site resolves an enum already covered by an existing entry
  (same namespace, overlapping value set), add the new keys to that entry's
  `keys[]` instead of duplicating — the scanner dedupes via a `namespace.key`
  set, so listing the same pair in two entries is harmless but adds noise.

**`id` and `site` are mandatory and enforced (Task 423):** every entry must
have a non-empty `id`, unique across the whole manifest, and a non-empty
`site` (free-text `File.ext:line` — not regex-validated). These are what make
an `ERROR`/`WARN` line diagnosable back to "which call site owns this key?" —
a manifest entry missing either, or with a duplicate `id`, fails the gate.

### Reachability — do NOT add unreachable keys

Per audit §1a/§1b, the manifest enumerates **reachable** keys only:

- Dead union members that no code path ever passes to `t()` (e.g.
  `PhoneErrorKey.error_phone_country_mismatch` — produced only by a function
  whose result never reaches the `t()` call) are **excluded**.
- Non-`t()` raw labels (e.g. `floors_total`, rendered as a literal string with
  no translation call) are **excluded** — out of this scanner's scope by
  definition.
- A key existing in `messages/*.json` but with **zero** references from any
  dynamic (or static) `t()` call site is an **orphan**, not a manifest entry —
  see audit §7 for the Task-316-scoped orphan findings (`listing.sort_by`).

---

## §5 — BASELINE

`scripts/i18n-dynamic-baseline.json` mirrors
`scripts/i18n-hardcode-baseline.json`'s convention: a committed JSON map of
known, ticketed gaps so the gate ships green without masking *new* misses.

Current baseline (Task 317): the 3 keys found missing by Task 316 —
`admin.support.user_status_{active,blocked,inactive}` × all 4 locales (12
cells), each tagged `"owner": "Task 320 — remove this entry when filled"`.
Task 320 should: (a) add the 3 keys to `messages/{sq,en,uk,it}.json` under
`admin.support`, then (b) remove the corresponding entries from
`scripts/i18n-dynamic-baseline.json` (or run `--update-baseline`, which drops
entries whose keys are no longer missing).

**Every baseline entry MUST carry a real, non-placeholder `owner` (Task 423):**
a missing/empty `owner`, or an `owner` matching `/UPDATE ME/i`, fails the gate.
`--update-baseline` still writes new entries with the placeholder owner
`"UPDATE ME — owning task"` (so the regenerated file is reviewable diff-wise)
and prints "N new entry(ies) written with placeholder owner — assign an
owning task before the gate will pass." — but the very next normal run of
`check:i18n-dynamic` then FAILS until a real owning task is assigned. This is
the intended self-enforcing loop: you cannot silently accept new dynamic-key
debt without naming who owns the fix.

---

## §6 — RELATIONSHIP TO OTHER GATES

```
check:i18n             — message key-set parity (count/key match across sq/en/uk/it)
check:i18n-dynamic     — dynamic-t() resolved-key coverage (this doc)
check:i18n-hardcode    — static hardcoded-English-string scan (src/**/*.tsx)
check:locale-leak      — rendered DOM leak detection (story-gated, Playwright)
```

Four complementary, non-overlapping gates — see `docs/i18n-governance.md` §5
for the other three. `check:i18n-dynamic` is the only one that understands
*dynamic* key construction; the others operate on static text/keys.

---

## §7 — CI WIRING STATUS

**Wired as a blocking step in the `governance` job, Task 323** — `npm run check:i18n-dynamic`
runs as the **"Dynamic i18n key gate (resolved-key coverage, fail-on-new)"** step in
`.github/workflows/governance-pr.yml`, placed immediately after the
`check:i18n-hardcode` step and before the file-integrity gate. No `continue-on-error`:
a non-zero exit (any non-baselined missing `namespace.key`) fails the PR check.

---

## §8 — EPIC II CROSS-REFERENCE

| Epic II Phase | Task | Status |
|---|---|---|
| Phase 1 P1 — Dynamic-key audit | 316 | DONE (2026-06-13) |
| Phase 1 P1 — Dynamic-key scanner + manifest + baseline | **317** | DONE (2026-06-13) |
| Phase 2 — Notification locale-binding | 318/319 | 318 audit DONE (2026-06-13) — see `docs/governance-reports/2026-06-13-notification-locale-audit.md`; 319 fix PLANNED |
| Phase 2 — Dynamic-key remediation (`admin.support.user_status_*`) | 320 | PLANNED |
| Phase 3 — CI hardening (wire `check:i18n-dynamic` into CI) | 323 | DONE (2026-06-14) |

See `docs/governance-reports/2026-06-13-i18n-dynamic-key-audit.md` for the
full Task 316 audit and `tasks/Epics/Epic_II_Global_i18n_Hardening.md` for the
full epic plan.
