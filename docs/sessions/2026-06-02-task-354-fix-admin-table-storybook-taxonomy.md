# Task 354-Fix — Global AdminTable/AdminCardList Storybook Taxonomy Pass
**Date:** 2026-06-02  
**Executor:** Sonnet 4.6  
**Status:** INCOMPLETE / OWNER QA REQUIRED

---

## 1. Verdict

**Task 354-Fix global AdminTable/AdminCardList Storybook taxonomy pass: INCOMPLETE / OWNER QA REQUIRED.**  
TypeScript: 0 errors. Build: ✅ (16.97s). No git commit. No push. No git commands.

---

## 2. Owner Request Acknowledged

The owner observed that AdminTable/AdminCardList stories had many variants but unclear purposes — particularly why `ResponsiveSwitchTable` and `Mobile Card Mode` look identical at 320px, and which stories are for layout QA vs behavioral QA vs locale stress.

---

## 3. Scope Confirmation

Handled globally across `AdminTable.stories.tsx` and `AdminCardList.stories.tsx`. Not a point fix.

---

## 4. Defined Taxonomy

### 4.1 Static Table Stories
**Purpose:** Inspect column layout, column visibility breakpoints (sm/md/lg/xl), and table rendering quality without any row interaction noise.  
**Distinguishing characteristics:** No `onRowClick`. No hover. No cursor-pointer. No trailing chevron column.  
**Stories:** `Desktop1280`, `Desktop1440`

### 4.2 Custom Card Layout Stories (formerly Mobile_CardMode)
**Purpose:** Inspect the quality of a custom `cardRow` format (title/badge+role/email+location meta) at a specific mobile width. NOT testing responsive switching.  
**Distinguishing characteristics:** Has `cardRow={CARD_ROW}` with custom formatting. No `onRowClick`. No interactive affordance.  
**Key distinction from Responsive Switch:** Both look like card mode at 320px. But Custom Card Layout exists to answer "does the card format look correct?" while Responsive Switch exists to answer "does the component switch modes correctly at different widths?"  
**Stories:** `CustomCardLayout_Mobile320` (was `Mobile320_CardMode`), `CustomCardLayout_Mobile390` (was `Mobile390_CardMode`)

### 4.3 Responsive Switch Stories
**Purpose:** Validate that the SAME AdminTable component automatically switches between card mode (<1024px) and table mode (≥1024px) based on viewport width, with NO prop changes.  
**How to use:** Open all four stories in order — Mobile320 → Tablet768 → Desktop1024 → Desktop1280. Observe the switch from card to table at 1024px.  
**In-canvas notes:** Each story shows a localized note explaining which mode is currently visible and pointing to the other end for comparison.  
**Stories:** `ResponsiveSwitch_Mobile320` (was `ResponsiveSwitch_Mobile`), `ResponsiveSwitch_Tablet768`, `ResponsiveSwitch_Desktop1024`, `ResponsiveSwitch_Desktop1280` (was `ResponsiveSwitch_Desktop`)

### 4.4 Interactive Stories
**Purpose:** Prove row click affordance, keyboard activation (Enter/Space), trailing chevron placement, and visible owner-observable selected-row feedback.  
**Sub-modes:**
- **Interactive Table Mode (≥1024px):** AdminTable adds trailing chevron `<td>` column automatically.
- **Interactive Card Mode (<1024px):** AdminCardList adds auto-chevron in trailing automatically.  
**Stories:** All `*_Interactive` exports + locale variants

### 4.5 Non-Interactive / Static Stories
**Purpose:** Prove that static rows do not show misleading interaction affordances.  
**AdminCardList:** `StaticRows_Desktop`, `Compact`, `LegacyReactNode`

### 4.6 Locale Stress Stories
**Purpose:** Verify long localized content (sq/en/uk/it) wraps safely, chevron remains visible, no horizontal overflow, no text clipping.  
**Stories:** `UkrainianLongStrings_*`, `Albanian_*`, `Italian_*`, locale-prefixed interactive stories

### 4.7 Canonical Breakpoint Coverage
**Purpose:** Ensure every required breakpoint (320–2560) is represented in both static and interactive modes.  
**Stories:** All 14 canonical breakpoint widths covered in en interactive stories.

---

## 5. Files Changed

