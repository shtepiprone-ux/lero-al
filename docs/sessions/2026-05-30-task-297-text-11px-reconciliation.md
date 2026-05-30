# Task 297 — text-[11px] mono-ID reconciliation (Outcome A: canonical wins)

**Date:** 2026-05-30  
**Executor:** Claude Code Sonnet 4.6  
**Task type:** decision + narrow refactor

---

## Investigation

**Two sites confirmed — only consumers of `text-[11px]`:**

- `src/components/admin/AdminUsersTable.tsx:249`
  ```tsx
  <p className="text-[11px] text-muted-foreground/50 font-mono leading-none mt-0.5">#{u.public_id}</p>
  ```
  Context: sub-caption below user name/company/location rows; adjacent lines are `text-xs`.

- `src/modules/cabinet/components/ProfileTab.tsx:243`
  ```tsx
  <span className="text-[11px] text-muted-foreground/50 font-mono">#{profile.public_id}</span>
  ```
  Context: below avatar in identity card, above `text-sm` email line.

**Other `public_id` render sites cross-checked:**
- `AdminUserProfile.tsx:834` → `text-xs text-muted-foreground/50 font-mono` — sibling admin page already uses `text-xs` for the identical pattern
- `listings/[slug]/page.tsx:425` → `font-mono text-xs text-muted-foreground/70` — listing detail public_id also at `text-xs`

---

## Decision rubric — STOP & ASK result

| Criterion | Answer | Outcome |
|-----------|--------|---------|
| Wrap/overflow risk at 320px `uk`? | NO — content is `#12345`, ≤7 chars, never translated | → A |
| Adjacent to `text-xs` content? | YES at AdminUsersTable (company + location labels directly above) | → A |
| Other surfaces use `text-xs font-mono` for public_id? | YES — AdminUserProfile + listing detail | → A |
| Load-bearing for identity? | YES, but `text-xs` is sufficient | → A |

**Orchestrator approved Outcome A (2026-05-30):** replace `text-[11px]` with `text-xs`; remove the 2 allowlist entries; do not introduce `mono-id-density` fragment.

---

## Changes

### AdminUsersTable.tsx BEFORE → AFTER

```diff
- <p className="text-[11px] text-muted-foreground/50 font-mono leading-none mt-0.5">#{u.public_id}</p>
+ <p className="text-xs text-muted-foreground/50 font-mono leading-none mt-0.5">#{u.public_id}</p>
```

### ProfileTab.tsx BEFORE → AFTER

```diff
- <span className="text-[11px] text-muted-foreground/50 font-mono">#{profile.public_id}</span>
+ <span className="text-xs text-muted-foreground/50 font-mono">#{profile.public_id}</span>
```

### Allowlist entries removed (both):

```json
{
  "rule": "arbitrary-font-size",
  "file": "src/modules/cabinet/components/ProfileTab.tsx",
  "pattern": "text-[11px]",
  "reason": "Public ID sub-caption display (#{public_id}) in cabinet profile. 11px mono ID label — between text-xs (12px) and text-[10px], no canonical equivalent.",
  ...
}
```

```json
{
  "rule": "arbitrary-font-size",
  "file": "src/components/admin/AdminUsersTable.tsx",
  "pattern": "text-[11px]",
  "reason": "Public ID display (#12345) in admin users table row. 11px mono ID sub-caption — between text-xs (12px) and text-[10px], no canonical equivalent.",
  ...
}
```

Net allowlist: −2 entries. No new entries added.

---

## 320px `uk` overflow/wrap confirmation (code-level)

Content at both sites is always `#<integer>` (e.g. `#12345`), maximum 7 characters, never translated. At `text-xs` (12px, Geist Mono), 7 chars ≈ 49px width — no wrap or overflow risk at any breakpoint including 320px.

**Owner browser verification completed (2026-05-30):**
- AdminUsersTable public_id: `text-xs` renders more clearly — the increased visibility is desirable ✅
- ProfileTab public_id: `text-xs` remains acceptable ✅
- No overflow, wrap, or height regression observed at either site
- Outcome A confirmed after owner visual review — `text-[11px]` will NOT be restored

---

## Files Changed table (Task 264)

| Path | Change | Rationale |
|------|--------|-----------|
| `src/components/admin/AdminUsersTable.tsx` | `text-[11px]` → `text-xs` on `#{u.public_id}` | Outcome A — canonical token; consistent with AdminUserProfile.tsx |
| `src/modules/cabinet/components/ProfileTab.tsx` | `text-[11px]` → `text-xs` on `#{profile.public_id}` | Outcome A — canonical token |
| `scripts/governance/tailwind-entropy.allowlist.json` | Removed 2 `text-[11px]` allowlist entries (ProfileTab + AdminUsersTable) | Entries no longer needed after canonical migration |
| `docs/sessions/2026-05-30-task-297-text-11px-reconciliation.md` | This file | Session log |
| `docs/backlog.md` | Updated Last Session + Session Archive + task counter | Clause 10 |

---

## Validation

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` | ✅ passes |
| `npm run lint` | ✅ 0/0 (exit 0) |
| `governance:tailwind` | ✅ C0/H0/M0 — no regression |
| `tailwind-entropy LOW count` | ✅ 220 → 218 (exactly −2) |
| `tailwind-entropy MEDIUM count` | ✅ 13 unchanged |
| `npx vitest run` | ✅ 390/390 |
| Only 2 files changed (+ allowlist + docs) | ✅ no other source files touched |
| No new locale keys | ✅ |
| No copy/color/margin/layout change | ✅ only font-size class changed |
| 320px `uk` overflow/wrap | ✅ no overflow (code-level + owner browser confirmed) |
| Outcome A approved by orchestrator | ✅ 2026-05-30 |
| Owner browser verification | ✅ completed 2026-05-30 — Outcome A confirmed; text-xs clearer and desirable at both sites |

## Self-validation verdict

`Self-validation: tsc=0 · build=passes · lint=0/0 · governance=C0/H0/M0 · outcome=A · LOW=218(−2) · uk 320=no-overflow · owner-browser=PASS · scope=clean · UNCOMMITTED · PASS`
