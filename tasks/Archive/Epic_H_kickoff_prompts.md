# Epic H — kickoff prompts (all 7 sub-tasks)

> Cloudinary Storage Hygiene. Goal: organize every user-uploaded asset by user/context and clean up orphans safely.
>
> **Global task numbering (fixed 2026-05-20):** H.1 = **Task 141**, H.2 = **Task 142**, H.4 = **Task 143**, H.6 = **Task 144**, H.3 = **Task 145**, H.5 = **Task 146**, H.7 = **Task 147**.
> (Order: H.1 → H.2 → H.4 → **H.6 (safety audit — blocks cleanup)** → H.3 → H.5 → H.7.) See `docs/backlog.md` roadmap.
> ⚠️ **H.6 MUST land before H.3 and H.5.** Cleanup tasks ship behind the H.6 dry-run framework and env flag.
> Each kickoff below is self-contained.

---

## H.1 — User-based folder structure

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic H — sub-task H.1. Document as Task 141 (verify against docs/backlog.md).

Hard contract (do NOT violate): do not change the scope below; do not introduce your own
architectural decisions — if something is ambiguous or missing, STOP and ask, do not invent scope;
execute the acceptance criteria literally; update docs/backlog.md + add a docs/sessions/ log.

Goal: All NEW assets uploaded by a user must land under `<user_id>/...` in Cloudinary. Migration plan for existing assets documented.

Required pre-read:
1. tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md — H.1 scope + Epic-level rules.
2. docs/ai-behavior.md — Canonical Task Template, Architecture Stability Rules, Pre-Task Mandatory Checklist.
3. docs/integrations.md — Cloudinary section (folder rules live there; UPDATE this file as part of the task).
4. docs/env.md — confirm CLOUDINARY_* env vars and folder prefix variables.
5. docs/data-access-rules.md (any DB columns that store the asset path/public_id).
6. All upload entry points: /api/upload-avatar, /api/upload-company-logo, any listing-image uploaders, plus the helper(s) in src/lib/.
7. Inspect package.json.

Localization coverage: sq, en, uk, it (upload UI messages — verify existing keys, no new strings expected here).
Responsive coverage: Upload UI at all 7 breakpoints (smoke).

Scope:
1. Decide the canonical root layout — `<user_id>/...` for user-owned assets; document the FULL tree (H.2/H.4/H.7 children) in docs/integrations.md.
2. Update every upload helper to write to the new path.
3. Keep public_id stable so DB references remain valid; DB columns that store full paths must be updated atomically if path changes (decide: store only public_id, or store full path — document choice).
4. Migration plan for EXISTING assets: dry-run inventory of current paths, mapping to target paths. Do NOT execute the migration in this task — only the plan + tooling sketch.

Acceptance criteria:
- All NEW uploads land under `<user_id>/...`; verified by inspecting Cloudinary console after a manual upload at each entry point.
- docs/integrations.md updated with full folder tree + DB-reference policy.
- Existing-asset migration plan documented (not executed).
- 0 new lint errors / 0 new warnings; typecheck no new errors; governance gates relevant to scope PASS.
- Session log + backlog updated. Commit hygiene: stage with a single `git add -A` (do NOT emit multi-line `git add` with `^`/backtick continuations — they fail in PowerShell and stage nothing); `git status` shows no untracked source files; commit + push; confirm with `git log -1` (paste real terminal output).