| File | Change |
|------|--------|
| `src/components/admin/AdminTable.stories.tsx` | Added `StoryPurposeNote`, `NOTES` dict, `storyNote()` helper. Renamed 4 confusing stories. Updated meta + all story `docs.description.story`. Added in-canvas notes to all RS + CustomCard stories. Improved Interactive section headers. |
| `src/components/admin/AdminCardList.stories.tsx` | Added `StoryPurposeNote`. Updated meta with taxonomy. Updated story `docs.description.story` with taxonomy labels. |
| `docs/backlog.md` | New Last Session entry |
| `docs/sessions/2026-06-02-task-354-fix-admin-table-storybook-taxonomy.md` | This file |

---

## 6. Story Inventory

### AdminTable.stories.tsx — Rename Map

| Old Name | New Name | Reason |
|----------|----------|--------|
| `Mobile320_CardMode` | `CustomCardLayout_Mobile320` | Clarifies it tests CARD FORMAT quality, not responsive switching |
| `Mobile390_CardMode` | `CustomCardLayout_Mobile390` | Same |
| `ResponsiveSwitch_Mobile` | `ResponsiveSwitch_Mobile320` | Adds breakpoint number for consistency with other RS stories |
| `ResponsiveSwitch_Desktop` | `ResponsiveSwitch_Desktop1280` | Adds breakpoint number for consistency |

### AdminTable.stories.tsx — Full Inventory

| Story | Category | Mode | Locale | Interactive | Chevron | Note Added | Action |
|-------|----------|------|--------|-------------|---------|------------|--------|
| `Desktop1280` | Static | Table | en | No | No | No (docs) | Updated docs |
| `Desktop1440` | Static | Table | en | No | No | No (docs) | Updated docs |
| `CustomCardLayout_Mobile320` | Custom Card | Card | en | No | No | YES | Renamed + note |
| `CustomCardLayout_Mobile390` | Custom Card | Card | en | No | No | YES | Renamed + note |
| `Desktop1280_Interactive` | Interactive | Table | en | Yes | Yes | No (docs) | Updated docs |
| `Desktop1440_Interactive` through `Desktop2560_Interactive` | Interactive | Table | en | Yes | Yes | No | — |
| `Desktop1024_Interactive` | Interactive | Table (lg: boundary) | en | Yes | Yes | No (docs) | Updated docs |
| `Canonical960_Interactive` through `Mobile320_Interactive` | Interactive | Card | en | Yes | Yes | No | — |
| `Uk_*_Interactive`, `Sq_*_Interactive`, `It_*_Interactive` | Interactive + Locale | Both | uk/sq/it | Yes | Yes | No | — |
| `ResponsiveSwitch_Mobile320` | Responsive Switch | Card | en | No | No | YES | Renamed + note |
| `ResponsiveSwitch_Tablet768` | Responsive Switch | Card | en | No | No | YES | Added note |
| `ResponsiveSwitch_Desktop1024` | Responsive Switch | Table (boundary) | en | No | No | YES | Added note |
| `ResponsiveSwitch_Desktop1280` | Responsive Switch | Table | en | No | No | YES | Renamed + note |
| `UkrainianLongStrings_Mobile320` | Locale Stress | Card | uk | No | No | No (docs) | Updated docs |
| `UkrainianLongStrings_Desktop` | Locale Stress | Table | uk | No | No | No (docs) | Updated docs |
| `UkrainianLongStrings_Interactive_Desktop` | Locale Stress + Interactive | Table | uk | Yes | Yes | No (docs) | Updated docs |
| `UkrainianLongStrings_Interactive_Mobile320` | Locale Stress + Interactive | Card | uk | Yes | Yes | No (docs) | Updated docs |
| `EmptyState`, `EmptyState_Interactive`, `LoadingState`, `LoadingState_Interactive` | Edge States | Table | en | Varies | No | No | — |

### AdminCardList.stories.tsx — No Renames

All AdminCardList stories already had clear enough names. Only descriptions updated.

---

## 7. Explanation of Responsive Switch vs Custom Card Layout

**In-canvas notes (localized):** All 4 Responsive Switch stories show a `StoryPurposeNote` banner at the top:
- At 320/768px: "Responsive Switch — card mode at this width (<1024px). Open Desktop 1024 or 1280 to see the same component in table mode."
- At 1024px: "Responsive Switch — lg: boundary (1024px): TABLE mode activates here. Open Mobile 320 to compare CARD mode. Same component, no prop change."
- At 1280px: "Responsive Switch — TABLE mode at this width (≥1024px). Open Mobile 320 to compare CARD mode."

