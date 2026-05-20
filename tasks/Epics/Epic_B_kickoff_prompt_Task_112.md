# Kickoff prompt — Task 112 (Epic B.2)

> Epic B.1 (side popup auth) shipped in Task 108.
> Run this only after Sprint 3 (Tasks 109 + 110 + 111) is closed.

---

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context:
We are continuing Epic B — Auth, Registration & Agent Onboarding.
Epic B.1 (side popup auth flow, AuthSheet) shipped as Task 108.
Sprint 3 (Tasks 109 primitive burn-down + 110 drawer padding + 111 tailwind entropy) is closed.
This task must be documented as Task 112. Do not rename it to Task B.2. Preserve global task numbering.

Canonical patterns this task MUST follow (from earlier work):
- Selection Components Policy: Combobox is the canonical selection component (docs/ai-behavior.md). NEVER add a Select-based domain input. NEVER create a local combobox clone (Task 99 already deleted one).
- Reuse the existing city data source — the same one LocationCombobox uses elsewhere in the project. Do NOT introduce a parallel city list.
- Server-side errors follow the Epic A error-code contract (server returns codes, client resolves via t()).
- AuthSheet (src/modules/auth/components/AuthSheet.tsx) currently has a temporary plain-text `company` field in the agent register view. The city selector is added in THIS task; the company selector comes in Task 113 (B.3).

Required pre-read before implementation:
1. Read tasks/Epics/Epic_B_Auth_Registration_and_Agent_Onboarding.md — Task B.2 scope + acceptance.
2. Read docs/backlog.md — Last Session + Next Immediate Tasks.
3. Read docs/ai-behavior.md, especially:
   - Canonical Task Template
   - Selection Components Policy (Combobox-only)
   - Localization (i18n) Rules
   - Pre-Task Mandatory Checklist
   - Auth Lifecycle Rules
4. Always-governed: docs/env.md, docs/rls-rules.md, docs/component-rules.md.
5. Task-relevant: docs/data-access-rules.md, docs/domain-rules.md (city/location modeling), docs/component-governance.md, docs/ui-rules.md.
6. Read src/modules/auth/components/AuthSheet.tsx — the agent register view (isAgent=true) where the city field goes.
7. Read src/components/shared/LocationCombobox.tsx — the canonical city/location Combobox and its data source.
8. Read all four locale files for the auth namespace: messages/sq.json, en.json, uk.json, it.json.
9. Inspect package.json for validation scripts.

Localization coverage required:
- sq, en, uk, it
- City field label, placeholder, and any validation message via t().
- City option labels: reuse however LocationCombobox already localizes them elsewhere (do not hardcode).

Responsive coverage required:
- 320, 375, 390, 768, 1280, 1440, 2560
- The Combobox dropdown must render correctly inside the AuthSheet (which is itself a Sheet) at all breakpoints — watch for clipping (Task 93/98 patterns) and use `portal` if needed.

Task scope (Task 112 — Epic B.2):
1. Add an OPTIONAL city selector to the agent registration view in AuthSheet (isAgent=true), using the canonical LocationCombobox / Combobox.
2. Reuse the existing city data source — no parallel list, no new fetch pattern if one already exists.
3. Persist the selected city to the agent's profile on registration (wire to the existing registration mutation; follow data-access-rules + rls-rules for the profile write).
4. Field is optional — registration must succeed without a city.
5. Ensure the dropdown does not clip inside the Sheet (use portal; verify against Task 93/98 fixes).

Acceptance criteria:
- Agent register view has an optional city Combobox (canonical component, no clone).
- City data comes from the existing canonical source.
- Selecting a city persists it to the agent profile; omitting it still allows registration.
- Dropdown renders without clipping inside the AuthSheet at all 7 breakpoints.
- All four locales: label/placeholder/validation via t().
- 0 new lint errors / 0 new warnings.
- governance:localization PASS; governance:primitives no REGRESSION (Sprint 3 cleared the baseline).
- Session log: docs/sessions/YYYY-MM-DD-task-112-agent-city-selection.md.
- docs/backlog.md updated (Last Session + Session Archive row).
- npm run build is the user's manual step.

Out of scope (do NOT touch in Task 112):
- Agent company dropdown with logos (Task 113 = Epic B.3) — leave the temporary text `company` field as-is for now.
- Company logo upload rules (Task 114 = Epic B.4).
- Admin company management page (Task 115 = Epic B.5).
- Reworking AuthSheet's overall structure (shipped in Task 108).

Follow every rule in docs/ai-behavior.md. Do not skip the Pre-Task Mandatory Checklist. Do not start Task 113 in this run.
```

---

## Epic B remaining queue (after Task 112)

- **Task 113** — Epic B.3 — Agent company selection with logo display (new `companies` table + RLS). Replaces the temporary plain-text `company` field in AuthSheet.
- **Task 114** — Epic B.4 — Company logo upload rules (256×256 px, format validation, Cloudinary path per Epic H.7).
- **Task 115** — Epic B.5 — Admin company management page (CRUD; follows Epic K canonical table pattern).