Out of scope: avatar-specific path (H.2), listing-image path (H.4), other photos (H.7), any deletion (H.3/H.5/H.6). Follow docs/ai-behavior.md and docs/orchestrator-role.md.
```

---

## H.2 — Avatar folder structure

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic H — sub-task H.2. Document as Task 142 (verify against docs/backlog.md).
DEPENDENCY: H.1 (Task 141) — DONE. H.1 shipped the shared `uploadToCloudinary(bytes, mime, folder)`
utility (`src/lib/cloudinaryUpload.ts`) + `publicIdFromUrl()`; the avatar route
(`src/app/api/upload-avatar/route.ts`) currently passes folder `'avatars'`. H.2 = change that folder
argument to the user-scoped path (this is where the actual `<user_id>/` prefixing happens — H.1 did
NOT prefix yet).

Hard contract (do NOT violate): do not change the scope below; do not introduce your own
architectural decisions — if ambiguous, STOP and ask, do not invent scope; execute the acceptance
criteria literally; update docs/backlog.md + add a docs/sessions/ log.

Goal: All new avatars land at `<user_id>/avatars/...`.

Required pre-read:
1. tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md — H.2 scope.
2. docs/ai-behavior.md — Pre-Task Mandatory Checklist, Architecture Stability Rules.
3. docs/integrations.md (post-H.1 folder tree).
4. /api/upload-avatar (and any other avatar-write paths — admin upload, registration flow).
5. Schema: users.avatar_url and any other avatar references (Cloudinary public_id format).
6. Inspect package.json.

Localization coverage: sq, en, uk, it (upload UI — no new keys expected).
Responsive coverage: Avatar upload UI at all 7 breakpoints (smoke).

Scope:
1. Change avatar upload paths to `<user_id>/avatars/<file_id>`.
2. Ensure profile picture renders correctly afterwards (DB reference stays valid OR migrated atomically).
3. Add H.2 entry to docs/integrations.md folder tree.

Acceptance criteria:
- New avatar uploaded by a test user lands in `<user_id>/avatars/`; profile + AppImage variant=avatar render correctly.
- 0 new lint/warnings; governance gates PASS.
- Session log + backlog updated. Commit hygiene: single `git add -A` (NO `^`/backtick multi-line continuations — they fail in PowerShell and stage nothing); `git status` clean of untracked source; commit + push; confirm with `git log -1` (paste real output).

Out of scope: replacement cleanup (H.3 — needs H.6 first). Follow docs/ai-behavior.md and docs/orchestrator-role.md.
```

---

## H.4 — Listing image folder structure

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic H — sub-task H.4. Document as Task 143 (verify against docs/backlog.md).
DEPENDENCY: H.1 (Task 141).

NOTE (intel from H.1 review): listing images are uploaded via a CLIENT-SIDE **unsigned** Cloudinary
upload preset (`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`) in `src/app/[locale]/listings/create/page.tsx`
and `src/app/[locale]/listings/[slug]/edit/page.tsx` — NOT via the server-side `uploadToCloudinary`
utility (which only the avatar + company-logo routes use). For unsigned preset uploads the folder is
set via the upload params / preset config, so the path change must be done there (or by moving
listing uploads server-side). Plan accordingly; do not assume `uploadToCloudinary(folder)` covers it.

Goal: All new listing photos land at `<user_id>/listings/<listing_id>/...`.

Required pre-read:
1. tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md — H.4 scope.
2. docs/ai-behavior.md — Pre-Task Mandatory Checklist.
3. docs/integrations.md (post-H.1 folder tree).
4. Listing image upload helpers (src/modules/listings/, any API routes); listing schema for image references.
5. Schema: listings.images (or equivalent) — confirm storage format (URL vs public_id).
6. Inspect package.json.

Localization coverage: sq, en, uk, it (upload UI — no new keys expected).
Responsive coverage: Listing image upload UI at all 7 breakpoints.

Scope:
1. Change listing image upload paths to `<user_id>/listings/<listing_id>/<file_id>`.
2. Data model references updated; new listing creation flow + edit flow both write to the new path.
3. Add H.4 entry to docs/integrations.md folder tree.

Acceptance criteria:
- New listing photo uploaded by a test user lands in `<user_id>/listings/<listing_id>/`; gallery renders correctly.
- 0 new lint/warnings; governance gates PASS.
- Session log + backlog updated. Commit + push.

