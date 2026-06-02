### Task 364 — Settlement localization: LocationCombobox sq/en search & display + Select capitalization & i18n

Type:        feature + bug
Priority:    high
Area:        `src/components/shared/LocationCombobox.tsx`, `src/components/shared/Combobox.tsx` (+ `Combobox.stories.tsx`),
             `src/components/ui/select.tsx` (+ `select.stories.tsx`), settlement data layer in `src/modules/locations/**`

> Owner clarification (2026-06-02): the settlement DB stores **only Albanian (`name_al`) and English
> (`name_en`)** names (verify in `/admin/locations`). There are **no uk/it settlement names** → fall
> back to `name_al`. **No new multilingual schema is in scope.** If the data layer does NOT already
> expose `name_en` (column + query + type), the executor MUST **STOP and ASK** before inventing it
> (contract clause 2) — do not add a migration in this task.

Pre-read (mandatory before any code change):
1. docs/agent-contract.md
2. docs/backlog.md
3. docs/rule-index.md → "DB / server action / RLS task": docs/data-access-rules.md, docs/rls-rules.md, docs/domain-rules.md, docs/qa-rules.md
4. docs/rule-index.md → "UI / layout / component task": docs/ui-rules.md (§0 canonical Combobox single-source), docs/component-rules.md
5. docs/rule-index.md → "Storybook / visual snapshot task": docs/storybook-governance.md
6. Epic Q + Epic CC (Combobox single-source) — read the relevant session logs so the canonical Combobox is not forked.
7. Inspect package.json validation scripts.

Localization coverage:
- sq, en, uk, it. Settlement **option labels** localize by active locale: `en` → `name_en` (fallback `name_al`); `sq` → `name_al`; `uk`/`it` → `name_al` (no data). Any new UI strings → all four `messages/*.json`. `check:i18n` PASS.

Responsive coverage:
- 320, 375, 390, 768, 1280, 1440, 2560 — the combobox dropdown + selected value must not overflow at 320 uk (Task 354 already hardened truncation; preserve it).

Current behavior to preserve:
- `LocationCombobox.tsx`: current props (`locations`, `value`, `onChange`, `regions`, `onAddLocation`, `portal`, `size`, `error`) and the "+ Add location" admin flow. Today it maps `label: l.name_al` only (line ~52) — this task extends the label/search to be locale-aware WITHOUT removing `name_al` fallback.
- `Combobox.tsx`: canonical single-source primitive (ui-rules §0) — do NOT fork it; extend via props/data, not a clone.
- `select.tsx`: existing API + Task 354 overflow hardening (`w-full max-w-full min-w-0`, value `truncate`) preserved.
- Existing consumers of LocationCombobox (e.g. `StepLocation.tsx`, listings filters, admin) keep working.

Bug / Goal:
1. **LocationCombobox multilingual** — when the user types a settlement name, the matching settlement
   must be found and **displayed in the language the user typed in**, when that name exists in the DB
   (sq via `name_al`, en via `name_en`). Search must match against BOTH `name_al` and `name_en` so a
   user typing English finds the city and sees the English label (and vice-versa). uk/it fall back to
   `name_al`.
2. **Select** — (a) incorrect localizations → develop correct texts for all four locales; (b)
   **settlement names must always be capitalized everywhere** (first letter uppercase) in the Select
   options/value, regardless of how they are stored.

Required after behavior:
As a user choosing a settlement in the LocationCombobox (and in any Select showing settlement names):
1. With `en` active: typing "Tir" matches Tirana and the option/selected label shows the **English**
   name (`name_en`); if `name_en` is null → shows `name_al`.
2. With `sq` active: typing "Tir" matches and shows `name_al`.
3. With `uk`/`it` active: matches by `name_al`/`name_en` substring but **displays `name_al`** (no data
   for those locales) — no blank labels, no `[object]`/key leakage.
4. Search is accent/case-insensitive across both name fields (a user typing either language finds it).
5. Settlement labels are always **capitalized** (e.g. stored "tirana" → shown "Tirana") in both
   Combobox and Select.
6. Selecting an option still calls `onChange(id)` and persists exactly as today.

Required investigation (do FIRST — gates the whole task):
1. Open/inspect the settlement data layer: `src/modules/locations/hooks/useLocations.ts`, the
   `Location` type in `src/types/database`, and the query in `src/modules/listings/lib/queries.ts` /
   wherever locations are fetched. **Confirm `name_en` exists** (column + selected in query + typed).
   - If `name_en` is present everywhere → proceed.
   - If `name_en` is missing from the type/query but exists in DB → extend the SELECT + type ONLY
     (no migration) and note it.
   - If `name_en` does NOT exist in DB → **STOP and ASK the orchestrator** (do not add a migration).
2. Read `LocationCombobox.tsx` options mapping + `Combobox.tsx` filter/search logic — add a
   locale-aware label resolver + a search predicate over both names.
3. Read `select.tsx` / `select.stories.tsx` — find where settlement labels render; apply a capitalize
   helper (a small `lib` util, not inline per call site — Note 14 global rule) and fix the locale strings.
4. Inventory all LocationCombobox/Select settlement consumers; apply the resolver once at the canonical
   layer so all consumers inherit it (no diverging call sites).

Acceptance criteria:
- AC1–AC6 = the six Required-after steps, each verifiable at `LocationCombobox.tsx`:line /
  `Combobox.tsx`:line / `select.tsx`:line / data-layer:line.
- Locale-aware label resolver lives at a single canonical place (no per-call-site duplication).
- Capitalize helper is a shared util applied everywhere settlement names render.
- New strings in sq/en/uk/it identical key set (`check:i18n` PASS).
- Positive + Negative flow parity in diff.
- Canonical `Combobox` single-source respected (no fork); existing consumers + "+ Add location" flow preserved.
- 0 new lint/warnings; `tsc` → 0; `build` passes; `build-storybook` passes.
- 7 breakpoints × 4 locales (rendered = OWNER QA REQUIRED if no browser); dropdown/value no overflow at 320 uk.
- docs/component-catalog.md / ui-rules.md updated if the Combobox contract changes. backlog.md updated. Session log with Note 18 block + §17 UI pre-flight + Files Changed table.
- No `git add`/`git commit` from executor.

Positive flow (happy path):
- Actor: user selecting a settlement.
- Steps: (1) en locale, type "Dur" → "Durrës" (name_en) appears; (2) select → label shows English, `onChange(id)` fires; (3) switch to sq → label shows `name_al`; (4) Select elsewhere shows the same settlement capitalized.
- Success: correct localized, capitalized label; selection persists.

Negative flow:
- **No `name_en` for a settlement:** trigger = en active, settlement has null `name_en` → falls back to `name_al`; never blank.
- **uk/it locale:** trigger = uk active → displays `name_al`; search still matches both fields; no key/enum leakage.
- **No search match:** trigger = "zzz" → canonical empty/no-results state (preserve existing), not a crash.
- **Lowercase stored name:** trigger = "tirana" in DB → rendered "Tirana".
- **Long settlement name at 320 uk:** trigger = long label → truncates safely (Task 354 contract), no overflow.
- **Add-location admin flow:** trigger = admin adds a new city via `onAddLocation` → still works; new option appears localized/capitalized.
- **Data layer lacks `name_en`:** trigger = investigation step 1 finds no column → STOP & ASK (no migration, no invented schema).

Out of scope:
- Do NOT add a DB migration or new locale columns (uk/it names) — STOP & ASK instead.
- Do NOT fork the canonical Combobox.
- Do NOT touch Tabs/Button/Sheet/Dialog/FilterBar/Phone.