**Custom Card Layout notes:** Both `CustomCardLayout_Mobile320` and `CustomCardLayout_Mobile390` show: "Custom card layout quality check — not testing the card/table switch. Use Responsive Switch stories for that."

**Docs description:** The AdminTable component description now includes a paragraph explicitly explaining the key distinction: "Both may look similar at 320px (both show card mode), but their purpose is different."

---

## 8. Localization Confirmation

The `NOTES` dictionary in `AdminTable.stories.tsx` contains all 4 locales (en/sq/uk/it) for each note type. When used in locale-specific stories (stories with `globals: { locale: 'uk' }` etc.), the `storyNote(key, locale)` helper returns the correct language.

**Current usage:** The in-canvas notes are applied to Responsive Switch and Custom Card Layout stories which are all en (no locale globals). If locale-specific Responsive Switch stories are added in future, they would automatically get the correct language note by passing the locale to `storyNote()`.

**Note:** The current in-canvas notes use English only because the stories where they appear (`ResponsiveSwitch_*`, `CustomCardLayout_*`) are all locale-neutral (no `globals.locale`). The localized note texts are ready in the `NOTES` dict for when needed.

---

## 9. Behavior Preservation Confirmation

All row click, keyboard activation, chevrons, selected feedback, empty/loading states, and responsive switch behavior preserved unchanged.

| Capability | Status |
|------------|--------|
| Row click (onRowClick) | ✓ preserved |
| Keyboard Enter/Space | ✓ preserved |
| Auto-chevron in table mode | ✓ preserved |
| Auto-chevron in card mode | ✓ preserved |
| Selected-row localized panel | ✓ preserved |
| Responsive switch (card/table) | ✓ preserved |
| Empty state (colSpan correct) | ✓ preserved |
| Loading state (placeholder td) | ✓ preserved |
| All 44 AdminTable story exports | ✓ preserved (4 renamed) |
| All 25 AdminCardList story exports | ✓ preserved (none renamed) |

---

## 10. Responsive Confirmation

`StoryPurposeNote` renders as:
- `<p className="mb-3 px-3 py-1.5 rounded border border-dashed border-border/50 bg-muted/10 text-[11px] text-muted-foreground leading-relaxed">`
- `text-[11px]`: very compact, will not cause overflow at any width
- `leading-relaxed`: long notes wrap safely across narrow widths
- `mb-3`: 12px margin below note, before the component
- No fixed width, no `overflow-hidden`: text wraps naturally

---

## 11. Full Rendered QA Matrix

All entries: OWNER QA REQUIRED.

| Scenario | Locale | Breakpoints | Clarity added | Status |
|----------|--------|-------------|---------------|--------|
| Responsive Switch stories (4) | en | 320/768/1024/1280 | In-canvas note + new names | OWNER QA REQUIRED |
| Custom Card Layout stories (2) | en | 320/390 | In-canvas note + new names | OWNER QA REQUIRED |
| Interactive table (14 breakpoints) | en | 320→2560 | Updated docs | OWNER QA REQUIRED |
| Interactive locale stories (uk/sq/it) | uk/sq/it | 320/375/390/768/1280/1440 | Updated docs | OWNER QA REQUIRED |
| Static table | en | 1280/1440 | Updated docs | OWNER QA REQUIRED |
| Locale stress (static) | uk | 320/1280 | Updated docs | OWNER QA REQUIRED |
| Locale stress (interactive) | uk | 320/1280 | Updated docs | OWNER QA REQUIRED |
| Empty/loading states | en | 1280 | Existing docs adequate | OWNER QA REQUIRED |
| AdminCardList interactive | en/uk/sq/it | all 14 bp | Updated docs + meta taxonomy | OWNER QA REQUIRED |
| AdminCardList static | en | 1280 | Updated docs | OWNER QA REQUIRED |

---

## 12. Validation

```
npm run typecheck      → 0 errors ✓
npm run build-storybook → ✓ built in 16.97s ✓
```

---

## 13. Remaining Issues

None for this pass. All taxonomy + naming + clarity work complete.

---

## 14. Explicit Confirmation

**No git commands are included in this report.**  
**No commit was made.**  
**No push was made.**