Out of scope: replacement cleanup (H.5 — needs H.6 first), non-listing photos (H.7). Follow docs/ai-behavior.md.
```

---

## H.6 — Safety audit / dry-run framework (BLOCKS H.3 + H.5)

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic H — sub-task H.6. Document as Task 144 (verify against docs/backlog.md).
This task BLOCKS H.3 and H.5 (any destructive Cloudinary delete). Land it first.

Goal: Build the dry-run + reference-check framework that every destructive Cloudinary delete will route through. No asset still referenced by the DB may ever be deleted. Real deletes must be behind an env flag.

Required pre-read:
1. tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md — H.6 scope + Epic-level safety language.
2. docs/ai-behavior.md — No Fake Fixes Policy, Regression Responsibility, Pre-Task Mandatory Checklist.
3. docs/env.md (add the new flag); docs/integrations.md (Cloudinary delete API + folder tree).
4. docs/data-access-rules.md, docs/rls-rules.md (cross-table reference check must use canonical query layer).
5. docs/qa-rules.md (integration-test conventions).
6. Existing Cloudinary helper code; any places that currently call cloudinary delete (should be none / few).
7. Inspect package.json.

Localization coverage: N/A (infrastructure).
Responsive coverage: N/A.

Scope:
1. Add CLOUDINARY_DELETE_MODE env (or equivalent) with values `dry-run` (default everywhere except prod-flagged) and `enabled`. Document in docs/env.md.
2. Build deleteAsset(publicId, { reason, dryRun }) — central wrapper.
   - In dry-run: log structured entry (publicId, would-be-action, reference check result, reason); DO NOT call Cloudinary delete.
   - In enabled mode: same log + actual delete after the reference check passes.
3. Reference check: query every DB table that can hold the asset (users.avatar_url, listings.images, companies.logo_url, popular_locations.photo, …). If the publicId is referenced ANYWHERE, skip the delete and log skip-reason.
4. Integration test: insert a referenced asset, attempt delete, assert it is skipped + logged.

Acceptance criteria:
- deleteAsset wrapper exists and is the ONLY way to delete Cloudinary assets (enforced by lint/grep — document the rule).
- Dry-run mode is default; real deletes require env flag.
- Reference-check integration test passes (skips referenced assets).
- Structured log format documented (for H.3/H.5/H.7 to consume).
- 0 new lint/warnings; governance gates PASS.
- Session log + backlog updated. Commit + push.

Out of scope: actual cleanup of avatars (H.3) or listing images (H.5). Follow docs/ai-behavior.md.
```

---

## H.3 — Avatar replacement cleanup

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic H — sub-task H.3. Document as Task 145 (verify against docs/backlog.md).
DEPENDENCY: H.2 (Task 142) for path; H.6 (Task 144) for safe delete framework. Both MUST be done.

Goal: When a user replaces their avatar, the OLD avatar (now unreferenced) is deleted from Cloudinary via the H.6 deleteAsset wrapper.

Required pre-read:
1. tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md — H.3 scope.
2. docs/ai-behavior.md, docs/qa-rules.md.
3. docs/integrations.md (deleteAsset contract from H.6).
4. /api/upload-avatar (replacement happens here), users.avatar_url updates.
5. Inspect package.json.

Localization coverage: sq, en, uk, it (any error messages via Epic A error-code contract — no new visible keys expected).
Responsive coverage: smoke — avatar replace UI at all 7 breakpoints.

Scope:
1. On successful new-avatar write: capture old public_id, update users.avatar_url to new, THEN call deleteAsset(oldPublicId, { reason: 'avatar_replaced' }) — order matters (update DB first, then delete; never the reverse).
2. Skip delete if old public_id is null or matches new (idempotent re-uploads).
3. Behind the H.6 env flag — dry-run by default.

Acceptance criteria:
- Replace test: upload new avatar; verify DB updated, old asset logged for delete (dry-run) or actually deleted (enabled).
- Reference check still skips assets used elsewhere (regression test).
- 0 new lint/warnings; governance gates PASS.
- Session log + backlog updated. Commit + push.

Out of scope: listing image cleanup (H.5), other photos (H.7). Follow docs/ai-behavior.md.
```

---

## H.5 — Listing image replacement cleanup

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic H — sub-task H.5. Document as Task 146 (verify against docs/backlog.md).
DEPENDENCY: H.4 (Task 143) for path; H.6 (Task 144) for safe delete framework. Both MUST be done.

Goal: When a listing image is replaced or removed, the prior asset is deleted via the H.6 deleteAsset wrapper.

Required pre-read:
1. tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md — H.5 scope.
2. docs/ai-behavior.md, docs/qa-rules.md.
3. docs/integrations.md (deleteAsset contract from H.6).
4. Listing image edit/remove flows; listings.images schema.
5. Inspect package.json.

Localization coverage: sq, en, uk, it (any error messages via Epic A error-code contract).
Responsive coverage: smoke — listing edit gallery at all 7 breakpoints.

Scope:
1. On image-list mutation (edit/remove): diff prior public_ids vs new; orphaned IDs → deleteAsset(id, { reason: 'listing_image_removed' | 'listing_image_replaced' }).
2. DB update first, then delete. Never delete before DB commit.
3. Bulk listing delete: delete all images for the listing (same wrapper, batched).
4. Behind the H.6 env flag — dry-run by default.

Acceptance criteria:
- Edit listing → remove image → verify orphaned asset logged for delete (dry-run) or actually deleted (enabled).
- Reference check skips images that another listing still references (rare but possible — test it).
- 0 new lint/warnings; governance gates PASS.
- Session log + backlog updated. Commit + push.

Out of scope: avatar cleanup (H.3), other photos (H.7). Follow docs/ai-behavior.md.
```

---

## H.7 — Other photos (company logos, marketing, etc.) folder structure

```
You are Claude Code Sonnet 4.6 working in the `lero-al` project.

Context: Epic H — sub-task H.7. Document as Task 147 (verify against docs/backlog.md).
DEPENDENCY: H.1 (Task 141) for root layout; H.6 (Task 144) for any deletions related to these assets.

Goal: All non-user / non-listing photos (company logos, marketing media, future popular-location photos) live under a canonical folder structure named after what they belong to (e.g. `companies/<company_id>/logo.<ext>`, `marketing/<slug>/...`).

Required pre-read:
1. tasks/Epics/Epic_H_Cloudinary_Storage_Hygiene.md — H.7 scope.
2. docs/ai-behavior.md, docs/integrations.md.
3. /api/upload-company-logo (Task 114) — current path; any other non-user uploaders.
4. Epic J (popular locations) — J.1 will need a folder rule for location photos; coordinate the canonical name here.
5. Inspect package.json.

Localization coverage: sq, en, uk, it (upload UI — no new keys expected).
Responsive coverage: Upload UI at all 7 breakpoints (smoke).

Scope:
1. Audit every non-user, non-listing upload entry point; list current paths.
2. Define canonical folder rules in docs/integrations.md: `companies/<company_id>/logo.<ext>`, `marketing/<slug>/...`, `popular_locations/<id>/...` (placeholder for Epic J).
3. Migrate active upload code to new paths.
4. Migration plan for EXISTING assets — documented, not executed.

Acceptance criteria:
- All non-user/non-listing uploaders write to the canonical folder rules.
- docs/integrations.md folder tree complete (covers user, avatar, listing, company, marketing, popular_location).
- Existing-asset migration plan documented (not executed).
- 0 new lint/warnings; governance gates PASS.
- Session log + backlog updated. Commit + push.

Out of scope: actual existing-asset migration; deletion of orphans (covered by H.6 framework + per-entity tasks). Follow docs/ai-behavior.md.
```
